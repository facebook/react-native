/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import typeof BatchedBridge from '../BatchedBridge/BatchedBridge';
import typeof legacySendAccessibilityEvent from '../Components/AccessibilityInfo/legacySendAccessibilityEvent';
import typeof TextInputState from '../Components/TextInput/TextInputState';
import typeof ExceptionsManager from '../Core/ExceptionsManager';
import typeof RawEventEmitter from '../Core/RawEventEmitter';
import typeof ReactFiberErrorDialog from '../Core/ReactFiberErrorDialog';
import typeof RCTEventEmitter from '../EventEmitter/RCTEventEmitter';
import typeof CustomEvent from '../Events/CustomEvent';
import typeof {
  createPublicInstance,
  createPublicTextInstance,
  getInternalInstanceHandleFromPublicInstance,
  getNativeTagFromPublicInstance,
  getNodeFromPublicInstance,
} from '../ReactNative/ReactFabricPublicInstance/ReactFabricPublicInstance';
import typeof {
  create as createAttributePayload,
  diff as diffAttributePayloads,
} from '../ReactNative/ReactFabricPublicInstance/ReactNativeAttributePayload';
import typeof UIManager from '../ReactNative/UIManager';
import typeof * as ReactNativeViewConfigRegistry from '../Renderer/shims/ReactNativeViewConfigRegistry';
import typeof flattenStyle from '../StyleSheet/flattenStyle';
import type {DangerouslyImpreciseStyleProp} from '../StyleSheet/StyleSheet';
import typeof deepFreezeAndThrowOnMutationInDev from '../Utilities/deepFreezeAndThrowOnMutationInDev';
import typeof deepDiffer from '../Utilities/differ/deepDiffer';
import typeof Platform from '../Utilities/Platform';

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
  // TODO: Remove when React has migrated to `createAttributePayload` and `diffAttributePayloads`
  get deepDiffer(): deepDiffer {
    return require('../Utilities/differ/deepDiffer');
  },
  get deepFreezeAndThrowOnMutationInDev(): deepFreezeAndThrowOnMutationInDev<
    {...} | Array<mixed>,
  > {
    return require('../Utilities/deepFreezeAndThrowOnMutationInDev');
  },
  // TODO: Remove when React has migrated to `createAttributePayload` and `diffAttributePayloads`
  get flattenStyle(): flattenStyle<DangerouslyImpreciseStyleProp> {
    // $FlowFixMe[underconstrained-implicit-instantiation]
    // $FlowFixMe[incompatible-return]
    return require('../StyleSheet/flattenStyle');
  },
  get ReactFiberErrorDialog(): ReactFiberErrorDialog {
    return require('../Core/ReactFiberErrorDialog').default;
  },
  get legacySendAccessibilityEvent(): legacySendAccessibilityEvent {
    return require('../Components/AccessibilityInfo/legacySendAccessibilityEvent');
  },
  get RawEventEmitter(): RawEventEmitter {
    return require('../Core/RawEventEmitter').default;
  },
  get CustomEvent(): CustomEvent {
    return require('../Events/CustomEvent').default;
  },
  get createAttributePayload(): createAttributePayload {
    return require('../ReactNative/ReactFabricPublicInstance/ReactNativeAttributePayload')
      .create;
  },
  get diffAttributePayloads(): diffAttributePayloads {
    return require('../ReactNative/ReactFabricPublicInstance/ReactNativeAttributePayload')
      .diff;
  },
  get createPublicInstance(): createPublicInstance {
    return require('../ReactNative/ReactFabricPublicInstance/ReactFabricPublicInstance')
      .createPublicInstance;
  },
  get createPublicTextInstance(): createPublicTextInstance {
    return require('../ReactNative/ReactFabricPublicInstance/ReactFabricPublicInstance')
      .createPublicTextInstance;
  },
  get getNativeTagFromPublicInstance(): getNativeTagFromPublicInstance {
    return require('../ReactNative/ReactFabricPublicInstance/ReactFabricPublicInstance')
      .getNativeTagFromPublicInstance;
  },
  get getNodeFromPublicInstance(): getNodeFromPublicInstance {
    return require('../ReactNative/ReactFabricPublicInstance/ReactFabricPublicInstance')
      .getNodeFromPublicInstance;
  },
  get getInternalInstanceHandleFromPublicInstance(): getInternalInstanceHandleFromPublicInstance {
    return require('../ReactNative/ReactFabricPublicInstance/ReactFabricPublicInstance')
      .getInternalInstanceHandleFromPublicInstance;
  },
};
