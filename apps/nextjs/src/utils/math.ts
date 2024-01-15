export class MathUtil {
  public static roundTo2Decimals(num: number): number {
    // return Math.round(num * 10 ** decimalPlaces) / 10 ** decimalPlaces;
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }
}
