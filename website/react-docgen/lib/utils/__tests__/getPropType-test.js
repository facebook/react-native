/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

"use strict";

jest.autoMockOff();

describe('getPropType', function() {
  var utils;
  var getPropType;

  function parse(src) {
    return utils.parse(src).get('body', 0, 'expression');
  }

  beforeEach(function() {
    getPropType = require('../getPropType');
    utils = require('../../../tests/utils');
  });

  it('detects simple prop types', function() {
    var simplePropTypes = [
      'array',
      'bool',
      'func',
      'number',
      'object',
      'string',
      'any',
      'element',
      'node',
    ];

    simplePropTypes.forEach(
      type => expect(getPropType(parse('React.PropTypes.' + type)))
        .toEqual({name: type})
    );

    // It doesn't actually matter what the MemberExpression is
    simplePropTypes.forEach(
      type => expect(getPropType(parse('Foo.' + type + '.bar')))
        .toEqual({name: type})
    );

    // Doesn't even have to be a MemberExpression
    simplePropTypes.forEach(
      type => expect(getPropType(parse(type)))
        .toEqual({name: type})
    );
  });

  it('detects complex prop types', function() {
    expect(getPropType(parse('oneOf(["foo", "bar"])'))).toEqual({
      name: 'enum',
      value: [
        {value: '"foo"', computed: false},
        {value: '"bar"', computed: false}
      ]
    });

    expect(getPropType(parse('oneOfType([number, bool])'))).toEqual({
      name: 'union',
      value: [
        {name: 'number'},
        {name: 'bool'}
      ]
    });

    // custom type
    expect(getPropType(parse('oneOfType([foo])'))).toEqual({
      name: 'union',
      value: [{name: 'custom', raw: 'foo'}]
    });

    // custom type
    expect(getPropType(parse('instanceOf(Foo)'))).toEqual({
      name: 'instanceOf',
      value: 'Foo'
    });

    expect(getPropType(parse('arrayOf(string)'))).toEqual({
      name: 'arrayOf',
      value: {name: 'string'}
    });

    expect(getPropType(parse('shape({foo: string, bar: bool})'))).toEqual({
      name: 'shape',
      value: {
        foo: {
          name: 'string'
        },
        bar: {
          name: 'bool'
        }
      }
    });

    // custom
    expect(getPropType(parse('shape({foo: xyz})'))).toEqual({
      name: 'shape',
      value: {
        foo: {
          name: 'custom',
          raw: 'xyz'
        }
      }
    });
  });

  it('resolves variables to their values', function() {
    var src = [
      'var shape = {bar: PropTypes.string};',
      'PropTypes.shape(shape);',
    ].join('\n');
    var propTypeExpression = utils.parse(src).get('body', 1, 'expression');

    expect(getPropType(propTypeExpression)).toEqual({
      name: 'shape',
      value: {
        bar: {name: 'string'}
      }
    });
  });

  it('detects custom validation functions', function() {
    expect(getPropType(parse('(function() {})'))).toEqual({
      name: 'custom',
      raw: '(function() {})'
    });

    expect(getPropType(parse('() => {}'))).toEqual({
      name: 'custom',
      raw: '() => {}'
    });
  });

});
