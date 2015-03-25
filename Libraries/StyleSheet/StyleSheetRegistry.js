/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule StyleSheetRegistry
 * @flow
 */
'use strict';

var styles = {};
var uniqueID = 1;
var emptyStyle = {};

class StyleSheetRegistry {
  static registerStyle(style: Object): number {
    var id = ++uniqueID;
    if (__DEV__) {
      Object.freeze(style);
    }
    styles[id] = style;
    return id;
  }

  static getStyleByID(id: number): Object {
    if (!id) {
      // Used in the style={[condition && id]} pattern,
      // we want it to be a no-op when the value is false or null
      return emptyStyle;
    }

    var style = styles[id];
    if (!style) {
      console.warn('Invalid style with id `' + id + '`. Skipping ...');
      return emptyStyle;
    }
    return style;
  }
}

module.exports = StyleSheetRegistry;
