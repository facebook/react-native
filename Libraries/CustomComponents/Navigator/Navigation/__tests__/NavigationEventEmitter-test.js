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
  .dontMock('EmitterSubscription')
  .dontMock('EventSubscription')
  .dontMock('EventEmitter')
  .dontMock('EventSubscriptionVendor')
  .dontMock('NavigationEvent')
  .dontMock('NavigationEventEmitter');

var NavigationEventEmitter = require('NavigationEventEmitter');

describe('NavigationEventEmitter', () => {
  it('emits event', () => {
    var context = {};
    var emitter = new NavigationEventEmitter(context);
    var logs = [];

    emitter.addListener('ping', (event) => {
      var {type, data, target, defaultPrevented} = event;

      logs.push({
        data,
        defaultPrevented,
        target,
        type,
      });

    });

    emitter.emit('ping', 'hello');

    expect(logs.length).toBe(1);
    expect(logs[0].target).toBe(context);
    expect(logs[0].type).toBe('ping');
    expect(logs[0].data).toBe('hello');
    expect(logs[0].defaultPrevented).toBe(false);
  });

  it('does not emit event that has no listeners', () => {
    var context = {};
    var emitter = new NavigationEventEmitter(context);
    var pinged = false;

    emitter.addListener('ping', () => {
      pinged = true;
    });

    emitter.emit('yo', 'bo');
    expect(pinged).toBe(false);
  });

  it('puts nested emit call in a queue', () => {
    var context = {};
    var emitter = new NavigationEventEmitter(context);
    var logs = [];

    emitter.addListener('one', () => {
      logs.push(1);
      emitter.emit('two');
      logs.push(2);
    });

    emitter.addListener('two', () => {
      logs.push(3);
      emitter.emit('three');
      logs.push(4);
    });

    emitter.addListener('three', () => {
      logs.push(5);
    });

    emitter.emit('one');

    expect(logs).toEqual([1, 2, 3, 4, 5]);
  });

  it('puts nested emit call in a queue should be in sequence order', () => {
    var context = {};
    var emitter = new NavigationEventEmitter(context);
    var logs = [];

    emitter.addListener('one', () => {
      logs.push(1);
      emitter.emit('two');
      emitter.emit('three');
      logs.push(2);
    });

    emitter.addListener('two', () => {
      logs.push(3);
      logs.push(4);
    });

    emitter.addListener('three', () => {
      logs.push(5);
    });

    emitter.emit('one');

    expect(logs).toEqual([1, 2, 3, 4, 5]);
  });

  it('calls callback after emitting', () => {
    var context = {};
    var emitter = new NavigationEventEmitter(context);
    var logs = [];

    emitter.addListener('ping', (event) => {
      var {type, data, target, defaultPrevented} = event;
      logs.push({
        data,
        defaultPrevented,
        target,
        type,
      });
      event.preventDefault();
    });

    emitter.emit('ping', 'hello', (event) => {
      var {type, data, target, defaultPrevented} = event;
      logs.push({
        data,
        defaultPrevented,
        target,
        type,
      });
    });

    expect(logs.length).toBe(2);
    expect(logs[1].target).toBe(context);
    expect(logs[1].type).toBe('ping');
    expect(logs[1].data).toBe('hello');
    expect(logs[1].defaultPrevented).toBe(true);
  });

  it('calls callback after emitting the current event and before ' +
       'emitting the next event', () => {
    var context = {};
    var emitter = new NavigationEventEmitter(context);
    var logs = [];

    emitter.addListener('ping', (event) => {
      logs.push('ping');
      emitter.emit('pong');
    });

    emitter.addListener('pong', (event) => {
      logs.push('pong');
    });

    emitter.emit('ping', null, () => {
      logs.push('did-ping');
    });

    expect(logs).toEqual([
      'ping',
      'did-ping',
      'pong',
    ]);
  });
});
