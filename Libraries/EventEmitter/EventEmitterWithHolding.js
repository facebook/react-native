/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule EventEmitterWithHolding
 * @flow
 */
'use strict';

import type EmitterSubscription from 'EmitterSubscription';
import type EventEmitter from 'EventEmitter';
import type EventHolder from 'EventHolder';

/**
 * @class EventEmitterWithHolding
 * @description
 * An EventEmitterWithHolding decorates an event emitter and enables one to
 * "hold" or cache events and then have a handler register later to actually
 * handle them.
 *
 * This is separated into its own decorator so that only those who want to use
 * the holding functionality have to and others can just use an emitter. Since
 * it implements the emitter interface it can also be combined with anything
 * that uses an emitter.
 */
class EventEmitterWithHolding {

  _emitter: EventEmitter;
  _eventHolder: EventHolder;
  _currentEventToken: ?Object;
  _emittingHeldEvents: boolean;

  /**
   * @constructor
   * @param {object} emitter - The object responsible for emitting the actual
   *   events.
   * @param {object} holder - The event holder that is responsible for holding
   *   and then emitting held events.
   */
  constructor(emitter: EventEmitter, holder: EventHolder) {
    this._emitter = emitter;
    this._eventHolder = holder;
    this._currentEventToken = null;
    this._emittingHeldEvents = false;
  }

  /**
   * @see EventEmitter#addListener
   */
  addListener(eventType: string, listener: Function, context: ?Object) {
    return this._emitter.addListener(eventType, listener, context);
  }

  /**
   * @see EventEmitter#once
   */
  once(eventType: string, listener: Function, context: ?Object) {
    return this._emitter.once(eventType, listener, context);
  }

  /**
   * Adds a listener to be invoked when events of the specified type are
   * emitted. An optional calling context may be provided. The data arguments
   * emitted will be passed to the listener function. In addition to subscribing
   * to all subsequent events, this method will also handle any events that have
   * already been emitted, held, and not released.
   *
   * @param {string} eventType - Name of the event to listen to
   * @param {function} listener - Function to invoke when the specified event is
   *   emitted
   * @param {*} context - Optional context object to use when invoking the
   *   listener
   *
   * @example
   *   emitter.emitAndHold('someEvent', 'abc');
   *
   *   emitter.addRetroactiveListener('someEvent', function(message) {
   *     console.log(message);
   *   }); // logs 'abc'
   */
  addRetroactiveListener(
    eventType: string, listener: Function, context: ?Object): EmitterSubscription {
    const subscription = this._emitter.addListener(eventType, listener, context);

    this._emittingHeldEvents = true;
    this._eventHolder.emitToListener(eventType, listener, context);
    this._emittingHeldEvents = false;

    return subscription;
  }

  /**
   * @see EventEmitter#removeAllListeners
   */
  removeAllListeners(eventType: string) {
    this._emitter.removeAllListeners(eventType);
  }

  /**
   * @see EventEmitter#removeCurrentListener
   */
  removeCurrentListener() {
    this._emitter.removeCurrentListener();
  }

  /**
   * @see EventEmitter#listeners
   */
  listeners(eventType: string) /* TODO: Annotate return type here */ {
    return this._emitter.listeners(eventType);
  }

  /**
   * @see EventEmitter#emit
   */
  emit(eventType: string, ...args: any) {
    this._emitter.emit(eventType, ...args);
  }

  /**
   * Emits an event of the given type with the given data, and holds that event
   * in order to be able to dispatch it to a later subscriber when they say they
   * want to handle held events.
   *
   * @param {string} eventType - Name of the event to emit
   * @param {...*} Arbitrary arguments to be passed to each registered listener
   *
   * @example
   *   emitter.emitAndHold('someEvent', 'abc');
   *
   *   emitter.addRetroactiveListener('someEvent', function(message) {
   *     console.log(message);
   *   }); // logs 'abc'
   */
  emitAndHold(eventType: string, ...args: any) {
    this._currentEventToken = this._eventHolder.holdEvent(eventType, ...args);
    this._emitter.emit(eventType, ...args);
    this._currentEventToken = null;
  }

  /**
   * @see EventHolder#releaseCurrentEvent
   */
  releaseCurrentEvent() {
    if (this._currentEventToken) {
      this._eventHolder.releaseEvent(this._currentEventToken);
    } else if (this._emittingHeldEvents) {
      this._eventHolder.releaseCurrentEvent();
    }
  }

  /**
   * @see EventHolder#releaseEventType
   * @param {string} eventType
   */
  releaseHeldEventType(eventType: string) {
    this._eventHolder.releaseEventType(eventType);
  }
}

module.exports = EventEmitterWithHolding;
