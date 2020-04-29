<<<<<<< HEAD
// Copyright 2004-present Facebook. All Rights Reserved.
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <fb/fbjni.h>
=======
/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
>>>>>>> fb/0.62-stable
#include <react/jni/JMessageQueueThread.h>
#include <react/jni/ReadableNativeMap.h>
#include <react/uimanager/Scheduler.h>
#include <react/uimanager/SchedulerDelegate.h>
#include <memory>
#include <mutex>
#include "ComponentFactoryDelegate.h"
#include "EventBeatManager.h"

namespace facebook {
namespace react {

class Instance;

class Binding : public jni::HybridClass<Binding>, public SchedulerDelegate {
 public:
  constexpr static const char *const kJavaDescriptor =
      "Lcom/facebook/react/fabric/Binding;";

  static void registerNatives();

<<<<<<< HEAD
  jni::global_ref<jobject> javaUIManager_;
  std::mutex javaUIManagerMutex_;

  std::shared_ptr<Scheduler> scheduler_;
  std::mutex schedulerMutex_;

  std::recursive_mutex commitMutex_;

  float pointScaleFactor_ = 1;

=======
>>>>>>> fb/0.62-stable
 private:
  jni::global_ref<jobject> getJavaUIManager();
  std::shared_ptr<Scheduler> getScheduler();

  void setConstraints(
      jint surfaceId,
      jfloat minWidth,
      jfloat maxWidth,
      jfloat minHeight,
      jfloat maxHeight);

  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jclass>);

  void installFabricUIManager(
      jlong jsContextNativePointer,
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
      jfloat maxHeight);

  void renderTemplateToSurface(jint surfaceId, jstring uiTemplate);

  void stopSurface(jint surfaceId);

  void schedulerDidFinishTransaction(
      MountingCoordinator::Shared const &mountingCoordinator);

  void schedulerDidRequestPreliminaryViewAllocation(
      const SurfaceId surfaceId,
      const ShadowView &shadowView);

  void schedulerDidDispatchCommand(
<<<<<<< HEAD
    const ShadowView &shadowView,
    std::string const &commandName,
    folly::dynamic const args);
=======
      const ShadowView &shadowView,
      std::string const &commandName,
      folly::dynamic const args);
>>>>>>> fb/0.62-stable

  void setPixelDensity(float pointScaleFactor);

  void schedulerDidSetJSResponder(
<<<<<<< HEAD
     SurfaceId surfaceId,
     const ShadowView &shadowView,
     const ShadowView &initialShadowView,
     bool blockNativeResponder);
=======
      SurfaceId surfaceId,
      const ShadowView &shadowView,
      const ShadowView &initialShadowView,
      bool blockNativeResponder);
>>>>>>> fb/0.62-stable

  void schedulerDidClearJSResponder();

  void uninstallFabricUIManager();
<<<<<<< HEAD
=======

  // Private member variables
  jni::global_ref<jobject> javaUIManager_;
  std::mutex javaUIManagerMutex_;

  std::shared_ptr<Scheduler> scheduler_;
  std::mutex schedulerMutex_;

  std::recursive_mutex commitMutex_;

  float pointScaleFactor_ = 1;

  std::shared_ptr<const ReactNativeConfig> reactNativeConfig_{nullptr};
  bool shouldCollateRemovesAndDeletes_{false};
  bool collapseDeleteCreateMountingInstructions_{false};
  bool disablePreallocateViews_{false};
>>>>>>> fb/0.62-stable
};

} // namespace react
} // namespace facebook
