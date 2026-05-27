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

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import NativeFantomTestSpecificMethods from '../../../testing/fantom/specs/NativeFantomTestSpecificMethods';
import * as Fantom from '@react-native/fantom';

const NUMBER_OF_TASKS_TO_SCHEDULE = 100;
const noop = () => {};
const takeFunctionAndNoop = NativeFantomTestSpecificMethods.takeFunctionAndNoop;

Fantom.unstable_benchmark
  .suite('RuntimeScheduler', {
    minIterations: 100000,
  })
  .test(`call ${NUMBER_OF_TASKS_TO_SCHEDULE} noop JSI methods`, () => {
    for (let i = 0; i < NUMBER_OF_TASKS_TO_SCHEDULE; i++) {
      takeFunctionAndNoop(noop);
    }
  })
  .test(
    `schedule ${NUMBER_OF_TASKS_TO_SCHEDULE} tasks`,
    () => {
      for (let i = 0; i < NUMBER_OF_TASKS_TO_SCHEDULE; i++) {
        Fantom.scheduleTask(noop);
      }
    },
    {
      afterEach: () => {
        // Will flush the queue
        Fantom.runWorkLoop();
      },
    },
  )
  .test(
    `run ${NUMBER_OF_TASKS_TO_SCHEDULE} scheduled tasks`,
    () => {
      // Will flush the queue
      Fantom.runWorkLoop();
    },
    {
      beforeEach: () => {
        for (let i = 0; i < NUMBER_OF_TASKS_TO_SCHEDULE; i++) {
          Fantom.scheduleTask(noop);
        }
      },
    },
  )
  .test(`schedule and run ${NUMBER_OF_TASKS_TO_SCHEDULE} tasks`, () => {
    for (let i = 0; i < NUMBER_OF_TASKS_TO_SCHEDULE; i++) {
      Fantom.runTask(noop);
    }
  });
