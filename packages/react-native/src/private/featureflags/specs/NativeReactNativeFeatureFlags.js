/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<caa58549cc5d5f8b5f690240af39c1d2>>
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
  +disableMountItemReorderingAndroid?: () => boolean;
  +enableAccumulatedUpdatesInRawPropsAndroid?: () => boolean;
  +enableBridgelessArchitecture?: () => boolean;
  +enableCppPropsIteratorSetter?: () => boolean;
  +enableEagerRootViewAttachment?: () => boolean;
  +enableEventEmitterRetentionDuringGesturesOnAndroid?: () => boolean;
  +enableFabricLogs?: () => boolean;
  +enableFabricRenderer?: () => boolean;
  +enableFixForViewCommandRace?: () => boolean;
  +enableIOSViewClipToPaddingBox?: () => boolean;
  +enableImagePrefetchingAndroid?: () => boolean;
  +enableJSRuntimeGCOnMemoryPressureOnIOS?: () => boolean;
  +enableLayoutAnimationsOnAndroid?: () => boolean;
  +enableLayoutAnimationsOnIOS?: () => boolean;
  +enableLongTaskAPI?: () => boolean;
  +enableNewBackgroundAndBorderDrawables?: () => boolean;
  +enablePreciseSchedulingForPremountItemsOnAndroid?: () => boolean;
  +enablePropsUpdateReconciliationAndroid?: () => boolean;
  +enableReportEventPaintTime?: () => boolean;
  +enableSynchronousStateUpdates?: () => boolean;
  +enableUIConsistency?: () => boolean;
  +enableViewCulling?: () => boolean;
  +enableViewRecycling?: () => boolean;
  +enableViewRecyclingForText?: () => boolean;
  +enableViewRecyclingForView?: () => boolean;
  +excludeYogaFromRawProps?: () => boolean;
  +fixDifferentiatorEmittingUpdatesWithWrongParentTag?: () => boolean;
  +fixMappingOfEventPrioritiesBetweenFabricAndReact?: () => boolean;
  +fixMountingCoordinatorReportedPendingTransactionsOnAndroid?: () => boolean;
  +fuseboxEnabledRelease?: () => boolean;
  +fuseboxNetworkInspectionEnabled?: () => boolean;
  +lazyAnimationCallbacks?: () => boolean;
  +traceTurboModulePromiseRejectionsOnAndroid?: () => boolean;
  +useAlwaysAvailableJSErrorHandling?: () => boolean;
  +useEditTextStockAndroidFocusBehavior?: () => boolean;
  +useFabricInterop?: () => boolean;
  +useNativeViewConfigsInBridgelessMode?: () => boolean;
  +useOptimizedEventBatchingOnAndroid?: () => boolean;
  +useRawPropsJsiValue?: () => boolean;
  +useTurboModuleInterop?: () => boolean;
  +useTurboModules?: () => boolean;
}

const NativeReactNativeFeatureFlags: ?Spec = TurboModuleRegistry.get<Spec>(
  'NativeReactNativeFeatureFlagsCxx',
);

export default NativeReactNativeFeatureFlags;
