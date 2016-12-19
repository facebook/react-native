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
  *
 * @providesModule NavigationEventEmitter
 * @flow
 */
'use strict';

var EventEmitter = require('EventEmitter');
var NavigationEvent = require('NavigationEvent');

type ExtraInfo = {
  defaultPrevented: ?boolean,
  eventPhase: ?number,
  propagationStopped: ?boolean,
  target: ?Object,
};

class NavigationEventEmitter extends EventEmitter {
  _emitQueue: Array<any>;
  _emitting: boolean;
  _target: Object;

  constructor(target: Object) {
    super();
    this._emitting = false;
    this._emitQueue = [];
    this._target = target;
  }

  emit(
    eventType: string,
    data: any,
    didEmitCallback: ?Function,
    extraInfo: ?ExtraInfo
  ): void {
    if (this._emitting) {
      // An event cycle that was previously created hasn't finished yet.
      // Put this event cycle into the queue and will finish them later.
      var args: any = Array.prototype.slice.call(arguments);
      this._emitQueue.push(args);
      return;
    }

    this._emitting = true;

    var event = NavigationEvent.pool(eventType, this._target, data);

    if (extraInfo) {
      if (extraInfo.target) {
        event.target = extraInfo.target;
      }

      if (extraInfo.eventPhase) {
        event.eventPhase = extraInfo.eventPhase;
      }

      if (extraInfo.defaultPrevented) {
        event.preventDefault();
      }

      if (extraInfo.propagationStopped) {
        event.stopPropagation();
      }
    }

    // EventEmitter#emit only takes `eventType` as `String`. Casting `eventType`
    // to `String` to make @flow happy.
    super.emit(String(eventType), event);

    if (typeof didEmitCallback === 'function') {
      didEmitCallback.call(this._target, event);
    }
    event.dispose();

    this._emitting = false;

    while (this._emitQueue.length) {
      var args: any = this._emitQueue.shift();
      this.emit.apply(this, args);
    }
  }
}

module.exports = NavigationEventEmitter;
