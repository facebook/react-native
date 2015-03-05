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
jest.mock('../../Documentation');

describe('propTypeHandler', function() {
  var utils;
  var getPropTypeMock;
  var documentation;
  var propTypeHandler;

  beforeEach(function() {
    utils = require('../../../tests/utils');
    getPropTypeMock = jest.genMockFunction().mockImplementation(() => ({}));
    jest.setMock('../../utils/getPropType', getPropTypeMock);
    jest.mock('../../utils/getPropType');

    documentation = new (require('../../Documentation'));
    propTypeHandler = require('../propTypeHandler');
  });

  function parse(definition) {
    var programPath = utils.parseWithTemplate(definition, utils.REACT_TEMPLATE);
    return programPath.get(
      'body',
      programPath.node.body.length - 1,
      'expression'
    );
  }

  it('passes the correct argument to getPropType', function() {
    var definition = parse(
      '({propTypes: {foo: PropTypes.bool, abc: PropTypes.xyz}})'
    );
    var propertyPath = definition.get('properties', 0, 'value');
    var fooPath = propertyPath.get('properties', 0, 'value');
    var xyzPath = propertyPath.get('properties', 1, 'value');

    propTypeHandler(documentation, definition);

    expect(getPropTypeMock).toBeCalledWith(fooPath);
    expect(getPropTypeMock).toBeCalledWith(xyzPath);
  });

  it('finds definitions via React.PropTypes', function() {
    var definition = parse([
      '({',
      '  propTypes: {',
      '    foo: PropTypes.bool,',
      '    bar: require("react").PropTypes.bool,',
      '  }',
      '})',
    ].join('\n'));


    propTypeHandler(documentation, definition);
    expect(documentation.descriptors).toEqual({
      foo: {
        type: {},
        required: false
      },
      bar: {
        type: {},
        required: false
      }
    });
  });

  it('finds definitions via the ReactPropTypes module', function() {
    var definition = parse([
      '({',
      '  propTypes: {',
      '    foo: require("ReactPropTypes").bool,',
      '  }',
      '})',
    ].join('\n'));


    propTypeHandler(documentation, definition);
    expect(documentation.descriptors).toEqual({
      foo: {
        type: {},
        required: false
      },
    });
  });

  it('detects whether a prop is required', function() {
    var definition = parse([
      '({',
      '  propTypes: {',
      '    simple_prop: PropTypes.array.isRequired,',
      '    complex_prop: ',
      '    PropTypes.oneOfType([PropTypes.number, PropTypes.bool]).isRequired,',
      '  }',
      '})'
    ].join('\n'));

    propTypeHandler(documentation, definition);
    expect(documentation.descriptors).toEqual({
        simple_prop: {
          type: {},
          required: true
        },
        complex_prop: {
          type: {},
          required: true
        }
    });
  });

  it('only considers definitions from React or ReactPropTypes', function() {
    var definition = parse([
      '({',
      '  propTypes: {',
      '    custom_propA: PropTypes.bool,',
      '    custom_propB: Prop.bool.isRequired',
      '  }',
      '})',
    ].join('\n'));

    propTypeHandler(documentation, definition);
    expect(documentation.descriptors).toEqual({
      custom_propA: {
        type: {},
        required: false
      },
      custom_propB: {
        type: {
          name: 'custom',
          raw: 'Prop.bool.isRequired'
        },
        required: false
      }
    });
  });

  it('understands the spread operator', function() {
    var definition = parse([
      'var Foo = require("Foo.react");',
      'var props = {bar: PropTypes.bool};',
      '({',
      '  propTypes: {',
      '    ...Foo.propTypes,',
      '    ...props,',
      '    foo: PropTypes.number',
      '  }',
      '})',
    ].join('\n'));

    propTypeHandler(documentation, definition);
    expect(documentation.composes).toEqual(['Foo.react']);
    expect(documentation.descriptors).toEqual({
      foo: {
        type: {},
        required: false
      },
      bar: {
        type: {},
        required: false
      },
    });
  });

  it('resolves variables', function() {
    var definition = parse([
      'var props = {bar: PropTypes.bool};',
      '({',
      '  propTypes: props',
      '})',
    ].join('\n'));

    propTypeHandler(documentation, definition);
    expect(documentation.descriptors).toEqual({
      bar: {
        type: {},
        required: false
      },
    });
  });

  it('does not error if propTypes cannot be found', function() {
    var definition = parse([
      '({',
      '  fooBar: 42',
      '})',
    ].join('\n'));

    expect(function() {
      propTypeHandler(documentation, definition);
    }).not.toThrow();
  });
});
