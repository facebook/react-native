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

import '../../../Core/InitializeCore.js';
import type {
  InternalInstanceHandle,
  ViewConfig,
} from '../../../Renderer/shims/ReactNativeTypes';

import ReactNativeElement from '../../../../src/private/webapis/dom/nodes/ReactNativeElement';
import ReactFabricHostComponent from '../../../ReactNative/ReactFabricPublicInstance/ReactFabricHostComponent';
import Fantom from '@react-native/fantom';

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

Fantom.unstable_benchmark
  .suite('ReactNativeElement vs. ReactFabricHostComponent')
  .add('ReactNativeElement', () => {
    // eslint-disable-next-line no-new
    new ReactNativeElement(tag, viewConfig, internalInstanceHandle);
  })
  .add('ReactFabricHostComponent', () => {
    // eslint-disable-next-line no-new
    new ReactFabricHostComponent(tag, viewConfig, internalInstanceHandle);
  });
