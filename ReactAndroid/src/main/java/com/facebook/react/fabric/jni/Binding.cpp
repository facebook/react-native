/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Binding.h"
#include "AsyncEventBeat.h"
#include "EventEmitterWrapper.h"
#include "ReactNativeConfigHolder.h"
#include "StateWrapperImpl.h"

#include <cfenv>
#include <cmath>

#include <fbjni/fbjni.h>
#include <jsi/JSIDynamic.h>
#include <jsi/jsi.h>
#include <react/renderer/animations/LayoutAnimationDriver.h>
#include <react/renderer/componentregistry/ComponentDescriptorFactory.h>
#include <react/renderer/components/scrollview/ScrollViewProps.h>
#include <react/renderer/core/EventBeat.h>
#include <react/renderer/core/EventEmitter.h>
#include <react/renderer/core/conversions.h>
#include <react/renderer/debug/SystraceSection.h>
#include <react/renderer/scheduler/Scheduler.h>
#include <react/renderer/scheduler/SchedulerDelegate.h>
#include <react/renderer/scheduler/SchedulerToolbox.h>
#include <react/renderer/uimanager/primitives.h>
#include <react/utils/ContextContainer.h>

#include <glog/logging.h>

using namespace facebook::jni;
using namespace facebook::jsi;

namespace facebook {
namespace react {

jni::local_ref<Binding::jhybriddata> Binding::initHybrid(
    jni::alias_ref<jclass>) {
  return makeCxxInstance();
}

// Thread-safe getter
std::shared_ptr<Scheduler> Binding::getScheduler() {
  std::shared_lock<butter::shared_mutex> lock(installMutex_);
  return scheduler_;
}

jni::local_ref<ReadableNativeMap::jhybridobject>
Binding::getInspectorDataForInstance(
    jni::alias_ref<EventEmitterWrapper::javaobject> eventEmitterWrapper) {
  std::shared_ptr<Scheduler> scheduler = getScheduler();
  if (!scheduler) {
    LOG(ERROR) << "Binding::startSurface: scheduler disappeared";
    return ReadableNativeMap::newObjectCxxArgs(folly::dynamic::object());
  }

  EventEmitterWrapper *cEventEmitter = cthis(eventEmitterWrapper);
  InspectorData data =
      scheduler->getInspectorDataForInstance(*cEventEmitter->eventEmitter);

  folly::dynamic result = folly::dynamic::object;
  result["fileName"] = data.fileName;
  result["lineNumber"] = data.lineNumber;
  result["columnNumber"] = data.columnNumber;
  result["selectedIndex"] = data.selectedIndex;
  result["props"] = data.props;
  auto hierarchy = folly::dynamic::array();
  for (const auto &hierarchyItem : data.hierarchy) {
    hierarchy.push_back(hierarchyItem);
  }
  result["hierarchy"] = hierarchy;
  return ReadableNativeMap::newObjectCxxArgs(result);
}

bool isLargeTextMeasureCacheEnabled() {
  static const auto reactFeatureFlagsJavaDescriptor =
      jni::findClassStatic(Binding::ReactFeatureFlagsJavaDescriptor);
  const auto field = reactFeatureFlagsJavaDescriptor->getStaticField<jboolean>(
      "enableLargeTextMeasureCache");
  return reactFeatureFlagsJavaDescriptor->getStaticFieldValue(field);
}

bool isMapBufferSerializationEnabled() {
  static const auto reactFeatureFlagsJavaDescriptor =
      jni::findClassStatic(Binding::ReactFeatureFlagsJavaDescriptor);
  static const auto isMapBufferSerializationEnabledMethod =
      reactFeatureFlagsJavaDescriptor->getStaticMethod<jboolean()>(
          "isMapBufferSerializationEnabled");
  bool value =
      isMapBufferSerializationEnabledMethod(reactFeatureFlagsJavaDescriptor);
  return value;
}

void Binding::setPixelDensity(float pointScaleFactor) {
  pointScaleFactor_ = pointScaleFactor;
}

void Binding::driveCxxAnimations() {
  scheduler_->animationTick();
}

#pragma mark - Surface management

void Binding::startSurface(
    jint surfaceId,
    jni::alias_ref<jstring> moduleName,
    NativeMap *initialProps) {
  SystraceSection s("FabricUIManagerBinding::startSurface");

  std::shared_ptr<Scheduler> scheduler = getScheduler();
  if (!scheduler) {
    LOG(ERROR) << "Binding::startSurface: scheduler disappeared";
    return;
  }

  auto layoutContext = LayoutContext{};
  layoutContext.pointScaleFactor = pointScaleFactor_;

  auto surfaceHandler = SurfaceHandler{moduleName->toStdString(), surfaceId};
  surfaceHandler.setContextContainer(scheduler->getContextContainer());
  surfaceHandler.setProps(initialProps->consume());
  surfaceHandler.constraintLayout({}, layoutContext);

  scheduler->registerSurface(surfaceHandler);

  surfaceHandler.start();

  surfaceHandler.getMountingCoordinator()->setMountingOverrideDelegate(
      animationDriver_);

  {
    SystraceSection s2("FabricUIManagerBinding::startSurface::surfaceId::lock");
    std::unique_lock<butter::shared_mutex> lock(surfaceHandlerRegistryMutex_);
    SystraceSection s3("FabricUIManagerBinding::startSurface::surfaceId");
    surfaceHandlerRegistry_.emplace(surfaceId, std::move(surfaceHandler));
  }

  auto mountingManager =
      verifyMountingManager("FabricUIManagerBinding::startSurface");
  if (!mountingManager) {
    return;
  }
  mountingManager->onSurfaceStart(surfaceId);
}

void Binding::startSurfaceWithConstraints(
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
    jboolean doLeftAndRightSwapInRTL) {
  SystraceSection s("FabricUIManagerBinding::startSurfaceWithConstraints");

  if (enableFabricLogs_) {
    LOG(WARNING)
        << "Binding::startSurfaceWithConstraints() was called (address: "
        << this << ", surfaceId: " << surfaceId << ").";
  }

  std::shared_ptr<Scheduler> scheduler = getScheduler();
  if (!scheduler) {
    LOG(ERROR) << "Binding::startSurfaceWithConstraints: scheduler disappeared";
    return;
  }

  auto minimumSize =
      Size{minWidth / pointScaleFactor_, minHeight / pointScaleFactor_};
  auto maximumSize =
      Size{maxWidth / pointScaleFactor_, maxHeight / pointScaleFactor_};

  LayoutContext context;
  context.viewportOffset =
      Point{offsetX / pointScaleFactor_, offsetY / pointScaleFactor_};
  context.pointScaleFactor = {pointScaleFactor_};
  context.swapLeftAndRightInRTL = doLeftAndRightSwapInRTL;
  LayoutConstraints constraints = {};
  constraints.minimumSize = minimumSize;
  constraints.maximumSize = maximumSize;
  constraints.layoutDirection =
      isRTL ? LayoutDirection::RightToLeft : LayoutDirection::LeftToRight;

  auto surfaceHandler = SurfaceHandler{moduleName->toStdString(), surfaceId};
  surfaceHandler.setContextContainer(scheduler_->getContextContainer());
  surfaceHandler.setProps(initialProps->consume());
  surfaceHandler.constraintLayout(constraints, context);

  scheduler->registerSurface(surfaceHandler);

  surfaceHandler.start();

  surfaceHandler.getMountingCoordinator()->setMountingOverrideDelegate(
      animationDriver_);

  {
    SystraceSection s2(
        "FabricUIManagerBinding::startSurfaceWithConstraints::surfaceId::lock");
    std::unique_lock<butter::shared_mutex> lock(surfaceHandlerRegistryMutex_);
    SystraceSection s3(
        "FabricUIManagerBinding::startSurfaceWithConstraints::surfaceId");
    surfaceHandlerRegistry_.emplace(surfaceId, std::move(surfaceHandler));
  }

  auto mountingManager = verifyMountingManager(
      "FabricUIManagerBinding::startSurfaceWithConstraints");
  if (!mountingManager) {
    return;
  }
  mountingManager->onSurfaceStart(surfaceId);
}

void Binding::renderTemplateToSurface(jint surfaceId, jstring uiTemplate) {
  SystraceSection s("FabricUIManagerBinding::renderTemplateToSurface");

  std::shared_ptr<Scheduler> scheduler = getScheduler();
  if (!scheduler) {
    LOG(ERROR) << "Binding::renderTemplateToSurface: scheduler disappeared";
    return;
  }

  auto env = Environment::current();
  const char *nativeString = env->GetStringUTFChars(uiTemplate, JNI_FALSE);
  scheduler->renderTemplateToSurface(surfaceId, nativeString);
  env->ReleaseStringUTFChars(uiTemplate, nativeString);
}

void Binding::stopSurface(jint surfaceId) {
  SystraceSection s("FabricUIManagerBinding::stopSurface");

  if (enableFabricLogs_) {
    LOG(WARNING) << "Binding::stopSurface() was called (address: " << this
                 << ", surfaceId: " << surfaceId << ").";
  }

  std::shared_ptr<Scheduler> scheduler = getScheduler();
  if (!scheduler) {
    LOG(ERROR) << "Binding::stopSurface: scheduler disappeared";
    return;
  }

  {
    std::unique_lock<butter::shared_mutex> lock(surfaceHandlerRegistryMutex_);

    auto iterator = surfaceHandlerRegistry_.find(surfaceId);

    if (iterator == surfaceHandlerRegistry_.end()) {
      LOG(ERROR) << "Binding::stopSurface: Surface with given id is not found";
      return;
    }

    auto surfaceHandler = std::move(iterator->second);
    surfaceHandlerRegistry_.erase(iterator);
    surfaceHandler.stop();
    scheduler->unregisterSurface(surfaceHandler);
  }

  auto mountingManager =
      verifyMountingManager("FabricUIManagerBinding::stopSurface");
  if (!mountingManager) {
    return;
  }
  mountingManager->onSurfaceStop(surfaceId);
}

void Binding::registerSurface(SurfaceHandlerBinding *surfaceHandlerBinding) {
  auto const &surfaceHandler = surfaceHandlerBinding->getSurfaceHandler();
  auto scheduler = getScheduler();
  if (!scheduler) {
    LOG(ERROR) << "Binding::registerSurface: scheduler disappeared";
    return;
  }
  scheduler->registerSurface(surfaceHandler);

  auto mountingManager =
      verifyMountingManager("FabricUIManagerBinding::registerSurface");
  if (!mountingManager) {
    return;
  }
  mountingManager->onSurfaceStart(surfaceHandler.getSurfaceId());
}

void Binding::unregisterSurface(SurfaceHandlerBinding *surfaceHandlerBinding) {
  auto const &surfaceHandler = surfaceHandlerBinding->getSurfaceHandler();
  auto scheduler = getScheduler();
  if (!scheduler) {
    LOG(ERROR) << "Binding::unregisterSurface: scheduler disappeared";
    return;
  }
  scheduler->unregisterSurface(surfaceHandler);

  auto mountingManager =
      verifyMountingManager("FabricUIManagerBinding::unregisterSurface");
  if (!mountingManager) {
    return;
  }
  mountingManager->onSurfaceStop(surfaceHandler.getSurfaceId());
}

void Binding::setConstraints(
    jint surfaceId,
    jfloat minWidth,
    jfloat maxWidth,
    jfloat minHeight,
    jfloat maxHeight,
    jfloat offsetX,
    jfloat offsetY,
    jboolean isRTL,
    jboolean doLeftAndRightSwapInRTL) {
  SystraceSection s("FabricUIManagerBinding::setConstraints");

  std::shared_ptr<Scheduler> scheduler = getScheduler();
  if (!scheduler) {
    LOG(ERROR) << "Binding::setConstraints: scheduler disappeared";
    return;
  }

  auto minimumSize =
      Size{minWidth / pointScaleFactor_, minHeight / pointScaleFactor_};
  auto maximumSize =
      Size{maxWidth / pointScaleFactor_, maxHeight / pointScaleFactor_};

  LayoutContext context;
  context.viewportOffset =
      Point{offsetX / pointScaleFactor_, offsetY / pointScaleFactor_};
  context.pointScaleFactor = {pointScaleFactor_};
  context.swapLeftAndRightInRTL = doLeftAndRightSwapInRTL;
  LayoutConstraints constraints = {};
  constraints.minimumSize = minimumSize;
  constraints.maximumSize = maximumSize;
  constraints.layoutDirection =
      isRTL ? LayoutDirection::RightToLeft : LayoutDirection::LeftToRight;

  {
    std::shared_lock<butter::shared_mutex> lock(surfaceHandlerRegistryMutex_);

    auto iterator = surfaceHandlerRegistry_.find(surfaceId);

    if (iterator == surfaceHandlerRegistry_.end()) {
      LOG(ERROR)
          << "Binding::setConstraints: Surface with given id is not found";
      return;
    }

    auto &surfaceHandler = iterator->second;
    surfaceHandler.constraintLayout(constraints, context);
  }
}

#pragma mark - Install/uninstall java binding

void Binding::installFabricUIManager(
    jni::alias_ref<JRuntimeExecutor::javaobject> runtimeExecutorHolder,
    jni::alias_ref<JRuntimeScheduler::javaobject> runtimeSchedulerHolder,
    jni::alias_ref<jobject> javaUIManager,
    EventBeatManager *eventBeatManager,
    ComponentFactory *componentsRegistry,
    jni::alias_ref<jobject> reactNativeConfig) {
  SystraceSection s("FabricUIManagerBinding::installFabricUIManager");

  std::shared_ptr<const ReactNativeConfig> config =
      std::make_shared<const ReactNativeConfigHolder>(reactNativeConfig);

  enableFabricLogs_ =
      config->getBool("react_fabric:enabled_android_fabric_logs");

  disableRevisionCheckForPreallocation_ =
      config->getBool("react_fabric:disable_revision_check_for_preallocation");

  disablePreallocationOnClone_ = config->getBool(
      "react_native_new_architecture:disable_preallocation_on_clone_android");

  if (enableFabricLogs_) {
    LOG(WARNING) << "Binding::installFabricUIManager() was called (address: "
                 << this << ").";
  }

  // Use std::lock and std::adopt_lock to prevent deadlocks by locking mutexes
  // at the same time
  std::unique_lock<butter::shared_mutex> lock(installMutex_);

  auto globalJavaUiManager = make_global(javaUIManager);
  mountingManager_ =
      std::make_shared<FabricMountingManager>(config, globalJavaUiManager);

  ContextContainer::Shared contextContainer =
      std::make_shared<ContextContainer>();

  auto runtimeExecutor = runtimeExecutorHolder->cthis()->get();

  if (runtimeSchedulerHolder) {
    auto runtimeScheduler = runtimeSchedulerHolder->cthis()->get().lock();
    if (runtimeScheduler) {
      runtimeScheduler->setEnableYielding(config->getBool(
          "react_native_new_architecture:runtimescheduler_enable_yielding_android"));
      runtimeExecutor =
          [runtimeScheduler](
              std::function<void(jsi::Runtime & runtime)> &&callback) {
            runtimeScheduler->scheduleWork(std::move(callback));
          };
      contextContainer->insert(
          "RuntimeScheduler",
          std::weak_ptr<RuntimeScheduler>(runtimeScheduler));
    }
  }

  // TODO: T31905686 Create synchronous Event Beat
  EventBeat::Factory synchronousBeatFactory =
      [eventBeatManager, runtimeExecutor, globalJavaUiManager](
          EventBeat::SharedOwnerBox const &ownerBox)
      -> std::unique_ptr<EventBeat> {
    return std::make_unique<AsyncEventBeat>(
        ownerBox, eventBeatManager, runtimeExecutor, globalJavaUiManager);
  };

  EventBeat::Factory asynchronousBeatFactory =
      [eventBeatManager, runtimeExecutor, globalJavaUiManager](
          EventBeat::SharedOwnerBox const &ownerBox)
      -> std::unique_ptr<EventBeat> {
    return std::make_unique<AsyncEventBeat>(
        ownerBox, eventBeatManager, runtimeExecutor, globalJavaUiManager);
  };

  contextContainer->insert("ReactNativeConfig", config);
  contextContainer->insert("FabricUIManager", globalJavaUiManager);

  // Keep reference to config object and cache some feature flags here
  reactNativeConfig_ = config;

  contextContainer->insert(
      "MapBufferSerializationEnabled", isMapBufferSerializationEnabled());

  disablePreallocateViews_ = reactNativeConfig_->getBool(
      "react_fabric:disabled_view_preallocation_android");

  dispatchPreallocationInBackground_ = reactNativeConfig_->getBool(
      "react_native_new_architecture:dispatch_preallocation_in_bg");

  contextContainer->insert(
      "EnableLargeTextMeasureCache", isLargeTextMeasureCacheEnabled());

  auto toolbox = SchedulerToolbox{};
  toolbox.contextContainer = contextContainer;
  toolbox.componentRegistryFactory = componentsRegistry->buildRegistryFunction;
  toolbox.runtimeExecutor = runtimeExecutor;
  toolbox.synchronousEventBeatFactory = synchronousBeatFactory;
  toolbox.asynchronousEventBeatFactory = asynchronousBeatFactory;

  backgroundExecutor_ = std::make_unique<JBackgroundExecutor>();
  toolbox.backgroundExecutor = backgroundExecutor_->get();

  animationDriver_ = std::make_shared<LayoutAnimationDriver>(
      runtimeExecutor, contextContainer, this);
  scheduler_ =
      std::make_shared<Scheduler>(toolbox, animationDriver_.get(), this);
}

void Binding::uninstallFabricUIManager() {
  if (enableFabricLogs_) {
    LOG(WARNING) << "Binding::uninstallFabricUIManager() was called (address: "
                 << this << ").";
  }

  std::unique_lock<butter::shared_mutex> lock(installMutex_);
  animationDriver_ = nullptr;
  scheduler_ = nullptr;
  mountingManager_ = nullptr;
  reactNativeConfig_ = nullptr;
}

std::shared_ptr<FabricMountingManager> Binding::verifyMountingManager(
    std::string const &hint) {
  std::shared_lock<butter::shared_mutex> lock(installMutex_);
  if (!mountingManager_) {
    LOG(ERROR) << hint << " mounting manager disappeared.";
  }
  return mountingManager_;
}

void Binding::schedulerDidFinishTransaction(
    MountingCoordinator::Shared const &mountingCoordinator) {
  auto mountingManager =
      verifyMountingManager("Binding::schedulerDidFinishTransaction");
  if (!mountingManager) {
    return;
  }

  mountingManager->executeMount(mountingCoordinator);
}

void Binding::schedulerDidRequestPreliminaryViewAllocation(
    const SurfaceId surfaceId,
    const ShadowNode &shadowNode) {
  if (disablePreallocateViews_) {
    return;
  }

  if (!shadowNode.getTraits().check(ShadowNodeTraits::Trait::FormsView)) {
    return;
  }

  preallocateView(surfaceId, shadowNode);
}

void Binding::schedulerDidCloneShadowNode(
    SurfaceId surfaceId,
    ShadowNode const &oldShadowNode,
    ShadowNode const &newShadowNode) {
  if (disablePreallocationOnClone_) {
    return;
  }
  // This is only necessary if view preallocation was skipped during
  // createShadowNode

  // We may need to PreAllocate a ShadowNode at this point if this is the
  // earliest point it is possible to do so:
  // 1. The revision is exactly 1
  // 2. At revision 0 (the old node), View Preallocation would have been skipped

  if (!disableRevisionCheckForPreallocation_) {
    if (newShadowNode.getProps()->revision != 1) {
      return;
    }
    if (oldShadowNode.getProps()->revision != 0) {
      return;
    }
  }

  // If the new node is concrete and the old wasn't, we can preallocate
  if (!oldShadowNode.getTraits().check(ShadowNodeTraits::Trait::FormsView) &&
      newShadowNode.getTraits().check(ShadowNodeTraits::Trait::FormsView)) {
    preallocateView(surfaceId, newShadowNode);
  }
}

void Binding::preallocateView(
    SurfaceId surfaceId,
    ShadowNode const &shadowNode) {
  auto shadowView = ShadowView(shadowNode);
  auto preallocationFunction = [this,
                                surfaceId,
                                shadowView = std::move(shadowView)] {
    auto mountingManager = verifyMountingManager("Binding::preallocateView");
    if (!mountingManager) {
      return;
    }

    mountingManager->preallocateShadowView(surfaceId, shadowView);
  };

  if (dispatchPreallocationInBackground_) {
    auto backgroundExecutor = backgroundExecutor_->get();
    backgroundExecutor(preallocationFunction);
  } else {
    preallocationFunction();
  }
}

void Binding::schedulerDidDispatchCommand(
    const ShadowView &shadowView,
    std::string const &commandName,
    folly::dynamic const &args) {
  auto mountingManager =
      verifyMountingManager("Binding::schedulerDidDispatchCommand");
  if (!mountingManager) {
    return;
  }

  mountingManager->dispatchCommand(shadowView, commandName, args);
}

void Binding::schedulerDidSendAccessibilityEvent(
    const ShadowView &shadowView,
    std::string const &eventType) {
  auto mountingManager =
      verifyMountingManager("Binding::schedulerDidSendAccessibilityEvent");
  if (!mountingManager) {
    return;
  }

  mountingManager->sendAccessibilityEvent(shadowView, eventType);
}

void Binding::schedulerDidSetIsJSResponder(
    ShadowView const &shadowView,
    bool isJSResponder,
    bool blockNativeResponder) {
  auto mountingManager =
      verifyMountingManager("Binding::schedulerDidSetIsJSResponder");
  if (!mountingManager) {
    return;
  }

  mountingManager->setIsJSResponder(
      shadowView, isJSResponder, blockNativeResponder);
}

void Binding::onAnimationStarted() {
  auto mountingManager = verifyMountingManager("Binding::onAnimationStarted");
  if (!mountingManager) {
    return;
  }

  mountingManager->onAnimationStarted();
}

void Binding::onAllAnimationsComplete() {
  auto mountingManager = verifyMountingManager("Binding::onAnimationComplete");
  if (!mountingManager) {
    return;
  }

  mountingManager->onAllAnimationsComplete();
}

void Binding::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", Binding::initHybrid),
      makeNativeMethod(
          "installFabricUIManager", Binding::installFabricUIManager),
      makeNativeMethod("startSurface", Binding::startSurface),
      makeNativeMethod(
          "getInspectorDataForInstance", Binding::getInspectorDataForInstance),
      makeNativeMethod(
          "startSurfaceWithConstraints", Binding::startSurfaceWithConstraints),
      makeNativeMethod(
          "renderTemplateToSurface", Binding::renderTemplateToSurface),
      makeNativeMethod("stopSurface", Binding::stopSurface),
      makeNativeMethod("setConstraints", Binding::setConstraints),
      makeNativeMethod("setPixelDensity", Binding::setPixelDensity),
      makeNativeMethod("driveCxxAnimations", Binding::driveCxxAnimations),
      makeNativeMethod(
          "uninstallFabricUIManager", Binding::uninstallFabricUIManager),
      makeNativeMethod("registerSurface", Binding::registerSurface),
      makeNativeMethod("unregisterSurface", Binding::unregisterSurface),
  });
}

} // namespace react
} // namespace facebook
