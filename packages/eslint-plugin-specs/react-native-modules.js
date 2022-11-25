/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

'use strict';

const path = require('path');
const withBabelRegister = require('./with-babel-register');

// We use the prepack hook before publishing package to set this value to true
const PACKAGE_USAGE = false;
const ERRORS = {
  misnamedHasteModule(hasteModuleName) {
    return `Module ${hasteModuleName}: All files using TurboModuleRegistry must start with Native.`;
  },
};

let RNModuleParser;
let RNParserUtils;
let RNFlowParser;

function requireModuleParser() {
  if (RNModuleParser == null || RNParserUtils == null || RNFlowParser == null) {
    // If using this externally, we leverage @react-native/codegen as published form
    if (!PACKAGE_USAGE) {
      const config = {
        only: [/react-native-codegen\/src\//],
        plugins: [require('@babel/plugin-transform-flow-strip-types').default],
      };

      withBabelRegister(config, () => {
        RNModuleParser = require('@react-native/codegen/src/parsers/flow/modules');
        RNParserUtils = require('@react-native/codegen/src/parsers/utils');
        RNFlowParser = require('@react-native/codegen/src/parsers/flow/parser');
      });
    } else {
      const config = {
        only: [/@react-native\/codegen\/lib\//],
        plugins: [require('@babel/plugin-transform-flow-strip-types').default],
      };

      withBabelRegister(config, () => {
        RNModuleParser = require('@react-native/codegen/lib/parsers/flow/modules');
        RNParserUtils = require('@react-native/codegen/lib/parsers/flow/utils');
        RNFlowParser = require('@react-native/codegen/lib/parsers/flow/parser');
      });
    }
  }

  return {
    buildModuleSchema: RNModuleParser.buildModuleSchema,
    createParserErrorCapturer: RNParserUtils.createParserErrorCapturer,
    parser: new RNFlowParser.FlowParser(),
  };
}

const VALID_SPEC_NAMES = /^Native\S+$/;

function isModuleRequire(node) {
  if (node.type !== 'CallExpression') {
    return false;
  }

  const callExpression = node;

  if (callExpression.callee.type !== 'MemberExpression') {
    return false;
  }

  const memberExpression = callExpression.callee;
  if (
    !(
      memberExpression.object.type === 'Identifier' &&
      memberExpression.object.name === 'TurboModuleRegistry'
    )
  ) {
    return false;
  }

  if (
    !(
      memberExpression.property.type === 'Identifier' &&
      (memberExpression.property.name === 'get' ||
        memberExpression.property.name === 'getEnforcing')
    )
  ) {
    return false;
  }
  return true;
}

function isGeneratedFile(context) {
  return (
    context
      .getSourceCode()
      .getText()
      .indexOf('@' + 'generated SignedSource<<') !== -1
  );
}

/**
 * A lint rule to guide best practices in writing type safe React NativeModules.
 */
function rule(context) {
  const filename = context.getFilename();
  const hasteModuleName = path.basename(filename).replace(/\.js$/, '');

  if (isGeneratedFile(context)) {
    return {};
  }

  let isModule = false;

  return {
    'Program:exit': function (node) {
      if (!isModule) {
        return;
      }

      // Report invalid file names
      if (!VALID_SPEC_NAMES.test(hasteModuleName)) {
        context.report({
          node,
          message: ERRORS.misnamedHasteModule(hasteModuleName),
        });
      }

      const {buildModuleSchema, createParserErrorCapturer, parser} =
        requireModuleParser();
      const flowParser = require('flow-parser');

      const [parsingErrors, tryParse] = createParserErrorCapturer();

      const sourceCode = context.getSourceCode().getText();
      const ast = flowParser.parse(sourceCode, {enums: true});

      tryParse(() => {
        buildModuleSchema(hasteModuleName, ast, tryParse, parser);
      });

      parsingErrors.forEach(error => {
        error.nodes.forEach(flowNode => {
          context.report({
            loc: flowNode.loc,
            message: error.message,
          });
        });
      });
    },
    CallExpression(node) {
      if (!isModuleRequire(node)) {
        return;
      }

      isModule = true;
    },
    InterfaceExtends(node) {
      if (node.id.name !== 'TurboModule') {
        return;
      }

      isModule = true;
    },
  };
}

rule.errors = ERRORS;

module.exports = rule;
