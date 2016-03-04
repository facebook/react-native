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
 * @providesModule NavigationContext
 * @noflow
 */
'use strict';

var NavigationEvent = require('NavigationEvent');
var NavigationEventEmitter = require('NavigationEventEmitter');
var NavigationTreeNode = require('NavigationTreeNode');

var Set = require('Set');

var emptyFunction = require('fbjs/lib/emptyFunction');
var invariant = require('fbjs/lib/invariant');

import type EventSubscription from 'EventSubscription';

var {
  AT_TARGET,
  BUBBLING_PHASE,
  CAPTURING_PHASE,
} = NavigationEvent;

// Event types that do not support event bubbling, capturing and
// reconciliation API (e.g event.preventDefault(), event.stopPropagation()).
var LegacyEventTypes = new Set([
  'willfocus',
  'didfocus',
]);

/**
 * Class that contains the info and methods for app navigation.
 */
class NavigationContext {
  __node: NavigationTreeNode;
  _bubbleEventEmitter: ?NavigationEventEmitter;
  _captureEventEmitter: ?NavigationEventEmitter;
  _currentRoute: any;
  _emitCounter: number;
  _emitQueue: Array<any>;

  constructor() {
    this._bubbleEventEmitter = new NavigationEventEmitter(this);
    this._captureEventEmitter = new NavigationEventEmitter(this);
    this._currentRoute = null;

    // Sets the protected property `__node`.
    this.__node = new NavigationTreeNode(this);

    this._emitCounter = 0;
    this._emitQueue = [];

    this.addListener('willfocus', this._onFocus);
    this.addListener('didfocus', this._onFocus);
  }

  /* $FlowFixMe - get/set properties not yet supported */
  get parent(): ?NavigationContext {
    var parent = this.__node.getParent();
    return parent ? parent.getValue() : null;
  }

  /* $FlowFixMe - get/set properties not yet supported */
  get top(): ?NavigationContext {
    var result = null;
    var parentNode = this.__node.getParent();
    while (parentNode) {
      result = parentNode.getValue();
      parentNode = parentNode.getParent();
    }
    return result;
  }

  /* $FlowFixMe - get/set properties not yet supported */
  get currentRoute(): any {
    return this._currentRoute;
  }

  appendChild(childContext: NavigationContext): void {
    this.__node.appendChild(childContext.__node);
  }

  addListener(
    eventType: string,
    listener: Function,
    useCapture: ?boolean
  ): EventSubscription {
    if (LegacyEventTypes.has(eventType)) {
      useCapture = false;
    }

    var emitter = useCapture ?
      this._captureEventEmitter :
      this._bubbleEventEmitter;

    if (emitter) {
      return emitter.addListener(eventType, listener, this);
    } else {
      return {remove: emptyFunction};
    }
  }

  emit(eventType: String, data: any, didEmitCallback: ?Function): void {
    if (this._emitCounter > 0) {
      // An event cycle that was previously created hasn't finished yet.
      // Put this event cycle into the queue and will finish them later.
      var args: any = Array.prototype.slice.call(arguments);
      this._emitQueue.push(args);
      return;
    }

    this._emitCounter++;

    if (LegacyEventTypes.has(eventType)) {
      // Legacy events does not support event bubbling and reconciliation.
      this.__emit(
        eventType,
        data,
        null,
        {
          defaultPrevented: false,
          eventPhase: AT_TARGET,
          propagationStopped: true,
          target: this,
        }
      );
    } else {
      var targets = [this];
      var parentTarget = this.parent;
      while (parentTarget) {
        targets.unshift(parentTarget);
        parentTarget = parentTarget.parent;
      }

      var propagationStopped = false;
      var defaultPrevented = false;
      var callback = (event) => {
        propagationStopped = propagationStopped || event.isPropagationStopped();
        defaultPrevented = defaultPrevented || event.defaultPrevented;
      };

      // Capture phase
      targets.some((currentTarget) => {
        if (propagationStopped) {
          return true;
        }

        var extraInfo = {
          defaultPrevented,
          eventPhase: CAPTURING_PHASE,
          propagationStopped,
          target: this,
        };

        currentTarget.__emit(eventType, data, callback, extraInfo);
      }, this);

      // bubble phase
      targets.reverse().some((currentTarget) => {
        if (propagationStopped) {
          return true;
        }
        var extraInfo = {
          defaultPrevented,
          eventPhase: BUBBLING_PHASE,
          propagationStopped,
          target: this,
        };
        currentTarget.__emit(eventType, data, callback, extraInfo);
      }, this);
    }

    if (didEmitCallback) {
      var event = NavigationEvent.pool(eventType, this, data);
      propagationStopped && event.stopPropagation();
      defaultPrevented && event.preventDefault();
      didEmitCallback.call(this, event);
      event.dispose();
    }

    this._emitCounter--;
    while (this._emitQueue.length) {
      var args: any = this._emitQueue.shift();
      this.emit.apply(this, args);
    }
  }

  dispose(): void {
    // clean up everything.
    this._bubbleEventEmitter && this._bubbleEventEmitter.removeAllListeners();
    this._captureEventEmitter && this._captureEventEmitter.removeAllListeners();
    this._bubbleEventEmitter = null;
    this._captureEventEmitter = null;
    this._currentRoute = null;
  }

  // This method `__method` is protected.
  __emit(
    eventType: String,
    data: any,
    didEmitCallback: ?Function,
    extraInfo: Object,
  ): void {
    var emitter;
    switch (extraInfo.eventPhase) {
      case CAPTURING_PHASE: // phase = 1
        emitter = this._captureEventEmitter;
        break;

      case AT_TARGET: // phase = 2
        emitter = this._bubbleEventEmitter;
        break;

      case BUBBLING_PHASE: // phase = 3
        emitter = this._bubbleEventEmitter;
        break;

      default:
        invariant(false, 'invalid event phase %s', extraInfo.eventPhase);
    }

    if (extraInfo.target === this) {
      // phase = 2
      extraInfo.eventPhase = AT_TARGET;
    }

    if (emitter) {
      emitter.emit(
        eventType,
        data,
        didEmitCallback,
        extraInfo
      );
    }
  }

  _onFocus(event: NavigationEvent): void {
    invariant(
      event.data && event.data.hasOwnProperty('route'),
      'event type "%s" should provide route',
      event.type
    );

    this._currentRoute = event.data.route;
  }
}

module.exports = NavigationContext;
