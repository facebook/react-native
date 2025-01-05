/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <mutex>
#include <shared_mutex>
#include <unordered_map>

#include <fbjni/fbjni.h>
#include <react/jni/JRuntimeExecutor.h>
#include <react/jni/JRuntimeScheduler.h>
#include <react/jni/ReadableNativeMap.h>
#include <react/renderer/scheduler/SchedulerDelegate.h>
#include <react/renderer/scheduler/SurfaceHandler.h>
#include <react/renderer/uimanager/LayoutAnimationStatusDelegate.h>
#include <react/renderer/uimanager/primitives.h>

#include "EventEmitterWrapper.h"
#include "JFabricUIManager.h"
#include "SurfaceHandlerBinding.h"

namespace facebook::react {

class ComponentFactory;
class EventBeatManager;
class FabricMountingManager;
class Instance;
class LayoutAnimationDriver;
class Scheduler;

class FabricUIManagerBinding : public jni::HybridClass<FabricUIManagerBinding>,
                               public SchedulerDelegate,
                               public LayoutAnimationStatusDelegate {
 public:
  constexpr static const char* const kJavaDescriptor =
      "Lcom/facebook/react/fabric/FabricUIManagerBinding;";

  static void registerNatives();

  std::shared_ptr<Scheduler> getScheduler();

 private:
  void setConstraints(
      jint surfaceId,
      jfloat minWidth,
      jfloat maxWidth,
      jfloat minHeight,
      jfloat maxHeight,
      jfloat offsetX,
      jfloat offsetY,
      jboolean isRTL,
      jboolean doLeftAndRightSwapInRTL);

  jni::local_ref<ReadableNativeMap::jhybridobject> getInspectorDataForInstance(
      jni::alias_ref<EventEmitterWrapper::javaobject> eventEmitterWrapper);

  static void initHybrid(jni::alias_ref<jhybridobject> jobj);

  void installFabricUIManager(
      jni::alias_ref<JRuntimeExecutor::javaobject> runtimeExecutorHolder,
      jni::alias_ref<JRuntimeScheduler::javaobject> runtimeSchedulerHolder,
      jni::alias_ref<JFabricUIManager::javaobject> javaUIManager,
      EventBeatManager* eventBeatManager,
      ComponentFactory* componentsRegistry);

  void startSurface(
      jint surfaceId,
      jni::alias_ref<jstring> moduleName,
      NativeMap* initialProps);

  void startSurfaceWithConstraints(
      jint surfaceId,
      jni::alias_ref<jstring> moduleName,
      NativeMap* initialProps,
      jfloat minWidth,
      jfloat maxWidth,
      jfloat minHeight,
      jfloat maxHeight,
      jfloat offsetX,
      jfloat offsetY,
      jboolean isRTL,
      jboolean doLeftAndRightSwapInRTL);

  void stopSurface(jint surfaceId);

  void startSurfaceWithSurfaceHandler(
      jint surfaceId,
      jni::alias_ref<SurfaceHandlerBinding::jhybridobject>
          surfaceHandlerBinding,
      jboolean isMountable);

  void stopSurfaceWithSurfaceHandler(
      jni::alias_ref<SurfaceHandlerBinding::jhybridobject> surfaceHandler);

  void schedulerDidFinishTransaction(
      const std::shared_ptr<const MountingCoordinator>& mountingCoordinator)
      override;

  void schedulerShouldRenderTransactions(
      const std::shared_ptr<const MountingCoordinator>& mountingCoordinator)
      override;

  void schedulerDidRequestPreliminaryViewAllocation(
      const ShadowNode& shadowNode) override;

  void schedulerDidDispatchCommand(
      const ShadowView& shadowView,
      const std::string& commandName,
      const folly::dynamic& args) override;

  void schedulerDidSendAccessibilityEvent(
      const ShadowView& shadowView,
      const std::string& eventType) override;

  void schedulerDidSetIsJSResponder(
      const ShadowView& shadowView,
      bool isJSResponder,
      bool blockNativeResponder) override;

  void setPixelDensity(float pointScaleFactor);

  void driveCxxAnimations();

  void drainPreallocateViewsQueue();

  void reportMount(SurfaceId surfaceId);

  void uninstallFabricUIManager();

  // Private member variables
  std::shared_mutex installMutex_;
  std::shared_ptr<FabricMountingManager> mountingManager_;
  std::shared_ptr<Scheduler> scheduler_;

  std::shared_ptr<FabricMountingManager> getMountingManager(
      const char* locationHint);

  // LayoutAnimations
  void onAnimationStarted() override;
  void onAllAnimationsComplete() override;

  std::shared_ptr<LayoutAnimationDriver> animationDriver_;

  // Roots not created through ReactSurface (non-bridgeless) will store their
  // SurfaceHandler here, for other roots we keep a weak reference to the Java
  // owner
  std::unordered_map<
      SurfaceId,
      std::variant<
          SurfaceHandler,
          jni::weak_ref<SurfaceHandlerBinding::jhybridobject>>>
      surfaceHandlerRegistry_{};
  std::shared_mutex
      surfaceHandlerRegistryMutex_; // Protects `surfaceHandlerRegistry_`.

  // Track pending transactions, one per surfaceId
  std::mutex pendingTransactionsMutex_;
  std::vector<MountingTransaction> pendingTransactions_;

  float pointScaleFactor_ = 1;

  bool enableFabricLogs_{false};
};

} // namespace facebook::react
