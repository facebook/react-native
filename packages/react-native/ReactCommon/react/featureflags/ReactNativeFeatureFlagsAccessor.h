/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<48b454c264577c4e85eb6b9b46d5d2c5>>
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

#include <react/featureflags/ReactNativeFeatureFlagsProvider.h>
#include <array>
#include <atomic>
#include <memory>
#include <optional>

namespace facebook::react {

class ReactNativeFeatureFlagsAccessor {
 public:
  ReactNativeFeatureFlagsAccessor();

  bool commonTestFlag();
  bool batchRenderingUpdatesInEventLoop();
  bool enableBackgroundExecutor();
  bool enableCleanTextInputYogaNode();
  bool enableCustomDrawOrderFabric();
  bool enableFixForClippedSubviewsCrash();
  bool enableMicrotasks();
  bool enableMountHooksAndroid();
  bool enableSpannableBuildingUnification();
  bool enableSynchronousStateUpdates();
  bool enableUIConsistency();
  bool inspectorEnableCxxInspectorPackagerConnection();
  bool inspectorEnableModernCDPRegistry();
  bool useModernRuntimeScheduler();
  bool useNativeViewConfigsInBridgelessMode();

  void override(std::unique_ptr<ReactNativeFeatureFlagsProvider> provider);

 private:
  void markFlagAsAccessed(int position, const char* flagName);
  void ensureFlagsNotAccessed();

  std::unique_ptr<ReactNativeFeatureFlagsProvider> currentProvider_;
  bool wasOverridden_;

  std::array<std::atomic<const char*>, 15> accessedFeatureFlags_;

  std::atomic<std::optional<bool>> commonTestFlag_;
  std::atomic<std::optional<bool>> batchRenderingUpdatesInEventLoop_;
  std::atomic<std::optional<bool>> enableBackgroundExecutor_;
  std::atomic<std::optional<bool>> enableCleanTextInputYogaNode_;
  std::atomic<std::optional<bool>> enableCustomDrawOrderFabric_;
  std::atomic<std::optional<bool>> enableFixForClippedSubviewsCrash_;
  std::atomic<std::optional<bool>> enableMicrotasks_;
  std::atomic<std::optional<bool>> enableMountHooksAndroid_;
  std::atomic<std::optional<bool>> enableSpannableBuildingUnification_;
  std::atomic<std::optional<bool>> enableSynchronousStateUpdates_;
  std::atomic<std::optional<bool>> enableUIConsistency_;
  std::atomic<std::optional<bool>> inspectorEnableCxxInspectorPackagerConnection_;
  std::atomic<std::optional<bool>> inspectorEnableModernCDPRegistry_;
  std::atomic<std::optional<bool>> useModernRuntimeScheduler_;
  std::atomic<std::optional<bool>> useNativeViewConfigsInBridgelessMode_;
};

} // namespace facebook::react
