/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const DeprecatedImageStylePropTypes = require('DeprecatedImageStylePropTypes');
const TextStylePropTypes = require('TextStylePropTypes');
const DeprecatedViewStylePropTypes = require('DeprecatedViewStylePropTypes');

const invariant = require('fbjs/lib/invariant');

// Hardcoded because this is a legit case but we don't want to load it from
// a private API. We might likely want to unify style sheet creation with how it
// is done in the DOM so this might move into React. I know what I'm doing so
// plz don't fire me.
const ReactPropTypesSecret = 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED';

class StyleSheetValidation {
  static validateStyleProp(prop: string, style: Object, caller: string) {
    if (!__DEV__ || global.__RCTProfileIsProfiling) {
      return;
    }
    if (allStylePropTypes[prop] === undefined) {
      const message1 = '"' + prop + '" is not a valid style property.';
      const message2 =
        '\nValid style props: ' +
        JSON.stringify(Object.keys(allStylePropTypes).sort(), null, '  ');
      styleError(message1, style, caller, message2);
    }
    const error = allStylePropTypes[prop](
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

  static validateStyle(name: string, styles: Object) {
    if (!__DEV__ || global.__RCTProfileIsProfiling) {
      return;
    }
    for (const prop in styles[name]) {
      StyleSheetValidation.validateStyleProp(
        prop,
        styles[name],
        'StyleSheet ' + name,
      );
    }
  }

  /* $FlowFixMe(>=0.85.0 site=react_native_fb) This comment suppresses an error
   * found when Flow v0.85 was deployed. To see the error, delete this comment
   * and run Flow. */
  static addValidStylePropTypes(stylePropTypes) {
    if (!__DEV__ || global.__RCTProfileIsProfiling) {
      return;
    }
    for (const key in stylePropTypes) {
      allStylePropTypes[key] = stylePropTypes[key];
    }
  }
}

const styleError = function(message1, style, caller?, message2?) {
  invariant(
    false,
    message1 +
      '\n' +
      (caller || '<<unknown>>') +
      ': ' +
      JSON.stringify(style, null, '  ') +
      (message2 || ''),
  );
};

const allStylePropTypes = {};

if (__DEV__ && !global.__RCTProfileIsProfiling) {
  StyleSheetValidation.addValidStylePropTypes(DeprecatedImageStylePropTypes);
  StyleSheetValidation.addValidStylePropTypes(TextStylePropTypes);
  StyleSheetValidation.addValidStylePropTypes(DeprecatedViewStylePropTypes);
}

module.exports = StyleSheetValidation;
