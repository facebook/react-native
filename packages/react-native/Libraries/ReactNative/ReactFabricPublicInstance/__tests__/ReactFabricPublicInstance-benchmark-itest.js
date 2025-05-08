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

import 'react-native/Libraries/Core/InitializeCore';

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

/* eslint-disable no-new */
Fantom.unstable_benchmark
  .suite('ReactNativeElement vs. ReactFabricHostComponent')
  .test('ReactNativeElement', () => {
    new ReactNativeElement(
      tag,
      viewConfig,
      internalInstanceHandle,
      ownerDocument,
    );
  })
  .test('ReactFabricHostComponent', () => {
    new ReactFabricHostComponent(tag, viewConfig, internalInstanceHandle);
  });
