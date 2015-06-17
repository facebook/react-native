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
 *
 * @providesModule NavigationContext
 * @flow
 */
'use strict';

var NavigationEventEmitter = require('NavigationEventEmitter');
var emptyFunction = require('emptyFunction');

type EventSubscription = {
  remove: Function
};

/**
 * Class that contains the info and methods for app navigation.
 */
class NavigationContext {
  _eventEmitter: ?NavigationEventEmitter;

  constructor() {
    this._eventEmitter = new NavigationEventEmitter(this);
  }

  addListener(
    eventType: string,
    listener: Function,
    context: ?Object
  ): EventSubscription {
    var emitter = this._eventEmitter;
    if (emitter) {
      return emitter.addListener(eventType, listener, context);
    } else {
      return {remove: emptyFunction};
    }
  }

  emit(eventType: String, data: any): void {
    var emitter = this._eventEmitter;
    if (emitter) {
      emitter.emit(eventType, data);
    }
  }

  dispose() {
    var emitter = this._eventEmitter;
    if (emitter) {
      emitter.removeAllListeners();
      this._eventEmitter = null;
    }
  }
}

module.exports = NavigationContext;
