/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <react/jni/JRuntimeExecutor.h>
#include <react/jni/JRuntimeScheduler.h>
#include <react/jni/ReadableNativeMap.h>
#include <react/renderer/animations/LayoutAnimationDriver.h>
#include <react/renderer/scheduler/Scheduler.h>
#include <react/renderer/scheduler/SchedulerDelegate.h>
#include <react/renderer/uimanager/LayoutAnimationStatusDelegate.h>

#include <memory>
#include <mutex>
#include "ComponentFactory.h"
#include "EventBeatManager.h"
#include "EventEmitterWrapper.h"
#include "JBackgroundExecutor.h"
#include "SurfaceHandlerBinding.h"

namespace facebook {
namespace react {

class Instance;

struct CppMountItem final {
#pragma mark - Designated Initializers
  static CppMountItem CreateMountItem(ShadowView shadowView);
  static CppMountItem DeleteMountItem(ShadowView shadowView);
  static CppMountItem
  InsertMountItem(ShadowView parentView, ShadowView shadowView, int index);
  static CppMountItem
  RemoveMountItem(ShadowView parentView, ShadowView shadowView, int index);
  static CppMountItem UpdatePropsMountItem(ShadowView shadowView);
  static CppMountItem UpdateStateMountItem(ShadowView shadowView);
  static CppMountItem UpdateLayoutMountItem(ShadowView shadowView);
  static CppMountItem UpdateEventEmitterMountItem(ShadowView shadowView);
  static CppMountItem UpdatePaddingMountItem(ShadowView shadowView);

#pragma mark - Type

  enum Type {
    Undefined = -1,
    Multiple = 1,
    Create = 2,
    Delete = 4,
    Insert = 8,
    Remove = 16,
    UpdateProps = 32,
    UpdateState = 64,
    UpdateLayout = 128,
    UpdateEventEmitter = 256,
    UpdatePadding = 512
  };

#pragma mark - Fields

  Type type = {Create};
  ShadowView parentShadowView = {};
  ShadowView oldChildShadowView = {};
  ShadowView newChildShadowView = {};
  int index = {};
};

class Binding : public jni::HybridClass<Binding>,
                public SchedulerDelegate,
                public LayoutAnimationStatusDelegate {
 public:
  constexpr static const char *const kJavaDescriptor =
      "Lcom/facebook/react/fabric/Binding;";

  constexpr static auto UIManagerJavaDescriptor =
      "com/facebook/react/fabric/FabricUIManager";

  constexpr static auto ReactFeatureFlagsJavaDescriptor =
      "com/facebook/react/config/ReactFeatureFlags";

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
      jfloat offsetX,
      jfloat offsetY,
      jboolean isRTL,
      jboolean doLeftAndRightSwapInRTL);

  jni::local_ref<ReadableNativeMap::jhybridobject> getInspectorDataForInstance(
      jni::alias_ref<EventEmitterWrapper::javaobject> eventEmitterWrapper);

  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jclass>);

  void installFabricUIManager(
      jni::alias_ref<JRuntimeExecutor::javaobject> runtimeExecutorHolder,
      jni::alias_ref<JRuntimeScheduler::javaobject> runtimeSchedulerHolder,
      jni::alias_ref<jobject> javaUIManager,
      EventBeatManager *eventBeatManager,
      ComponentFactory *componentsRegistry,
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
      jfloat offsetX,
      jfloat offsetY,
      jboolean isRTL,
      jboolean doLeftAndRightSwapInRTL);

  void renderTemplateToSurface(jint surfaceId, jstring uiTemplate);

  void stopSurface(jint surfaceId);

  void registerSurface(SurfaceHandlerBinding *surfaceHandler);

  void unregisterSurface(SurfaceHandlerBinding *surfaceHandler);

  void schedulerDidFinishTransaction(
      MountingCoordinator::Shared const &mountingCoordinator) override;

  void preallocateShadowView(
      const SurfaceId surfaceId,
      const ShadowView &shadowView);

  void schedulerDidRequestPreliminaryViewAllocation(
      const SurfaceId surfaceId,
      const ShadowNode &shadowNode) override;

  void schedulerDidCloneShadowNode(
      SurfaceId surfaceId,
      const ShadowNode &oldShadowNode,
      const ShadowNode &newShadowNode) override;

  void schedulerDidDispatchCommand(
      const ShadowView &shadowView,
      std::string const &commandName,
      folly::dynamic const args) override;

  void schedulerDidSendAccessibilityEvent(
      const ShadowView &shadowView,
      std::string const &eventType) override;

  void schedulerDidSetIsJSResponder(
      ShadowView const &shadowView,
      bool isJSResponder,
      bool blockNativeResponder) override;

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
  std::unique_ptr<JBackgroundExecutor> backgroundExecutor_;

  std::shared_ptr<Scheduler> scheduler_;
  std::mutex schedulerMutex_;

  better::map<SurfaceId, SurfaceHandler> surfaceHandlerRegistry_{};
  better::shared_mutex
      surfaceHandlerRegistryMutex_; // Protects `surfaceHandlerRegistry_`.

  std::recursive_mutex commitMutex_;

  float pointScaleFactor_ = 1;

  std::shared_ptr<const ReactNativeConfig> reactNativeConfig_{nullptr};
  bool disablePreallocateViews_{false};
  bool enableFabricLogs_{false};
  bool enableEarlyEventEmitterUpdate_{false};
  bool disableRevisionCheckForPreallocation_{false};
  bool enableEventEmitterRawPointer_{false};
};

} // namespace react
} // namespace facebook
