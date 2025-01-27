/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import '../../../../../../Libraries/Core/InitializeCore.js';

import Event from '../Event';
import EventTarget from '../EventTarget';
import createEventTargetHierarchyWithDepth from './createEventTargetHierarchyWithDepth';
import {unstable_benchmark} from '@react-native/fantom';

let event: Event;
let eventTarget: EventTarget;

unstable_benchmark
  .suite('EventTarget')
  .add(
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
  .add(
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
  .add(
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
  .add(
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
  .add(
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
  .add(
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
  );
