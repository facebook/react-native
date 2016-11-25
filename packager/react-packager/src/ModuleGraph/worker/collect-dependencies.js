/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

const nullthrows = require('fbjs/lib/nullthrows');

const {traverse, types} = require('babel-core');

type AST = Object;

class Replacement {
  nameToIndex: Map<string, number>;
  nextIndex: number;

  constructor() {
    this.nameToIndex = new Map();
    this.nextIndex = 0;
  }

  isRequireCall(callee, firstArg) {
    return (
      callee.type === 'Identifier' && callee.name === 'require' &&
      firstArg && firstArg.type === 'StringLiteral'
    );
  }

  getIndex(stringLiteral) {
    const name = stringLiteral.value;
    let index = this.nameToIndex.get(name);
    if (index !== undefined) {
      return index;
    }
    index = this.nextIndex++;
    this.nameToIndex.set(name, index);
    return index;
  }

  getNames() {
    return Array.from(this.nameToIndex.keys());
  }

  makeArgs(newId, oldId, dependencyMapIdentifier) {
    const mapLookup = createMapLookup(dependencyMapIdentifier, newId);
    return [mapLookup, oldId];
  }
}

class ProdReplacement {
  replacement: Replacement;
  names: Array<string>;

  constructor(names) {
    this.replacement = new Replacement();
    this.names = names;
  }

  isRequireCall(callee, firstArg) {
    return (
      callee.type === 'Identifier' &&
      callee.name === 'require' &&
      firstArg &&
      firstArg.type === 'MemberExpression' &&
      firstArg.property &&
      firstArg.property.type === 'NumericLiteral'
    );
  }

  getIndex(memberExpression) {
    const id = memberExpression.property.value;
    if (id in this.names) {
      return this.replacement.getIndex({value: this.names[id]});
    }

    throw new Error(
      `${id} is not a known module ID. Existing mappings: ${
       this.names.map((n, i) => `${i} => ${n}`).join(', ')}`
    );
  }

  getNames() {
    return this.replacement.getNames();
  }

  makeArgs(newId, _, dependencyMapIdentifier) {
    const mapLookup = createMapLookup(dependencyMapIdentifier, newId);
    return [mapLookup];
  }
}

function createMapLookup(dependencyMapIdentifier, propertyIdentifier) {
  return types.memberExpression(
    dependencyMapIdentifier,
    propertyIdentifier,
    true,
  );
}

function collectDependencies(ast, replacement, dependencyMapIdentifier) {
  const traversalState = {dependencyMapIdentifier};
  traverse(ast, {
    Program(path, state) {
      if (!state.dependencyMapIdentifier) {
        state.dependencyMapIdentifier =
          path.scope.generateUidIdentifier('dependencyMap');
      }
    },
    CallExpression(path, state) {
      const node = path.node;
      const arg = node.arguments[0];
      if (replacement.isRequireCall(node.callee, arg)) {
        const index = replacement.getIndex(arg);
        node.arguments = replacement.makeArgs(
          types.numericLiteral(index),
          arg,
          state.dependencyMapIdentifier,
        );
      }
    },
  }, null, traversalState);

  return {
    dependencies: replacement.getNames(),
    dependencyMapName: nullthrows(traversalState.dependencyMapIdentifier).name,
  };
}

exports = module.exports =
  (ast: AST) => collectDependencies(ast, new Replacement());
exports.forOptimization =
  (ast: AST, names: Array<string>, dependencyMapName?: string) =>
    collectDependencies(
      ast,
      new ProdReplacement(names),
      dependencyMapName && types.identifier(dependencyMapName),
    );
