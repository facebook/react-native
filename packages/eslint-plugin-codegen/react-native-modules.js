/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react_native
 * @format
 */

'use strict';

const path = require('path');
const withBabelRegister = require('./with-babel-register');

const ERRORS = {
  misnamedHasteModule(hasteModuleName) {
    return `Module ${hasteModuleName}: All files using TurboModuleRegistry must start with Native.`;
  },
  untypedModuleRequire(hasteModuleName, requireMethodName) {
    return `Module ${hasteModuleName}: Please type parameterize the Module require: TurboModuleRegistry.${requireMethodName}<Spec>().`;
  },
  incorrectlyTypedModuleRequire(hasteModuleName, requireMethodName) {
    return `Module ${hasteModuleName}: Type parameter of Module require must be 'Spec': TurboModuleRegistry.${requireMethodName}<Spec>().`;
  },
  multipleModuleRequires(hasteModuleName, numCalls) {
    return `Module ${hasteModuleName}: Module spec must contain exactly one call into TurboModuleRegistry, detected ${numCalls}.`;
  },
  calledModuleRequireWithWrongType(hasteModuleName, requireMethodName, type) {
    const a = /[aeiouy]/.test(type.toLowerCase()) ? 'an' : 'a';
    return `Module ${hasteModuleName}: TurboModuleRegistry.${requireMethodName}<Spec>() must be called with a string literal, detected ${a} '${type}'.`;
  },
  calledModuleRequireWithWrongLiteral(
    hasteModuleName,
    requireMethodName,
    literal,
  ) {
    return `Module ${hasteModuleName}: TurboModuleRegistry.${requireMethodName}<Spec>() must be called with a string literal, detected ${literal}`;
  },
};

let RNModuleParser;
let RNParserUtils;

function requireModuleParser() {
  if (RNModuleParser == null || RNParserUtils == null) {
    const config = {
      only: [/react-native-codegen\/src\//],
      plugins: [require('@babel/plugin-transform-flow-strip-types').default],
    };

    withBabelRegister(config, () => {
      RNModuleParser = require('react-native-codegen/src/parsers/flow/modules');
      RNParserUtils = require('react-native-codegen/src/parsers/flow/utils');
    });
  }

  return {
    buildModuleSchema: RNModuleParser.buildModuleSchema,
    createParserErrorCapturer: RNParserUtils.createParserErrorCapturer,
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

  let moduleRequires = [];
  return {
    'Program:exit': function(node) {
      if (moduleRequires.length === 0) {
        return;
      }

      if (moduleRequires.length > 1) {
        moduleRequires.forEach(callExpressionNode => {
          context.report({
            node: callExpressionNode,
            message: ERRORS.multipleModuleRequires(
              hasteModuleName,
              moduleRequires.length,
            ),
          });
        });
        return;
      }

      // Report invalid file names
      if (!VALID_SPEC_NAMES.test(hasteModuleName)) {
        context.report({
          node,
          message: ERRORS.misnamedHasteModule(hasteModuleName),
        });
      }

      const {
        buildModuleSchema,
        createParserErrorCapturer,
      } = requireModuleParser();
      const flowParser = require('flow-parser');

      const [parsingErrors, guard] = createParserErrorCapturer();

      const sourceCode = context.getSourceCode().getText();
      const ast = flowParser.parse(sourceCode);
      guard(() => buildModuleSchema(hasteModuleName, [], ast, guard));
      parsingErrors.forEach(error => {
        context.report({
          loc: error.node.loc,
          message: error.message,
        });
      });
    },
    CallExpression(node) {
      if (!isModuleRequire(node)) {
        return;
      }

      moduleRequires.push(node);

      /**
       * Validate that NativeModule requires are typed
       */

      const {typeArguments} = node;

      if (typeArguments == null) {
        const methodName = node.callee.property.name;
        context.report({
          node,
          message: ERRORS.untypedModuleRequire(hasteModuleName, methodName),
        });
        return;
      }

      if (typeArguments.type !== 'TypeParameterInstantiation') {
        return;
      }

      const [param] = typeArguments.params;

      /**
       * Validate that NativeModule requires are correctly typed
       */

      if (
        typeArguments.params.length !== 1 ||
        param.type !== 'GenericTypeAnnotation' ||
        param.id.name !== 'Spec'
      ) {
        const methodName = node.callee.property.name;
        context.report({
          node,
          message: ERRORS.incorrectlyTypedModuleRequire(
            hasteModuleName,
            methodName,
          ),
        });
        return;
      }

      /**
       * Validate the TurboModuleRegistry.get<Spec>(...) argument
       */

      if (node.arguments.length === 1) {
        const methodName = node.callee.property.name;

        if (node.arguments[0].type !== 'Literal') {
          context.report({
            node: node.arguments[0],
            message: ERRORS.calledModuleRequireWithWrongType(
              hasteModuleName,
              methodName,
              node.arguments[0].type,
            ),
          });
          return;
        }

        if (typeof node.arguments[0].value !== 'string') {
          context.report({
            node: node.arguments[0],
            message: ERRORS.calledModuleRequireWithWrongLiteral(
              hasteModuleName,
              methodName,
              node.arguments[0].value,
            ),
          });
          return;
        }
      }

      return true;
    },
  };
}

rule.errors = ERRORS;

module.exports = rule;
