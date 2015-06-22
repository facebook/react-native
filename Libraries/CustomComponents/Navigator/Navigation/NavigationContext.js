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
 */
'use strict';

var NavigationEventEmitter = require('NavigationEventEmitter');

var emptyFunction = require('emptyFunction');
var invariant = require('invariant');

import type * as NavigationEvent from 'NavigationEvent';
import type * as EventSubscription from 'EventSubscription';

/**
 * Class that contains the info and methods for app navigation.
 */
class NavigationContext {
  _eventEmitter: ?NavigationEventEmitter;
  _currentRoute: any;

  constructor() {
    this._eventEmitter = new NavigationEventEmitter(this);
    this._currentRoute = null;
    this.addListener('willfocus', this._onFocus, this);
    this.addListener('didfocus', this._onFocus, this);
  }

  // TODO: @flow does not like this getter. Will add @flow check back once
  // getter/setter is supported.
  get currentRoute(): any {
    return this._currentRoute;
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

  dispose(): void {
    var emitter = this._eventEmitter;
    if (emitter) {
      // clean up everything.
      emitter.removeAllListeners();
      this._eventEmitter = null;
      this._currentRoute = null;
    }
  }

  _onFocus(event: NavigationEvent): void {
    invariant(
      event.data && event.data.hasOwnProperty('route'),
      'didfocus event should provide route'
    );
    this._currentRoute = event.data.route;
  }
}

module.exports = NavigationContext;
