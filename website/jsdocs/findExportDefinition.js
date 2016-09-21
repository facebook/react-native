/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/*jslint node: true */
'use strict';

var Syntax = require('./syntax');
var traverseFlat = require('./traverseFlat');


/**
 * If the expression is an identifier, it is resolved in the scope chain.
 * If it is an assignment expression, it resolves to the right hand side.
 *
 * In all other cases the expression itself is returned.
 *
 * Since the scope chain constructed by the traverse function is very simple
 * (it doesn't take into account *changes* to the variable through assignment
 * statements), this function doesn't return the correct value in every
 * situation. But it's good enough for how it is used in the parser.
 *
 * @param {object} expr
 * @param {array} scopeChain
 *
 * @return {object}
 */
function resolveToValue(expr, scopeChain) {
  switch (expr.type) {
    case Syntax.AssignmentExpression:
      if (expr.operator === '=') {
        return resolveToValue(expr.right, scopeChain);
      }
      break;
    case Syntax.Identifier:
      var value;
      scopeChain.some(function(scope, i) {
        if (hasOwnProperty.call(scope, expr.name) && scope[expr.name]) {
          value = resolveToValue(scope[expr.name], scopeChain.slice(i));
          return true;
        }
      });
      return value;
  }
  return expr;
}

/**
 * Returns true if the statement is of form `foo = bar;`.
 *
 * @param {object} node
 * @return {bool}
 */
function isAssignmentStatement(node) {
  return node.type === Syntax.ExpressionStatement &&
    node.expression.type === Syntax.AssignmentExpression &&
    node.expression.operator === '=';
}

/**
 * Splits a member or call expression into parts. E.g. foo.bar.baz becomes
 * ['foo', 'bar', 'baz']
 *
 * @param {object} expr
 * @return {array}
 */
function expressionToArray(expr) {
  var parts = [];
  switch(expr.type) {
    case Syntax.CallExpression:
      parts = expressionToArray(expr.callee);
      break;
    case Syntax.MemberExpression:
      parts = expressionToArray(expr.object);
      if (expr.computed) {
        parts.push('...');
      } else {
        parts.push(expr.property.name || expr.property.value);
      }
      break;
    case Syntax.Identifier:
      parts = [expr.name];
      break;
    case Syntax.Literal:
      parts = [expr.raw];
      break;
    case Syntax.ThisExpression:
      parts = ['this'];
      break;
    case Syntax.ObjectExpression:
      var properties = expr.properties.map(function(property) {
        return expressionToString(property.key) +
          ': ' +
          expressionToString(property.value);
      });
      parts = ['{' + properties.join(', ') + '}'];
      break;
    case Syntax.ArrayExpression:
      parts = ['[' + expr.elements.map(expressionToString).join(', ') + ']'];
      break;
  }
  return parts;
}

/**
 * Creates a string representation of a member expression.
 *
 * @param {object} expr
 * @return {array}
 */
function expressionToString(expr) {
  return expressionToArray(expr).join('.');
}

/**
 * Returns true if the expression is of form `exports.foo = bar;` or
 * `modules.exports = foo;`.
 *
 * @param {object} node
 * @return {bool}
 */
function isExportsOrModuleExpression(expr) {
  if (expr.left.type !== Syntax.MemberExpression) {
    return false;
  }
  var exprArr = expressionToArray(expr.left);
  return (exprArr[0] === 'module' && exprArr[1] === 'exports') ||
    exprArr[0] == 'exports';
}


/**
 * Finds module.exports / exports.X statements inside an assignment expression.
 */
function handleAssignmentExpression(expr, scopeChain, multipleExports) {
  while (!isExportsOrModuleExpression(expr)) {
    if (expr.type === Syntax.AssignmentExpression &&
        expr.right.type === Syntax.AssignmentExpression) {
      expr = expr.right;
    } else {
      return;
    }
  }

  var definition = resolveToValue(
    expr.right,
    scopeChain
  );

  if (!definition) {
    // handle empty var declaration, e.g. "var x; ... module.exports = x"
    if (expr.right.type === Syntax.Identifier) {
      var found = false;
      scopeChain.some(function(scope) {
        if (scope[expr.right.name] === null) {
          return found = true;
        }
      });
      if (found) {
        // fake definition so we still return something at least
        return {
          definition: {
            type: Syntax.VariableDeclaration,
            loc: expr.loc,
            isSynthesized: true
          },
          scopeChain: scopeChain
        };
      }
    }
    return;
  }

  var leftExpression = expr.left;
  var leftExpressions = expressionToArray(leftExpression);
  if (leftExpressions[0] === 'exports') {
    // exports.A = A
    if (leftExpressions.length === 2 && leftExpression.property) {
      // The 2nd element is the field name
      multipleExports.push({
        key: leftExpression.property,
        value: definition
      });
    }
  } else if (definition) {
    // module.exports = A
    return {
      definition: definition,
      scopeChain: scopeChain
    };
  }
}

/**
 * Given an AST, this function tries to find the object expression that is the
 * module's exported value.
 *
 * @param {object} ast
 * @return {?object}
 */
function findExportDefinition(ast) {
  var multipleExports = [];
  var singleExport;
  traverseFlat(ast, function(node, scopeChain) {
    if (singleExport) {
      return false;
    }
    if (node.type === Syntax.VariableDeclaration) {
      node.declarations.forEach(function (decl) {
        if (!singleExport && decl.init &&
            decl.init.type === Syntax.AssignmentExpression) {
          singleExport = handleAssignmentExpression(
            decl.init,
            scopeChain,
            multipleExports
          );
        }
      });
      return false;
    }
    if (!isAssignmentStatement(node)) {
      return false;
    }
    if (node.expression) {
      singleExport = handleAssignmentExpression(
        node.expression,
        scopeChain,
        multipleExports
      );
    }
  });

  // NOT going to handle the f**ked up case where in the same file we have
  // module.exports = A; exports.b = b;
  if (singleExport) {
    return singleExport;
  }

  if (multipleExports.length === 1) {
    return {
      scopeChain: [],
      definition: multipleExports[0].value
    };
  }

  if (multipleExports.length > 0) {
    // Synthesize an ObjectExpression union all exports
    var properties = multipleExports.map(function(element) {
      var key = element.key;
      var value = element.value;
      return {
        type: Syntax.Property,
        key: key,
        value: value,
        loc: {
          start: { line: key.loc.start.line, column: key.loc.start.column },
          end: { line: value.loc.end.line, column: value.loc.end.column }
        },
        range: [ key.range[0], value.range[1] ]
      };
    });
    return {
      scopeChain: [],
      definition: {
        isSynthesized: true,
        type: Syntax.ObjectExpression,
        properties: properties,
        // Use the first export statement location
        loc: properties[0].loc
      }
    };
  }

  return null;
}

module.exports = findExportDefinition;
