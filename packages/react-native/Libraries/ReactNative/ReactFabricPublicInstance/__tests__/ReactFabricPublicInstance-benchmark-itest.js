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

import type {
  InternalInstanceHandle,
  ViewConfig,
} from 'react-native/Libraries/Renderer/shims/ReactNativeTypes';
import type ReactNativeDocument from 'react-native/src/private/webapis/dom/nodes/ReactNativeDocument';

import * as Fantom from '@react-native/fantom';
import ReactFabricHostComponent from 'react-native/Libraries/ReactNative/ReactFabricPublicInstance/ReactFabricHostComponent';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

// Create fake parameters for the class.
const tag = 11;
const viewConfig: ViewConfig = {
  uiViewClassName: 'test',
  validAttributes: {
    style: {},
  },
};
// $FlowExpectedError[incompatible-type]
const internalInstanceHandle: InternalInstanceHandle = {};
// $FlowExpectedError[incompatible-type]
const ownerDocument: ReactNativeDocument = {};

const ITERATIONS = 100;

const now = Fantom.unstable_benchmark.now;

/* eslint-disable no-new */
Fantom.unstable_benchmark
  .suite('ReactNativeElement vs. ReactFabricHostComponent', {
    minIterations: 50000,
  })
  .test('ReactNativeElement', () => {
    // This logic is very fast and if we only run it once the cost of calling
    // the benchmark function itself is significant. Calling it in a loop and
    // computing the average is more accurate to account for that.
    const start = now();
    for (let i = 0; i < ITERATIONS; i++) {
      new ReactNativeElement(
        tag,
        viewConfig,
        internalInstanceHandle,
        ownerDocument,
      );
    }
    const end = now();
    return {
      overriddenDuration: (end - start) / ITERATIONS,
    };
  })
  .test('ReactFabricHostComponent', () => {
    // This logic is very fast and if we only run it once the cost of calling
    // the benchmark function itself is significant. Calling it in a loop and
    // computing the average is more accurate to account for that.
    const start = now();
    for (let i = 0; i < ITERATIONS; i++) {
      new ReactFabricHostComponent(tag, viewConfig, internalInstanceHandle);
    }
    const end = now();
    return {
      overriddenDuration: (end - start) / ITERATIONS,
    };
  });
