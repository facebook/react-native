/**
 * Object containing the current React Native version.
 *
 * Specifically, this is the source of truth for the resolved `react-native`
 * package in the JavaScript bundle. Apps and libraries can use this to
 * determine compatibility or enable version-specific features.
 *
 * @example
 * ```js
 * // Get the full version string
 * const version = ReactNativeVersion.getVersionString();
 *
 * // Access individual version components
 * const major = ReactNativeVersion.major;
 * ```
 */
export default class ReactNativeVersion {
  static major: number;
  static minor: number;
  static patch: number;
  static prerelease: string | null;
  static getVersionString(): string
}
