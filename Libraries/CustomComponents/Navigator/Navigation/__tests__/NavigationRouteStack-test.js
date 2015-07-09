/**
 * Copyright (c) 2015, Facebook, Inc.  All rights reserved.
 *
 * Facebook, Inc. (“Facebook”) owns all right, title and interest, including
 * all intellectual property and other proprietary rights, in and to the React
 * Native CustomComponents software (the “Software”).  Subject to your
 * compliance with these terms, you are hereby granted a non-exclusive,
 * worldwide, royalty-free copyright license to (1) use and copy the Software;
 * and (2) reproduce and distribute the Software as part of your own software
 * (“Your Software”).  Facebook reserves all rights not expressly granted to
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
    expect(stack.index).toEqual(1);
  });

  it('gets size', () => {
    var stack = new NavigationRouteStack(1, ['a', 'b', 'c']);
    expect(stack.size).toEqual(3);
  });

  it('gets route', () => {
    var stack = new NavigationRouteStack(0, ['a', 'b', 'c']);
    expect(stack.get(2)).toEqual('c');
  });

  it('converts to an array', () => {
    var stack = new NavigationRouteStack(0, ['a', 'b']);
    expect(stack.toArray()).toEqual(['a', 'b']);
  });

  it('creates a new stack after mutation', () => {
    var stack1 = new NavigationRouteStack(0, ['a', 'b']);
    var stack2 = stack1.push('c');
    expect(stack1).not.toEqual(stack2);
  });

  it('throws at index out of bound', () => {
    expect(() => {
      new NavigationRouteStack(-1, ['a', 'b']);
    }).toThrow();

    expect(() => {
      new NavigationRouteStack(100, ['a', 'b']);
    }).toThrow();
  });

  // Push
  it('pushes route', () => {
    var stack1 = new NavigationRouteStack(1, ['a', 'b']);
    var stack2 = stack1.push('c');

    expect(stack2).not.toEqual(stack1);
    expect(stack2.toArray()).toEqual(['a', 'b', 'c']);
    expect(stack2.index).toEqual(2);
    expect(stack2.size).toEqual(3);
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
    expect(stack2).not.toEqual(stack1);
    expect(stack2.toArray()).toEqual(['a', 'b', 'd']);
    expect(stack2.index).toEqual(2);
  });

  // Pop
  it('pops route', () => {
    var stack1 = new NavigationRouteStack(2, ['a', 'b', 'c']);
    var stack2 = stack1.pop();
    expect(stack2).not.toEqual(stack1);
    expect(stack2.toArray()).toEqual(['a', 'b']);
    expect(stack2.index).toEqual(1);
    expect(stack2.size).toEqual(2);
  });

  it('replaces routes on pop', () => {
    var stack1 = new NavigationRouteStack(1, ['a', 'b', 'c']);
    var stack2 = stack1.pop();
    expect(stack2).not.toEqual(stack1);
    expect(stack2.toArray()).toEqual(['a']);
    expect(stack2.index).toEqual(0);
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

    expect(stack2).not.toEqual(stack1);
    expect(stack2.index).toEqual(2);
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

    expect(stack2).not.toEqual(stack1);
    expect(stack2.toArray()).toEqual(['x', 'b']);
    expect(stack2.index).toEqual(1);
  });

  it('replaces route at negative index', () => {
    var stack1 = new NavigationRouteStack(1, ['a', 'b']);
    var stack2 = stack1.replaceAtIndex(-1, 'x');

    expect(stack2).not.toEqual(stack1);
    expect(stack2.toArray()).toEqual(['a', 'x']);
    expect(stack2.index).toEqual(1);
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
