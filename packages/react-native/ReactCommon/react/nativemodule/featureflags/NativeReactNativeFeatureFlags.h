/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<6da9173f6eac23ebe891e12b85e6afc0>>
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

#pragma once

#if __has_include("rncoreJSI.h") // Cmake headers on Android
#include "rncoreJSI.h"
#elif __has_include("FBReactNativeSpecJSI.h") // CocoaPod headers on Apple
#include "FBReactNativeSpecJSI.h"
#else
#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#endif

namespace facebook::react {

class NativeReactNativeFeatureFlags
    : public NativeReactNativeFeatureFlagsCxxSpec<
          NativeReactNativeFeatureFlags> {
 public:
  NativeReactNativeFeatureFlags(std::shared_ptr<CallInvoker> jsInvoker);

  bool commonTestFlag(jsi::Runtime& runtime);

  bool batchRenderingUpdatesInEventLoop(jsi::Runtime& runtime);

  bool completeReactInstanceCreationOnBgThreadOnAndroid(jsi::Runtime& runtime);

  bool destroyFabricSurfacesInReactInstanceManager(jsi::Runtime& runtime);

  bool enableAlignItemsBaselineOnFabricIOS(jsi::Runtime& runtime);

  bool enableAndroidMixBlendModeProp(jsi::Runtime& runtime);

  bool enableBackgroundStyleApplicator(jsi::Runtime& runtime);

  bool enableCleanTextInputYogaNode(jsi::Runtime& runtime);

  bool enableEagerRootViewAttachment(jsi::Runtime& runtime);

  bool enableEventEmitterRetentionDuringGesturesOnAndroid(jsi::Runtime& runtime);

  bool enableFabricLogs(jsi::Runtime& runtime);

  bool enableFabricRendererExclusively(jsi::Runtime& runtime);

  bool enableGranularShadowTreeStateReconciliation(jsi::Runtime& runtime);

  bool enableIOSViewClipToPaddingBox(jsi::Runtime& runtime);

  bool enableLayoutAnimationsOnIOS(jsi::Runtime& runtime);

  bool enableLongTaskAPI(jsi::Runtime& runtime);

  bool enableMicrotasks(jsi::Runtime& runtime);

  bool enablePropsUpdateReconciliationAndroid(jsi::Runtime& runtime);

  bool enableReportEventPaintTime(jsi::Runtime& runtime);

  bool enableSynchronousStateUpdates(jsi::Runtime& runtime);

  bool enableUIConsistency(jsi::Runtime& runtime);

  bool enableViewRecycling(jsi::Runtime& runtime);

  bool excludeYogaFromRawProps(jsi::Runtime& runtime);

  bool fetchImagesInViewPreallocation(jsi::Runtime& runtime);

  bool fixIncorrectScrollViewStateUpdateOnAndroid(jsi::Runtime& runtime);

  bool fixMappingOfEventPrioritiesBetweenFabricAndReact(jsi::Runtime& runtime);

  bool fixMissedFabricStateUpdatesOnAndroid(jsi::Runtime& runtime);

  bool fixMountingCoordinatorReportedPendingTransactionsOnAndroid(jsi::Runtime& runtime);

  bool forceBatchingMountItemsOnAndroid(jsi::Runtime& runtime);

  bool fuseboxEnabledDebug(jsi::Runtime& runtime);

  bool fuseboxEnabledRelease(jsi::Runtime& runtime);

  bool initEagerTurboModulesOnNativeModulesQueueAndroid(jsi::Runtime& runtime);

  bool lazyAnimationCallbacks(jsi::Runtime& runtime);

  bool loadVectorDrawablesOnImages(jsi::Runtime& runtime);

  bool setAndroidLayoutDirection(jsi::Runtime& runtime);

  bool traceTurboModulePromiseRejectionsOnAndroid(jsi::Runtime& runtime);

  bool useFabricInterop(jsi::Runtime& runtime);

  bool useImmediateExecutorInAndroidBridgeless(jsi::Runtime& runtime);

  bool useModernRuntimeScheduler(jsi::Runtime& runtime);

  bool useNativeViewConfigsInBridgelessMode(jsi::Runtime& runtime);

  bool useNewReactImageViewBackgroundDrawing(jsi::Runtime& runtime);

  bool useOptimisedViewPreallocationOnAndroid(jsi::Runtime& runtime);

  bool useOptimizedEventBatchingOnAndroid(jsi::Runtime& runtime);

  bool useRuntimeShadowNodeReferenceUpdate(jsi::Runtime& runtime);

  bool useRuntimeShadowNodeReferenceUpdateOnLayout(jsi::Runtime& runtime);

  bool useStateAlignmentMechanism(jsi::Runtime& runtime);

  bool useTurboModuleInterop(jsi::Runtime& runtime);
};

} // namespace facebook::react
