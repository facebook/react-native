/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import CustomEvent from '../CustomEvent';
import Event from '../Event';
import EventTarget from '../EventTarget';

class CustomEventSubclass extends CustomEvent {}

export function testGeneric(target: EventTarget<>) {
  target.dispatchEvent(new Event('foo'));
  target.dispatchEvent(new CustomEvent('bar'));

  target.addEventListener('foo', (event: Event) => {});
  target.addEventListener('bar', (event: Event) => {});

  // $FlowExpectedError[incompatible-call]
  target.addEventListener('bar', (event: CustomEvent) => {});
}

export function testCustom(target: EventTarget<{customEvent: CustomEvent}>) {
  // Good
  target.dispatchEvent(new CustomEvent('customEvent'));

  // Should this fail?
  target.dispatchEvent(new CustomEvent('bar'));

  // $FlowExpectedError[incompatible-call]
  target.dispatchEvent(new Event('customEvent'));

  // Good
  target.addEventListener('customEvent', (event: CustomEvent) => {});

  // Underconstraining is fine (CustomEvent is a subtype of Event)
  target.addEventListener('customEvent', (event: Event) => {});

  // Overconstraining is not fine
  target.addEventListener(
    'customEvent',
    // $FlowExpectedError[incompatible-call]
    (event: CustomEventSubclass) => {},
  );

  // $FlowExpectedError[prop-missing] Unknown event type
  // $FlowExpectedError[incompatible-call]
  target.addEventListener('foo', (event: Event) => {});
}
