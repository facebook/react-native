/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<3a195160a461f2a83201aeb1f9100513>>
 * @flow strict
 */

/**
 * IMPORTANT: Do NOT modify this file directly.
 *
 * To change the definition of the flags, edit
 *   packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.config.js.
 *
 * To regenerate this code, run the following script from the repo root:
 *   yarn featureflags --update
 */

import type {TurboModule} from '../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  +commonTestFlag?: () => boolean;
  +commonTestFlagWithoutNativeImplementation?: () => boolean;
  +animatedShouldSignalBatch?: () => boolean;
  +cxxNativeAnimatedEnabled?: () => boolean;
  +disableMainQueueSyncDispatchIOS?: () => boolean;
  +disableMountItemReorderingAndroid?: () => boolean;
  +enableAccessibilityOrder?: () => boolean;
  +enableAccumulatedUpdatesInRawPropsAndroid?: () => boolean;
  +enableBridgelessArchitecture?: () => boolean;
  +enableCppPropsIteratorSetter?: () => boolean;
  +enableCustomFocusSearchOnClippedElementsAndroid?: () => boolean;
  +enableDoubleMeasurementFixAndroid?: () => boolean;
  +enableEagerRootViewAttachment?: () => boolean;
  +enableFabricLogs?: () => boolean;
  +enableFabricRenderer?: () => boolean;
  +enableFixForParentTagDuringReparenting?: () => boolean;
  +enableFontScaleChangesUpdatingLayout?: () => boolean;
  +enableIOSViewClipToPaddingBox?: () => boolean;
  +enableJSRuntimeGCOnMemoryPressureOnIOS?: () => boolean;
  +enableLayoutAnimationsOnAndroid?: () => boolean;
  +enableLayoutAnimationsOnIOS?: () => boolean;
  +enableMainQueueModulesOnIOS?: () => boolean;
  +enableNativeCSSParsing?: () => boolean;
  +enableNetworkEventReporting?: () => boolean;
  +enableNewBackgroundAndBorderDrawables?: () => boolean;
  +enablePropsUpdateReconciliationAndroid?: () => boolean;
  +enableResourceTimingAPI?: () => boolean;
  +enableSynchronousStateUpdates?: () => boolean;
  +enableViewCulling?: () => boolean;
  +enableViewRecycling?: () => boolean;
  +enableViewRecyclingForText?: () => boolean;
  +enableViewRecyclingForView?: () => boolean;
  +fixMappingOfEventPrioritiesBetweenFabricAndReact?: () => boolean;
  +fuseboxEnabledRelease?: () => boolean;
  +fuseboxNetworkInspectionEnabled?: () => boolean;
  +traceTurboModulePromiseRejectionsOnAndroid?: () => boolean;
  +updateRuntimeShadowNodeReferencesOnCommit?: () => boolean;
  +useAlwaysAvailableJSErrorHandling?: () => boolean;
  +useEditTextStockAndroidFocusBehavior?: () => boolean;
  +useFabricInterop?: () => boolean;
  +useNativeViewConfigsInBridgelessMode?: () => boolean;
  +useOptimizedEventBatchingOnAndroid?: () => boolean;
  +useRawPropsJsiValue?: () => boolean;
  +useShadowNodeStateOnClone?: () => boolean;
  +useTurboModuleInterop?: () => boolean;
  +useTurboModules?: () => boolean;
}

const NativeReactNativeFeatureFlags: ?Spec = TurboModuleRegistry.get<Spec>(
  'NativeReactNativeFeatureFlagsCxx',
);

export default NativeReactNativeFeatureFlags;
