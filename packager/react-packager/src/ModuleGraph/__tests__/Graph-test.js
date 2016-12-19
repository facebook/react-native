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
  .useRealTimers()
  .mock('console');

const {Console} = require('console');
const Graph = require('../Graph');
const {fn} = require('../test-helpers');

const {any, objectContaining} = jasmine;
const quiet = new Console();

describe('Graph:', () => {
  const anyEntry = ['arbitrary/entry/point'];
  const anyPlatform = 'arbitrary platform';
  const noOpts = undefined;

  let graph, load, resolve;
  beforeEach(() => {
    load = fn();
    resolve = fn();
    resolve.stub.yields(null, 'arbitrary file');
    load.stub.yields(null, createFile('arbitrary file'), []);

    graph = Graph.create(resolve, load);
  });

  it('calls back an error when called without any entry point', done => {
    graph([], anyPlatform, {log: quiet}, (error) => {
      expect(error).toEqual(any(Error));
      done();
    });
  });

  it('resolves the entry point with the passed-in `resolve` function', done => {
    const entryPoint = '/arbitrary/path';
    graph([entryPoint], anyPlatform, noOpts, () => {
      expect(resolve).toBeCalledWith(
        entryPoint, '', any(String), any(Object), any(Function));
      done();
    });
  });

  it('allows to specify multiple entry points', done => {
    const entryPoints = ['Arbitrary', '../entry.js'];
    graph(entryPoints, anyPlatform, noOpts, () => {
      expect(resolve).toBeCalledWith(
        entryPoints[0], '', any(String), any(Object), any(Function));
      expect(resolve).toBeCalledWith(
        entryPoints[1], '', any(String), any(Object), any(Function));
      done();
    });

  });

  it('calls back with an error when called without `platform` option', done => {
    graph(anyEntry, undefined, {log: quiet}, error => {
      expect(error).toEqual(any(Error));
      done();
    });
  });

  it('forwards a passed-in `platform` to `resolve`', done => {
    const platform = 'any';
    graph(anyEntry, platform, noOpts, () => {
      expect(resolve).toBeCalledWith(
        any(String), '', platform, any(Object), any(Function));
      done();
    });
  });

  it('forwards a passed-in `log` option to `resolve`', done => {
    const log = new Console();
    graph(anyEntry, anyPlatform, {log}, () => {
      expect(resolve).toBeCalledWith(
        any(String), '', any(String), objectContaining({log}), any(Function));
      done();
    });
  });

  it('calls back with every error produced by `resolve`', done => {
    const error = Error();
    resolve.stub.yields(error);
    graph(anyEntry, anyPlatform, noOpts, e => {
      expect(e).toBe(error);
      done();
    });
  });

  it('only calls back once if two parallel invocations of `resolve` fail', done => {
    load.stub.yields(null, createFile('with two deps'), ['depA', 'depB']);
    resolve.stub
      .withArgs('depA').yieldsAsync(new Error())
      .withArgs('depB').yieldsAsync(new Error());

    let calls = 0;
    function callback() {
      if (calls === 0) {
        process.nextTick(() => {
          expect(calls).toEqual(1);
          done();
        });
      }
      ++calls;
    }

    graph(['entryA', 'entryB'], anyPlatform, noOpts, callback);
  });

  it('passes the files returned by `resolve` on to the `load` function', done => {
    const modules = new Map([
      ['Arbitrary', '/absolute/path/to/Arbitrary.js'],
      ['../entry.js', '/whereever/is/entry.js'],
    ]);
    for (const [id, file] of modules) {
      resolve.stub.withArgs(id).yields(null, file);
    }
    const [file1, file2] = modules.values();

    graph(modules.keys(), anyPlatform, noOpts, () => {
      expect(load).toBeCalledWith(file1, any(Object), any(Function));
      expect(load).toBeCalledWith(file2, any(Object), any(Function));
      done();
    });
  });

  it('passes the `optimize` flag on to `load`', done => {
    graph(anyEntry, anyPlatform, {optimize: true}, () => {
      expect(load).toBeCalledWith(
        any(String), objectContaining({optimize: true}), any(Function));
      done();
    });
  });

  it('uses `false` as the default for the `optimize` flag', done => {
    graph(anyEntry, anyPlatform, noOpts, () => {
      expect(load).toBeCalledWith(
        any(String), objectContaining({optimize: false}), any(Function));
      done();
    });
  });

  it('forwards a passed-in `log` to `load`', done => {
    const log = new Console();
    graph(anyEntry, anyPlatform, {log}, () => {
      expect(load)
        .toBeCalledWith(any(String), objectContaining({log}), any(Function));
      done();
    });
  });

  it('calls back with every error produced by `load`', done => {
    const error = Error();
    load.stub.yields(error);
    graph(anyEntry, anyPlatform, noOpts, e => {
      expect(e).toBe(error);
      done();
    });
  });

  it('resolves any dependencies provided by `load`', done => {
    const entryPath = '/path/to/entry.js';
    const id1 = 'required/id';
    const id2 = './relative/import';
    resolve.stub.withArgs('entry').yields(null, entryPath);
    load.stub.withArgs(entryPath)
      .yields(null, {path: entryPath}, [id1, id2]);

    graph(['entry'], anyPlatform, noOpts, () => {
      expect(resolve).toBeCalledWith(
        id1, entryPath, any(String), any(Object), any(Function));
      expect(resolve).toBeCalledWith(
        id2, entryPath, any(String), any(Object), any(Function));
      done();
    });
  });

  it('loads transitive dependencies', done => {
    const entryPath = '/path/to/entry.js';
    const id1 = 'required/id';
    const id2 = './relative/import';
    const path1 = '/path/to/dep/1';
    const path2 = '/path/to/dep/2';

    resolve.stub
      .withArgs(id1).yields(null, path1)
      .withArgs(id2).yields(null, path2)
      .withArgs('entry').yields(null, entryPath);
    load.stub
      .withArgs(entryPath).yields(null, {path: entryPath}, [id1])
      .withArgs(path1).yields(null, {path: path1}, [id2]);

    graph(['entry'], anyPlatform, noOpts, () => {
      expect(resolve).toBeCalledWith(id2, path1, any(String), any(Object), any(Function));
      expect(load).toBeCalledWith(path1, any(Object), any(Function));
      expect(load).toBeCalledWith(path2, any(Object), any(Function));
      done();
    });
  });

  it('calls back with an array of modules in depth-first traversal order, regardless of the order of resolution', done => {
    load.stub.reset();
    resolve.stub.reset();

    const ids = [
      'a',
        'b',
          'c', 'd',
        'e',
          'f', 'g',
        'h',
    ];
    ids.forEach(id => {
      const path = idToPath(id);
      resolve.stub.withArgs(id).yields(null, path);
      load.stub.withArgs(path).yields(null, createFile(id), []);
    });
    load.stub.withArgs(idToPath('a')).yields(null, createFile('a'), ['b', 'e', 'h']);
    load.stub.withArgs(idToPath('b')).yields(null, createFile('b'), ['c', 'd']);
    load.stub.withArgs(idToPath('e')).yields(null, createFile('e'), ['f', 'g']);

    // load certain ids later
    ['b', 'e', 'h'].forEach(id => resolve.stub.withArgs(id).resetBehavior());
    resolve.stub.withArgs('h').func = (a, b, c, d, callback) => {
      callback(null, idToPath('h'));
      ['e', 'b'].forEach(
        id => resolve.stub.withArgs(id).yield(null, idToPath(id)));
    };

    graph(['a'], anyPlatform, noOpts, (error, result) => {
      expect(error).toEqual(null);
      expect(result.modules).toEqual([
        createModule('a', ['b', 'e', 'h']),
        createModule('b', ['c', 'd']),
        createModule('c'),
        createModule('d'),
        createModule('e', ['f', 'g']),
        createModule('f'),
        createModule('g'),
        createModule('h'),
      ]);
      done();
    });
  });

  it('calls back with the resolved modules of the entry points', done => {
    load.stub.reset();
    resolve.stub.reset();

    load.stub.withArgs(idToPath('a')).yields(null, createFile('a'), ['b']);
    load.stub.withArgs(idToPath('b')).yields(null, createFile('b'), []);
    load.stub.withArgs(idToPath('c')).yields(null, createFile('c'), ['d']);
    load.stub.withArgs(idToPath('d')).yields(null, createFile('d'), []);

    'abcd'.split('')
      .forEach(id => resolve.stub.withArgs(id).yields(null, idToPath(id)));

    graph(['a', 'c'], anyPlatform, noOpts, (error, result) => {
      expect(result.entryModules).toEqual([
        createModule('a', ['b']),
        createModule('c', ['d']),
      ]);
      done();
    });
  });

  it('calls back with the resolved modules of the entry points if one entry point is a dependency of another', done => {
    load.stub.reset();
    resolve.stub.reset();

    load.stub.withArgs(idToPath('a')).yields(null, createFile('a'), ['b']);
    load.stub.withArgs(idToPath('b')).yields(null, createFile('b'), []);

    'ab'.split('')
      .forEach(id => resolve.stub.withArgs(id).yields(null, idToPath(id)));

    graph(['a', 'b'], anyPlatform, noOpts, (error, result) => {
      expect(result.entryModules).toEqual([
        createModule('a', ['b']),
        createModule('b', []),
      ]);
      done();
    });
  });

  it('does not include dependencies more than once', done => {
    const ids = ['a', 'b', 'c', 'd'];
    ids.forEach(id => {
      const path = idToPath(id);
      resolve.stub.withArgs(id).yields(null, path);
      load.stub.withArgs(path).yields(null, createFile(id), []);
    });
    ['a', 'd'].forEach(id =>
      load.stub
        .withArgs(idToPath(id)).yields(null, createFile(id), ['b', 'c']));

    graph(['a', 'd', 'b'], anyPlatform, noOpts, (error, result) => {
      expect(error).toEqual(null);
      expect(result.modules).toEqual([
        createModule('a', ['b', 'c']),
        createModule('b'),
        createModule('c'),
        createModule('d', ['b', 'c']),
      ]);
      done();
    });
  });

  it('handles dependency cycles', done => {
    resolve.stub
      .withArgs('a').yields(null, idToPath('a'))
      .withArgs('b').yields(null, idToPath('b'))
      .withArgs('c').yields(null, idToPath('c'));
    load.stub
      .withArgs(idToPath('a')).yields(null, createFile('a'), ['b'])
      .withArgs(idToPath('b')).yields(null, createFile('b'), ['c'])
      .withArgs(idToPath('c')).yields(null, createFile('c'), ['a']);

    graph(['a'], anyPlatform, noOpts, (error, result) => {
      expect(result.modules).toEqual([
        createModule('a', ['b']),
        createModule('b', ['c']),
        createModule('c', ['a']),
      ]);
      done();
    });
  });

  it('can skip files', done => {
    ['a', 'b', 'c', 'd', 'e'].forEach(
      id => resolve.stub.withArgs(id).yields(null, idToPath(id)));
    load.stub
      .withArgs(idToPath('a')).yields(null, createFile('a'), ['b', 'c', 'd'])
      .withArgs(idToPath('b')).yields(null, createFile('b'), ['e']);
    ['c', 'd', 'e'].forEach(id =>
      load.stub.withArgs(idToPath(id)).yields(null, createFile(id), []));
    const skip = new Set([idToPath('b'), idToPath('c')]);

    graph(['a'], anyPlatform, {skip}, (error, result) => {
      expect(result.modules).toEqual([
        createModule('a', ['b', 'c', 'd']),
        createModule('d', []),
      ]);
      done();
    });
  });
});

function createDependency(id) {
  return {id, path: idToPath(id)};
}

function createFile(id) {
  return {ast: {}, path: idToPath(id)};
}

function createModule(id, dependencies = []): Module {
  return {
    file: createFile(id),
    dependencies: dependencies.map(createDependency)
  };
}

function idToPath(id) {
  return '/path/to/' + id;
}
