/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var _ = require('lodash');
var wordwrap = require('wordwrap');

var HORIZONTAL_LINE = '\u2500';
var VERTICAL_LINE = '\u2502';
var TOP_LEFT = '\u250c';
var TOP_RIGHT = '\u2510';
var BOTTOM_LEFT = '\u2514';
var BOTTOM_RIGHT = '\u2518';

/**
 * Prints a banner with a border around it containing the given message. The
 * following options are supported:
 *
 * type Options = {
 *   // A function to apply to each line of text to decorate it
 *   chalkFunction: (string: message) => string;
 *   // The total width (max line length) of the banner, including margin and
 *   // padding (default = 80)
 *   width: number;
 *   // How much leading space to prepend to each line (default = 0)
 *   marginLeft: number;
 *   // How much trailing space to append to each line (default = 0)
 *   marginRight: number;
 *   // Space between the top banner border and the text (default = 0)
 *   paddingTop: number;
 *   // Space between the bottom banner border and the text (default = 0)
 *   paddingBottom: number;
 *   // Space between the left banner border and the text (default = 2)
 *   paddingLeft: number;
 *   // Space between the right banner border and the text (default = 2)
 *   paddingRight: number;
 * };
 */
function formatBanner(message, options) {
  options = options || {};
  _.defaults(options, {
    chalkFunction: _.identity,
    width: 80,
    marginLeft: 0,
    marginRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 2,
    paddingRight: 2,
  });

  var width = options.width;
  var marginLeft = options.marginLeft;
  var marginRight = options.marginRight;
  var paddingTop = options.paddingTop;
  var paddingBottom = options.paddingBottom;
  var paddingLeft = options.paddingLeft;
  var paddingRight = options.paddingRight;

  var horizSpacing = marginLeft + paddingLeft + paddingRight + marginRight;
  // 2 for the banner borders
  var maxLineWidth = width - horizSpacing - 2;
  var wrap = wordwrap(maxLineWidth);
  var body = wrap(message);

  var left = spaces(marginLeft) + VERTICAL_LINE + spaces(paddingLeft);
  var right = spaces(paddingRight) + VERTICAL_LINE + spaces(marginRight);
  var bodyLines = _.flattenDeep([
    arrayOf('', paddingTop),
    body.split('\n'),
    arrayOf('', paddingBottom),
  ]).map(function(line) {
    var padding = spaces(Math.max(0, maxLineWidth - line.length));
    return left + options.chalkFunction(line) + padding + right;
  });

  var horizontalBorderLine = repeatString(
    HORIZONTAL_LINE,
    width - marginLeft - marginRight - 2
  );
  var top = spaces(marginLeft) + TOP_LEFT + horizontalBorderLine + TOP_RIGHT +
    spaces(marginRight);
  var bottom = spaces(marginLeft) + BOTTOM_LEFT + horizontalBorderLine +
    BOTTOM_RIGHT + spaces(marginRight);
  return _.flattenDeep([top, bodyLines, bottom]).join('\n');
}

function spaces(number) {
  return repeatString(' ', number);
}

function repeatString(string, number) {
  return new Array(number + 1).join(string);
}

function arrayOf(value, number) {
  return _.range(number).map(function() {
    return value;
  });
}

module.exports = formatBanner;
