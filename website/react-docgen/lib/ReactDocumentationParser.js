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

type Handler = (documentation: Documentation, path: NodePath) => void;

var Documentation = require('./Documentation');

var findExportedReactCreateClass =
  require('./strategies/findExportedReactCreateClassCall');
var getPropertyName = require('./utils/getPropertyName');
var recast = require('recast');
var resolveToValue = require('./utils/resolveToValue');
var n = recast.types.namedTypes;

class ReactDocumentationParser {
  _componentHandlers: Array<Handler>;
  _apiHandlers: Object<string, Handler>;

  constructor() {
    this._componentHandlers = [];
    this._apiHandlers = Object.create(null);
  }

  /**
   * Handlers to extract information from the component definition.
   *
   * If "property" is not provided, the handler is passed the whole component
   * definition.
   *
   * NOTE: The component definition is currently expected to be represented as
   * an ObjectExpression (an object literal). This will likely change in the
   * future.
   */
  addHandler(handler: Handler, property?: string): void {
    if (!property) {
      this._componentHandlers.push(handler);
    } else {
      if (!this._apiHandlers[property]) {
        this._apiHandlers[property] = [];
      }
      this._apiHandlers[property].push(handler);
    }
  }

  /**
   * Takes JavaScript source code and returns an object with the information
   * extract from it.
   *
   * The second argument is strategy to find the AST node(s) of the component
   * definition(s) inside `source`.
   * It is a function that gets passed the program AST node of
   * the source as first argument, and a reference to recast as second argument.
   *
   * This allows you define your own strategy for finding component definitions.
   * By default it will look for the exported component created by
   * React.createClass. An error is thrown if multiple components are exported.
   *
   * NOTE: The component definition is currently expected to be represented as
   * an ObjectExpression (an object literal), no matter which strategy is
   * chosen. This will likely change in the future.
   */
  parseSource(
    source: string,
    componentDefinitionStrategy?:
      (program: ASTNode, recast: Object) => (Array<NodePath>|NodePath)
  ): (Array<Object>|Object) {
    if (!componentDefinitionStrategy) {
      componentDefinitionStrategy = findExportedReactCreateClass;
    }
    var ast = recast.parse(source);
    // Find the component definitions first. The return value should be
    // an ObjectExpression.
    var componentDefinition = componentDefinitionStrategy(ast.program, recast);
    var isArray = Array.isArray(componentDefinition);
    if (!componentDefinition || (isArray && componentDefinition.length === 0)) {
      throw new Error(ReactDocumentationParser.ERROR_MISSING_DEFINITION);
    }

    return isArray ?
      this._executeHandlers(componentDefinition).map(
        documentation => documentation.toObject()
      ) :
      this._executeHandlers([componentDefinition])[0].toObject();
  }

  _executeHandlers(componentDefinitions: Array<NodePath>): Array<Documenation> {
    return componentDefinitions.map(componentDefinition => {
      var documentation = new Documentation();
      componentDefinition.get('properties').each(propertyPath => {
        var name = getPropertyName(propertyPath);
        if (!this._apiHandlers[name]) {
          return;
        }
        var propertyValuePath = propertyPath.get('value');
        this._apiHandlers[name].forEach(
          handler => handler(documentation, propertyValuePath)
        );
      });

      this._componentHandlers.forEach(
        handler => handler(documentation, componentDefinition)
      );
      return documentation;
    });
  }

}

ReactDocumentationParser.ERROR_MISSING_DEFINITION =
  'No suitable component definition found.';

module.exports = ReactDocumentationParser;
