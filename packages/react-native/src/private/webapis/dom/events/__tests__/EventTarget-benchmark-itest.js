/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import createEventTargetHierarchyWithDepth from './createEventTargetHierarchyWithDepth';
import {unstable_benchmark} from '@react-native/fantom';
import Event from 'react-native/src/private/webapis/dom/events/Event';
import EventTarget from 'react-native/src/private/webapis/dom/events/EventTarget';

let event: Event;
let eventTarget: EventTarget<>;
let eventTargets: $ReadOnlyArray<EventTarget<>>;

unstable_benchmark
  .suite('EventTarget', {
    minIterations: 1000,
  })
  .test(
    'dispatchEvent, no bubbling, no listeners',
    () => {
      eventTarget.dispatchEvent(event);
    },
    {
      beforeAll: () => {
        event = new Event('custom');
        eventTarget = new EventTarget();
      },
    },
  )
  .test(
    'dispatchEvent, no bubbling, single listener',
    () => {
      eventTarget.dispatchEvent(event);
    },
    {
      beforeAll: () => {
        event = new Event('custom');
        eventTarget = new EventTarget();
        eventTarget.addEventListener('custom', () => {});
      },
    },
  )
  .test(
    'dispatchEvent, no bubbling, multiple listeners',
    () => {
      eventTarget.dispatchEvent(event);
    },
    {
      beforeAll: () => {
        event = new Event('custom');
        eventTarget = new EventTarget();
        for (let i = 0; i < 100; i++) {
          eventTarget.addEventListener('custom', () => {});
        }
      },
    },
  )
  .test(
    'dispatchEvent, bubbling, no listeners',
    () => {
      eventTarget.dispatchEvent(event);
    },
    {
      beforeAll: () => {
        event = new Event('custom', {bubbles: true});
        const targets = createEventTargetHierarchyWithDepth(100);
        eventTarget = targets[targets.length - 1];
      },
    },
  )
  .test(
    'dispatchEvent, bubbling, single listener per target',
    () => {
      eventTarget.dispatchEvent(event);
    },
    {
      beforeAll: () => {
        event = new Event('custom', {bubbles: true});
        const targets = createEventTargetHierarchyWithDepth(100);
        eventTarget = targets[targets.length - 1];
        for (const target of targets) {
          target.addEventListener('custom', () => {});
        }
      },
    },
  )
  .test(
    'dispatchEvent, bubbling, multiple listeners per target',
    () => {
      eventTarget.dispatchEvent(event);
    },
    {
      beforeAll: () => {
        event = new Event('custom', {bubbles: true});
        const targets = createEventTargetHierarchyWithDepth(100);
        eventTarget = targets[targets.length - 1];
        for (const target of targets) {
          for (let i = 0; i < 100; i++) {
            target.addEventListener('custom', () => {});
          }
        }
      },
    },
  )
  .test(
    'addEventListener, one listener',
    () => {
      eventTarget.addEventListener('custom', () => {});
    },
    {
      beforeEach: () => {
        eventTarget = new EventTarget();
      },
    },
  )
  .test(
    'addEventListener, one target, one type, multiple listeners',
    () => {
      for (let i = 0; i < 100; i++) {
        eventTarget.addEventListener('custom', () => {});
      }
    },
    {
      beforeEach: () => {
        eventTarget = new EventTarget();
      },
    },
  )
  .test(
    'addEventListener, one target, multiple types, one listener per type',
    () => {
      for (let i = 0; i < 100; i++) {
        eventTarget.addEventListener(String(i), () => {});
      }
    },
    {
      beforeEach: () => {
        eventTarget = new EventTarget();
      },
    },
  )
  .test(
    'addEventListener, one target, multiple types, multiple listeners',
    () => {
      for (let i = 0; i < 100; i++) {
        for (let j = 0; j < 100; j++) {
          eventTarget.addEventListener(String(i), () => {});
        }
      }
    },
    {
      beforeEach: () => {
        eventTarget = new EventTarget();
      },
    },
  )
  .test(
    'addEventListener, multiple targets, one type, one listener',
    () => {
      for (const target of eventTargets) {
        target.addEventListener('custom', () => {});
      }
    },
    {
      beforeEach: () => {
        eventTargets = createEventTargetHierarchyWithDepth(100);
      },
    },
  );
