/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

declare module 'chalk' {
  declare type TemplateStringsArray = $ReadOnlyArray<string>;

  declare type Level = $Values<{
    None: 0,
    Basic: 1,
    Ansi256: 2,
    TrueColor: 3,
    ...
  }>;

  declare type ChalkOptions = {
    enabled?: boolean,
    level?: Level,
  };

  declare type ColorSupport = {
    level: Level,
    hasBasic: boolean,
    has256: boolean,
    has16m: boolean,
  };

  declare type Chalk = {
    (...text: string[]): string,
    (text: TemplateStringsArray, ...placeholders: string[]): string,
    Instance(options?: ChalkOptions): Chalk,
    level: Level,
    rgb(r: number, g: number, b: number): Chalk,
    hsl(h: number, s: number, l: number): Chalk,
    hsv(h: number, s: number, v: number): Chalk,
    hwb(h: number, w: number, b: number): Chalk,
    bgHex(color: string): Chalk,
    bgKeyword(color: string): Chalk,
    bgRgb(r: number, g: number, b: number): Chalk,
    bgHsl(h: number, s: number, l: number): Chalk,
    bgHsv(h: number, s: number, v: number): Chalk,
    bgHwb(h: number, w: number, b: number): Chalk,
    hex(color: string): Chalk,
    keyword(color: string): Chalk,

    +reset: Chalk,
    +bold: Chalk,
    +dim: Chalk,
    +italic: Chalk,
    +underline: Chalk,
    +inverse: Chalk,
    +hidden: Chalk,
    +strikethrough: Chalk,

    +visible: Chalk,

    +black: Chalk,
    +red: Chalk,
    +green: Chalk,
    +yellow: Chalk,
    +blue: Chalk,
    +magenta: Chalk,
    +cyan: Chalk,
    +white: Chalk,
    +gray: Chalk,
    +grey: Chalk,
    +blackBright: Chalk,
    +redBright: Chalk,
    +greenBright: Chalk,
    +yellowBright: Chalk,
    +blueBright: Chalk,
    +magentaBright: Chalk,
    +cyanBright: Chalk,
    +whiteBright: Chalk,

    +bgBlack: Chalk,
    +bgRed: Chalk,
    +bgGreen: Chalk,
    +bgYellow: Chalk,
    +bgBlue: Chalk,
    +bgMagenta: Chalk,
    +bgCyan: Chalk,
    +bgWhite: Chalk,
    +bgBlackBright: Chalk,
    +bgRedBright: Chalk,
    +bgGreenBright: Chalk,
    +bgYellowBright: Chalk,
    +bgBlueBright: Chalk,
    +bgMagentaBright: Chalk,
    +bgCyanBright: Chalk,
    +bgWhiteBrigh: Chalk,

    supportsColor: ColorSupport,
  };

  declare module.exports: Chalk;
}
