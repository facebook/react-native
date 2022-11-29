/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "CppComponentRegistry.h"
#include "FabricMountItem.h"

#include <react/config/ReactNativeConfig.h>
#include <react/renderer/animations/LayoutAnimationDriver.h>
#include <react/renderer/mounting/MountingCoordinator.h>
#include <react/renderer/mounting/ShadowView.h>
#include <react/renderer/uimanager/LayoutAnimationStatusDelegate.h>
#include <react/utils/ContextContainer.h>

#include <fbjni/fbjni.h>

#include <mutex>

namespace facebook {
namespace react {

class FabricMountingManager final {
 public:
  constexpr static auto UIManagerJavaDescriptor =
      "com/facebook/react/fabric/FabricUIManager";

  constexpr static auto ReactFeatureFlagsJavaDescriptor =
      "com/facebook/react/config/ReactFeatureFlags";

  FabricMountingManager(
      std::shared_ptr<const ReactNativeConfig> &config,
      std::shared_ptr<const CppComponentRegistry> &cppComponentRegistry,
      jni::global_ref<jobject> &javaUIManager);

  void onSurfaceStart(SurfaceId surfaceId);

  void onSurfaceStop(SurfaceId surfaceId);

  void preallocateShadowView(SurfaceId surfaceId, ShadowView const &shadowView);

  void executeMount(MountingCoordinator::Shared const &mountingCoordinator);

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
  jni::global_ref<jobject> javaUIManager_;

  std::recursive_mutex commitMutex_;

  butter::map<SurfaceId, butter::set<Tag>> allocatedViewRegistry_{};
  std::recursive_mutex allocatedViewsMutex_;
  std::shared_ptr<const CppComponentRegistry> cppComponentRegistry_;

  bool const useOverflowInset_{false};

  jni::local_ref<jobject> getProps(
      ShadowView const &oldShadowView,
      ShadowView const &newShadowView);
};

} // namespace react
} // namespace facebook
