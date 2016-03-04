/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const fs = require('fs');
const Promise = require('promise');
const writeSourceMap = require('./write-sourcemap');

const MAGIC_UNBUNDLE_FILE_HEADER = require('./magic-number');
const MAGIC_STARTUP_MODULE_ID = '';

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
    dev,
    'sourcemap-output': sourcemapOutput,
  } = options;

  log('start');
  const {startupCode, modules} = bundle.getUnbundle({minify: !dev});
  log('finish');

  log('Writing unbundle output to:', bundleOutput);
  const writeUnbundle = writeBuffers(
    fs.createWriteStream(bundleOutput),
    buildTableAndContents(startupCode, modules, encoding)
  );

  writeUnbundle.then(() => log('Done writing unbundle output'));

  return Promise.all([writeUnbundle, writeSourceMap(sourcemapOutput, '', log)]);
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

const moduleToBuffer = ({name, code}, encoding) => ({
  name,
  buffer: Buffer.concat([
    Buffer(code, encoding),
    nullByteBuffer // create \0-terminated strings
  ])
});

function uInt32Buffer(n) {
  const buffer = Buffer(4);
  buffer.writeUInt32LE(n, 0);
  return buffer;
}

function buildModuleTable(buffers) {
  // table format:
  //  - table_length: uint_32 length of all table entries in bytes + the table length itself
  //  - entries: entry...
  //
  // entry:
  //  - module_id: NUL terminated utf8 string
  //  - module_offset: uint_32 offset into the module string
  //  - module_length: uint_32 length of the module string, including terminating NUL byte

  const numBuffers = buffers.length;

  const tableLengthBuffer = uInt32Buffer(0);
  let tableLength = 4; // the table length itself, 4 == tableLengthBuffer.length
  let currentOffset = 0;

  const offsetTable = [tableLengthBuffer];
  for (let i = 0; i < numBuffers; i++) {
    const {name, buffer: {length}} = buffers[i];
    const entry = Buffer.concat([
      Buffer(i === 0 ? MAGIC_STARTUP_MODULE_ID : name, 'utf8'),
      nullByteBuffer,
      uInt32Buffer(currentOffset),
      uInt32Buffer(length)
    ]);
    currentOffset += length;
    tableLength += entry.length;
    offsetTable.push(entry);
  }

  tableLengthBuffer.writeUInt32LE(tableLength, 0);
  return Buffer.concat(offsetTable);
}

function buildModuleBuffers(startupCode, modules, encoding) {
  return (
    [moduleToBuffer({name: '', code: startupCode}, encoding)]
      .concat(modules.map(module => moduleToBuffer(module, encoding)))
  );
}

function buildTableAndContents(startupCode, modules, encoding) {
  const buffers = buildModuleBuffers(startupCode, modules, encoding);
  const table = buildModuleTable(buffers, encoding);
  return [fileHeader, table].concat(buffers.map(({buffer}) => buffer));
}

module.exports = saveAsIndexedFile;
