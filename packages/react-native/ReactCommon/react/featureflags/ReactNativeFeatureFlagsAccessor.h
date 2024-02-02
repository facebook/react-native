/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<1514c04fb9d175308e106b84a14bc89d>>
 */

/**
 * IMPORTANT: Do NOT modify this file directly.
 *
 * To change the definition of the flags, edit
 *   packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.json.
 *
 * To regenerate this code, run the following script from the repo root:
 *   yarn featureflags-update
 */

#pragma once

#include <react/featureflags/ReactNativeFeatureFlagsProvider.h>
#include <memory>
#include <optional>
#include <vector>

namespace facebook::react {

class ReactNativeFeatureFlagsAccessor {
 public:
  ReactNativeFeatureFlagsAccessor();

  bool commonTestFlag();
  bool useModernRuntimeScheduler();
  bool enableMicrotasks();
  bool batchRenderingUpdatesInEventLoop();
  bool enableSpannableBuildingUnification();
  bool enableCustomDrawOrderFabric();
  bool enableFixForClippedSubviewsCrash();

  void override(std::unique_ptr<ReactNativeFeatureFlagsProvider> provider);

 private:
  std::unique_ptr<ReactNativeFeatureFlagsProvider> currentProvider_;
  std::vector<const char*> accessedFeatureFlags_;

  std::optional<bool> commonTestFlag_;
  std::optional<bool> useModernRuntimeScheduler_;
  std::optional<bool> enableMicrotasks_;
  std::optional<bool> batchRenderingUpdatesInEventLoop_;
  std::optional<bool> enableSpannableBuildingUnification_;
  std::optional<bool> enableCustomDrawOrderFabric_;
  std::optional<bool> enableFixForClippedSubviewsCrash_;
};

} // namespace facebook::react
