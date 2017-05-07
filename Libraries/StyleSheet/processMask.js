/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule processMask
 * @flow
 */
'use strict';

var processColor = require('processColor');

var invariant = require('fbjs/lib/invariant');
var stringifySafe = require('stringifySafe');

/**
 * Generate a mask object from the given style info
 */
function processMask(maskStyle: Object): Object {
  if (__DEV__) {
    validateMask(maskStyle);
  }

  var position = convertSideOrCorner(maskStyle.sideOrCorner);

  return {
    colors: maskStyle.colors.map(processColor),
    locations: maskStyle.locations,
    start: position.start,
    end: position.end
  };
}

function convertSideOrCorner(sideOrCorner: string): Object {
  // Default position is "to bottom"
  var position = {
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1.0 }
  };

  if (!sideOrCorner) {
    return position;
  }

  var values = sideOrCorner.split(/\s+/);

  if (values[1] === 'left') {
    position.start = { x: 1.0, y: 0.5 };
    position.end = { x: 0, y: 0.5 };
  } else if (values[1] === 'right') {
    position.start = { x: 0, y: 0.5 };
    position.end = { x: 1.0, y: 0.5 };
  } else if (values[1] === 'top') {
    position.start = { x: 0.5, y: 1.0 };
    position.end = { x: 0.5, y: 0 };
  }

  if (values[2] === 'left') {
    position.start.x = 1.0;
    position.end.x = 0;
  } else if (values[2] === 'right') {
    position.start.x = 0;
    position.end.x = 1.0;
  } else if (values[2] === 'top') {
    position.start.y = 1.0;
    position.end.y = 0;
  } else if (values[2] === 'bottom') {
    position.start.y = 0;
    position.end.y = 1.0;
  }
  return position;
}

function validateMask(maskStyle: Object): void {
  invariant(
    maskStyle.colors && maskStyle.colors.length,
    'The mask must have at least one color. Passed properties: %s',
    stringifySafe(maskStyle)
  );
  if (maskStyle.locations) {
    invariant(
      maskStyle.locations.length === maskStyle.colors.length,
      'The mask must have one location per color. Passed properties: %s',
      stringifySafe(maskStyle)
    );
  }
  if (maskStyle.sideOrCorner) {
    validateSideOrCorner(maskStyle.sideOrCorner);
  }
}

var legalSideOrCorner = ['left', 'right', 'top', 'bottom'];

function validateSideOrCorner(sideOrCorner: string): void {
  invariant(
    sideOrCorner.indexOf('to ') === 0,
    'Mask "sideOrCorner" must start with "to ": %s',
    stringifySafe(sideOrCorner)
  );
  invariant(
    sideOrCorner.split(/\s+/).slice(1).every(val => legalSideOrCorner.includes(val)),
    'Mask "sideOrCorner" must contain only "left", "right", "top", "bottom": %s',
    stringifySafe(sideOrCorner)
  );
}

module.exports = processMask;
