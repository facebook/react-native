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
    parser.addHandler(require('../propDocblockHandler'), 'propTypes');
  });

  it('finds docblocks for prop types', function() {
    var source = getSource([
      '{',
      '  propTypes: {',
      '    /**',
      '     * Foo comment',
      '     */',
      '    foo: Prop.bool,',
      '',
      '    /**',
      '     * Bar comment',
      '     */',
      '    bar: Prop.bool,',
      '  }',
      '}'
    ].join('\n'));

    var expectedResult = {
      description: '',
      props: {
        foo: {
          description: 'Foo comment'
        },
        bar: {
          description: 'Bar comment'
        }
      }
    };

    var result = parser.parseSource(source);
    expect(result).toEqual(expectedResult);
  });

  it('can handle multline comments', function() {
    var source = getSource([
      '{',
      '  propTypes: {',
      '    /**',
      '     * Foo comment with',
      '     * many lines!',
      '     *',
      '     * even with empty lines in between',
      '     */',
      '    foo: Prop.bool',
      '  }',
      '}'
    ].join('\n'));

    var expectedResult = {
      description: '',
      props: {
        foo: {
          description:
            'Foo comment with\nmany lines!\n\neven with empty lines in between'
        }
      }
    };

    var result = parser.parseSource(source);
    expect(result).toEqual(expectedResult);
  });

  it('ignores non-docblock comments', function() {
    var source = getSource([
      '{',
      '  propTypes: {',
      '    /**',
      '     * Foo comment',
      '     */',
      '    // TODO: remove this comment',
      '    foo: Prop.bool,',
      '',
      '    /**',
      '     * Bar comment',
      '     */',
      '    /* This is not a doc comment */',
      '    bar: Prop.bool,',
      '  }',
      '}'
    ].join('\n'));

    var expectedResult = {
      description: '',
      props: {
        foo: {
          description: 'Foo comment'
        },
        bar: {
          description: 'Bar comment'
        }
      }
    };

    var result = parser.parseSource(source);
    expect(result).toEqual(expectedResult);
  });

  it('only considers the comment with the property below it', function() {
    var source = getSource([
      '{',
      '  propTypes: {',
      '    /**',
      '     * Foo comment',
      '     */',
      '    foo: Prop.bool,',
      '    bar: Prop.bool,',
      '  }',
      '}'
    ].join('\n'));

    var expectedResult = {
      description: '',
      props: {
        foo: {
          description: 'Foo comment'
        },
        bar: {
          description: ''
        }
      }
    };

    var result = parser.parseSource(source);
    expect(result).toEqual(expectedResult);
  });

  it('understands and ignores the spread operator', function() {
    var source = getSource([
      '{',
      '  propTypes: {',
      '    ...Foo.propTypes,',
      '    /**',
      '     * Foo comment',
      '     */',
      '    foo: Prop.bool,',
      '    bar: Prop.bool,',
      '  }',
      '}'
    ].join('\n'));

    var expectedResult = {
      description: '',
      props: {
        foo: {
          description: 'Foo comment'
        },
        bar: {
          description: ''
        }
      }
    };

    var result = parser.parseSource(source);
    expect(result).toEqual(expectedResult);
  });
});
