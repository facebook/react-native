/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule StyleSheetValidation
 * @flow
 */
'use strict';

var ImageStylePropTypes = require('../Image/ImageStylePropTypes');
var TextStylePropTypes = require('../Text/TextStylePropTypes');
var ViewStylePropTypes = require('../Components/View/ViewStylePropTypes');

var invariant = require('fbjs/lib/invariant');

// Hardcoded because this is a legit case but we don't want to load it from
// a private API. We might likely want to unify style sheet creation with how it
// is done in the DOM so this might move into React. I know what I'm doing so
// plz don't fire me.
const ReactPropTypesSecret = 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED';

class StyleSheetValidation {
  static validateStyleProp(prop, style, caller) {
    if (!__DEV__) {
      return;
    }
    if (allStylePropTypes[prop] === undefined) {
      var message1 = '"' + prop + '" is not a valid style property.';
      var message2 = '\nValid style props: ' +
        JSON.stringify(Object.keys(allStylePropTypes).sort(), null, '  ');
      styleError(message1, style, caller, message2);
    }
    var error = allStylePropTypes[prop](
      style,
      prop,
      caller,
      'prop',
      null,
      ReactPropTypesSecret,
    );
    if (error) {
      styleError(error.message, style, caller);
    }
  }

  static validateStyle(name, styles) {
    if (!__DEV__) {
      return;
    }
    for (var prop in styles[name]) {
      StyleSheetValidation.validateStyleProp(prop, styles[name], 'StyleSheet ' + name);
    }
  }

  static addValidStylePropTypes(stylePropTypes) {
    for (var key in stylePropTypes) {
      allStylePropTypes[key] = stylePropTypes[key];
    }
  }
}

var styleError = function(message1, style, caller?, message2?) {
  invariant(
    false,
    message1 + '\n' + (caller || '<<unknown>>') + ': ' +
    JSON.stringify(style, null, '  ') + (message2 || '')
  );
};

var allStylePropTypes = {};

StyleSheetValidation.addValidStylePropTypes(ImageStylePropTypes);
StyleSheetValidation.addValidStylePropTypes(TextStylePropTypes);
StyleSheetValidation.addValidStylePropTypes(ViewStylePropTypes);

module.exports = StyleSheetValidation;
