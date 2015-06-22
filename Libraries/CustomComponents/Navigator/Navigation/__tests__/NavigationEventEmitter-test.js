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
  .dontMock('EmitterSubscription')
  .dontMock('EventEmitter')
  .dontMock('EventSubscriptionVendor')
  .dontMock('NavigationEvent')
  .dontMock('NavigationEventEmitter');

var NavigationEventEmitter = require('NavigationEventEmitter');

describe('NavigationEventEmitter', () => {
  it('emit event', () => {
    var target = {};
    var emitter = new NavigationEventEmitter(target);
    var focusCounter = 0;
    var focusTarget;

    emitter.addListener('focus', (event) => {
      focusCounter++;
      focusTarget = event.target;
    });

    emitter.emit('focus');
    emitter.emit('blur');

    expect(focusCounter).toBe(1);
    expect(focusTarget).toBe(target);
  });

  it('put nested emit call in queue', () => {
    var target = {};
    var emitter = new NavigationEventEmitter(target);
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
});
