/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<fecd2198c65b74c22fa1a6ce96343228>>
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
  +cdpInteractionMetricsEnabled?: () => boolean;
  +cxxNativeAnimatedEnabled?: () => boolean;
  +cxxNativeAnimatedRemoveJsSync?: () => boolean;
  +disableEarlyViewCommandExecution?: () => boolean;
  +disableFabricCommitInCXXAnimated?: () => boolean;
  +disableMountItemReorderingAndroid?: () => boolean;
  +disableOldAndroidAttachmentMetricsWorkarounds?: () => boolean;
  +disableTextLayoutManagerCacheAndroid?: () => boolean;
  +enableAccessibilityOrder?: () => boolean;
  +enableAccumulatedUpdatesInRawPropsAndroid?: () => boolean;
  +enableAndroidLinearText?: () => boolean;
  +enableAndroidTextMeasurementOptimizations?: () => boolean;
  +enableBridgelessArchitecture?: () => boolean;
  +enableCppPropsIteratorSetter?: () => boolean;
  +enableCustomFocusSearchOnClippedElementsAndroid?: () => boolean;
  +enableDestroyShadowTreeRevisionAsync?: () => boolean;
  +enableDoubleMeasurementFixAndroid?: () => boolean;
  +enableEagerMainQueueModulesOnIOS?: () => boolean;
  +enableEagerRootViewAttachment?: () => boolean;
  +enableFabricLogs?: () => boolean;
  +enableFabricRenderer?: () => boolean;
  +enableFontScaleChangesUpdatingLayout?: () => boolean;
  +enableIOSTextBaselineOffsetPerLine?: () => boolean;
  +enableIOSViewClipToPaddingBox?: () => boolean;
  +enableImagePrefetchingAndroid?: () => boolean;
  +enableImagePrefetchingOnUiThreadAndroid?: () => boolean;
  +enableImmediateUpdateModeForContentOffsetChanges?: () => boolean;
  +enableImperativeFocus?: () => boolean;
  +enableInteropViewManagerClassLookUpOptimizationIOS?: () => boolean;
  +enableIntersectionObserverByDefault?: () => boolean;
  +enableKeyEvents?: () => boolean;
  +enableLayoutAnimationsOnAndroid?: () => boolean;
  +enableLayoutAnimationsOnIOS?: () => boolean;
  +enableMainQueueCoordinatorOnIOS?: () => boolean;
  +enableModuleArgumentNSNullConversionIOS?: () => boolean;
  +enableNativeCSSParsing?: () => boolean;
  +enableNetworkEventReporting?: () => boolean;
  +enablePreparedTextLayout?: () => boolean;
  +enablePropsUpdateReconciliationAndroid?: () => boolean;
  +enableResourceTimingAPI?: () => boolean;
  +enableSwiftUIBasedFilters?: () => boolean;
  +enableViewCulling?: () => boolean;
  +enableViewRecycling?: () => boolean;
  +enableViewRecyclingForImage?: () => boolean;
  +enableViewRecyclingForScrollView?: () => boolean;
  +enableViewRecyclingForText?: () => boolean;
  +enableViewRecyclingForView?: () => boolean;
  +enableVirtualViewClippingWithoutScrollViewClipping?: () => boolean;
  +enableVirtualViewContainerStateExperimental?: () => boolean;
  +enableVirtualViewDebugFeatures?: () => boolean;
  +enableVirtualViewRenderState?: () => boolean;
  +enableVirtualViewWindowFocusDetection?: () => boolean;
  +enableWebPerformanceAPIsByDefault?: () => boolean;
  +fixMappingOfEventPrioritiesBetweenFabricAndReact?: () => boolean;
  +fuseboxAssertSingleHostState?: () => boolean;
  +fuseboxEnabledRelease?: () => boolean;
  +fuseboxNetworkInspectionEnabled?: () => boolean;
  +hideOffscreenVirtualViewsOnIOS?: () => boolean;
  +overrideBySynchronousMountPropsAtMountingAndroid?: () => boolean;
  +perfIssuesEnabled?: () => boolean;
  +perfMonitorV2Enabled?: () => boolean;
  +preparedTextCacheSize?: () => number;
  +preventShadowTreeCommitExhaustion?: () => boolean;
  +shouldPressibilityUseW3CPointerEventsForHover?: () => boolean;
  +shouldTriggerResponderTransferOnScrollAndroid?: () => boolean;
  +skipActivityIdentityAssertionOnHostPause?: () => boolean;
  +sweepActiveTouchOnChildNativeGesturesAndroid?: () => boolean;
  +traceTurboModulePromiseRejectionsOnAndroid?: () => boolean;
  +updateRuntimeShadowNodeReferencesOnCommit?: () => boolean;
  +useAlwaysAvailableJSErrorHandling?: () => boolean;
  +useFabricInterop?: () => boolean;
  +useNativeEqualsInNativeReadableArrayAndroid?: () => boolean;
  +useNativeTransformHelperAndroid?: () => boolean;
  +useNativeViewConfigsInBridgelessMode?: () => boolean;
  +useOptimizedEventBatchingOnAndroid?: () => boolean;
  +useRawPropsJsiValue?: () => boolean;
  +useShadowNodeStateOnClone?: () => boolean;
  +useSharedAnimatedBackend?: () => boolean;
  +useTraitHiddenOnAndroid?: () => boolean;
  +useTurboModuleInterop?: () => boolean;
  +useTurboModules?: () => boolean;
  +viewCullingOutsetRatio?: () => number;
  +virtualViewHysteresisRatio?: () => number;
  +virtualViewPrerenderRatio?: () => number;
}

const NativeReactNativeFeatureFlags: ?Spec = TurboModuleRegistry.get<Spec>(
  'NativeReactNativeFeatureFlagsCxx',
);

export default NativeReactNativeFeatureFlags;
