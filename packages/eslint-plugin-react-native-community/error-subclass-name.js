/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

module.exports = function rule(context) {
  function classVisitor(node) {
    const {superClass, id} = node;
    const nodeIsError = isErrorLikeId(id);
    const superIsError = isErrorLikeId(superClass);
    if (nodeIsError && !superIsError) {
      const idName = getNameFromId(id);
      context.report({
        node: superClass || id,
        message: `'${idName}' must extend an error class (like 'Error') because its name is in PascalCase and ends with 'Error'.`,
      });
    } else if (superIsError && !nodeIsError) {
      const idName = getNameFromId(id);
      context.report({
        node: id || node,
        message: idName
          ? `'${idName}' may not be the name of an error class. It should be in PascalCase and end with 'Error'.`
          : "An error class should have a PascalCase name ending with 'Error'.",
      });
    }
  }

  function functionVisitor(node) {
    const {id} = node;
    const nodeIsError = isErrorLikeId(id);
    if (nodeIsError) {
      const idName = getNameFromId(id);
      context.report({
        node: id,
        message: `'${idName}' is a reserved name. PascalCase names ending with 'Error' are reserved for error classes and may not be used for regular functions. Either rename this function or convert it to a class that extends 'Error'.`,
      });
    }
  }

  return {
    ClassDeclaration: classVisitor,
    ClassExpression: classVisitor,
    FunctionExpression: functionVisitor,
    FunctionDeclaration: functionVisitor,
  };
};

// Checks whether `node` is an identifier (or similar name node) with a
// PascalCase name ending with 'Error'.
function isErrorLikeId(node) {
  return (
    node && node.type === 'Identifier' && /^([A-Z].*)?Error$/.test(node.name)
  );
}

// If `node` is an identifier (or similar name node), returns its name as a
// string. Otherwise returns null.
function getNameFromId(node) {
  return node ? node.name : null;
}
