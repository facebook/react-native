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
 * @providesModule NavigationEvent
 * @flow
 */
'use strict';

const invariant = require('fbjs/lib/invariant');

class NavigationEventPool {
  _list: Array<any>;

  constructor() {
    this._list = [];
  }

  get(type: string, currentTarget: Object, data: any): NavigationEvent {
    let event;
    if (this._list.length > 0) {
      event = this._list.pop();
      event.constructor.call(event, type, currentTarget, data);
    } else {
      event = new NavigationEvent(type, currentTarget, data);
    }
    return event;
  }

  put(event: NavigationEvent) {
    this._list.push(event);
  }
}

const _navigationEventPool = new NavigationEventPool();

/**
 * The NavigationEvent interface represents any event of the navigation.
 * It contains common properties and methods to any event.
 *
 * == Important Properties ==
 *
 * - target:
 *   A reference to the navigation context that dispatched the event. It is
 *   different from event.currentTarget when the event handler is called during
 *   the bubbling or capturing phase of the event.
 *
 * - currentTarget:
 *   Identifies the current target for the event, as the event traverses the
 *   navigation context tree. It always refers to the navigation context the
 *   event handler has been attached to as opposed to event.target which
 *   identifies the navigation context on which the event occurred.
 *
 * - eventPhase:
 *   Returns an integer value which specifies the current evaluation phase of
 *   the event flow; possible values are listed in NavigationEvent phase
 *   constants below.
 */
class NavigationEvent {
  static AT_TARGET: number;
  static BUBBLING_PHASE: number;
  static CAPTURING_PHASE: number;
  static NONE: number;

  _currentTarget: ?Object;
  _data: any;
  _defaultPrevented: boolean;
  _disposed: boolean;
  _propagationStopped: boolean;
  _type: string;

  target: ?Object;

  // Returns an integer value which specifies the current evaluation phase of
  // the event flow.
  eventPhase: number;

  static pool(type: string, currentTarget: Object, data: any): NavigationEvent {
    return _navigationEventPool.get(type, currentTarget, data);
  }

  constructor(type: string, currentTarget: Object, data: any) {
    this.target = currentTarget;
    this.eventPhase = NavigationEvent.NONE;

    this._type = type;
    this._currentTarget = currentTarget;
    this._data = data;
    this._defaultPrevented = false;
    this._disposed = false;
    this._propagationStopped = false;
  }

  get type(): string {
    return this._type;
  }

  get currentTarget(): ?Object {
    return this._currentTarget;
  }

  get data(): any {
    return this._data;
  }

  get defaultPrevented(): boolean {
    return this._defaultPrevented;
  }

  preventDefault(): void {
    this._defaultPrevented = true;
  }

  stopPropagation(): void {
    this._propagationStopped = true;
  }

  stop(): void {
    this.preventDefault();
    this.stopPropagation();
  }

  isPropagationStopped(): boolean {
    return this._propagationStopped;
  }

  /**
   * Dispose the event.
   * NavigationEvent shall be disposed after being emitted by
   * `NavigationEventEmitter`.
   */
  dispose(): void {
    invariant(!this._disposed, 'NavigationEvent is already disposed');
    this._disposed = true;

    // Clean up.
    this.target = null;
    this.eventPhase = NavigationEvent.NONE;
    this._type = '';
    this._currentTarget = null;
    this._data = null;
    this._defaultPrevented = false;

    // Put this back to the pool to reuse the instance.
    _navigationEventPool.put(this);
  }
}

/**
 * Event phase constants.
 * These values describe which phase the event flow is currently being
 * evaluated.
 */

// No event is being processed at this time.
NavigationEvent.NONE = 0;

// The event is being propagated through the currentTarget's ancestor objects.
NavigationEvent.CAPTURING_PHASE = 1;

// The event has arrived at the event's currentTarget. Event listeners registered for
// this phase are called at this time.
NavigationEvent.AT_TARGET = 2;

// The event is propagating back up through the currentTarget's ancestors in reverse
// order, starting with the parent. This is known as bubbling, and occurs only
// if event propagation isn't prevented. Event listeners registered for this
// phase are triggered during this process.
NavigationEvent.BUBBLING_PHASE = 3;

module.exports = NavigationEvent;
