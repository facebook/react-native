/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

export interface EventSubscription {
  remove(): void;
}

export interface IEventEmitter<TEventToArgsMap: {...}> {
  addListener<TEvent: $Keys<TEventToArgsMap>>(
    eventType: TEvent,
    listener: (...args: TEventToArgsMap[TEvent]) => mixed,
    context?: mixed,
  ): EventSubscription;

  emit<TEvent: $Keys<TEventToArgsMap>>(
    eventType: TEvent,
    ...args: TEventToArgsMap[TEvent]
  ): void;

  removeAllListeners<TEvent: $Keys<TEventToArgsMap>>(eventType?: ?TEvent): void;

  listenerCount<TEvent: $Keys<TEventToArgsMap>>(eventType: TEvent): number;
}

interface Registration<TArgs> {
  +context: mixed;
  +listener: (...args: TArgs) => mixed;
  +remove: () => void;
}

// $FlowFixMe[deprecated-type]
type Registry<TEventToArgsMap: {...}> = $ObjMap<
  TEventToArgsMap,
  <TArgs>(TArgs) => Set<Registration<TArgs>>,
>;

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
export default class EventEmitter<TEventToArgsMap: {...}>
  implements IEventEmitter<TEventToArgsMap>
{
  #registry: Registry<TEventToArgsMap> = {};

  /**
   * Registers a listener that is called when the supplied event is emitted.
   * Returns a subscription that has a `remove` method to undo registration.
   */
  addListener<TEvent: $Keys<TEventToArgsMap>>(
    eventType: TEvent,
    listener: (...args: TEventToArgsMap[TEvent]) => mixed,
    context: mixed,
  ): EventSubscription {
    if (typeof listener !== 'function') {
      throw new TypeError(
        'EventEmitter.addListener(...): 2nd argument must be a function.',
      );
    }
    const registrations = allocate<
      TEventToArgsMap,
      TEvent,
      TEventToArgsMap[TEvent],
    >(this.#registry, eventType);
    const registration: Registration<TEventToArgsMap[TEvent]> = {
      context,
      listener,
      remove(): void {
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
  emit<TEvent: $Keys<TEventToArgsMap>>(
    eventType: TEvent,
    ...args: TEventToArgsMap[TEvent]
  ): void {
    const registrations: ?Set<Registration<TEventToArgsMap[TEvent]>> =
      this.#registry[eventType];
    if (registrations != null) {
      // Copy `registrations` to take a snapshot when we invoke `emit`, in case
      // registrations are added or removed when listeners are invoked.
      for (const registration of Array.from(registrations)) {
        registration.listener.apply(registration.context, args);
      }
    }
  }

  /**
   * Removes all registered listeners.
   */
  removeAllListeners<TEvent: $Keys<TEventToArgsMap>>(
    eventType?: ?TEvent,
  ): void {
    if (eventType == null) {
      this.#registry = {};
    } else {
      delete this.#registry[eventType];
    }
  }

  /**
   * Returns the number of registered listeners for the supplied event.
   */
  listenerCount<TEvent: $Keys<TEventToArgsMap>>(eventType: TEvent): number {
    const registrations: ?Set<Registration<mixed>> = this.#registry[eventType];
    return registrations == null ? 0 : registrations.size;
  }
}

function allocate<
  TEventToArgsMap: {...},
  TEvent: $Keys<TEventToArgsMap>,
  TEventArgs: TEventToArgsMap[TEvent],
>(
  registry: Registry<TEventToArgsMap>,
  eventType: TEvent,
): Set<Registration<TEventArgs>> {
  let registrations: ?Set<Registration<TEventArgs>> = registry[eventType];
  if (registrations == null) {
    registrations = new Set();
    registry[eventType] = registrations;
  }
  return registrations;
}
