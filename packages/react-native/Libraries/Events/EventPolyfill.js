/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

// https://dom.spec.whatwg.org/#dictdef-eventinit
type Event$Init = {
  bubbles?: boolean,
  cancelable?: boolean,
  composed?: boolean,
  /** Non-standard. See `composed` instead. */
  scoped?: boolean,
  ...
};

/**
 * This is a copy of the Event interface defined in Flow:
 * https://github.com/facebook/flow/blob/741104e69c43057ebd32804dd6bcc1b5e97548ea/lib/dom.js
 * which is itself a faithful interface of the W3 spec:
 * https://dom.spec.whatwg.org/#interface-event
 *
 * Since Flow assumes that Event is provided and is on the global object,
 * we must provide an implementation of Event for CustomEvent (and future
 * alignment of React Native's event system with the W3 spec).
 */
interface IEvent {
  constructor(type: string, eventInitDict?: Event$Init): void;
  /**
   * Returns the type of event, e.g. "click", "hashchange", or "submit".
   */
  +type: string;
  /**
   * Returns the object to which event is dispatched (its target).
   */
  +target: EventTarget; // TODO: nullable
  /** @deprecated */
  +srcElement: Element; // TODO: nullable
  /**
   * Returns the object whose event listener's callback is currently being invoked.
   */
  +currentTarget: EventTarget; // TODO: nullable
  /**
   * Returns the invocation target objects of event's path (objects on which
   * listeners will be invoked), except for any nodes in shadow trees of which
   * the shadow root's mode is "closed" that are not reachable from event's
   * currentTarget.
   */
  composedPath(): Array<EventTarget>;

  +NONE: number;
  +AT_TARGET: number;
  +BUBBLING_PHASE: number;
  +CAPTURING_PHASE: number;
  /**
   * Returns the event's phase, which is one of NONE, CAPTURING_PHASE, AT_TARGET,
   * and BUBBLING_PHASE.
   */
  +eventPhase: number;

  /**
   * When dispatched in a tree, invoking this method prevents event from reaching
   * any objects other than the current object.
   */
  stopPropagation(): void;
  /**
   * Invoking this method prevents event from reaching any registered event
   * listeners after the current one finishes running and, when dispatched in a
   * tree, also prevents event from reaching any other objects.
   */
  stopImmediatePropagation(): void;

  /**
   * Returns true or false depending on how event was initialized. True if
   * event goes through its target's ancestors in reverse tree order, and
   * false otherwise.
   */
  +bubbles: boolean;
  /**
   * Returns true or false depending on how event was initialized. Its
   * return value does not always carry meaning, but true can indicate
   * that part of the operation during which event was dispatched, can
   * be canceled by invoking the preventDefault() method.
   */
  +cancelable: boolean;
  // returnValue: boolean; // legacy, and some subclasses still define it as a string!
  /**
   * If invoked when the cancelable attribute value is true, and while
   * executing a listener for the event with passive set to false, signals to
   * the operation that caused event to be dispatched that it needs to be
   * canceled.
   */
  preventDefault(): void;
  /**
   * Returns true if preventDefault() was invoked successfully to indicate
   * cancelation, and false otherwise.
   */
  +defaultPrevented: boolean;
  /**
   * Returns true or false depending on how event was initialized. True if
   * event invokes listeners past a ShadowRoot node that is the root of its
   * target, and false otherwise.
   */
  +composed: boolean;

  /**
   * Returns true if event was dispatched by the user agent, and false otherwise.
   */
  +isTrusted: boolean;
  /**
   * Returns the event's timestamp as the number of milliseconds measured relative
   * to the time origin.
   */
  +timeStamp: number;

  /** Non-standard. See Event.prototype.composedPath */
  +deepPath?: () => EventTarget[];
  /** Non-standard. See Event.prototype.composed */
  +scoped: boolean;

  /**
   * @deprecated
   */
  initEvent(type: string, bubbles: boolean, cancelable: boolean): void;
}

class EventPolyfill implements IEvent {
  type: string;
  bubbles: boolean;
  cancelable: boolean;
  composed: boolean;
  // Non-standard. See `composed` instead.
  scoped: boolean;
  isTrusted: boolean;
  defaultPrevented: boolean;
  timeStamp: number;

  // https://developer.mozilla.org/en-US/docs/Web/API/Event/eventPhase
  NONE: number;
  AT_TARGET: number;
  BUBBLING_PHASE: number;
  CAPTURING_PHASE: number;

  eventPhase: number;

  currentTarget: EventTarget; // TODO: nullable
  target: EventTarget; // TODO: nullable
  /** @deprecated */
  srcElement: Element; // TODO: nullable

  // React Native-specific: proxy data to a NativeSyntheticEvent when
  // certain methods are called.
  // NativeSyntheticEvent will also have a reference to this instance -
  // it is circular - and both classes use this reference to keep
  // data with the other in sync.
  _syntheticEvent: mixed;

  constructor(type: string, eventInitDict?: Event$Init) {
    this.type = type;
    this.bubbles = !!(eventInitDict?.bubbles || false);
    this.cancelable = !!(eventInitDict?.cancelable || false);
    this.composed = !!(eventInitDict?.composed || false);
    this.scoped = !!(eventInitDict?.scoped || false);

    // TODO: somehow guarantee that only "private" instantiations of Event
    // can set this to true
    this.isTrusted = false;

    // TODO: in the future we'll want to make sure this has the same
    // time-basis as events originating from native
    this.timeStamp = Date.now();

    this.defaultPrevented = false;

    // https://developer.mozilla.org/en-US/docs/Web/API/Event/eventPhase
    this.NONE = 0;
    this.AT_TARGET = 1;
    this.BUBBLING_PHASE = 2;
    this.CAPTURING_PHASE = 3;
    this.eventPhase = this.NONE;

    // $FlowFixMe
    this.currentTarget = null;
    // $FlowFixMe
    this.target = null;
    // $FlowFixMe
    this.srcElement = null;
  }

  composedPath(): Array<EventTarget> {
    throw new Error('TODO: not yet implemented');
  }

  preventDefault(): void {
    this.defaultPrevented = true;

    if (this._syntheticEvent != null) {
      // $FlowFixMe
      this._syntheticEvent.preventDefault();
    }
  }

  initEvent(type: string, bubbles: boolean, cancelable: boolean): void {
    throw new Error(
      'TODO: not yet implemented. This method is also deprecated.',
    );
  }

  stopImmediatePropagation(): void {
    throw new Error('TODO: not yet implemented');
  }

  stopPropagation(): void {
    if (this._syntheticEvent != null) {
      // $FlowFixMe
      this._syntheticEvent.stopPropagation();
    }
  }

  setSyntheticEvent(value: mixed): void {
    this._syntheticEvent = value;
  }
}

// Assertion magic for polyfill follows.
declare var checkEvent: Event; // eslint-disable-line no-unused-vars

/*::
// This can be a strict mode error at runtime so put it in a Flow comment.
(checkEvent: IEvent);
*/

global.Event = EventPolyfill;

export default EventPolyfill;
