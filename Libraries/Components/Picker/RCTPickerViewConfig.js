/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import ReactNativeViewViewConfig from '../../Components/View/ReactNativeViewViewConfig';
import type {ReactNativeBaseComponentViewConfig} from '../../Renderer/shims/ReactNativeTypes';

const RCTPickerViewConfig = {
  uiViewClassName: 'RCTPicker',
  bubblingEventTypes: {
    topChange: {
      phasedRegistrationNames: {
        bubbled: 'onChange',
        captured: 'onChangeCapture',
      },
    },
  },
  directEventTypes: {},
  validAttributes: {
    ...ReactNativeViewViewConfig.validAttributes,
    color: {process: require('../../StyleSheet/processColor')},
    fontFamily: true,
    fontSize: true,
    fontStyle: true,
    fontWeight: true,
    items: true,
    onChange: true,
    selectedIndex: true,
    textAlign: true,
  },
};

module.exports = (RCTPickerViewConfig: ReactNativeBaseComponentViewConfig<>);
