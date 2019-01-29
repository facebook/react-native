/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const invariant = require('invariant');

class EventHolder {
  _heldEvents: Object;
  _currentEventKey: ?Object;

  constructor() {
    this._heldEvents = {};
    this._currentEventKey = null;
  }

  /**
   * Holds a given event for processing later.
   *
   * TODO: Annotate return type better. The structural type of the return here
   *       is pretty obvious.
   *
   * @param {string} eventType - Name of the event to hold and later emit
   * @param {...*} Arbitrary arguments to be passed to each registered listener
   * @return {object} Token that can be used to release the held event
   *
   * @example
   *
   *   holder.holdEvent({someEvent: 'abc'});
   *
   *   holder.emitToHandler({
   *     someEvent: function(data, event) {
   *       console.log(data);
   *     }
   *   }); //logs 'abc'
   *
   */
  holdEvent(eventType: string, ...args: any) {
    this._heldEvents[eventType] = this._heldEvents[eventType] || [];
    const eventsOfType = this._heldEvents[eventType];
    const key = {
      eventType: eventType,
      index: eventsOfType.length,
    };
    eventsOfType.push(args);
    return key;
  }

  /**
   * Emits the held events of the specified type to the given listener.
   *
   * @param {?string} eventType - Optional name of the events to replay
   * @param {function} listener - The listener to which to dispatch the event
   * @param {?object} context - Optional context object to use when invoking
   *   the listener
   */
  emitToListener(eventType: ?string, listener: Function, context: ?Object) {
    const eventsOfType = this._heldEvents[eventType];
    if (!eventsOfType) {
      return;
    }
    const origEventKey = this._currentEventKey;
    eventsOfType.forEach((/*?array*/ eventHeld, /*number*/ index) => {
      if (!eventHeld) {
        return;
      }
      this._currentEventKey = {
        eventType: eventType,
        index: index,
      };
      listener.apply(context, eventHeld);
    });
    this._currentEventKey = origEventKey;
  }

  /**
   * Provides an API that can be called during an eventing cycle to release
   * the last event that was invoked, so that it is no longer "held".
   *
   * If it is called when not inside of an emitting cycle it will throw.
   *
   * @throws {Error} When called not during an eventing cycle
   */
  releaseCurrentEvent() {
    invariant(
      this._currentEventKey !== null,
      'Not in an emitting cycle; there is no current event',
    );
    this._currentEventKey && this.releaseEvent(this._currentEventKey);
  }

  /**
   * Releases the event corresponding to the handle that was returned when the
   * event was first held.
   *
   * @param {object} token - The token returned from holdEvent
   */
  releaseEvent(token: Object) {
    delete this._heldEvents[token.eventType][token.index];
  }

  /**
   * Releases all events of a certain type.
   *
   * @param {string} type
   */
  releaseEventType(type: string) {
    this._heldEvents[type] = [];
  }
}

module.exports = EventHolder;
