/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <mutex>

#include <butter/set.h>
#include <fbjni/fbjni.h>
#include <react/fabric/JFabricUIManager.h>
#include <react/renderer/mounting/MountingCoordinator.h>
#include <react/renderer/uimanager/primitives.h>

namespace facebook {
namespace react {

class ReactNativeConfig;
struct ShadowView;

class FabricMountingManager final {
 public:
  FabricMountingManager(
      std::shared_ptr<const ReactNativeConfig> &config,
      jni::global_ref<JFabricUIManager::javaobject> &javaUIManager);

  void onSurfaceStart(SurfaceId surfaceId);

  void onSurfaceStop(SurfaceId surfaceId);

  void preallocateShadowView(SurfaceId surfaceId, ShadowView const &shadowView);

  void executeMount(const MountingCoordinator::Shared &mountingCoordinator);

  void dispatchCommand(
      ShadowView const &shadowView,
      std::string const &commandName,
      folly::dynamic const &args);

  void sendAccessibilityEvent(
      const ShadowView &shadowView,
      std::string const &eventType);

  void setIsJSResponder(
      ShadowView const &shadowView,
      bool isJSResponder,
      bool blockNativeResponder);

  void onAnimationStarted();

  void onAllAnimationsComplete();

 private:
  jni::global_ref<JFabricUIManager::javaobject> javaUIManager_;

  std::recursive_mutex commitMutex_;

  butter::map<SurfaceId, butter::set<Tag>> allocatedViewRegistry_{};
  std::recursive_mutex allocatedViewsMutex_;

  bool const reduceDeleteCreateMutation_{false};

  jni::local_ref<jobject> getProps(
      ShadowView const &oldShadowView,
      ShadowView const &newShadowView);
};

} // namespace react
} // namespace facebook
