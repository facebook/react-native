/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<aa2a12756ea3c1bd2be05dab06b296d7>>
 * @flow strict
 */

/**
 * IMPORTANT: Do NOT modify this file directly.
 *
 * To change the definition of the flags, edit
 *   packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.config.js.
 *
 * To regenerate this code, run the following script from the repo root:
 *   yarn featureflags-update
 */

import type {TurboModule} from '../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  +commonTestFlag?: () => boolean;
  +allowRecursiveCommitsWithSynchronousMountOnAndroid?: () => boolean;
  +batchRenderingUpdatesInEventLoop?: () => boolean;
  +completeReactInstanceCreationOnBgThreadOnAndroid?: () => boolean;
  +enableAlignItemsBaselineOnFabricIOS?: () => boolean;
  +enableAndroidLineHeightCentering?: () => boolean;
  +enableBridgelessArchitecture?: () => boolean;
  +enableCleanTextInputYogaNode?: () => boolean;
  +enableDeletionOfUnmountedViews?: () => boolean;
  +enableEagerRootViewAttachment?: () => boolean;
  +enableEventEmitterRetentionDuringGesturesOnAndroid?: () => boolean;
  +enableFabricLogs?: () => boolean;
  +enableFabricRenderer?: () => boolean;
  +enableFabricRendererExclusively?: () => boolean;
  +enableGranularShadowTreeStateReconciliation?: () => boolean;
  +enableIOSViewClipToPaddingBox?: () => boolean;
  +enableLayoutAnimationsOnIOS?: () => boolean;
  +enableLongTaskAPI?: () => boolean;
  +enableMicrotasks?: () => boolean;
  +enablePreciseSchedulingForPremountItemsOnAndroid?: () => boolean;
  +enablePropsUpdateReconciliationAndroid?: () => boolean;
  +enableReportEventPaintTime?: () => boolean;
  +enableSynchronousStateUpdates?: () => boolean;
  +enableTextPreallocationOptimisation?: () => boolean;
  +enableUIConsistency?: () => boolean;
  +enableViewRecycling?: () => boolean;
  +excludeYogaFromRawProps?: () => boolean;
  +fetchImagesInViewPreallocation?: () => boolean;
  +fixMappingOfEventPrioritiesBetweenFabricAndReact?: () => boolean;
  +fixMountingCoordinatorReportedPendingTransactionsOnAndroid?: () => boolean;
  +forceBatchingMountItemsOnAndroid?: () => boolean;
  +fuseboxEnabledDebug?: () => boolean;
  +fuseboxEnabledRelease?: () => boolean;
  +initEagerTurboModulesOnNativeModulesQueueAndroid?: () => boolean;
  +lazyAnimationCallbacks?: () => boolean;
  +loadVectorDrawablesOnImages?: () => boolean;
  +removeNestedCallsToDispatchMountItemsOnAndroid?: () => boolean;
  +setAndroidLayoutDirection?: () => boolean;
  +traceTurboModulePromiseRejectionsOnAndroid?: () => boolean;
  +useFabricInterop?: () => boolean;
  +useImmediateExecutorInAndroidBridgeless?: () => boolean;
  +useModernRuntimeScheduler?: () => boolean;
  +useNativeViewConfigsInBridgelessMode?: () => boolean;
  +useOptimisedViewPreallocationOnAndroid?: () => boolean;
  +useOptimizedEventBatchingOnAndroid?: () => boolean;
  +useRuntimeShadowNodeReferenceUpdate?: () => boolean;
  +useRuntimeShadowNodeReferenceUpdateOnLayout?: () => boolean;
  +useTurboModuleInterop?: () => boolean;
  +useTurboModules?: () => boolean;
}

const NativeReactNativeFeatureFlags: ?Spec = TurboModuleRegistry.get<Spec>(
  'NativeReactNativeFeatureFlagsCxx',
);

export default NativeReactNativeFeatureFlags;
