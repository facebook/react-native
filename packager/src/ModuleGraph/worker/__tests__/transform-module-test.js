/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.disableAutomock();

const transformModule = require('../transform-module');

const t = require('babel-types');
const {SourceMapConsumer} = require('source-map');
const {fn} = require('../../test-helpers');
const {parse} = require('babylon');
const generate = require('babel-generator').default;
const {traverse} = require('babel-core');

const {any, objectContaining} = jasmine;

describe('transforming JS modules:', () => {
  const filename = 'arbitrary';

  let transform;

  beforeEach(() => {
    transform = fn();
    transform.stub.yields(null, transformResult());
  });

  const {bodyAst, sourceCode, transformedCode} = createTestData();

  const options = variants => ({
    filename,
    transform,
    variants,
  });

  const transformResult = (body = bodyAst) => ({
    ast: t.file(t.program(body)),
  });

  it('passes through file name and code', done => {
    transformModule(sourceCode, options(), (error, result) => {
      expect(result).toEqual(objectContaining({
        code: sourceCode,
        file: filename,
      }));
      done();
    });
  });

  it('exposes a haste ID if present', done => {
    const hasteID = 'TheModule';
    const codeWithHasteID = `/** @providesModule ${hasteID} */`;
    transformModule(codeWithHasteID, options(), (error, result) => {
      expect(result).toEqual(objectContaining({hasteID}));
      done();
    });
  });

  it('sets `type` to `"module"` by default', done => {
    transformModule(sourceCode, options(), (error, result) => {
      expect(result).toEqual(objectContaining({type: 'module'}));
      done();
    });
  });

  it('sets `type` to `"script"` if the input is a polyfill', done => {
    transformModule(sourceCode, {...options(), polyfill: true}, (error, result) => {
      expect(result).toEqual(objectContaining({type: 'script'}));
      done();
    });
  });

  it('calls the passed-in transform function with code, file name, and options for all passed in variants', done => {
    const variants = {dev: {dev: true}, prod: {dev: false}};

    transformModule(sourceCode, options(variants), () => {
      expect(transform)
        .toBeCalledWith({filename, sourceCode, options: variants.dev}, any(Function));
      expect(transform)
        .toBeCalledWith({filename, sourceCode, options: variants.prod}, any(Function));
      done();
    });
  });

  it('calls back with any error yielded by the transform function', done => {
    const error = new Error();
    transform.stub.yields(error);

    transformModule(sourceCode, options(), e => {
      expect(e).toBe(error);
      done();
    });
  });

  it('wraps the code produced by the transform function into a module factory', done => {
    transformModule(sourceCode, options(), (error, result) => {
      expect(error).toEqual(null);

      const {code, dependencyMapName} = result.transformed.default;
      expect(code.replace(/\s+/g, ''))
        .toEqual(
          `__d(function(global,require,module,exports,${
          dependencyMapName}){${transformedCode}});`
        );
      done();
    });
  });

  it('wraps the code produced by the transform function into an immediately invoked function expression for polyfills', done => {
    transformModule(sourceCode, {...options(), polyfill: true}, (error, result) => {
      expect(error).toEqual(null);

      const {code} = result.transformed.default;
      expect(code.replace(/\s+/g, ''))
        .toEqual(`(function(global){${transformedCode}})(this);`);
      done();
    });
  });

  it('creates source maps', done => {
    transformModule(sourceCode, options(), (error, result) => {
      const {code, map} = result.transformed.default;
      const column = code.indexOf('code');
      const consumer = new SourceMapConsumer(map);
      expect(consumer.originalPositionFor({line: 1, column}))
        .toEqual(objectContaining({line: 1, column: sourceCode.indexOf('code')}));
      done();
    });
  });

  it('extracts dependencies (require calls)', done => {
    const dep1 = 'foo', dep2 = 'bar';
    const code = `require('${dep1}'),require('${dep2}')`;
    const {body} = parse(code).program;
    transform.stub.yields(null, transformResult(body));

    transformModule(code, options(), (error, result) => {
      expect(result.transformed.default)
        .toEqual(objectContaining({dependencies: [dep1, dep2]}));
      done();
    });
  });

  it('transforms for all variants', done => {
    const variants = {dev: {dev: true}, prod: {dev: false}};
    transform.stub
      .withArgs(filename, sourceCode, variants.dev)
        .yields(null, transformResult(bodyAst))
      .withArgs(filename, sourceCode, variants.prod)
        .yields(null, transformResult([]));

    transformModule(sourceCode, options(variants), (error, result) => {
      const {dev, prod} = result.transformed;
      expect(dev.code.replace(/\s+/g, ''))
        .toEqual(
          `__d(function(global,require,module,exports,${
          dev.dependencyMapName}){arbitrary(code);});`
        );
      expect(prod.code.replace(/\s+/g, ''))
        .toEqual(
          `__d(function(global,require,module,exports,${
          prod.dependencyMapName}){arbitrary(code);});`
        );
      done();
    });
  });

  it('prefixes JSON files with `module.exports = `', done => {
    const json = '{"foo":"bar"}';

    transformModule(json, {...options(), filename: 'some.json'}, (error, result) => {
      const {code} = result.transformed.default;
      expect(code.replace(/\s+/g, ''))
        .toEqual(
          '__d(function(global,require,module,exports){' +
          `module.exports=${json}});`
        );
      done();
    });
  });

  it('does not create source maps for JSON files', done => {
    transformModule('{}', {...options(), filename: 'some.json'}, (error, result) => {
      expect(result.transformed.default)
        .toEqual(objectContaining({map: null}));
      done();
    });
  });

  it('adds package data for `package.json` files', done => {
    const pkg = {
      name: 'package-name',
      main: 'package/main',
      browser: {browser: 'defs'},
      'react-native': {'react-native': 'defs'},
    };

    transformModule(
      JSON.stringify(pkg),
      {...options(), filename: 'arbitrary/package.json'},
      (error, result) => {
        expect(result.package).toEqual(pkg);
        done();
      },
    );
  });
});

function createTestData() {
  // creates test data with an transformed AST, so that we can test source
  // map generation.
  const sourceCode = 'some(arbitrary(code));';
  const fileAst = parse(sourceCode);
  traverse(fileAst, {
    CallExpression(path) {
      if (path.node.callee.name === 'some') {
        path.replaceWith(path.node.arguments[0]);
      }
    }
  });
  return {
    bodyAst: fileAst.program.body,
    sourceCode,
    transformedCode: generate(fileAst).code,
  };
}
