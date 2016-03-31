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
  .autoMockOff()
  .mock('ErrorUtils');

var NavigationContext = require('NavigationContext');
var NavigationEvent = require('NavigationEvent');

describe('NavigationContext', () => {
  it('defaults `currentRoute` to null', () => {
    var context = new NavigationContext();
    expect(context.currentRoute).toEqual(null);
  });

  it('updates `currentRoute`', () => {
    var context = new NavigationContext();
    context.emit('didfocus', {route: {name: 'a'}});
    expect(context.currentRoute.name).toEqual('a');
  });

  it('has parent', () => {
    var parent = new NavigationContext();
    var child = new NavigationContext();
    parent.appendChild(child);
    expect(child.parent).toBe(parent);
  });

  it('has `top`', () => {
    var top = new NavigationContext();
    var parent = new NavigationContext();
    var child = new NavigationContext();
    top.appendChild(parent);
    parent.appendChild(child);
    expect(child.top).toBe(top);
  });

  it('captures event', () => {
    var parent = new NavigationContext();
    var child = new NavigationContext();
    parent.appendChild(child);

    var logs = [];

    var listener = (event) => {
      var {currentTarget, eventPhase, target, type} = event;
      logs.push({
        currentTarget,
        eventPhase,
        target,
        type,
      });
    };

    parent.addListener('yo', listener, true);
    child.addListener('yo', listener, true);

    child.emit('yo');

    expect(logs).toEqual([
      {
        currentTarget: parent,
        eventPhase: NavigationEvent.CAPTURING_PHASE,
        target: child,
        type: 'yo',
      },
      {
        currentTarget: child,
        eventPhase: NavigationEvent.AT_TARGET,
        target: child,
        type: 'yo',
      }
    ]);
  });

  it('bubbles events', () => {
    var parent = new NavigationContext();
    var child = new NavigationContext();
    parent.appendChild(child);

    var logs = [];

    var listener = (event) => {
      var {currentTarget, eventPhase, target, type} = event;
      logs.push({
        currentTarget,
        eventPhase,
        target,
        type,
      });
    };

    parent.addListener('yo', listener);
    child.addListener('yo', listener);

    child.emit('yo');

    expect(logs).toEqual([
      {
        currentTarget: child,
        eventPhase: NavigationEvent.AT_TARGET,
        target: child,
        type: 'yo',
      },
      {
        currentTarget: parent,
        eventPhase: NavigationEvent.BUBBLING_PHASE,
        target: child,
        type: 'yo',
      },
    ]);
  });

  it('stops event propagation at capture phase', () => {
    var parent = new NavigationContext();
    var child = new NavigationContext();
    parent.appendChild(child);

    var counter = 0;

    parent.addListener('yo', event => event.stopPropagation(), true);
    child.addListener('yo', event => counter++, true);

    child.emit('yo');

    expect(counter).toBe(0);
  });

  it('stops event propagation at bubbling phase', () => {
    var parent = new NavigationContext();
    var child = new NavigationContext();
    parent.appendChild(child);

    var counter = 0;

    parent.addListener('yo', event => counter++);
    child.addListener('yo', event => event.stopPropagation());

    child.emit('yo');

    expect(counter).toBe(0);
  });

  it('prevents event at capture phase', () => {
    var parent = new NavigationContext();
    var child = new NavigationContext();
    parent.appendChild(child);

    var val;
    parent.addListener('yo', event => event.preventDefault(), true);
    child.addListener('yo', event => val = event.defaultPrevented, true);

    child.emit('yo');

    expect(val).toBe(true);
  });

  it('prevents event at bubble phase', () => {
    var parent = new NavigationContext();
    var child = new NavigationContext();
    parent.appendChild(child);

    var val;
    parent.addListener('yo', event => val = event.defaultPrevented);
    child.addListener('yo', event => event.preventDefault());

    child.emit('yo');

    expect(val).toBe(true);
  });

  it('emits nested events in order at capture phase', () => {
    var parent = new NavigationContext();
    var child = new NavigationContext();
    parent.appendChild(child);

    var logs = [];

    var listener = (event) => {
      var {currentTarget, type} = event;
      logs.push({
        currentTarget,
        type,
      });
    };

    child.addListener('yo', event => {
      // event `didyo` should be fired after the full propagation cycle of the
      // `yo` event.
      child.emit('didyo');
    });

    parent.addListener('yo', listener, true);
    parent.addListener('didyo', listener, true);
    child.addListener('yo', listener, true);

    child.emit('yo');

    expect(logs).toEqual([
      {type: 'yo', currentTarget: parent},
      {type: 'yo', currentTarget: child},
      {type: 'didyo', currentTarget: parent},
    ]);
  });

  it('emits nested events in order at bubbling phase', () => {
    var parent = new NavigationContext();
    var child = new NavigationContext();
    parent.appendChild(child);

    var logs = [];

    var listener = (event) => {
      var {currentTarget, type} = event;
      logs.push({
        currentTarget,
        type,
      });
    };

    child.addListener('yo', event => {
      // event `didyo` should be fired after the full propagation cycle of the
      // `yo` event.
      child.emit('didyo');
    });

    parent.addListener('yo', listener);
    child.addListener('yo', listener);
    parent.addListener('didyo', listener);

    child.emit('yo');

    expect(logs).toEqual([
      {type: 'yo', currentTarget: child},
      {type: 'yo', currentTarget: parent},
      {type: 'didyo', currentTarget: parent},
    ]);
  });
});
