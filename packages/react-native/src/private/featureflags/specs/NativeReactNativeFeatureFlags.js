/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<039fde6acab2250f771634a7c350bbb7>>
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
  +destroyFabricSurfacesInReactInstanceManager?: () => boolean;
  +enableAlignItemsBaselineOnFabricIOS?: () => boolean;
  +enableAndroidLineHeightCentering?: () => boolean;
  +enableAndroidMixBlendModeProp?: () => boolean;
  +enableBackgroundStyleApplicator?: () => boolean;
  +enableCleanTextInputYogaNode?: () => boolean;
  +enableDeletionOfUnmountedViews?: () => boolean;
  +enableEagerRootViewAttachment?: () => boolean;
  +enableEventEmitterRetentionDuringGesturesOnAndroid?: () => boolean;
  +enableFabricLogs?: () => boolean;
  +enableFabricRendererExclusively?: () => boolean;
  +enableGranularShadowTreeStateReconciliation?: () => boolean;
  +enableIOSViewClipToPaddingBox?: () => boolean;
  +enableLayoutAnimationsOnIOS?: () => boolean;
  +enableLongTaskAPI?: () => boolean;
  +enableMicrotasks?: () => boolean;
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
  +useNewReactImageViewBackgroundDrawing?: () => boolean;
  +useOptimisedViewPreallocationOnAndroid?: () => boolean;
  +useOptimizedEventBatchingOnAndroid?: () => boolean;
  +useRuntimeShadowNodeReferenceUpdate?: () => boolean;
  +useRuntimeShadowNodeReferenceUpdateOnLayout?: () => boolean;
  +useStateAlignmentMechanism?: () => boolean;
  +useTurboModuleInterop?: () => boolean;
}

const NativeReactNativeFeatureFlags: ?Spec = TurboModuleRegistry.get<Spec>(
  'NativeReactNativeFeatureFlagsCxx',
);

export default NativeReactNativeFeatureFlags;
