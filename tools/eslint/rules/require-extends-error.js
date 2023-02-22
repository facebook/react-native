/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: "Require error classes to extend 'Error'",
      recommended: true,
    },
    messages: {
      errorClass:
        "'{{name}}' must extend an error class (like 'Error') because its name is in PascalCase and ends with 'Error'.",
      errorSuperClass:
        "'{{name}}' may not be the name of an error class. It should be in PascalCase and end with 'Error'.",
      errorSuperClassMissingName:
        "An error class should have a PascalCase name ending with 'Error'.",
      errorFunction:
        "'{{name}}' is a reserved name. PascalCase names ending with 'Error' are reserved for error classes and may not be used for regular functions. Either rename this function or convert it to a class that extends 'Error'.",
    },
    schema: [],
  },

  create(context) {
    return {
      ClassDeclaration(node) {
        processClass(node);
      },
      ClassExpression(node) {
        processClass(node);
      },
      FunctionExpression(node) {
        processFunction(node);
      },
      FunctionDeclaration(node) {
        processFunction(node);
      },
    };

    function processClass(node) {
      const {id, superClass} = node;

      // First, handle all cases in which superclass is not error-like.
      if (superClass == null || !isSuperClassErrorLike(superClass)) {
        if (id == null || !isIdentifierErrorLike(id)) {
          return;
        }
        context.report({
          node: id,
          messageId: 'errorClass',
          data: {name: id.name},
        });
        return;
      }

      // Then, handle all cases in which superclass is error-like.
      if (id == null) {
        context.report({
          node,
          messageId: 'errorSuperClassMissingName',
        });
      } else if (!isIdentifierErrorLike(id)) {
        context.report({
          node: id,
          messageId: 'errorSuperClass',
          data: {name: id.name},
        });
      }
    }

    function processFunction(node) {
      const {id} = node;
      if (id == null || !isIdentifierErrorLike(id)) {
        return;
      }
      context.report({
        node: id,
        messageId: 'errorFunction',
        data: {name: id.name},
      });
    }
  },
};

function isSuperClassErrorLike(node) {
  if (node.type === 'Identifier') {
    return isNameErrorLike(node.name);
  }
  if (node.type === 'MemberExpression') {
    return isSuperClassErrorLike(node.property);
  }
  return false;
}

function isIdentifierErrorLike(node) {
  return node.type === 'Identifier' && isNameErrorLike(node.name);
}

function isNameErrorLike(name) {
  return typeof name === 'string' && /^([A-Z].*)?Error$/.test(name);
}
