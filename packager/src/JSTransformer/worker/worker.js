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

const constantFolding = require('./constant-folding');
const extractDependencies = require('./extract-dependencies');
const inline = require('./inline');
const invariant = require('fbjs/lib/invariant');
const minify = require('./minify');

import type {LogEntry} from '../../Logger/Types';
import type {Ast, SourceMap, TransformOptions as BabelTransformOptions} from 'babel-core';

export type TransformedCode = {
  code: string,
  dependencies: Array<string>,
  dependencyOffsets: Array<number>,
  map?: ?SourceMap,
};

type Transformer = {
  transform: (
    filename: string,
    sourceCode: string,
    options: ?{},
  ) => {ast: ?Ast, code: string, map: ?SourceMap}
};

export type TransformOptions = {
  +dev: boolean,
  +generateSourceMaps: boolean,
  +hot: boolean,
  +inlineRequires: {+blacklist: {[string]: true}} | boolean,
  +platform: string,
  +preloadedModules?: Array<string> | false,
  +projectRoots: Array<string>,
  +ramGroups?: Array<string>,
} & BabelTransformOptions;

export type Options = {
  +dev: boolean,
  +minify: boolean,
  +platform: string,
  +transform: TransformOptions,
};

export type Data = {
  result: TransformedCode,
  transformFileStartLogEntry: LogEntry,
  transformFileEndLogEntry: LogEntry,
};

type Callback = (
  error: ?Error,
  data: ?Data,
) => mixed;

function transformCode(
  transformer: Transformer,
  filename: string,
  sourceCode: string,
  options: Options,
  callback: Callback,
) {
  invariant(
    !options.minify || options.transform.generateSourceMaps,
    'Minifying source code requires the `generateSourceMaps` option to be `true`',
  );

  const isJson = filename.endsWith('.json');
  if (isJson) {
    sourceCode = 'module.exports=' + sourceCode;
  }

  const transformFileStartLogEntry = {
    action_name: 'Transforming file',
    action_phase: 'start',
    file_name: filename,
    log_entry_label: 'Transforming file',
    start_timestamp: process.hrtime(),
  };

  let transformed;
  try {
    transformed = transformer.transform(sourceCode, filename, options.transform);
  } catch (error) {
    callback(error);
    return;
  }

  invariant(
    transformed != null,
    'Missing transform results despite having no error.',
  );

  var code, map;
  if (options.minify) {
    ({code, map} =
      constantFolding(filename, inline(filename, transformed, options)));
    invariant(code != null, 'Missing code from constant-folding transform.');
  } else {
    ({code, map} = transformed);
  }

  if (isJson) {
    code = code.replace(/^\w+\.exports=/, '');
  } else {
    // Remove shebang
    code = code.replace(/^#!.*/, '');
  }

  const depsResult = isJson
    ? {dependencies: [], dependencyOffsets: []}
    : extractDependencies(code);

  const timeDelta = process.hrtime(transformFileStartLogEntry.start_timestamp);
  const duration_ms = Math.round((timeDelta[0] * 1e9 + timeDelta[1]) / 1e6);
  const transformFileEndLogEntry = {
    action_name: 'Transforming file',
    action_phase: 'end',
    file_name: filename,
    duration_ms,
    log_entry_label: 'Transforming file',
  };

  callback(null, {
    result: {...depsResult, code, map},
    transformFileStartLogEntry,
    transformFileEndLogEntry,
  });
}

exports.transformAndExtractDependencies = (
  transform: string,
  filename: string,
  sourceCode: string,
  options: Options,
  callback: Callback,
) => {
  /* $FlowFixMe: impossible to type a dynamic require */
  const transformModule = require(transform);
  transformCode(transformModule, filename, sourceCode, options, callback);
};

exports.minify = (
  filename: string,
  code: string,
  sourceMap: string,
  callback: (error: ?Error, result: mixed) => mixed,
) => {
  var result;
  try {
    result = minify(filename, code, sourceMap);
  } catch (error) {
    callback(error);
  }
  callback(null, result);
};

exports.transformCode = transformCode; // for easier testing
