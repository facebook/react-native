/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule normalizeColor
 * @flow
 */
/* eslint no-bitwise: 0 */
'use strict';

function normalizeColor(color: string): ?number {
  var match;

  // Ordered based on occurrences on Facebook codebase
  if ((match = matchers.hex6.exec(color))) {
    return 0xff000000 + parseInt(match[1], 16);
  }

  if (names.hasOwnProperty(color)) {
    return names[color];
  }

  if ((match = matchers.rgb.exec(color))) {
    return (
      0xff000000 + // a
      parse255(match[1]) * (1 << 16) + // r
      parse255(match[2]) * (1 << 8) + // g
      parse255(match[3]) // b
    );
  }

  if ((match = matchers.rgba.exec(color))) {
    return (
      parse1(match[4]) * (1 << 24) + // a
      parse255(match[1]) * (1 << 16) + // r
      parse255(match[2]) * (1 << 8) + // g
      parse255(match[3]) // b
    );
  }

  if ((match = matchers.hex3.exec(color))) {
    return (
      parseInt(
        'ff' + // a
        match[1] + match[1] + // r
        match[2] + match[2] + // g
        match[3] + match[3], // b
        16
      )
    );
  }

  // https://drafts.csswg.org/css-color-4/#hex-notation
  if ((match = matchers.hex8.exec(color))) {
    var number = parseInt(match[1], 16);
    // Convert 0xrrggbbaa into 0xaarrggbb
    return (number << 24 | number >>> 8) >>> 0;
  }

  if ((match = matchers.hex4.exec(color))) {
    return (
      parseInt(
        match[4] + match[4] + // a
        match[1] + match[1] + // r
        match[2] + match[2] + // g
        match[3] + match[3], // b
        16
      )
    );
  }

  if ((match = matchers.hsl.exec(color))) {
    return (
      0xff000000 + // a
      hslToRgb(
        parse360(match[1]), // h
        parsePercentage(match[2]), // s
        parsePercentage(match[3]) // l
      )
    );
  }

  if ((match = matchers.hsla.exec(color))) {
    return (
      parse1(match[4]) * (1 << 24) + // a
      hslToRgb(
        parse360(match[1]), // h
        parsePercentage(match[2]), // s
        parsePercentage(match[3]) // l
      )
    );
  }

  return null;
}

function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) {
    t += 1;
  }
  if (t > 1) {
    t -= 1;
  }
  if (t < 1 / 6) {
    return p + (q - p) * 6 * t;
  }
  if (t < 1 / 2) {
    return q;
  }
  if (t < 2 / 3) {
    return p + (q - p) * (2 / 3 - t) * 6;
  }
  return p;
}

function hslToRgb(h: number, s: number, l: number): number {
  var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  var p = 2 * l - q;
  var r = hue2rgb(p, q, h + 1 / 3);
  var g = hue2rgb(p, q, h);
  var b = hue2rgb(p, q, h - 1 / 3);

  return (
    Math.round(r * 255) * (1 << 16) +
    Math.round(g * 255) * (1 << 8) +
    Math.round(b * 255)
  );
}

// var INTEGER = '[-+]?\\d+';
var NUMBER = '[-+]?\\d*\\.?\\d+';
var PERCENTAGE = NUMBER + '%';

function call(...args) {
  return '\\(\\s*(' + args.join(')\\s*,\\s*(') + ')\\s*\\)';
}

var matchers = {
  rgb: new RegExp('rgb' + call(NUMBER, NUMBER, NUMBER)),
  rgba: new RegExp('rgba' + call(NUMBER, NUMBER, NUMBER, NUMBER)),
  hsl: new RegExp('hsl' + call(NUMBER, PERCENTAGE, PERCENTAGE)),
  hsla: new RegExp('hsla' + call(NUMBER, PERCENTAGE, PERCENTAGE, NUMBER)),
  hex3: /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
  hex4: /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
  hex6: /^#([0-9a-fA-F]{6})$/,
  hex8: /^#([0-9a-fA-F]{8})$/,
};

function parse255(str: string): number {
  var int = parseInt(str, 10);
  if (int < 0) {
    return 0;
  }
  if (int > 255) {
    return 255;
  }
  return int;
}

function parse360(str: string): number {
  var int = parseFloat(str);
  return (((int % 360) + 360) % 360) / 360;
}

function parse1(str: string): number {
  var num = parseFloat(str);
  if (num < 0) {
    return 0;
  }
  if (num > 1) {
    return 255;
  }
  return Math.round(num * 255);
}

function parsePercentage(str: string): number {
  // parseFloat conveniently ignores the final %
  var int = parseFloat(str, 10);
  if (int < 0) {
    return 0;
  }
  if (int > 100) {
    return 1;
  }
  return int / 100;
}

var names = {
  transparent: 0x00000000,

  // http://www.w3.org/TR/css3-color/#svg-color
  aliceblue: 0xfff0f8ff,
  antiquewhite: 0xfffaebd7,
  aqua: 0xff00ffff,
  aquamarine: 0xff7fffd4,
  azure: 0xfff0ffff,
  beige: 0xfff5f5dc,
  bisque: 0xffffe4c4,
  black: 0xff000000,
  blanchedalmond: 0xffffebcd,
  blue: 0xff0000ff,
  blueviolet: 0xff8a2be2,
  brown: 0xffa52a2a,
  burlywood: 0xffdeb887,
  burntsienna: 0xffea7e5d,
  cadetblue: 0xff5f9ea0,
  chartreuse: 0xff7fff00,
  chocolate: 0xffd2691e,
  coral: 0xffff7f50,
  cornflowerblue: 0xff6495ed,
  cornsilk: 0xfffff8dc,
  crimson: 0xffdc143c,
  cyan: 0xff00ffff,
  darkblue: 0xff00008b,
  darkcyan: 0xff008b8b,
  darkgoldenrod: 0xffb8860b,
  darkgray: 0xffa9a9a9,
  darkgreen: 0xff006400,
  darkgrey: 0xffa9a9a9,
  darkkhaki: 0xffbdb76b,
  darkmagenta: 0xff8b008b,
  darkolivegreen: 0xff556b2f,
  darkorange: 0xffff8c00,
  darkorchid: 0xff9932cc,
  darkred: 0xff8b0000,
  darksalmon: 0xffe9967a,
  darkseagreen: 0xff8fbc8f,
  darkslateblue: 0xff483d8b,
  darkslategray: 0xff2f4f4f,
  darkslategrey: 0xff2f4f4f,
  darkturquoise: 0xff00ced1,
  darkviolet: 0xff9400d3,
  deeppink: 0xffff1493,
  deepskyblue: 0xff00bfff,
  dimgray: 0xff696969,
  dimgrey: 0xff696969,
  dodgerblue: 0xff1e90ff,
  firebrick: 0xffb22222,
  floralwhite: 0xfffffaf0,
  forestgreen: 0xff228b22,
  fuchsia: 0xffff00ff,
  gainsboro: 0xffdcdcdc,
  ghostwhite: 0xfff8f8ff,
  gold: 0xffffd700,
  goldenrod: 0xffdaa520,
  gray: 0xff808080,
  green: 0xff008000,
  greenyellow: 0xffadff2f,
  grey: 0xff808080,
  honeydew: 0xfff0fff0,
  hotpink: 0xffff69b4,
  indianred: 0xffcd5c5c,
  indigo: 0xff4b0082,
  ivory: 0xfffffff0,
  khaki: 0xfff0e68c,
  lavender: 0xffe6e6fa,
  lavenderblush: 0xfffff0f5,
  lawngreen: 0xff7cfc00,
  lemonchiffon: 0xfffffacd,
  lightblue: 0xffadd8e6,
  lightcoral: 0xfff08080,
  lightcyan: 0xffe0ffff,
  lightgoldenrodyellow: 0xfffafad2,
  lightgray: 0xffd3d3d3,
  lightgreen: 0xff90ee90,
  lightgrey: 0xffd3d3d3,
  lightpink: 0xffffb6c1,
  lightsalmon: 0xffffa07a,
  lightseagreen: 0xff20b2aa,
  lightskyblue: 0xff87cefa,
  lightslategray: 0xff778899,
  lightslategrey: 0xff778899,
  lightsteelblue: 0xffb0c4de,
  lightyellow: 0xffffffe0,
  lime: 0xff00ff00,
  limegreen: 0xff32cd32,
  linen: 0xfffaf0e6,
  magenta: 0xffff00ff,
  maroon: 0xff800000,
  mediumaquamarine: 0xff66cdaa,
  mediumblue: 0xff0000cd,
  mediumorchid: 0xffba55d3,
  mediumpurple: 0xff9370db,
  mediumseagreen: 0xff3cb371,
  mediumslateblue: 0xff7b68ee,
  mediumspringgreen: 0xff00fa9a,
  mediumturquoise: 0xff48d1cc,
  mediumvioletred: 0xffc71585,
  midnightblue: 0xff191970,
  mintcream: 0xfff5fffa,
  mistyrose: 0xffffe4e1,
  moccasin: 0xffffe4b5,
  navajowhite: 0xffffdead,
  navy: 0xff000080,
  oldlace: 0xfffdf5e6,
  olive: 0xff808000,
  olivedrab: 0xff6b8e23,
  orange: 0xffffa500,
  orangered: 0xffff4500,
  orchid: 0xffda70d6,
  palegoldenrod: 0xffeee8aa,
  palegreen: 0xff98fb98,
  paleturquoise: 0xffafeeee,
  palevioletred: 0xffdb7093,
  papayawhip: 0xffffefd5,
  peachpuff: 0xffffdab9,
  peru: 0xffcd853f,
  pink: 0xffffc0cb,
  plum: 0xffdda0dd,
  powderblue: 0xffb0e0e6,
  purple: 0xff800080,
  rebeccapurple: 0xff663399,
  red: 0xffff0000,
  rosybrown: 0xffbc8f8f,
  royalblue: 0xff4169e1,
  saddlebrown: 0xff8b4513,
  salmon: 0xfffa8072,
  sandybrown: 0xfff4a460,
  seagreen: 0xff2e8b57,
  seashell: 0xfffff5ee,
  sienna: 0xffa0522d,
  silver: 0xffc0c0c0,
  skyblue: 0xff87ceeb,
  slateblue: 0xff6a5acd,
  slategray: 0xff708090,
  slategrey: 0xff708090,
  snow: 0xfffffafa,
  springgreen: 0xff00ff7f,
  steelblue: 0xff4682b4,
  tan: 0xffd2b48c,
  teal: 0xff008080,
  thistle: 0xffd8bfd8,
  tomato: 0xffff6347,
  turquoise: 0xff40e0d0,
  violet: 0xffee82ee,
  wheat: 0xfff5deb3,
  white: 0xffffffff,
  whitesmoke: 0xfff5f5f5,
  yellow: 0xffffff00,
  yellowgreen: 0xff9acd32,
};

module.exports = normalizeColor;
