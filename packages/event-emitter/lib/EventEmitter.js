/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 */

/**
 * EventEmitter manages listeners and publishes events to them.
 *
 * EventEmitter accepts a single type parameter that defines the valid events
 * and associated listener argument(s).
 *
 * @example
 *
 *   const emitter = new EventEmitter<{
 *     success: [number, string],
 *     error: [Error],
 *   }>();
 *
 *   emitter.on('success', (statusCode, responseText) => {...});
 *   emitter.emit('success', 200, '...');
 *
 *   emitter.on('error', error => {...});
 *   emitter.emit('error', new Error('Resource not found'));
 *
 */
export default class EventEmitter {
  _registry = {};
  /**
   * Registers a listener that is called when the supplied event is emitted.
   * Returns a subscription that has a `remove` method to undo registration.
   */

  addListener(eventType, listener, context) {
    const registrations = allocate(this._registry, eventType);
    const registration = {
      context,
      listener,

      remove() {
        registrations.delete(registration);
      },
    };
    registrations.add(registration);
    return registration;
  }
  /**
   * Emits the supplied event. Additional arguments supplied to `emit` will be
   * passed through to each of the registered listeners.
   *
   * If a listener modifies the listeners registered for the same event, those
   * changes will not be reflected in the current invocation of `emit`.
   */

  emit(eventType, ...args) {
    const registrations = this._registry[eventType];

    if (registrations != null) {
      for (const registration of [...registrations]) {
        registration.listener.apply(registration.context, args);
      }
    }
  }
  /**
   * Removes all registered listeners.
   */

  removeAllListeners(eventType) {
    if (eventType == null) {
      this._registry = {};
    } else {
      delete this._registry[eventType];
    }
  }
  /**
   * Returns the number of registered listeners for the supplied event.
   */

  listenerCount(eventType) {
    const registrations = this._registry[eventType];
    return registrations == null ? 0 : registrations.size;
  }
}

function allocate(registry, eventType) {
  let registrations = registry[eventType];

  if (registrations == null) {
    registrations = new Set();
    registry[eventType] = registrations;
  }

  return registrations;
}
