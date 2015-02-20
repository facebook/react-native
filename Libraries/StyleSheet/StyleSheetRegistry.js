/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule StyleSheetRegistry
 */
'use strict';

var styles = {};
var uniqueID = 1;
var emptyStyle = {};

class StyleSheetRegistry {
  static registerStyle(style) {
    var id = ++uniqueID;
    if (__DEV__) {
      Object.freeze(style);
    }
    styles[id] = style;
    return id;
  }

  static getStyleByID(id) {
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
