/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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

jest.dontMock('NavigationLegacyNavigatorRouteStack');

const NavigationLegacyNavigatorRouteStack = require('NavigationLegacyNavigatorRouteStack');

function assetStringNotEmpty(str) {
  expect(!!str && typeof str === 'string').toBe(true);
}

describe('NavigationLegacyNavigatorRouteStack:', () => {
  // Different types of routes.
  const ROUTES = [
    'foo',
    1,
    true,
    {foo: 'bar'},
    ['foo'],
  ];

  // Basic
  it('gets index', () => {
    const stack = new NavigationLegacyNavigatorRouteStack(1, ['a', 'b', 'c']);
    expect(stack.index).toBe(1);
  });

  it('gets size', () => {
    const stack = new NavigationLegacyNavigatorRouteStack(1, ['a', 'b', 'c']);
    expect(stack.size).toBe(3);
  });

  it('gets route', () => {
    const stack = new NavigationLegacyNavigatorRouteStack(0, ['a', 'b', 'c']);
    expect(stack.get(2)).toBe('c');
  });

  it('converts to an array', () => {
    const stack = new NavigationLegacyNavigatorRouteStack(0, ['a', 'b']);
    expect(stack.toArray()).toEqual(['a', 'b']);
  });

  it('creates a new stack after mutation', () => {
    const stack1 = new NavigationLegacyNavigatorRouteStack(0, ['a', 'b']);
    const stack2 = stack1.push('c');
    expect(stack1).not.toBe(stack2);
  });

  it('throws at index out of bound', () => {
    expect(
      () => new NavigationLegacyNavigatorRouteStack(-1, ['a', 'b'])
    ).toThrow();

    expect(
      () => new NavigationLegacyNavigatorRouteStack(100, ['a', 'b'])
    ).toThrow();
  });

  it('finds index', () => {
    const stack = new NavigationLegacyNavigatorRouteStack(0, ['a', 'b']);
    expect(stack.indexOf('b')).toBe(1);
    expect(stack.indexOf('c')).toBe(-1);
  });

  // Key
  it('gets key for route', () => {
    const test = (route) => {
      const stack = new NavigationLegacyNavigatorRouteStack(0, ['a']);
      const key = stack.push(route).keyOf(route);
      expect(typeof key).toBe('string');
      expect(!!key).toBe(true);
    };

    ROUTES.forEach(test);
  });

  it('gets a key of larger value for route', () => {
    let lastKey = '';
    const test = (route) => {
      const stack = new NavigationLegacyNavigatorRouteStack(0, ['a']);
      const key = stack.push(route).keyOf(route);
      expect(key > lastKey).toBe(true);
      lastKey = key;
    };

    ROUTES.forEach(test);
  });

  it('gets an unique key for a different route', () => {
    let stack = new NavigationLegacyNavigatorRouteStack(0, ['a']);
    const keys = {};

    const test = (route) => {
      stack = stack.push(route);
      const key = stack.keyOf(route);
      expect(keys[key]).toBe(undefined);
      keys[key] = true;
    };

    ROUTES.forEach(test);
  });

  it('gets the same unique key for the same route', () => {
    const test = (route) => {
      const stack = new NavigationLegacyNavigatorRouteStack(0, [route]);
      expect(stack.keyOf(route)).toBe(stack.keyOf(route));
    };

    ROUTES.forEach(test);
  });


  it('gets the same unique key form the derived stack', () => {
    const test = (route) => {
      const stack = new NavigationLegacyNavigatorRouteStack(0, [route]);
      const derivedStack = stack.push('wow').pop().slice(0, 10).push('blah');
      expect(derivedStack.keyOf(route)).toBe(stack.keyOf(route));
    };

    ROUTES.forEach(test);
  });

  it('gets a different key from a different stack', () => {
    const test = (route) => {
      const stack1 = new NavigationLegacyNavigatorRouteStack(0, [route]);
      const stack2 = new NavigationLegacyNavigatorRouteStack(0, [route]);
      expect(stack1.keyOf(route)).not.toBe(stack2.keyOf(route));
    };

    ROUTES.forEach(test);
  });

  it('gets no key for a route that does not contains this route', () => {
     const stack = new NavigationLegacyNavigatorRouteStack(0, ['a']);
     expect(stack.keyOf('b')).toBe(null);
  });

  it('gets a new key for a route that was removed and added again', () => {
    const test = (route) => {
      const stack = new NavigationLegacyNavigatorRouteStack(0, ['a']);

      const key1 = stack.push(route).keyOf(route);
      const key2 = stack.push(route).pop().push(route).keyOf(route);
      expect(key1).not.toBe(key2);
    };

    ROUTES.forEach(test);
  });

  // Slice
  it('slices', () => {
    const stack1 = new NavigationLegacyNavigatorRouteStack(1, ['a', 'b', 'c', 'd']);
    const stack2 = stack1.slice(1, 3);
    expect(stack2).not.toBe(stack1);
    expect(stack2.toArray()).toEqual(['b', 'c']);
  });

  it('may update index after slicing', () => {
    const stack = new NavigationLegacyNavigatorRouteStack(2, ['a', 'b', 'c']);
    expect(stack.slice().index).toBe(2);
    expect(stack.slice(0, 1).index).toBe(0);
    expect(stack.slice(0, 2).index).toBe(1);
    expect(stack.slice(0, 3).index).toBe(2);
    expect(stack.slice(0, 100).index).toBe(2);
    expect(stack.slice(-2).index).toBe(1);
  });

  it('slices without specifying params', () => {
    const stack1 = new NavigationLegacyNavigatorRouteStack(1, ['a', 'b', 'c']);
    const stack2 = stack1.slice();
    expect(stack2).toBe(stack1);
  });

  it('slices to from the end', () => {
    const stack1 = new NavigationLegacyNavigatorRouteStack(1, ['a', 'b', 'c', 'd']);
    const stack2 = stack1.slice(-2);
    expect(stack2.toArray()).toEqual(['c', 'd']);
  });

  it('throws when slicing to empty', () => {
      expect(() => {
        const stack = new NavigationLegacyNavigatorRouteStack(1, ['a', 'b']);
        stack.slice(100);
      }).toThrow();
  });

  // Push
  it('pushes route', () => {
    const stack1 = new NavigationLegacyNavigatorRouteStack(1, ['a', 'b']);
    const stack2 = stack1.push('c');

    expect(stack2).not.toBe(stack1);
    expect(stack2.toArray()).toEqual(['a', 'b', 'c']);
    expect(stack2.index).toBe(2);
    expect(stack2.size).toBe(3);
  });

  it('throws when pushing empty route', () => {
    expect(() => {
      const stack = new NavigationLegacyNavigatorRouteStack(1, ['a', 'b']);
      stack.push(null);
    }).toThrow();

    expect(() => {
      const stack = new NavigationLegacyNavigatorRouteStack(1, ['a', 'b']);
      stack.push('');
    }).toThrow();

    expect(() => {
      const stack = new NavigationLegacyNavigatorRouteStack(1, ['a', 'b']);
      stack.push(undefined);
    }).toThrow();
  });

  it('replaces routes on push', () => {
    const stack1 = new NavigationLegacyNavigatorRouteStack(1, ['a', 'b', 'c']);
    const stack2 = stack1.push('d');
    expect(stack2).not.toBe(stack1);
    expect(stack2.toArray()).toEqual(['a', 'b', 'd']);
    expect(stack2.index).toBe(2);
  });

  // Pop
  it('pops route', () => {
    const stack1 = new NavigationLegacyNavigatorRouteStack(2, ['a', 'b', 'c']);
    const stack2 = stack1.pop();
    expect(stack2).not.toBe(stack1);
    expect(stack2.toArray()).toEqual(['a', 'b']);
    expect(stack2.index).toBe(1);
    expect(stack2.size).toBe(2);
  });

  it('replaces routes on pop', () => {
    const stack1 = new NavigationLegacyNavigatorRouteStack(1, ['a', 'b', 'c']);
    const stack2 = stack1.pop();
    expect(stack2).not.toBe(stack1);
    expect(stack2.toArray()).toEqual(['a']);
    expect(stack2.index).toBe(0);
  });

  it('does nothing while popping to empty', () => {
    const stack = new NavigationLegacyNavigatorRouteStack(0, ['a']);
    expect(stack.pop()).toBe(stack);
    expect(stack.pop().pop()).toBe(stack);
  });

  it('pops to route', () => {
    const stack = new NavigationLegacyNavigatorRouteStack(1, ['a', 'b', 'c']);
    expect(stack.popToRoute('b').toArray()).toEqual(['a', 'b']);
    expect(stack.popToRoute('b').index).toBe(1);
    expect(stack.popToRoute('a').toArray()).toEqual(['a']);
    expect(stack.popToRoute('a').index).toBe(0);

    expect(() => {stack.popToRoute('x');}).toThrow();
  });

  // Jump
  it('jumps to index', () => {
    const stack1 = new NavigationLegacyNavigatorRouteStack(0, ['a', 'b', 'c']);
    const stack2 = stack1.jumpToIndex(2);

    expect(stack2).not.toBe(stack1);
    expect(stack2.index).toBe(2);
  });

  it('throws then jumping to index out of bound', () => {
    expect(() => {
      const stack = new NavigationLegacyNavigatorRouteStack(1, ['a', 'b']);
      stack.jumpToIndex(2);
    }).toThrow();

    expect(() => {
      const stack = new NavigationLegacyNavigatorRouteStack(1, ['a', 'b']);
      stack.jumpToIndex(-1);
    }).toThrow();
  });

  it('jumps to route', () => {
    const stack = new NavigationLegacyNavigatorRouteStack(0, ['a', 'b']);
    expect(stack.jumpTo('b').index).toBe(1);
  });

  it('jumps backward', () => {
    const stack = new NavigationLegacyNavigatorRouteStack(1, ['a', 'b']);
    expect(stack.jumpBack().index).toBe(0);
    expect(stack.jumpBack().jumpBack().jumpBack().index).toBe(0);
  });

  it('jumps forward', () => {
    const stack = new NavigationLegacyNavigatorRouteStack(0, ['a', 'b']);
    expect(stack.jumpForward().index).toBe(1);
    expect(stack.jumpForward().jumpForward().jumpForward().index).toBe(1);
  });


  // Replace
  it('replaces route at index', () => {
    const stack1 = new NavigationLegacyNavigatorRouteStack(1, ['a', 'b']);
    const stack2 = stack1.replaceAtIndex(0, 'x');

    expect(stack2).not.toBe(stack1);
    expect(stack2.toArray()).toEqual(['x', 'b']);
    expect(stack2.index).toBe(0);
  });

  it('replaces route at negative index', () => {
    const stack1 = new NavigationLegacyNavigatorRouteStack(1, ['a', 'b']);
    const stack2 = stack1.replaceAtIndex(-1, 'x');

    expect(stack2).not.toBe(stack1);
    expect(stack2.toArray()).toEqual(['a', 'x']);
    expect(stack2.index).toBe(1);
  });

  it('throws when replacing empty route', () => {
    expect(() => {
      const stack = new NavigationLegacyNavigatorRouteStack(1, ['a', 'b']);
      stack.replaceAtIndex(1, null);
    }).toThrow();
  });

  it('does nothing when replacing at index out of bound', () => {
    const stack = new NavigationLegacyNavigatorRouteStack(1, ['a', 'b']);
    expect(stack.replaceAtIndex(100, 'x')).toBe(stack);
    expect(stack.replaceAtIndex(-100, 'x')).toBe(stack);
  });

  it('replaces previous and pop route', () => {
    const stack = new NavigationLegacyNavigatorRouteStack(1, ['a', 'b', 'c']);
    expect(stack.replacePreviousAndPop('x').toArray()).toEqual(['x']);
    expect(stack.replacePreviousAndPop('x').index).toBe(0);
  });

  it('does nothing when there is nothing to replace', () => {
    const stack = new NavigationLegacyNavigatorRouteStack(0, ['a', 'b', 'c']);
    expect(stack.replacePreviousAndPop('x')).toBe(stack);
  });

  // Reset

  it('resets route', () => {
    const stack = new NavigationLegacyNavigatorRouteStack(1, ['a', 'b', 'c']);
    expect(stack.resetTo('b')).toBe(stack);

    expect(stack.resetTo('x').toArray()).toEqual(['a', 'x']);
    expect(stack.resetTo('x').index).toBe(1);

    expect(() => {stack.resetTo(null);}).toThrow();
    expect(() => {stack.resetTo('a');}).toThrow();
  });

  it('resets routes', () => {
    const stack = new NavigationLegacyNavigatorRouteStack(0, ['a']);
    expect(stack.resetRoutes(['x', 'y']).toArray()).toEqual(['x', 'y']);
    expect(stack.resetRoutes(['x', 'y']).index).toBe(1);
  });

  // Iteration
  it('iterates each item', () => {
    const stack = new NavigationLegacyNavigatorRouteStack(0, ['a', 'b']);
    const logs = [];
    const keys = {};
    const context = {name: 'yo'};

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
    const stack = new NavigationLegacyNavigatorRouteStack(0, ['a', 'b']);
    const keys = {};
    const context = {name: 'yo'};

    const logs = stack.mapToArray(function(route, index, key) {
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

  // Navigation State
  it('coverts to navigation state', () => {
    const stack = new NavigationLegacyNavigatorRouteStack(0, ['a', 'b']);
    const state = stack.toNavigationState();
    expect(state).toEqual({
      index: 0,
      key: '0',
      children:[
        {key: '0', route: 'a'},
        {key: '1', route: 'b'},
      ],
    });
  });

  it('coverts from navigation state', () => {
    const stack = new NavigationLegacyNavigatorRouteStack(0, ['a', 'b']);
    const state = stack.toNavigationState().children[0];
    const route = NavigationLegacyNavigatorRouteStack.getRouteByNavigationState(state);
    expect(route).toBe('a');
  });
});
