/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<e13caa80ac317feb98cf4db5ac89be79>>
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

  bool allowCollapsableChildren(jsi::Runtime& runtime);

  bool allowRecursiveCommitsWithSynchronousMountOnAndroid(jsi::Runtime& runtime);

  bool batchRenderingUpdatesInEventLoop(jsi::Runtime& runtime);

  bool destroyFabricSurfacesInReactInstanceManager(jsi::Runtime& runtime);

  bool enableBackgroundExecutor(jsi::Runtime& runtime);

  bool enableCleanTextInputYogaNode(jsi::Runtime& runtime);

  bool enableGranularShadowTreeStateReconciliation(jsi::Runtime& runtime);

  bool enableMicrotasks(jsi::Runtime& runtime);

  bool enableSynchronousStateUpdates(jsi::Runtime& runtime);

  bool enableUIConsistency(jsi::Runtime& runtime);

  bool fixStoppedSurfaceRemoveDeleteTreeUIFrameCallbackLeak(jsi::Runtime& runtime);

  bool forceBatchingMountItemsOnAndroid(jsi::Runtime& runtime);

  bool fuseboxEnabledDebug(jsi::Runtime& runtime);

  bool fuseboxEnabledRelease(jsi::Runtime& runtime);

  bool lazyAnimationCallbacks(jsi::Runtime& runtime);

  bool preventDoubleTextMeasure(jsi::Runtime& runtime);

  bool setAndroidLayoutDirection(jsi::Runtime& runtime);

  bool useImmediateExecutorInAndroidBridgeless(jsi::Runtime& runtime);

  bool useModernRuntimeScheduler(jsi::Runtime& runtime);

  bool useNativeViewConfigsInBridgelessMode(jsi::Runtime& runtime);

  bool useRuntimeShadowNodeReferenceUpdate(jsi::Runtime& runtime);

  bool useRuntimeShadowNodeReferenceUpdateOnLayout(jsi::Runtime& runtime);

  bool useStateAlignmentMechanism(jsi::Runtime& runtime);
};

} // namespace facebook::react
