/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {polyfillGlobal} from '../../../Libraries/Utilities/PolyfillFunctions';

let initialized = false;

export default function setUpDOM() {
  if (initialized) {
    return;
  }

  initialized = true;

  polyfillGlobal(
    'DOMRect',
    () => require('../webapis/geometry/DOMRect').default,
  );

  polyfillGlobal(
    'DOMRectReadOnly',
    () => require('../webapis/geometry/DOMRectReadOnly').default,
  );

  polyfillGlobal(
    'DOMRectList',
    () => require('../webapis/geometry/DOMRectList').default,
  );

  polyfillGlobal(
    'HTMLCollection',
    () => require('../webapis/dom/oldstylecollections/HTMLCollection').default,
  );

  polyfillGlobal(
    'NodeList',
    () => require('../webapis/dom/oldstylecollections/NodeList').default,
  );

  polyfillGlobal(
    'Node',
    () => require('../webapis/dom/nodes/ReadOnlyNode').default,
  );

  polyfillGlobal(
    'Document',
    () => require('../webapis/dom/nodes/ReactNativeDocument').default,
  );

  polyfillGlobal(
    'CharacterData',
    () => require('../webapis/dom/nodes/ReadOnlyCharacterData').default,
  );

  polyfillGlobal(
    'Text',
    () => require('../webapis/dom/nodes/ReadOnlyText').default,
  );

  polyfillGlobal(
    'Element',
    () => require('../webapis/dom/nodes/ReadOnlyElement').default,
  );

  polyfillGlobal(
    'HTMLElement',
    () => require('../webapis/dom/nodes/ReactNativeElement').default,
  );

  polyfillGlobal('Event', () => require('../webapis/dom/events/Event').default);

  polyfillGlobal(
    'EventTarget',
    () => require('../webapis/dom/events/EventTarget').default,
  );

  polyfillGlobal(
    'CustomEvent',
    () => require('../webapis/dom/events/CustomEvent').default,
  );

  // Expose a global function that the React renderer can call to check
  // if EventTarget-based event dispatching is enabled.
  // We use a global function because we don't have another mechanism to pass
  // feature flags from RN to React in OSS (similar to RN$enableMicrotasksInReact
  // in setUpTimers.js).
  global.RN$isNativeEventTargetEventDispatchingEnabled = () =>
    require('../featureflags/ReactNativeFeatureFlags').enableNativeEventTargetEventDispatching();
}
