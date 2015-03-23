/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var eslint = require('eslint');

var ignoredStylisticRules = {
  'key-spacing': false,
  'comma-spacing': true,
  'no-multi-spaces': true,
  'brace-style': true,
  'camelcase': true,
  'consistent-this': true,
  'eol-last': true,
  'func-names': true,
  'func-style': true,
  'new-cap': true,
  'new-parens': true,
  'no-nested-ternary': true,
  'no-array-constructor': true,
  'no-lonely-if': true,
  'no-new-object': true,
  'no-spaced-func': true,
  'no-space-before-semi': true,
  'no-ternary': true,
  'no-trailing-spaces': true,
  'no-underscore-dangle': true,
  'no-wrap-func': true,
  'no-mixed-spaces-and-tabs': true,
  'quotes': true,
  'quote-props': true,
  'semi': true,
  'sort-vars': true,
  'space-after-keywords': true,
  'space-in-brackets': true,
  'space-in-parens': true,
  'space-infix-ops': true,
  'space-return-throw-case': true,
  'space-unary-word-ops': true,
  'max-nested-callbacks': true,
  'one-var': true,
  'wrap-regex': true,
  'curly': true,
  'no-mixed-requires': true,
};

function setLinterTransform(transformSource) {
  var originalVerify = eslint.linter.verify;
  eslint.linter.verify = function(text, config, filename, saveState) {
    var transformedText;
    try {
      transformedText = transformSource(text, filename);
    } catch (e) {
      return [{
        severity: 2,
        line: e.lineNumber,
        message: e.message,
        source: text
      }];
    }
    var originalLines = text.split('\n');
    var transformedLines = transformedText.split('\n');
    var warnings = originalVerify.call(eslint.linter, transformedText, config, filename, saveState);

    // JSX and ES6 transforms usually generate pretty ugly code. Let's skip lint warnings
    // about code style for lines that have been changed by transform step.
    // Note that more important issues, like use of undefined vars, will still be reported.
    return warnings.filter(function(error) {
      var lineHasBeenTransformed = originalLines[error.line - 1] !== transformedLines[error.line - 1];
      var shouldIgnore = ignoredStylisticRules[error.ruleId] && lineHasBeenTransformed;
      return !shouldIgnore;
    });
  };
}

module.exports = {
  setLinterTransform: setLinterTransform,
};
