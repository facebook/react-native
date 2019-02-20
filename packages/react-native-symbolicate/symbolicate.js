#!/usr/bin/env node
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Symbolicates a JavaScript stack trace using a source map.
 * In our first form, we read a stack trace from stdin and symbolicate it via
 * the provided source map.
 * In our second form, we symbolicate using an explicit line number, and
 * optionally a column.
 * In our third form, we symbolicate using a module ID, a line number, and
 * optionally a column.
 *
 * See https://our.intern.facebook.com/intern/dex/symbolicating-javascript-stack-traces-for-react-native/
 *
 * @format
 */

'use strict';

const SourceMapConsumer = require('source-map').SourceMapConsumer;
const Symbolication = require('./Symbolication.js');

const fs = require('fs');
const through2 = require('through2');

const argv = process.argv.slice(2);
if (argv.length < 1 || argv.length > 4) {
  /* eslint no-path-concat: "off" */
  const usages = [
    'Usage: ' + __filename + ' <source-map-file>',
    '       ' + __filename + ' <source-map-file> <line> [column]',
    '       ' + __filename + ' <source-map-file> <moduleId>.js <line> [column]',
    '       ' + __filename + ' <source-map-file> <mapfile>.profmap',
    '       ' +
      __filename +
      ' <source-map-file> --attribution < attribution.jsonl  > symbolicated.jsonl',
    '       ' + __filename + ' <source-map-file> <tracefile>.cpuprofile',
  ];
  console.error(usages.join('\n'));
  process.exit(1);
}

// Read the source map.
const sourceMapFileName = argv.shift();
const content = fs.readFileSync(sourceMapFileName, 'utf8');
const context = Symbolication.createContext(SourceMapConsumer, content);

if (argv.length === 0) {
  const read = stream => {
    return new Promise(resolve => {
      let data = '';
      if (stream.isTTY) {
        resolve(data);
        return;
      }

      stream.setEncoding('utf8');
      stream.on('readable', () => {
        let chunk;
        while ((chunk = stream.read())) {
          data += chunk;
        }
      });
      stream.on('end', () => {
        resolve(data);
      });
    });
  };

  (async () => {
    const stackTrace = await read(process.stdin);
    process.stdout.write(Symbolication.symbolicate(stackTrace, context));
  })().catch(error => {
    console.error(error);
  });
} else if (argv[0].endsWith('.profmap')) {
  process.stdout.write(Symbolication.symbolicateProfilerMap(argv[0], context));
} else if (argv[0] === '--attribution') {
  let buffer = '';
  process.stdin
    .pipe(
      through2(function(data, enc, callback) {
        // Take arbitrary strings, output single lines
        buffer += data;
        const lines = buffer.split('\n');
        for (let i = 0, e = lines.length - 1; i < e; i++) {
          this.push(lines[i]);
        }
        buffer = lines[lines.length - 1];
        callback();
      }),
    )
    .pipe(
      through2.obj(function(data, enc, callback) {
        // This is JSONL, so each line is a separate JSON object
        const obj = JSON.parse(data);
        Symbolication.symbolicateAttribution(obj, context);
        this.push(JSON.stringify(obj) + '\n');
        callback();
      }),
    )
    .pipe(process.stdout);
} else if (argv[0].endsWith('.cpuprofile')) {
  Symbolication.symbolicateChromeTrace(argv[0], context);
} else {
  // read-from-argv form.
  let moduleIds, lineNumber, columnNumber;
  if (argv[0].endsWith('.js')) {
    moduleIds = Symbolication.parseFileName(argv[0]);
    argv.shift();
  } else {
    moduleIds = {segmentId: 0, localId: undefined};
  }
  lineNumber = argv.shift();
  columnNumber = argv.shift() || 0;
  const original = Symbolication.getOriginalPositionFor(
    lineNumber,
    columnNumber,
    moduleIds,
    context,
  );
  console.log(original.source + ':' + original.line + ':' + original.name);
}
