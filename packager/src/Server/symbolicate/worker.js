/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

// RUNS UNTRANSFORMED IN NODE >= v4
// NO FANCY FEATURES, E.G. DESTRUCTURING, PLEASE!

const SourceMapConsumer = require('source-map').SourceMapConsumer;
const concat = require('concat-stream');
const net = require('net');

process.once('message', socket => {
  net.createServer({allowHalfOpen: true}, connection => {
    connection.setEncoding('utf8');
    connection.pipe(concat(data =>
      symbolicate(connection, data)
        .catch(console.error) // log the error as a last resort
    ));
  }).listen(socket, () => process.send(null));
});

function symbolicate(connection, data) {
  return Promise.resolve(data)
    .then(JSON.parse)
    .then(symbolicateStack)
    .then(JSON.stringify)
    .catch(makeErrorMessage)
    .then(message => connection.end(message));
}

function symbolicateStack(data) {
  const consumers = new Map(data.maps.map(mapToConsumer));
  return {
    result: data.stack.map(frame => mapFrame(frame, consumers)),
  };
}

function mapFrame(frame, consumers) {
  const sourceUrl = frame.file;
  const consumer = consumers.get(sourceUrl);
  if (consumer == null) {
    return frame;
  }
  const original = consumer.originalPositionFor({
    line: frame.lineNumber,
    column: frame.column,
  });
  if (!original) {
    return frame;
  }
  return Object.assign({}, frame, {
    file: original.source,
    lineNumber: original.line,
    column: original.column,
  });
}

function makeErrorMessage(error) {
  return JSON.stringify({
    error: String(error && error.message || error),
  });
}

function mapToConsumer(tuple) {
  tuple[1] = new SourceMapConsumer(tuple[1]);
  return tuple;
}

// for testing
exports.symbolicate = symbolicate;
