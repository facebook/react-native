/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const buildSourceMapWithMetaData = require('./build-unbundle-sourcemap-with-metadata');
const fs = require('fs');
const Promise = require('promise');
const writeSourceMap = require('./write-sourcemap');
const {joinModules} = require('./util');

const MAGIC_UNBUNDLE_FILE_HEADER = require('./magic-number');
const SIZEOF_UINT32 = 4;

/**
 * Saves all JS modules of an app as a single file, separated with null bytes.
 * The file begins with an offset table that contains module ids and their
 * lengths/offsets.
 * The module id for the startup code (prelude, polyfills etc.) is the
 * empty string.
 */
function saveAsIndexedFile(bundle, options, log) {
  const {
    'bundle-output': bundleOutput,
    'bundle-encoding': encoding,
    'sourcemap-output': sourcemapOutput,
  } = options;

  log('start');
  const {startupModules, lazyModules} = bundle.getUnbundle();
  log('finish');

  const startupCode = joinModules(startupModules);

  log('Writing unbundle output to:', bundleOutput);
  const writeUnbundle = writeBuffers(
    fs.createWriteStream(bundleOutput),
    buildTableAndContents(startupCode, lazyModules, encoding)
  ).then(() => log('Done writing unbundle output'));

  const sourceMap =
    buildSourceMapWithMetaData({startupModules, lazyModules});

  return Promise.all([
    writeUnbundle,
    writeSourceMap(sourcemapOutput, JSON.stringify(sourceMap), log),
  ]);
}

/* global Buffer: true */

const fileHeader = Buffer(4);
fileHeader.writeUInt32LE(MAGIC_UNBUNDLE_FILE_HEADER);
const nullByteBuffer = Buffer(1).fill(0);

function writeBuffers(stream, buffers) {
  buffers.forEach(buffer => stream.write(buffer));
  return new Promise((resolve, reject) => {
    stream.on('error', reject);
    stream.on('finish', () => resolve());
    stream.end();
  });
}

function nullTerminatedBuffer(contents, encoding) {
  return Buffer.concat([Buffer(contents, encoding), nullByteBuffer]);
}

function moduleToBuffer(id, code, encoding) {
  return {
    id,
    buffer: nullTerminatedBuffer(code, encoding),
  };
}

function entryOffset(n) {
  // 2: num_entries + startup_code_len
  // n * 2: each entry consists of two uint32s
  return (2 + n * 2) * SIZEOF_UINT32;
}

function buildModuleTable(startupCode, buffers) {
  // table format:
  // - num_entries:      uint_32  number of entries
  // - startup_code_len: uint_32  length of the startup section
  // - entries:          entry...
  //
  // entry:
  //  - module_offset:   uint_32  offset into the modules blob
  //  - module_length:   uint_32  length of the module code in bytes

  const maxId = buffers.reduce((max, {id}) => Math.max(max, id), 0);
  const numEntries = maxId + 1;
  const table = new Buffer(entryOffset(numEntries)).fill(0);

  // num_entries
  table.writeUInt32LE(numEntries, 0);

  // startup_code_len
  table.writeUInt32LE(startupCode.length, SIZEOF_UINT32);

  // entries
  let codeOffset = startupCode.length;
  buffers.forEach(({id, buffer}) => {
    const offset = entryOffset(id);
    // module_offset
    table.writeUInt32LE(codeOffset, offset);
    // module_length
    table.writeUInt32LE(buffer.length, offset + SIZEOF_UINT32);
    codeOffset += buffer.length;
  });

  return table;
}

function buildModuleBuffers(modules, encoding) {
  return modules.map(
    module => moduleToBuffer(module.id, module.code, encoding));
}

function buildTableAndContents(startupCode, modules, encoding) {
  // file contents layout:
  // - magic number      char[4]  0xE5 0xD1 0x0B 0xFB (0xFB0BD1E5 uint32 LE)
  // - offset table      table    see `buildModuleTables`
  // - code blob         char[]   null-terminated code strings, starting with
  //                              the startup code

  const startupCodeBuffer = nullTerminatedBuffer(startupCode, encoding);
  const moduleBuffers = buildModuleBuffers(modules, encoding);
  const table = buildModuleTable(startupCodeBuffer, moduleBuffers);

  return [
    fileHeader,
    table,
    startupCodeBuffer
  ].concat(moduleBuffers.map(({buffer}) => buffer));
}

module.exports = saveAsIndexedFile;
