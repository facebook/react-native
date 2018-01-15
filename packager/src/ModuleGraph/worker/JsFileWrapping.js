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

const babel = require('babel-core');

const MODULE_FACTORY_PARAMETERS = ['global', 'require', 'module', 'exports'];
const POLYFILL_FACTORY_PARAMETERS = ['global'];

function wrapModule(fileAst: Object, dependencyMapName: string): Object {
  const t = babel.types;
  const params = MODULE_FACTORY_PARAMETERS.concat(dependencyMapName);
  const factory = functionFromProgram(fileAst.program, params);
  const def = t.callExpression(t.identifier('__d'), [factory]);
  return t.file(t.program([t.expressionStatement(def)]));
}

function wrapPolyfill(fileAst: Object): Object {
  const t = babel.types;
  const factory = functionFromProgram(fileAst.program, POLYFILL_FACTORY_PARAMETERS);
  const iife = t.callExpression(factory, [t.identifier('this')]);
  return t.file(t.program([t.expressionStatement(iife)]));
}

function functionFromProgram(program: Object, parameters: Array<string>): Object {
  const t = babel.types;
  return t.functionExpression(
    t.identifier(''),
    parameters.map(makeIdentifier),
    t.blockStatement(program.body, program.directives),
  );
}

function makeIdentifier(name: string): Object {
  return babel.types.identifier(name);
}

module.exports = {
  MODULE_FACTORY_PARAMETERS,
  POLYFILL_FACTORY_PARAMETERS,
  wrapModule,
  wrapPolyfill,
};
