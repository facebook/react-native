/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const t = require('babel-types');

var globals = Object.create(null);
var requires = Object.create(null);
var _requires;

const hasDeadModules = modules =>
  Object.keys(modules).some(key => modules[key] === 0);

function CallExpression(path) {
  const { node } = path;
  const fnName = node.callee.name;

  if (fnName === 'require' || fnName === '__d') {
    var moduleName = node.arguments[0].value;
    if (fnName === '__d' && _requires && !_requires[moduleName]) {
      path.remove();
    } else if (fnName === '__d'){
      requires[moduleName] = requires[moduleName] || 0;
    } else {
      requires[moduleName] = (requires[moduleName] || 0) + 1;
    }
  }
}

function IfStatement(path) {
    const { node } = path;

    if (node.test.type === 'Identifier' && node.test.name in globals) {
      if (globals[node.test.name]) {
        if (node.consequent.type === 'BlockStatement') {
          path.replaceWithMultiple(node.consequent.body);
        } else {
          path.replaceWith(node.consequent);
        }
      } else if (node.alternate) {
        if (node.alternate.type === 'BlockStatement') {
          path.replaceWithMultiple(node.alternate.body);
        } else {
          path.replaceWith(node.alternate);
        }
      } else {
        path.remove();
      }
    }
  }

module.exports = function () {
  var firstPass = {
    AssignmentExpression(path) {
      const { node } = path;

      if (
        node.left.type === 'MemberExpression' &&
        node.left.object.name === 'global' &&
        node.left.property.type === 'Identifier' &&
        node.left.property.name === '__DEV__'
      ) {
        var value;
        if (node.right.type === 'BooleanLiteral') {
          value = node.right.value;
        } else if (
          node.right.type === 'UnaryExpression' &&
          node.right.operator === '!' &&
          node.right.argument.type === 'NumericLiteral'
        ) {
          value = !node.right.argument.value;
        } else {
          return;
        }
        globals[node.left.property.name] = value;

        // workaround babel/source map bug - the minifier should strip it
        path.replaceWith(t.booleanLiteral(value));

        //path.remove();
        //scope.removeBinding(node.left.name);
      }
    },
    IfStatement,
    ConditionalExpression: IfStatement,
    Identifier(path) {
      const { node } = path;

      var parent = path.parent;
      if (parent.type === 'AssignmentExpression' && parent.left === node) {
        return;
      }

      if (node.name in globals) {
        path.replaceWith(t.booleanLiteral(globals[node.name]));
      }
    },

    CallExpression,

    LogicalExpression(path) {
      const { node } = path;

      if (node.left.type === 'Identifier' && node.left.name in globals) {
        const value = globals[node.left.name];

        if (node.operator === '&&') {
          if (value) {
            path.replaceWith(node.right);
          } else {
            path.replaceWith(t.booleanLiteral(value));
          }
        } else if (node.operator === '||') {
          if (value) {
            path.replaceWith(t.booleanLiteral(value));
          } else {
            path.replaceWith(node.right);
          }
        }
      }
    }
  };

  var secondPass = {
    CallExpression,
  };

  return {
    visitor: {
      Program(path) {
        path.traverse(firstPass);
        var counter = 0;
        while (hasDeadModules(requires) && counter < 3) {
          _requires = requires;
          requires = {};
          path.traverse(secondPass);
          counter++;
        }
      }
    }
  };
};
