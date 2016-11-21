/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest
  .disableAutomock()
  .setMock('fs', jest.genMockFromModule('fs'))
  .mock('mkdirp');

const wrapWorkerFn = require('../wrap-worker-fn');
const {dirname} = require('path');
const {fn} = require('../../test-helpers');

const {any} = jasmine;

describe('wrapWorkerFn:', () => {
  const infile = '/arbitrary/in/file';
  const outfile = '/arbitrary/in/file';

  let workerFn, wrapped;
  beforeEach(() => {
    workerFn = fn();
    workerFn.stub.yields();
    wrapped = wrapWorkerFn(workerFn);
  });

  const fs = require('fs');
  const mkdirp = require('mkdirp');

  it('reads the passed-in file synchronously as UTF-8', done => {
    wrapped(infile, outfile, {}, () => {
      expect(fs.readFileSync).toBeCalledWith(infile, 'utf8');
      done();
    });
  });

  it('calls the worker function with file contents and options', done => {
    const contents = 'arbitrary(contents);';
    const options = {arbitrary: 'options'};
    fs.readFileSync.mockReturnValue(contents);
    wrapped(infile, outfile, options, () => {
      expect(workerFn).toBeCalledWith(contents, options, any(Function));
      done();
    });
  });

  it('passes through any error that the worker function calls back with', done => {
    const error = new Error();
    workerFn.stub.yields(error);
    wrapped(infile, outfile, {}, e => {
      expect(e).toBe(error);
      done();
    });
  });

  it('writes the result to disk', done => {
    const result = {arbitrary: 'result'};
    workerFn.stub.yields(null, result);
    wrapped(infile, outfile, {}, () => {
      expect(mkdirp.sync).toBeCalledWith(dirname(outfile));
      expect(fs.writeFileSync).toBeCalledWith(outfile, JSON.stringify(result), 'utf8');
      done();
    });
  });

  it('calls back with any error thrown by `mkdirp.sync`', done => {
    const error = new Error();
    mkdirp.sync.mockImplementationOnce(() => { throw error; });
    wrapped(infile, outfile, {}, e => {
      expect(e).toBe(error);
      done();
    });
  });

  it('calls back with any error thrown by `fs.writeFileSync`', done => {
    const error = new Error();
    fs.writeFileSync.mockImplementationOnce(() => { throw error; });
    wrapped(infile, outfile, {}, e => {
      expect(e).toBe(error);
      done();
    });
  });
});
