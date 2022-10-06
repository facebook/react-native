/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

/* eslint no-bitwise: 0 */

'use strict';

function normalizeColor(color) {
  if (typeof color === 'number') {
    if (color >>> 0 === color && color >= 0 && color <= 0xffffffff) {
      return color;
    }
    return null;
  }

  if (typeof color !== 'string') {
    return null;
  }

  const matchers = getMatchers();
  let match;

  // Ordered based on occurrences on Facebook codebase
  if ((match = matchers.hex6.exec(color))) {
    return parseInt(match[1] + 'ff', 16) >>> 0;
  }

  const colorFromKeyword = normalizeKeyword(color);
  if (colorFromKeyword != null) {
    return colorFromKeyword;
  }

  if ((match = matchers.rgb.exec(color))) {
    return (
      ((parse255(match[1]) << 24) | // r
        (parse255(match[2]) << 16) | // g
        (parse255(match[3]) << 8) | // b
        0x000000ff) >>> // a
      0
    );
  }

  if ((match = matchers.rgba.exec(color))) {
    // rgba(R G B / A) notation
    if (match[6] !== undefined) {
      return (
        ((parse255(match[6]) << 24) | // r
          (parse255(match[7]) << 16) | // g
          (parse255(match[8]) << 8) | // b
          parse1(match[9])) >>> // a
        0
      );
    }

    // rgba(R, G, B, A) notation
    return (
      ((parse255(match[2]) << 24) | // r
        (parse255(match[3]) << 16) | // g
        (parse255(match[4]) << 8) | // b
        parse1(match[5])) >>> // a
      0
    );
  }

  if ((match = matchers.hex3.exec(color))) {
    return (
      parseInt(
        match[1] +
          match[1] + // r
          match[2] +
          match[2] + // g
          match[3] +
          match[3] + // b
          'ff', // a
        16,
      ) >>> 0
    );
  }

  // https://drafts.csswg.org/css-color-4/#hex-notation
  if ((match = matchers.hex8.exec(color))) {
    return parseInt(match[1], 16) >>> 0;
  }

  if ((match = matchers.hex4.exec(color))) {
    return (
      parseInt(
        match[1] +
          match[1] + // r
          match[2] +
          match[2] + // g
          match[3] +
          match[3] + // b
          match[4] +
          match[4], // a
        16,
      ) >>> 0
    );
  }

  if ((match = matchers.hsl.exec(color))) {
    return (
      (hslToRgb(
        parse360(match[1]), // h
        parsePercentage(match[2]), // s
        parsePercentage(match[3]), // l
      ) |
        0x000000ff) >>> // a
      0
    );
  }

  if ((match = matchers.hsla.exec(color))) {
    // hsla(H S L / A) notation
    if (match[6] !== undefined) {
      return (
        (hslToRgb(
          parse360(match[6]), // h
          parsePercentage(match[7]), // s
          parsePercentage(match[8]), // l
        ) |
          parse1(match[9])) >>> // a
        0
      );
    }

    // hsla(H, S, L, A) notation
    return (
      (hslToRgb(
        parse360(match[2]), // h
        parsePercentage(match[3]), // s
        parsePercentage(match[4]), // l
      ) |
        parse1(match[5])) >>> // a
      0
    );
  }

  if ((match = matchers.hwb.exec(color))) {
    return (
      (hwbToRgb(
        parse360(match[1]), // h
        parsePercentage(match[2]), // w
        parsePercentage(match[3]), // b
      ) |
        0x000000ff) >>> // a
      0
    );
  }

  return null;
}

function hue2rgb(p, q, t) {
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

function hslToRgb(h, s, l) {
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = hue2rgb(p, q, h + 1 / 3);
  const g = hue2rgb(p, q, h);
  const b = hue2rgb(p, q, h - 1 / 3);

  return (
    (Math.round(r * 255) << 24) |
    (Math.round(g * 255) << 16) |
    (Math.round(b * 255) << 8)
  );
}

function hwbToRgb(h, w, b) {
  if (w + b >= 1) {
    const gray = Math.round((w * 255) / (w + b));

    return (gray << 24) | (gray << 16) | (gray << 8);
  }

  const red = hue2rgb(0, 1, h + 1 / 3) * (1 - w - b) + w;
  const green = hue2rgb(0, 1, h) * (1 - w - b) + w;
  const blue = hue2rgb(0, 1, h - 1 / 3) * (1 - w - b) + w;

  return (
    (Math.round(red * 255) << 24) |
    (Math.round(green * 255) << 16) |
    (Math.round(blue * 255) << 8)
  );
}

const NUMBER = '[-+]?\\d*\\.?\\d+';
const PERCENTAGE = NUMBER + '%';

function call(...args) {
  return '\\(\\s*(' + args.join(')\\s*,?\\s*(') + ')\\s*\\)';
}

function callWithSlashSeparator(...args) {
  return (
    '\\(\\s*(' +
    args.slice(0, args.length - 1).join(')\\s*,?\\s*(') +
    ')\\s*/\\s*(' +
    args[args.length - 1] +
    ')\\s*\\)'
  );
}

function commaSeparatedCall(...args) {
  return '\\(\\s*(' + args.join(')\\s*,\\s*(') + ')\\s*\\)';
}

let cachedMatchers;

function getMatchers() {
  if (cachedMatchers === undefined) {
    const regexStrings = getColorRegExStrings();
    cachedMatchers = {
      rgb: new RegExp(regexStrings.rgb),
      rgba: new RegExp(regexStrings.rgba),
      hsl: new RegExp(regexStrings.hsl),
      hsla: new RegExp(regexStrings.hsla),
      hwb: new RegExp(regexStrings.hwb),
      hex3: new RegExp(`^${regexStrings.hex3}$`),
      hex4: new RegExp(`^${regexStrings.hex4}$`),
      hex6: new RegExp(`^${regexStrings.hex6}$`),
      hex8: new RegExp(`^${regexStrings.hex8}$`),
    };
  }
  return cachedMatchers;
}

function parse255(str) {
  const int = parseInt(str, 10);
  if (int < 0) {
    return 0;
  }
  if (int > 255) {
    return 255;
  }
  return int;
}

function parse360(str) {
  const int = parseFloat(str);
  return (((int % 360) + 360) % 360) / 360;
}

function parse1(str) {
  const num = parseFloat(str);
  if (num < 0) {
    return 0;
  }
  if (num > 1) {
    return 255;
  }
  return Math.round(num * 255);
}

function parsePercentage(str) {
  // parseFloat conveniently ignores the final %
  const int = parseFloat(str);
  if (int < 0) {
    return 0;
  }
  if (int > 100) {
    return 1;
  }
  return int / 100;
}

function getColorRegExStrings() {
  return {
    rgb: 'rgb' + call(NUMBER, NUMBER, NUMBER),
    rgba:
      'rgba(' +
      commaSeparatedCall(NUMBER, NUMBER, NUMBER, NUMBER) +
      '|' +
      callWithSlashSeparator(NUMBER, NUMBER, NUMBER, NUMBER) +
      ')',
    hsl: 'hsl' + call(NUMBER, PERCENTAGE, PERCENTAGE),
    hsla:
      'hsla(' +
      commaSeparatedCall(NUMBER, PERCENTAGE, PERCENTAGE, NUMBER) +
      '|' +
      callWithSlashSeparator(NUMBER, PERCENTAGE, PERCENTAGE, NUMBER) +
      ')',
    hwb: 'hwb' + call(NUMBER, PERCENTAGE, PERCENTAGE),
    hex3: '#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})',
    hex4: '#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})',
    hex6: '#([0-9a-fA-F]{6})',
    hex8: '#([0-9a-fA-F]{8})',
  };
}

const namedColors = {
  transparent: 0x00000000,
  aliceblue: 0xf0f8ffff,
  antiquewhite: 0xfaebd7ff,
  aqua: 0x00ffffff,
  aquamarine: 0x7fffd4ff,
  azure: 0xf0ffffff,
  beige: 0xf5f5dcff,
  bisque: 0xffe4c4ff,
  black: 0x000000ff,
  blanchedalmond: 0xffebcdff,
  blue: 0x0000ffff,
  blueviolet: 0x8a2be2ff,
  brown: 0xa52a2aff,
  burlywood: 0xdeb887ff,
  burntsienna: 0xea7e5dff,
  cadetblue: 0x5f9ea0ff,
  chartreuse: 0x7fff00ff,
  chocolate: 0xd2691eff,
  coral: 0xff7f50ff,
  cornflowerblue: 0x6495edff,
  cornsilk: 0xfff8dcff,
  crimson: 0xdc143cff,
  cyan: 0x00ffffff,
  darkblue: 0x00008bff,
  darkcyan: 0x008b8bff,
  darkgoldenrod: 0xb8860bff,
  darkgray: 0xa9a9a9ff,
  darkgreen: 0x006400ff,
  darkgrey: 0xa9a9a9ff,
  darkkhaki: 0xbdb76bff,
  darkmagenta: 0x8b008bff,
  darkolivegreen: 0x556b2fff,
  darkorange: 0xff8c00ff,
  darkorchid: 0x9932ccff,
  darkred: 0x8b0000ff,
  darksalmon: 0xe9967aff,
  darkseagreen: 0x8fbc8fff,
  darkslateblue: 0x483d8bff,
  darkslategray: 0x2f4f4fff,
  darkslategrey: 0x2f4f4fff,
  darkturquoise: 0x00ced1ff,
  darkviolet: 0x9400d3ff,
  deeppink: 0xff1493ff,
  deepskyblue: 0x00bfffff,
  dimgray: 0x696969ff,
  dimgrey: 0x696969ff,
  dodgerblue: 0x1e90ffff,
  firebrick: 0xb22222ff,
  floralwhite: 0xfffaf0ff,
  forestgreen: 0x228b22ff,
  fuchsia: 0xff00ffff,
  gainsboro: 0xdcdcdcff,
  ghostwhite: 0xf8f8ffff,
  gold: 0xffd700ff,
  goldenrod: 0xdaa520ff,
  gray: 0x808080ff,
  green: 0x008000ff,
  greenyellow: 0xadff2fff,
  grey: 0x808080ff,
  honeydew: 0xf0fff0ff,
  hotpink: 0xff69b4ff,
  indianred: 0xcd5c5cff,
  indigo: 0x4b0082ff,
  ivory: 0xfffff0ff,
  khaki: 0xf0e68cff,
  lavender: 0xe6e6faff,
  lavenderblush: 0xfff0f5ff,
  lawngreen: 0x7cfc00ff,
  lemonchiffon: 0xfffacdff,
  lightblue: 0xadd8e6ff,
  lightcoral: 0xf08080ff,
  lightcyan: 0xe0ffffff,
  lightgoldenrodyellow: 0xfafad2ff,
  lightgray: 0xd3d3d3ff,
  lightgreen: 0x90ee90ff,
  lightgrey: 0xd3d3d3ff,
  lightpink: 0xffb6c1ff,
  lightsalmon: 0xffa07aff,
  lightseagreen: 0x20b2aaff,
  lightskyblue: 0x87cefaff,
  lightslategray: 0x778899ff,
  lightslategrey: 0x778899ff,
  lightsteelblue: 0xb0c4deff,
  lightyellow: 0xffffe0ff,
  lime: 0x00ff00ff,
  limegreen: 0x32cd32ff,
  linen: 0xfaf0e6ff,
  magenta: 0xff00ffff,
  maroon: 0x800000ff,
  mediumaquamarine: 0x66cdaaff,
  mediumblue: 0x0000cdff,
  mediumorchid: 0xba55d3ff,
  mediumpurple: 0x9370dbff,
  mediumseagreen: 0x3cb371ff,
  mediumslateblue: 0x7b68eeff,
  mediumspringgreen: 0x00fa9aff,
  mediumturquoise: 0x48d1ccff,
  mediumvioletred: 0xc71585ff,
  midnightblue: 0x191970ff,
  mintcream: 0xf5fffaff,
  mistyrose: 0xffe4e1ff,
  moccasin: 0xffe4b5ff,
  navajowhite: 0xffdeadff,
  navy: 0x000080ff,
  oldlace: 0xfdf5e6ff,
  olive: 0x808000ff,
  olivedrab: 0x6b8e23ff,
  orange: 0xffa500ff,
  orangered: 0xff4500ff,
  orchid: 0xda70d6ff,
  palegoldenrod: 0xeee8aaff,
  palegreen: 0x98fb98ff,
  paleturquoise: 0xafeeeeff,
  palevioletred: 0xdb7093ff,
  papayawhip: 0xffefd5ff,
  peachpuff: 0xffdab9ff,
  peru: 0xcd853fff,
  pink: 0xffc0cbff,
  plum: 0xdda0ddff,
  powderblue: 0xb0e0e6ff,
  purple: 0x800080ff,
  rebeccapurple: 0x663399ff,
  red: 0xff0000ff,
  rosybrown: 0xbc8f8fff,
  royalblue: 0x4169e1ff,
  saddlebrown: 0x8b4513ff,
  salmon: 0xfa8072ff,
  sandybrown: 0xf4a460ff,
  seagreen: 0x2e8b57ff,
  seashell: 0xfff5eeff,
  sienna: 0xa0522dff,
  silver: 0xc0c0c0ff,
  skyblue: 0x87ceebff,
  slateblue: 0x6a5acdff,
  slategray: 0x708090ff,
  slategrey: 0x708090ff,
  snow: 0xfffafaff,
  springgreen: 0x00ff7fff,
  steelblue: 0x4682b4ff,
  tan: 0xd2b48cff,
  teal: 0x008080ff,
  thistle: 0xd8bfd8ff,
  tomato: 0xff6347ff,
  turquoise: 0x40e0d0ff,
  violet: 0xee82eeff,
  wheat: 0xf5deb3ff,
  white: 0xffffffff,
  whitesmoke: 0xf5f5f5ff,
  yellow: 0xffff00ff,
  yellowgreen: 0x9acd32ff,
};

function normalizeKeyword(name) {
  return namedColors[name] ?? null;
}

module.exports = {
  normalizeColor,
  namedColors: Object.keys(namedColors),
  getColorRegExStrings: getColorRegExStrings,
};
