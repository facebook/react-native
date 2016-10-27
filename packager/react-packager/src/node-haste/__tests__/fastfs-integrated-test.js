/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.autoMockOff()
  .dontMock('graceful-fs');

const Fastfs = require('../fastfs');

const {EventEmitter} = require('events');
const fs = require('fs');
const path = require('path');

const fileName = path.resolve(__dirname, 'fastfs-data');
const contents = fs.readFileSync(fileName, 'utf-8');

describe('fastfs:', function() {
  let fastfs;
  const roots = [__dirname];
  const watcher = new EventEmitter();

  beforeEach(function() {
    fastfs = new Fastfs(
      'arbitrary',
      roots,
      watcher,
      [`${__dirname}/fastfs-data`],
      {}
    );
  });

  describe('partial reading', () => {
    // these are integrated tests that read real files from disk

    pit('reads a file while a predicate returns true', function() {
      return fastfs.readWhile(fileName, () => true).then(readContent =>
        expect(readContent).toEqual(contents)
      );
    });

    pit('invokes the predicate with the new chunk, the invocation index, and the result collected so far', () => {
      const predicate = jest.genMockFn().mockReturnValue(true);
      return fastfs.readWhile(fileName, predicate).then(() => {
        let aggregated = '';
        const {calls} = predicate.mock;
        expect(calls).not.toEqual([]);

        calls.forEach((call, i) => {
          const [chunk] = call;
          aggregated += chunk;
          expect(chunk).not.toBe('');
          expect(call).toEqual([chunk, i, aggregated]);
        });

        expect(aggregated).toEqual(contents);
      });
    });

    pit('stops reading when the predicate returns false', () => {
      const predicate = jest.genMockFn().mockImpl((_, i) => i !== 0);
      return fastfs.readWhile(fileName, predicate).then((readContent) => {
        const {calls} = predicate.mock;
        expect(calls.length).toBe(1);
        expect(readContent).toBe(calls[0][2]);
      });
    });

    pit('after reading the whole file with `readWhile`, `read()` still works', () => {
      // this test allows to reuse the results of `readWhile` for `readFile`
      return fastfs.readWhile(fileName, () => true).then(() => {
        fastfs.readFile(fileName).then(readContent =>
          expect(readContent).toEqual(contents)
        );
      });
    });

    pit('after reading parts of the file with `readWhile`, `read()` still works', () => {
      return fastfs.readWhile(fileName, () => false).then(() => {
        fastfs.readFile(fileName).then(readContent =>
          expect(readContent).toEqual(contents)
        );
      });
    });
  });
});
