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

var module_template = [
  'var React = require("React");',
  'var PropTypes = React.PropTypes;',
  'var Component = React.createClass(%s);',
  'module.exports = Component;'
].join('\n');

function getSource(definition) {
  return module_template.replace('%s', definition);
}

describe('React documentation parser', function() {
  var parser;

  beforeEach(function() {
    parser = new (require('../../ReactDocumentationParser'));
    parser.addHandler(require('../propTypeHandler'), 'propTypes');
  });

  it('finds definitions via React.PropTypes', function() {
    var source = [
      'var React = require("React");',
      'var Prop = React.PropTypes;',
      'var Prop1 = require("React").PropTypes;',
      'var Component = React.createClass({',
      '  propTypes: {',
      '    foo: Prop.bool,',
      '    bar: Prop1.bool,',
      '  }',
      '});',
      'module.exports = Component;'
    ].join('\n');

    var expectedResult = {
      description: '',
      props: {
        foo: {
          type: {name: 'bool'},
          required: false
        },
        bar: {
          type: {name: 'bool'},
          required: false
        }
      }
    };

    var result = parser.parseSource(source);
    expect(result).toEqual(expectedResult);
  });

  it('finds definitions via the ReactPropTypes module', function() {
    var source = [
      'var React = require("React");',
      'var Prop = require("ReactPropTypes");',
      'var Component = React.createClass({',
      '  propTypes: {',
      '    foo: Prop.bool,',
      '  }',
      '});',
      'module.exports = Component;'
    ].join('\n');

    var expectedResult = {
      description: '',
      props: {
        foo: {
          type: {name: 'bool'},
          required: false
        }
      }
    };

    var result = parser.parseSource(source);
    expect(result).toEqual(expectedResult);
  });

  it('detects simple prop types', function() {
    var source = getSource([
      '{',
      '  propTypes: {',
      '    array_prop: PropTypes.array,',
      '    bool_prop: PropTypes.bool,',
      '    func_prop: PropTypes.func,',
      '    number_prop: PropTypes.number,',
      '    object_prop: PropTypes.object,',
      '    string_prop: PropTypes.string,',
      '    element_prop: PropTypes.element,',
      '    any_prop: PropTypes.any,',
      '    node_prop: PropTypes.node',
      '  }',
      '}'
    ].join('\n'));

    var expectedResult = {
      description: '',
      props:{
        array_prop: {
          type: {name: 'array'},
          required: false
        },
        bool_prop: {
          type: {name: 'bool'},
          required: false
        },
        func_prop: {
          type: {name: 'func'},
          required: false
        },
        number_prop: {
          type: {name: 'number'},
          required: false
        },
        object_prop: {
          type: {name: 'object'},
          required: false
        },
        string_prop: {
          type: {name: 'string'},
          required: false
        },
        element_prop: {
          type: {name: 'element'},
          required: false
        },
        any_prop: {
          type: {name: 'any'},
          required: false
        },
        node_prop: {
          type: {name: 'node'},
          required: false
        }
      }
    };

    var result = parser.parseSource(source);
    expect(result).toEqual(expectedResult);
  });

  it('detects complex prop types', function() {
    var source = getSource([
      '{',
      '  propTypes: {',
      '    oneOf_prop: PropTypes.oneOf(["foo", "bar"]),',
      '    oneOfType_prop:',
      '      PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),',
      '    oneOfType_custom_prop:',
      '      PropTypes.oneOfType([xyz]),',
      '    instanceOf_prop: PropTypes.instanceOf(Foo),',
      '    arrayOf_prop: PropTypes.arrayOf(PropTypes.string),',
      '    shape_prop:',
      '      PropTypes.shape({foo: PropTypes.string, bar: PropTypes.bool}),',
      '    shape_custom_prop:',
      '      PropTypes.shape({foo: xyz})',
      '  }',
      '}'
    ].join('\n'));

    var expectedResult = {
      description: '',
      props:{
        oneOf_prop: {
          type: {
            name: 'enum',
            value: [
              {value: '"foo"', computed: false},
              {value: '"bar"', computed: false}
            ]
          },
          required: false
        },
        oneOfType_prop: {
          type: {
            name:'union',
            value: [
              {name: 'number'},
              {name: 'bool'}
            ]
          },
          required: false
        },
        oneOfType_custom_prop: {
          type: {
            name:'union',
            value: [{
              name: 'custom',
              raw: 'xyz'
            }]
          },
          required: false
        },
        instanceOf_prop: {
          type: {
            name: 'instance',
            value: 'Foo'
          },
          required: false
        },
        arrayOf_prop: {
          type: {
            name: 'arrayof',
            value: {name: 'string'}
          },
          required: false
        },
        shape_prop: {
          type: {
            name: 'shape',
            value: {
              foo: {name: 'string'},
              bar: {name: 'bool'}
            }
          },
          required: false
        },
        shape_custom_prop: {
          type: {
            name: 'shape',
            value: {
              foo: {
                name: 'custom',
                raw: 'xyz'
              },
            }
          },
          required: false
        }
      }
    };

    var result = parser.parseSource(source);
    expect(result).toEqual(expectedResult);
  });

  it('resolves variables to their values', function() {
    var source = [
      'var React = require("React");',
      'var PropTypes = React.PropTypes;',
      'var shape = {bar: PropTypes.string};',
      'var Component = React.createClass({',
      '  propTypes: {',
      '    foo: PropTypes.shape(shape)',
      '  }',
      '});',
      'module.exports = Component;'
    ].join('\n');

    var expectedResult = {
      description: '',
      props: {
        foo: {
          type: {
            name: 'shape',
            value: {
              bar: {name: 'string'}
            }
          },
          required: false
        }
      }
    };

    var result = parser.parseSource(source);
    expect(result).toEqual(expectedResult);
  });

  it('detects whether a prop is required', function() {
    var source = getSource([
      '{',
      '  propTypes: {',
      '    array_prop: PropTypes.array.isRequired,',
      '    bool_prop: PropTypes.bool.isRequired,',
      '    func_prop: PropTypes.func.isRequired,',
      '    number_prop: PropTypes.number.isRequired,',
      '    object_prop: PropTypes.object.isRequired,',
      '    string_prop: PropTypes.string.isRequired,',
      '    element_prop: PropTypes.element.isRequired,',
      '    any_prop: PropTypes.any.isRequired,',
      '    oneOf_prop: PropTypes.oneOf(["foo", "bar"]).isRequired,',
      '    oneOfType_prop: ',
      '    PropTypes.oneOfType([PropTypes.number, PropTypes.bool]).isRequired,',
      '    instanceOf_prop: PropTypes.instanceOf(Foo).isRequired',
      '  }',
      '}'
    ].join('\n'));

    var expectedResult = {
      description: '',
      props:{
        array_prop: {
          type: {name: 'array'},
          required: true
        },
        bool_prop: {
          type: {name: 'bool'},
          required: true
        },
        func_prop: {
          type: {name: 'func'},
          required: true
        },
        number_prop: {
          type: {name: 'number'},
          required: true
        },
        object_prop: {
          type: {name: 'object'},
          required: true
        },
        string_prop: {
          type: {name: 'string'},
          required: true
        },
        element_prop: {
          type: {name: 'element'},
          required: true
        },
        any_prop: {
          type: {name: 'any'},
          required: true
        },
        oneOf_prop: {
          type: {
            name: 'enum',
            value: [
              {value: '"foo"', computed: false},
              {value: '"bar"', computed: false}
            ]
          },
          required: true
        },
        oneOfType_prop: {
          type: {
            name: 'union',
            value: [
              {name: 'number'},
              {name: 'bool'}
            ]
          },
          required: true
        },
        instanceOf_prop: {
          type: {
            name: 'instance',
            value: 'Foo'
          },
          required: true
        }
      }
    };

    var result = parser.parseSource(source);
    expect(result).toEqual(expectedResult);
  });

  it('detects custom validation functions', function() {
    var source = getSource([
      '{',
      '  propTypes: {',
      '    custom_prop: function() {},',
      '    custom_prop2: () => {}',
      '  }',
      '}'
    ].join('\n'));

    var expectedResult = {
      description: '',
      props: {
        custom_prop: {
          type: {
            name: 'custom',
            raw: 'function() {}'
          },
          required: false
        },
        custom_prop2: {
          type: {
            name: 'custom',
            raw: '() => {}'
          },
          required: false
        }
      }
    };

    var result = parser.parseSource(source);
    expect(result).toEqual(expectedResult);
  });

  it('only considers definitions from React or ReactPropTypes', function() {
    var source = [
      'var React = require("React");',
      'var PropTypes = React.PropTypes;',
      'var Prop = require("Foo");',
      'var Component = React.createClass({',
      '  propTypes: {',
      '    custom_propA: PropTypes.bool,',
      '    custom_propB: Prop.bool.isRequired',
      '  }',
      '});',
      'module.exports = Component;'
    ].join('\n');

    var expectedResult = {
      description: '',
      props: {
        custom_propA: {
          type: {name: 'bool'},
          required: false
        },
        custom_propB: {
          type: {
            name: 'custom',
            raw: 'Prop.bool.isRequired'
          },
          required: false
        }
      }
    };

    var result = parser.parseSource(source);
    expect(result).toEqual(expectedResult);
  });

  it('understands the spread operator', function() {
    var source = [
      'var React = require("React");',
      'var PropTypes = React.PropTypes;',
      'var Foo = require("Foo.react");',
      'var props = {bar: PropTypes.bool};',
      'var Component = React.createClass({',
      '  propTypes: {',
      '    ...Foo.propTypes,',
      '    ...props,',
      '    foo: PropTypes.number',
      '  }',
      '});',
      'module.exports = Component;'
    ].join('\n');

    var expectedResult = {
      description: '',
      composes: ['Foo.react'],
      props:{
        foo: {
          type: {name: 'number'},
          required: false
        },
        bar: {
          type: {name: 'bool'},
          required: false
        },
      }
    };

    var result = parser.parseSource(source);
    expect(result).toEqual(expectedResult);
  });
});
