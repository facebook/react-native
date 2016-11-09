/**
 * Copyright (c) 2015, Facebook, Inc.  All rights reserved.
 *
 * Facebook, Inc. ("Facebook") owns all right, title and interest, including
 * all intellectual property and other proprietary rights, in and to the React
 * Native CustomComponents software (the "Software").  Subject to your
 * compliance with these terms, you are hereby granted a non-exclusive,
 * worldwide, royalty-free copyright license to (1) use and copy the Software;
 * and (2) reproduce and distribute the Software as part of your own software
 * ("Your Software").  Facebook reserves all rights not expressly granted to
 * you in this license agreement.
 *
 * THE SOFTWARE AND DOCUMENTATION, IF ANY, ARE PROVIDED "AS IS" AND ANY EXPRESS
 * OR IMPLIED WARRANTIES (INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE) ARE DISCLAIMED.
 * IN NO EVENT SHALL FACEBOOK OR ITS AFFILIATES, OFFICERS, DIRECTORS OR
 * EMPLOYEES BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
 * OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THE SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';


jest
 .disableAutomock()
 .mock('ErrorUtils');

var NavigationRouteStack = require('NavigationRouteStack');

function assetStringNotEmpty(str) {
  expect(!!str && typeof str === 'string').toBe(true);
}

describe('NavigationRouteStack:', () => {
  // Different types of routes.
  var ROUTES = [
    'foo',
    1,
    true,
    {foo: 'bar'},
    ['foo'],
  ];

  // Basic
  it('gets index', () => {
    var stack = new NavigationRouteStack(1, ['a', 'b', 'c']);
    expect(stack.index).toBe(1);
  });

  it('gets size', () => {
    var stack = new NavigationRouteStack(1, ['a', 'b', 'c']);
    expect(stack.size).toBe(3);
  });

  it('gets route', () => {
    var stack = new NavigationRouteStack(0, ['a', 'b', 'c']);
    expect(stack.get(2)).toBe('c');
  });

  it('converts to an array', () => {
    var stack = new NavigationRouteStack(0, ['a', 'b']);
    expect(stack.toArray()).toEqual(['a', 'b']);
  });

  it('creates a new stack after mutation', () => {
    var stack1 = new NavigationRouteStack(0, ['a', 'b']);
    var stack2 = stack1.push('c');
    expect(stack1).not.toBe(stack2);
  });

  it('throws at index out of bound', () => {
    expect(() => {
      new NavigationRouteStack(-1, ['a', 'b']);
    }).toThrow();

    expect(() => {
      new NavigationRouteStack(100, ['a', 'b']);
    }).toThrow();
  });

  it('finds index', () => {
    var stack = new NavigationRouteStack(0, ['a', 'b']);
    expect(stack.indexOf('b')).toBe(1);
    expect(stack.indexOf('c')).toBe(-1);
  });

  // Key
  it('gets key for route', () => {
    var test = (route) => {
      var stack = new NavigationRouteStack(0, ['a']);
      var key = stack.push(route).keyOf(route);
      expect(typeof key).toBe('string');
      expect(!!key).toBe(true);
    };

    ROUTES.forEach(test);
  });

  it('gets a key of larger value for route', () => {
    var lastKey = '';
    var test = (route) => {
      var stack = new NavigationRouteStack(0, ['a']);
      var key = stack.push(route).keyOf(route);
      expect(key > lastKey).toBe(true);
      lastKey = key;
    };

    ROUTES.forEach(test);
  });

  it('gets an unique key for a different route', () => {
    var stack = new NavigationRouteStack(0, ['a']);
    var keys = {};

    var test = (route) => {
      stack = stack.push(route);
      var key = stack.keyOf(route);
      expect(keys[key]).toBe(undefined);
      keys[key] = true;
    };

    ROUTES.forEach(test);
  });

  it('gets the same unique key for the same route', () => {
    var test = (route) => {
      var stack = new NavigationRouteStack(0, [route]);
      expect(stack.keyOf(route)).toBe(stack.keyOf(route));
    };

    ROUTES.forEach(test);
  });


  it('gets the same unique key form the derived stack', () => {
    var test = (route) => {
      var stack = new NavigationRouteStack(0, [route]);
      var derivedStack = stack.push('wow').pop().slice(0, 10).push('blah');
      expect(derivedStack.keyOf(route)).toBe(stack.keyOf(route));
    };

    ROUTES.forEach(test);
  });

  it('gets a different key from a different stack', () => {
    var test = (route) => {
      var stack1 = new NavigationRouteStack(0, [route]);
      var stack2 = new NavigationRouteStack(0, [route]);
      expect(stack1.keyOf(route)).not.toBe(stack2.keyOf(route));
    };

    ROUTES.forEach(test);
  });

  it('gets no key for a route that does not contains this route', () => {
     var stack = new NavigationRouteStack(0, ['a']);
     expect(stack.keyOf('b')).toBe(null);
  });

  it('gets a new key for a route that was removed and added again', () => {
    var test = (route) => {
      var stack = new NavigationRouteStack(0, ['a']);

      var key1 = stack.push(route).keyOf(route);
      var key2 = stack.push(route).pop().push(route).keyOf(route);
      expect(key1).not.toBe(key2);
    };

    ROUTES.forEach(test);
  });

  // Slice
  it('slices', () => {
    var stack1 = new NavigationRouteStack(1, ['a', 'b', 'c', 'd']);
    var stack2 = stack1.slice(1, 3);
    expect(stack2).not.toBe(stack1);
    expect(stack2.toArray()).toEqual(['b', 'c']);
  });

  it('may update index after slicing', () => {
    var stack = new NavigationRouteStack(2, ['a', 'b', 'c']);
    expect(stack.slice().index).toBe(2);
    expect(stack.slice(0, 1).index).toBe(0);
    expect(stack.slice(0, 2).index).toBe(1);
    expect(stack.slice(0, 3).index).toBe(2);
    expect(stack.slice(0, 100).index).toBe(2);
    expect(stack.slice(-2).index).toBe(1);
  });

  it('slices without specifying params', () => {
    var stack1 = new NavigationRouteStack(1, ['a', 'b', 'c']);
    var stack2 = stack1.slice();
    expect(stack2).toBe(stack1);
  });

  it('slices to from the end', () => {
    var stack1 = new NavigationRouteStack(1, ['a', 'b', 'c', 'd']);
    var stack2 = stack1.slice(-2);
    expect(stack2.toArray()).toEqual(['c', 'd']);
  });

  it('throws when slicing to empty', () => {
      expect(() => {
        var stack = new NavigationRouteStack(1, ['a', 'b']);
        stack.slice(100);
      }).toThrow();
  });

  // Push
  it('pushes route', () => {
    var stack1 = new NavigationRouteStack(1, ['a', 'b']);
    var stack2 = stack1.push('c');

    expect(stack2).not.toBe(stack1);
    expect(stack2.toArray()).toEqual(['a', 'b', 'c']);
    expect(stack2.index).toBe(2);
    expect(stack2.size).toBe(3);
  });

  it('throws when pushing empty route', () => {
    expect(() => {
      var stack = new NavigationRouteStack(1, ['a', 'b']);
      stack.push(null);
    }).toThrow();

    expect(() => {
      var stack = new NavigationRouteStack(1, ['a', 'b']);
      stack.push('');
    }).toThrow();

    expect(() => {
      var stack = new NavigationRouteStack(1, ['a', 'b']);
      stack.push(undefined);
    }).toThrow();
  });

  it('replaces routes on push', () => {
    var stack1 = new NavigationRouteStack(1, ['a', 'b', 'c']);
    var stack2 = stack1.push('d');
    expect(stack2).not.toBe(stack1);
    expect(stack2.toArray()).toEqual(['a', 'b', 'd']);
    expect(stack2.index).toBe(2);
  });

  // Pop
  it('pops route', () => {
    var stack1 = new NavigationRouteStack(2, ['a', 'b', 'c']);
    var stack2 = stack1.pop();
    expect(stack2).not.toBe(stack1);
    expect(stack2.toArray()).toEqual(['a', 'b']);
    expect(stack2.index).toBe(1);
    expect(stack2.size).toBe(2);
  });

  it('replaces routes on pop', () => {
    var stack1 = new NavigationRouteStack(1, ['a', 'b', 'c']);
    var stack2 = stack1.pop();
    expect(stack2).not.toBe(stack1);
    expect(stack2.toArray()).toEqual(['a']);
    expect(stack2.index).toBe(0);
  });

  it('throws when popping to empty stack', () => {
    expect(() => {
      var stack = new NavigationRouteStack(0, ['a']);
      stack.pop();
    }).toThrow();
  });

  // Jump
  it('jumps to index', () => {
    var stack1 = new NavigationRouteStack(0, ['a', 'b', 'c']);
    var stack2 = stack1.jumpToIndex(2);

    expect(stack2).not.toBe(stack1);
    expect(stack2.index).toBe(2);
  });

  it('throws then jumping to index out of bound', () => {
    expect(() => {
      var stack = new NavigationRouteStack(1, ['a', 'b']);
      stack.jumpToIndex(2);
    }).toThrow();

    expect(() => {
      var stack = new NavigationRouteStack(1, ['a', 'b']);
      stack.jumpToIndex(-1);
    }).toThrow();
  });

  // Replace
  it('replaces route at index', () => {
    var stack1 = new NavigationRouteStack(1, ['a', 'b']);
    var stack2 = stack1.replaceAtIndex(0, 'x');

    expect(stack2).not.toBe(stack1);
    expect(stack2.toArray()).toEqual(['x', 'b']);
    expect(stack2.index).toBe(0);
  });

  it('replaces route at negative index', () => {
    var stack1 = new NavigationRouteStack(1, ['a', 'b']);
    var stack2 = stack1.replaceAtIndex(-1, 'x');

    expect(stack2).not.toBe(stack1);
    expect(stack2.toArray()).toEqual(['a', 'x']);
    expect(stack2.index).toBe(1);
  });

  it('throws when replacing empty route', () => {
    expect(() => {
      var stack = new NavigationRouteStack(1, ['a', 'b']);
      stack.replaceAtIndex(1, null);
    }).toThrow();
  });

  it('throws when replacing at index out of bound', () => {
    expect(() => {
      var stack = new NavigationRouteStack(1, ['a', 'b']);
      stack.replaceAtIndex(100, 'x');
    }).toThrow();
  });

  // Iteration
  it('iterates each item', () => {
    var stack = new NavigationRouteStack(0, ['a', 'b']);
    var logs = [];
    var keys = {};
    var context = {name: 'yo'};

    stack.forEach(function (route, index, key) {
      assetStringNotEmpty(key);
      if (!keys.hasOwnProperty(key)) {
        keys[key] = true;
        logs.push([
          route,
          index,
          this.name,
        ]);
      }
    }, context);

    expect(logs).toEqual([
      ['a', 0, 'yo'],
      ['b', 1, 'yo'],
    ]);
  });

  it('Maps to an array', () => {
    var stack = new NavigationRouteStack(0, ['a', 'b']);
    var keys = {};
    var context = {name: 'yo'};

    var logs = stack.mapToArray(function(route, index, key) {
      assetStringNotEmpty(key);
      if (!keys.hasOwnProperty(key)) {
        keys[key] = true;
        return [
          route,
          index,
          this.name,
        ];
      }
    }, context);

    expect(logs).toEqual([
      ['a', 0, 'yo'],
      ['b', 1, 'yo'],
    ]);
  });

  // Diff
  it('subtracts stack', () => {
    var stack1 = new NavigationRouteStack(2, ['a', 'b', 'c']);
    var stack2 = stack1.pop().pop().push('x').push('y');

    var diff = stack1.subtract(stack2);

    var result = diff.toJS().map((record) => {
      assetStringNotEmpty(record.key);
      return {
        index: record.index,
        route: record.route,
      };
    });

    // route `b` and `c` are no longer in the stack.
    expect(result).toEqual([
      {
        index: 1,
        route: 'b',
      },
      {
        index: 2,
        route: 'c',
      },
    ]);
  });

  it('only subtracts the derived stack', () => {
    var stack1 = new NavigationRouteStack(2, ['a', 'b', 'c']);
    var stack2 = new NavigationRouteStack(0, ['a']);
    var diff = stack1.subtract(stack2);

    var result = diff.toJS().map((record) => {
      assetStringNotEmpty(record.key);
      return {
        index: record.index,
        route: record.route,
      };
    });

    expect(result).toEqual([
      {
        index: 0,
        route: 'a',
      },
      {
        index: 1,
        route: 'b',
      },
      {
        index: 2,
        route: 'c',
      },
    ]);

  });
});
