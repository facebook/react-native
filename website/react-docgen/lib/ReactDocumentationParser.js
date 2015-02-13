/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/**
 * @flow
 */
"use strict";

/**
 * How this parser works:
 *
 * 1. For each given file path do:
 *
 *   a. Find component definition
 *    -. Find the rvalue module.exports assignment.
 *       Otherwise inspect assignments to exports. If there are multiple
 *       components that are exported, we don't continue with parsing the file.
 *    -. If the previous step results in a variable name, resolve it.
 *    -. Extract the object literal from the React.createClass call.
 *
 *   b. Execute definition handlers (handlers working with the object
 *      expression).
 *
 *   c. For each property of the definition object, execute the registered
 *    callbacks, if they are eligible for this property.
 *
 * 2. Return the aggregated results
 */

type Handler = (documentation: Documentation, path: NodePath) => void;

var Documentation = require('./Documentation');

var expressionTo = require('./utils/expressionTo');
var getPropertyName = require('./utils/getPropertyName');
var isReactModuleName = require('./utils/isReactModuleName');
var match = require('./utils/match');
var resolveToValue = require('./utils/resolveToValue');
var resolveToModule = require('./utils/resolveToModule');
var recast = require('recast');
var n = recast.types.namedTypes;

function ignore() {
  return false;
}

/**
 * Returns true if the statement is of form `foo = bar;`.
 *
 * @param {object} node
 * @return {bool}
 */
function isAssignmentStatement(node) {
  return match(node, {expression: {operator: '='}});
}

/**
 * Returns true if the expression is of form `exports.foo = bar;` or
 * `modules.exports = foo;`.
 *
 * @param {object} node
 * @return {bool}
 */
function isExportsOrModuleExpression(path) {
  if (!n.AssignmentExpression.check(path.node) ||
    !n.MemberExpression.check(path.node.left)) {
    return false;
  }
  var exprArr = expressionTo.Array(path.get('left'));
  return (exprArr[0] === 'module' && exprArr[1] === 'exports') ||
    exprArr[0] == 'exports';
}

/**
 * Returns true if the expression is a function call of the form
 * `React.createClass(...)`.
 *
 * @param {object} node
 * @param {array} scopeChain
 * @return {bool}
 */
function isReactCreateClassCall(path) {
  if (!match(path.node, {callee: {property: {name: 'createClass'}}})) {
    return false;
  }
  var module = resolveToModule(path.get('callee', 'object'));
  return module && isReactModuleName(module);
}

/**
 * Given an AST, this function tries to find the object expression that is
 * passed to `React.createClass`, by resolving all references properly.
 *
 * @param {object} ast
 * @return {?object}
 */
function findComponentDefinition(ast) {
  var definition;

  recast.visit(ast, {
    visitFunctionDeclaration: ignore,
    visitFunctionExpression: ignore,
    visitIfStatement: ignore,
    visitWithStatement: ignore,
    visitSwitchStatement: ignore,
    visitTryStatement: ignore,
    visitWhileStatement: ignore,
    visitDoWhileStatement: ignore,
    visitForStatement: ignore,
    visitForInStatement: ignore,
    visitAssignmentExpression: function(path) {
      // Ignore anything that is not `exports.X = ...;` or
      // `module.exports = ...;`
      if (!isExportsOrModuleExpression(path)) {
        return false;
      }
      // Resolve the value of the right hand side. It should resolve to a call
      // expression, something like React.createClass
      path = resolveToValue(path.get('right'));
      if (!isReactCreateClassCall(path)) {
        return false;
      }
      if (definition) { // If a file exports multiple components, ... complain!
        throw new Error(ReactDocumentationParser.ERROR_MULTIPLE_DEFINITIONS);
      }
      // We found React.createClass. Lets get cracking!
      definition = resolveToValue(path.get('arguments', 0));
      return false;
    }
  });

  return definition;
}


class ReactDocumentationParser {
  _componentHandlers: Array<Handler>;
  _propertyHandlers: Object<string, Handler>;

  constructor() {
    this._componentHandlers = [];
    this._propertyHandlers = Object.create(null);
  }

  /**
   * Handlers extract information from the component definition.
   *
   * If "property" is not provided, the handler is passed the whole component
   * definition.
   */
  addHandler(handler: Handler, property?: string): void {
    if (!property) {
      this._componentHandlers.push(handler);
    } else {
      if (!this._propertyHandlers[property]) {
        this._propertyHandlers[property] = [];
      }
      this._propertyHandlers[property].push(handler);
    }
  }

  /**
   * Takes JavaScript source code and returns an object with the information
   * extract from it.
   */
  parseSource(source: string): Object {
    var documentation = new Documentation();
    var ast = recast.parse(source);
    // Find the component definition first. The return value should be
    // an ObjectExpression.
    var componentDefinition = findComponentDefinition(ast.program);
    if (!componentDefinition) {
      throw new Error(ReactDocumentationParser.ERROR_MISSING_DEFINITION);
    }

    // Execute all the handlers to extract the information
    this._executeHandlers(documentation, componentDefinition);

    return documentation.toObject();
  }

  _executeHandlers(documentation, componentDefinition: NodePath) {
    componentDefinition.get('properties').each(propertyPath => {
      var name = getPropertyName(propertyPath);
      if (!this._propertyHandlers[name]) {
        return;
      }
      var propertyValuePath = propertyPath.get('value');
      this._propertyHandlers[name].forEach(
        handler => handler(documentation, propertyValuePath)
      );
    });

    this._componentHandlers.forEach(
      handler => handler(documentation, componentDefinition)
    );
  }
}

ReactDocumentationParser.ERROR_MISSING_DEFINITION =
  'No suitable component definition found.';

ReactDocumentationParser.ERROR_MULTIPLE_DEFINITIONS =
  'Multiple exported component definitions found.';

module.exports = ReactDocumentationParser;
