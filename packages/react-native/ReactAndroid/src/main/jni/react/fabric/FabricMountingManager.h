/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <mutex>
#include <unordered_map>
#include <unordered_set>

#include <fbjni/fbjni.h>
#include <react/fabric/JFabricUIManager.h>
#include <react/renderer/uimanager/primitives.h>

namespace facebook::react {

class MountingTransaction;
class ReactNativeConfig;
struct ShadowView;

class FabricMountingManager final {
 public:
  FabricMountingManager(
      std::shared_ptr<const ReactNativeConfig>& config,
      jni::global_ref<JFabricUIManager::javaobject>& javaUIManager);
  FabricMountingManager(const FabricMountingManager&) = delete;

  void onSurfaceStart(SurfaceId surfaceId);

  void onSurfaceStop(SurfaceId surfaceId);

  void preallocateShadowView(SurfaceId surfaceId, const ShadowView& shadowView);

  void executeMount(const MountingTransaction& transaction);

  void dispatchCommand(
      const ShadowView& shadowView,
      const std::string& commandName,
      const folly::dynamic& args);

  void sendAccessibilityEvent(
      const ShadowView& shadowView,
      const std::string& eventType);

  void setIsJSResponder(
      const ShadowView& shadowView,
      bool isJSResponder,
      bool blockNativeResponder);

  void onAnimationStarted();

  void onAllAnimationsComplete();

 private:
  jni::global_ref<JFabricUIManager::javaobject> javaUIManager_;

  std::recursive_mutex commitMutex_;

  std::unordered_map<SurfaceId, std::unordered_set<Tag>>
      allocatedViewRegistry_{};
  std::recursive_mutex allocatedViewsMutex_;

  const bool reduceDeleteCreateMutation_{false};

  jni::local_ref<jobject> getProps(
      const ShadowView& oldShadowView,
      const ShadowView& newShadowView);
};

} // namespace facebook::react
