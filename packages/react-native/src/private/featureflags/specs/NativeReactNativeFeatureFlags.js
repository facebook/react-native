/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<55c1f0223345b5680bbdd888a358f210>>
 * @flow strict
 * @noformat
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
  +cxxNativeAnimatedRemoveJsSync?: () => boolean;
  +disableMainQueueSyncDispatchIOS?: () => boolean;
  +disableMountItemReorderingAndroid?: () => boolean;
  +disableTextLayoutManagerCacheAndroid?: () => boolean;
  +enableAccessibilityOrder?: () => boolean;
  +enableAccumulatedUpdatesInRawPropsAndroid?: () => boolean;
  +enableAndroidTextMeasurementOptimizations?: () => boolean;
  +enableBridgelessArchitecture?: () => boolean;
  +enableCppPropsIteratorSetter?: () => boolean;
  +enableCustomFocusSearchOnClippedElementsAndroid?: () => boolean;
  +enableDestroyShadowTreeRevisionAsync?: () => boolean;
  +enableDoubleMeasurementFixAndroid?: () => boolean;
  +enableEagerRootViewAttachment?: () => boolean;
  +enableFabricLogs?: () => boolean;
  +enableFabricRenderer?: () => boolean;
  +enableFixForParentTagDuringReparenting?: () => boolean;
  +enableFontScaleChangesUpdatingLayout?: () => boolean;
  +enableIOSTextBaselineOffsetPerLine?: () => boolean;
  +enableIOSViewClipToPaddingBox?: () => boolean;
  +enableInteropViewManagerClassLookUpOptimizationIOS?: () => boolean;
  +enableLayoutAnimationsOnAndroid?: () => boolean;
  +enableLayoutAnimationsOnIOS?: () => boolean;
  +enableMainQueueCoordinatorOnIOS?: () => boolean;
  +enableMainQueueModulesOnIOS?: () => boolean;
  +enableModuleArgumentNSNullConversionIOS?: () => boolean;
  +enableNativeCSSParsing?: () => boolean;
  +enableNetworkEventReporting?: () => boolean;
  +enableNewBackgroundAndBorderDrawables?: () => boolean;
  +enablePreparedTextLayout?: () => boolean;
  +enablePropsUpdateReconciliationAndroid?: () => boolean;
  +enableResourceTimingAPI?: () => boolean;
  +enableSynchronousStateUpdates?: () => boolean;
  +enableViewCulling?: () => boolean;
  +enableViewRecycling?: () => boolean;
  +enableViewRecyclingForText?: () => boolean;
  +enableViewRecyclingForView?: () => boolean;
  +enableVirtualViewDebugFeatures?: () => boolean;
  +enableVirtualViewRenderState?: () => boolean;
  +enableVirtualViewWindowFocusDetection?: () => boolean;
  +fixMappingOfEventPrioritiesBetweenFabricAndReact?: () => boolean;
  +fuseboxEnabledRelease?: () => boolean;
  +fuseboxNetworkInspectionEnabled?: () => boolean;
  +hideOffscreenVirtualViewsOnIOS?: () => boolean;
  +preparedTextCacheSize?: () => number;
  +traceTurboModulePromiseRejectionsOnAndroid?: () => boolean;
  +updateRuntimeShadowNodeReferencesOnCommit?: () => boolean;
  +useAlwaysAvailableJSErrorHandling?: () => boolean;
  +useFabricInterop?: () => boolean;
  +useNativeViewConfigsInBridgelessMode?: () => boolean;
  +useOptimizedEventBatchingOnAndroid?: () => boolean;
  +useRawPropsJsiValue?: () => boolean;
  +useShadowNodeStateOnClone?: () => boolean;
  +useTurboModuleInterop?: () => boolean;
  +useTurboModules?: () => boolean;
  +virtualViewPrerenderRatio?: () => number;
}

const NativeReactNativeFeatureFlags: ?Spec = TurboModuleRegistry.get<Spec>(
  'NativeReactNativeFeatureFlagsCxx',
);

export default NativeReactNativeFeatureFlags;
