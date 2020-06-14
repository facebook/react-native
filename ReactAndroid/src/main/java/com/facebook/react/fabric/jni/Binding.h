/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <react/animations/LayoutAnimationDriver.h>
#include <react/jni/JMessageQueueThread.h>
#include <react/jni/JRuntimeExecutor.h>
#include <react/jni/ReadableNativeMap.h>
#include <react/scheduler/Scheduler.h>
#include <react/scheduler/SchedulerDelegate.h>
#include <react/uimanager/LayoutAnimationStatusDelegate.h>
#include <memory>
#include <mutex>
#include "ComponentFactoryDelegate.h"
#include "EventBeatManager.h"

namespace facebook {
namespace react {

class Instance;

class Binding : public jni::HybridClass<Binding>,
                public SchedulerDelegate,
                public LayoutAnimationStatusDelegate {
 public:
  constexpr static const char *const kJavaDescriptor =
      "Lcom/facebook/react/fabric/Binding;";

  constexpr static auto UIManagerJavaDescriptor =
      "com/facebook/react/fabric/FabricUIManager";

  static void registerNatives();

 private:
  jni::global_ref<jobject> getJavaUIManager();
  std::shared_ptr<Scheduler> getScheduler();

  void setConstraints(
      jint surfaceId,
      jfloat minWidth,
      jfloat maxWidth,
      jfloat minHeight,
      jfloat maxHeight,
      jboolean isRTL,
      jboolean doLeftAndRightSwapInRTL);

  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jclass>);

  void installFabricUIManager(
      jlong jsContextNativePointer,
      jni::alias_ref<JRuntimeExecutor::javaobject> runtimeExecutorHolder,
      jni::alias_ref<jobject> javaUIManager,
      EventBeatManager *eventBeatManager,
      jni::alias_ref<JavaMessageQueueThread::javaobject> jsMessageQueueThread,
      ComponentFactoryDelegate *componentsRegistry,
      jni::alias_ref<jobject> reactNativeConfig);

  void startSurface(
      jint surfaceId,
      jni::alias_ref<jstring> moduleName,
      NativeMap *initialProps);

  void startSurfaceWithConstraints(
      jint surfaceId,
      jni::alias_ref<jstring> moduleName,
      NativeMap *initialProps,
      jfloat minWidth,
      jfloat maxWidth,
      jfloat minHeight,
      jfloat maxHeight,
      jboolean isRTL,
      jboolean doLeftAndRightSwapInRTL);

  void renderTemplateToSurface(jint surfaceId, jstring uiTemplate);

  void stopSurface(jint surfaceId);

  void schedulerDidFinishTransaction(
      MountingCoordinator::Shared const &mountingCoordinator) override;

  void schedulerDidRequestPreliminaryViewAllocation(
      const SurfaceId surfaceId,
      const ShadowView &shadowView) override;

  void schedulerDidDispatchCommand(
      const ShadowView &shadowView,
      std::string const &commandName,
      folly::dynamic const args) override;

  void schedulerDidSetJSResponder(
      SurfaceId surfaceId,
      const ShadowView &shadowView,
      const ShadowView &initialShadowView,
      bool blockNativeResponder) override;

  void schedulerDidClearJSResponder() override;

  void setPixelDensity(float pointScaleFactor);

  void driveCxxAnimations();

  void uninstallFabricUIManager();

  // Private member variables
  jni::global_ref<jobject> javaUIManager_;
  std::mutex javaUIManagerMutex_;

  // LayoutAnimations
  virtual void onAnimationStarted() override;
  virtual void onAllAnimationsComplete() override;
  LayoutAnimationDriver *getAnimationDriver();
  std::shared_ptr<LayoutAnimationDriver> animationDriver_;

  std::shared_ptr<Scheduler> scheduler_;
  std::mutex schedulerMutex_;

  std::recursive_mutex commitMutex_;

  float pointScaleFactor_ = 1;

  std::shared_ptr<const ReactNativeConfig> reactNativeConfig_{nullptr};
  bool shouldCollateRemovesAndDeletes_{false};
  bool collapseDeleteCreateMountingInstructions_{false};
  bool disablePreallocateViews_{false};
  bool disableVirtualNodePreallocation_{false};
  bool enableFabricLogs_{false};
};

} // namespace react
} // namespace facebook
