/**
 * @flow strict
 * @format
 */

declare module 'ansi-regex' {
  declare export type Options = {
    /**
     * Match only the first ANSI escape.
     */
    +onlyFirst?: boolean,
  };
  declare export default function ansiRegex(options?: Options): RegExp;
}
