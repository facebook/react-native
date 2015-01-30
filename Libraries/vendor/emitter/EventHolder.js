/**
 * @generated SignedSource<<0591836c443c735d24e61782320d3d16>>
 *
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !! This file is a check-in of a static_upstream project!      !!
 * !!                                                            !!
 * !! You should not modify this file directly. Instead:         !!
 * !! 1) Use `fjs use-upstream` to temporarily replace this with !!
 * !!    the latest version from upstream.                       !!
 * !! 2) Make your changes, test them, etc.                      !!
 * !! 3) Use `fjs push-upstream` to copy your changes back to    !!
 * !!    static_upstream.                                        !!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 *
 * @providesModule EventHolder
 * @typechecks
 */
'use strict';

var invariant = require('invariant');

class EventHolder {
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
  holdEvent(eventType: String, a, b, c, d, e, _) {
    this._heldEvents[eventType] = this._heldEvents[eventType] || [];
    var eventsOfType = this._heldEvents[eventType];
    var key = {
      eventType: eventType,
      index: eventsOfType.length
    };
    eventsOfType.push([a, b, c, d, e, _]);
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
  emitToListener(eventType: ?String , listener, context: ?Object) {
    var eventsOfType = this._heldEvents[eventType];
    if (!eventsOfType) {
      return;
    }
    var origEventKey = this._currentEventKey;
    eventsOfType.forEach((/*?array*/ eventHeld, /*number*/ index) => {
      if (!eventHeld) {
        return;
      }
      this._currentEventKey = {
        eventType: eventType,
        index: index
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
      'Not in an emitting cycle; there is no current event'
    );
    this.releaseEvent(this._currentEventKey);
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
  releaseEventType(type: String) {
    this._heldEvents[type] = [];
  }
}

module.exports = EventHolder;
