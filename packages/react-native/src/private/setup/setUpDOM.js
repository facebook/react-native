/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import {polyfillGlobal} from '../../../Libraries/Utilities/PolyfillFunctions';

let initialized = false;

export default function setUpDOM() {
  if (initialized) {
    return;
  }

  initialized = true;

  const EventTarget = require('../webapis/dom/events/EventTarget').default;
  const Event = require('../webapis/dom/events/Event').default;
  const CustomEvent = require('../webapis/dom/events/CustomEvent').default;

  // $FlowExpectedError[cannot-write]
  globalThis.EventTarget = EventTarget;

  // $FlowExpectedError[cannot-write]
  globalThis.Event = Event;

  // $FlowExpectedError[cannot-write]
  globalThis.CustomEvent = CustomEvent;

  // $FlowExpectedError[class-object-subtyping]
  Object.setPrototypeOf(globalThis, EventTarget.prototype);

  polyfillGlobal(
    'DOMRect',
    () => require('../webapis/dom/geometry/DOMRect').default,
  );

  polyfillGlobal(
    'DOMRectReadOnly',
    () => require('../webapis/dom/geometry/DOMRectReadOnly').default,
  );

  polyfillGlobal(
    'NodeList',
    () => require('../webapis/dom/oldstylecollections/NodeList').default,
  );
}
