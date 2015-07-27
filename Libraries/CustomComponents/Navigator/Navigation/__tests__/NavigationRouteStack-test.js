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
  .dontMock('NavigationRouteStack')
  .dontMock('clamp')
  .dontMock('invariant')
  .dontMock('immutable');

var NavigationRouteStack = require('NavigationRouteStack');

describe('NavigationRouteStack:', () => {
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
});
