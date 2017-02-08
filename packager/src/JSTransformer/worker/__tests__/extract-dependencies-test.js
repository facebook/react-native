/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.disableAutomock();

const extractDependencies = require('../extract-dependencies');

describe('Dependency extraction:', () => {
  it('can extract calls to require', () => {
    const code = `require('foo/bar');
      var React = require("React");
      var A = React.createClass({
        render: function() {
          return require (  "Component" );
        }
      });
      require
      ('more');`;
    const {dependencies, dependencyOffsets} = extractDependencies(code);
    expect(dependencies)
      .toEqual(['foo/bar', 'React', 'Component', 'more']);
    expect(dependencyOffsets).toEqual([8, 46, 147, 203]);
  });

  it('does not extract require method calls', () => {
    const code = `
      require('a');
      foo.require('b');
      bar.
      require ( 'c').require('d');require('e')`;

    const {dependencies, dependencyOffsets} = extractDependencies(code);
    expect(dependencies).toEqual(['a', 'e']);
    expect(dependencyOffsets).toEqual([15, 98]);
  });

  it('does not extract require calls from strings', () => {
    const code = `require('foo');
      var React = '\\'require("React")';
      var a = ' // require("yadda")';
      var a = ' /* require("yadda") */';
      var A = React.createClass({
        render: function() {
          return require (  "Component" );
        }
      });
      " \\" require('more')";`;

    const {dependencies, dependencyOffsets} = extractDependencies(code);
    expect(dependencies).toEqual(['foo', 'Component']);
    expect(dependencyOffsets).toEqual([8, 226]);
  });

  it('does not extract require calls in comments', () => {
    const code = `require('foo')//require("not/this")
      /* A comment here with a require('call') that should not be extracted */require('bar')
    // ending comment without newline require("baz")`;

    const {dependencies, dependencyOffsets} = extractDependencies(code);
    expect(dependencies).toEqual(['foo', 'bar']);
    expect(dependencyOffsets).toEqual([8, 122]);
  });

  it('deduplicates dependencies', () => {
    const code = `require('foo');require( "foo" );
      require("foo");`;

    const {dependencies, dependencyOffsets} = extractDependencies(code);
    expect(dependencies).toEqual(['foo']);
    expect(dependencyOffsets).toEqual([8, 24, 47]);
  });

  it('does not extract calls to function with names that start with "require"', () => {
    const code = 'arbitraryrequire(\'foo\');';

    const {dependencies, dependencyOffsets} = extractDependencies(code);
    expect(dependencies).toEqual([]);
    expect(dependencyOffsets).toEqual([]);
  });

  it('does not extract calls to require with non-static arguments', () => {
    const code = 'require(\'foo/\' + bar)';

    const {dependencies, dependencyOffsets} = extractDependencies(code);
    expect(dependencies).toEqual([]);
    expect(dependencyOffsets).toEqual([]);
  });

  it('does not get confused by previous states', () => {
    // yes, this was a bug
    const code = 'require("a");/* a comment */ var a = /[a]/.test(\'a\');';

    const {dependencies, dependencyOffsets} = extractDependencies(code);
    expect(dependencies).toEqual(['a']);
    expect(dependencyOffsets).toEqual([8]);
  });

  it('can handle regular expressions', () => {
    const code = 'require(\'a\'); /["\']/.test(\'foo\'); require("b");';

    const {dependencies, dependencyOffsets} = extractDependencies(code);
    expect(dependencies).toEqual(['a', 'b']);
    expect(dependencyOffsets).toEqual([8, 42]);
  });
});
