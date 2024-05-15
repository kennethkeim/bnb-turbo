import { PrismaAdapter } from "@next-auth/prisma-adapter";
import axios from "axios";
import {
  type DefaultSession,
  type NextAuthOptions,
  type TokenSet,
} from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

import { prisma } from "@acme/db";
import type { IgmsHost, IgmsHostResponse } from "@acme/igms";

import { env } from "../env.mjs";

const getIgmsHost = (response: IgmsHostResponse): IgmsHost | null => {
  return response.data.find((host) => host.platform_type === "airbnb") ?? null;
};

/**
 * Module augmentation for `next-auth` types
 * Allows us to add custom properties to the `session` object
 * and keep type safety
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 **/
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

const igmsDomain = "https://igms.com";
const igmsId = "igms";

/**
 * Options for NextAuth.js used to configure
 * adapters, providers, callbacks, etc.
 * @see https://next-auth.js.org/configuration/options
 **/
export const authOptions: NextAuthOptions = {
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // session.user.role = user.role; <-- put other properties on the session here
      }
      return session;
    },
  },
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
    }),

    {
      id: igmsId,
      name: "iGMS",
      type: "oauth",
      clientId: env.IGMS_CLIENT_ID,
      clientSecret: env.IGMS_CLIENT_SECRET,
      // checks: ["state"],

      // configure call to authorize user
      authorization: {
        params: {
          scope: "listings,direct-bookings,calendar-control,messaging,tasks",
          client_id: "229",
          redirect_uri: `http://localhost:3000/api/auth/callback/${igmsId}`,
        },
        url: `${igmsDomain}/app/auth.html`,
      },

      // make call to get token
      token: {
        async request(context) {
          const params = {
            grant_type: "authorization_code",
            code: context.params.code,
            redirect_uri: context.provider.callbackUrl,
            client_id: env.IGMS_CLIENT_ID,
            client_secret: env.IGMS_CLIENT_SECRET,
          };
          const response = await axios.get(`${igmsDomain}/auth/token`, {
            params,
          });
          return { tokens: response.data as TokenSet };
        },
      },

      // make call to get user info
      userinfo: {
        async request(context) {
          const url = `${igmsDomain}/api/v1/hosts`;
          const params = {
            access_token: context.tokens.access_token,
          };
          const response = await axios.get(url, { params });

          // Update user token (access_token does not get updated by Next Auth)
          const user = getIgmsHost(response.data as IgmsHostResponse);
          const account = await prisma.account.findFirst({
            where: { providerAccountId: user?.host_uid },
          });

          // Next auth creates the account on first login, no updates needed then
          if (account?.id) {
            await prisma.account.update({
              where: { id: account?.id },
              data: { access_token: context.tokens.access_token },
            });
          }

          // wtf does nextauth expect back here?
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return response.data;
        },
      },

      // extract user info
      profile(response: IgmsHostResponse) {
        console.log("GOT PROFIlE", response);
        const user = getIgmsHost(response);
        if (!user) throw new Error("User not found");
        return {
          id: user.host_uid,
          name: user.name,
          email: user.email[0],
          image: user.thumbnail_url,
        };
      },
    },

    /**
     * ...add more providers here
     *
     * Most other providers require a bit more work than the Discord provider.
     * For example, the GitHub provider requires you to add the
     * `refresh_token_expires_in` field to the Account model. Refer to the
     * NextAuth.js docs for the provider you want to use. Example:
     * @see https://next-auth.js.org/providers/github
     **/
  ],
};
