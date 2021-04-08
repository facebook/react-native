/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import typeof BatchedBridge from '../BatchedBridge/BatchedBridge';
import typeof ExceptionsManager from '../Core/ExceptionsManager';
import typeof Platform from '../Utilities/Platform';
import typeof RCTEventEmitter from '../EventEmitter/RCTEventEmitter';
import typeof ReactNativeViewConfigRegistry from '../Renderer/shims/ReactNativeViewConfigRegistry';
import typeof TextInputState from '../Components/TextInput/TextInputState';
import typeof UIManager from '../ReactNative/UIManager';
import typeof deepDiffer from '../Utilities/differ/deepDiffer';
import typeof deepFreezeAndThrowOnMutationInDev from '../Utilities/deepFreezeAndThrowOnMutationInDev';
import typeof flattenStyle from '../StyleSheet/flattenStyle';
import {type DangerouslyImpreciseStyleProp} from '../StyleSheet/StyleSheet';
import typeof ReactFiberErrorDialog from '../Core/ReactFiberErrorDialog';
import typeof legacySendAccessibilityEvent from '../Components/AccessibilityInfo/legacySendAccessibilityEvent';

// flowlint unsafe-getters-setters:off
module.exports = {
  get BatchedBridge(): BatchedBridge {
    return require('../BatchedBridge/BatchedBridge');
  },
  get ExceptionsManager(): ExceptionsManager {
    return require('../Core/ExceptionsManager');
  },
  get Platform(): Platform {
    return require('../Utilities/Platform');
  },
  get RCTEventEmitter(): RCTEventEmitter {
    return require('../EventEmitter/RCTEventEmitter');
  },
  get ReactNativeViewConfigRegistry(): ReactNativeViewConfigRegistry {
    return require('../Renderer/shims/ReactNativeViewConfigRegistry');
  },
  get TextInputState(): TextInputState {
    return require('../Components/TextInput/TextInputState');
  },
  get UIManager(): UIManager {
    return require('../ReactNative/UIManager');
  },
  get deepDiffer(): deepDiffer {
    return require('../Utilities/differ/deepDiffer');
  },
  get deepFreezeAndThrowOnMutationInDev(): deepFreezeAndThrowOnMutationInDev<
    // $FlowFixMe[deprecated-type] - can't properly parameterize the getter's type
    *,
  > {
    return require('../Utilities/deepFreezeAndThrowOnMutationInDev');
  },
  get flattenStyle(): flattenStyle<DangerouslyImpreciseStyleProp> {
    return require('../StyleSheet/flattenStyle');
  },
  get ReactFiberErrorDialog(): ReactFiberErrorDialog {
    return require('../Core/ReactFiberErrorDialog');
  },
  get legacySendAccessibilityEvent(): legacySendAccessibilityEvent {
    return require('../Components/AccessibilityInfo/legacySendAccessibilityEvent');
  },
};
