/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Binding.h"

#include "AsyncEventBeat.h"
#include "ComponentFactory.h"
#include "EventBeatManager.h"
#include "EventEmitterWrapper.h"
#include "FabricMountingManager.h"
#include "JBackgroundExecutor.h"
#include "ReactNativeConfigHolder.h"
#include "StateWrapperImpl.h"
#include "SurfaceHandlerBinding.h"

#include <cfenv>
#include <cmath>

#include <fbjni/fbjni.h>
#include <glog/logging.h>
#include <jsi/JSIDynamic.h>
#include <jsi/jsi.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/animations/LayoutAnimationDriver.h>
#include <react/renderer/componentregistry/ComponentDescriptorFactory.h>
#include <react/renderer/core/EventBeat.h>
#include <react/renderer/core/EventEmitter.h>
#include <react/renderer/core/conversions.h>
#include <react/renderer/debug/SystraceSection.h>
#include <react/renderer/scheduler/Scheduler.h>
#include <react/renderer/scheduler/SchedulerDelegate.h>
#include <react/renderer/scheduler/SchedulerToolbox.h>
#include <react/renderer/uimanager/primitives.h>
#include <react/utils/ContextContainer.h>
#include <react/utils/CoreFeatures.h>

namespace facebook::react {

jni::local_ref<Binding::jhybriddata> Binding::initHybrid(
    jni::alias_ref<jclass>) {
  return makeCxxInstance();
}

// Thread-safe getter
std::shared_ptr<Scheduler> Binding::getScheduler() {
  std::shared_lock lock(installMutex_);
  // Need to return a copy of the shared_ptr to make sure this is safe if called
  // concurrently with uninstallFabricUIManager
  return scheduler_;
}

jni::local_ref<ReadableNativeMap::jhybridobject>
Binding::getInspectorDataForInstance(
    jni::alias_ref<EventEmitterWrapper::javaobject> eventEmitterWrapper) {
  auto scheduler = getScheduler();
  if (!scheduler) {
    LOG(ERROR) << "Binding::startSurface: scheduler disappeared";
    return ReadableNativeMap::newObjectCxxArgs(folly::dynamic::object());
  }

  EventEmitterWrapper* cEventEmitter = cthis(eventEmitterWrapper);
  InspectorData data =
      scheduler->getInspectorDataForInstance(*cEventEmitter->eventEmitter);

  folly::dynamic result = folly::dynamic::object;
  result["fileName"] = data.fileName;
  result["lineNumber"] = data.lineNumber;
  result["columnNumber"] = data.columnNumber;
  result["selectedIndex"] = data.selectedIndex;
  result["props"] = data.props;
  auto hierarchy = folly::dynamic::array();
  for (const auto& hierarchyItem : data.hierarchy) {
    hierarchy.push_back(hierarchyItem);
  }
  result["hierarchy"] = hierarchy;
  return ReadableNativeMap::newObjectCxxArgs(result);
}

constexpr static auto kReactFeatureFlagsJavaDescriptor =
    "com/facebook/react/config/ReactFeatureFlags";

static bool getFeatureFlagValue(const char* name) {
  static const auto reactFeatureFlagsClass =
      jni::findClassStatic(kReactFeatureFlagsJavaDescriptor);
  const auto field = reactFeatureFlagsClass->getStaticField<jboolean>(name);
  return reactFeatureFlagsClass->getStaticFieldValue(field);
}

void Binding::setPixelDensity(float pointScaleFactor) {
  pointScaleFactor_ = pointScaleFactor;
}

void Binding::driveCxxAnimations() {
  scheduler_->animationTick();
}

void Binding::reportMount(SurfaceId surfaceId) {
  auto scheduler = getScheduler();
  if (!scheduler) {
    LOG(ERROR) << "Binding::reportMount: scheduler disappeared";
    return;
  }
  scheduler->reportMount(surfaceId);
}

#pragma mark - Surface management

void Binding::startSurface(
    jint surfaceId,
    jni::alias_ref<jstring> moduleName,
    NativeMap* initialProps) {
  SystraceSection s("FabricUIManagerBinding::startSurface");

  auto scheduler = getScheduler();
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
    std::unique_lock lock(surfaceHandlerRegistryMutex_);
    SystraceSection s3("FabricUIManagerBinding::startSurface::surfaceId");
    surfaceHandlerRegistry_.emplace(surfaceId, std::move(surfaceHandler));
  }

  auto mountingManager = getMountingManager("startSurface");
  if (!mountingManager) {
    return;
  }
  mountingManager->onSurfaceStart(surfaceId);
}

void Binding::startSurfaceWithConstraints(
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
    jboolean doLeftAndRightSwapInRTL) {
  SystraceSection s("FabricUIManagerBinding::startSurfaceWithConstraints");

  if (enableFabricLogs_) {
    LOG(WARNING)
        << "Binding::startSurfaceWithConstraints() was called (address: "
        << this << ", surfaceId: " << surfaceId << ").";
  }

  auto scheduler = getScheduler();
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
    std::unique_lock lock(surfaceHandlerRegistryMutex_);
    SystraceSection s3(
        "FabricUIManagerBinding::startSurfaceWithConstraints::surfaceId");
    surfaceHandlerRegistry_.emplace(surfaceId, std::move(surfaceHandler));
  }

  auto mountingManager = getMountingManager("startSurfaceWithConstraints");
  if (!mountingManager) {
    return;
  }
  mountingManager->onSurfaceStart(surfaceId);
}

void Binding::stopSurface(jint surfaceId) {
  SystraceSection s("FabricUIManagerBinding::stopSurface");

  if (enableFabricLogs_) {
    LOG(WARNING) << "Binding::stopSurface() was called (address: " << this
                 << ", surfaceId: " << surfaceId << ").";
  }

  auto scheduler = getScheduler();
  if (!scheduler) {
    LOG(ERROR) << "Binding::stopSurface: scheduler disappeared";
    return;
  }

  {
    std::unique_lock lock(surfaceHandlerRegistryMutex_);

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

  auto mountingManager = getMountingManager("stopSurface");
  if (!mountingManager) {
    return;
  }
  mountingManager->onSurfaceStop(surfaceId);
}

void Binding::registerSurface(SurfaceHandlerBinding* surfaceHandlerBinding) {
  const auto& surfaceHandler = surfaceHandlerBinding->getSurfaceHandler();
  auto scheduler = getScheduler();
  if (!scheduler) {
    LOG(ERROR) << "Binding::registerSurface: scheduler disappeared";
    return;
  }
  scheduler->registerSurface(surfaceHandler);

  auto mountingManager = getMountingManager("registerSurface");
  if (!mountingManager) {
    return;
  }
  mountingManager->onSurfaceStart(surfaceHandler.getSurfaceId());
}

void Binding::unregisterSurface(SurfaceHandlerBinding* surfaceHandlerBinding) {
  const auto& surfaceHandler = surfaceHandlerBinding->getSurfaceHandler();
  auto scheduler = getScheduler();
  if (!scheduler) {
    LOG(ERROR) << "Binding::unregisterSurface: scheduler disappeared";
    return;
  }
  scheduler->unregisterSurface(surfaceHandler);

  auto mountingManager = getMountingManager("unregisterSurface");
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

  auto scheduler = getScheduler();
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
    std::shared_lock lock(surfaceHandlerRegistryMutex_);

    auto iterator = surfaceHandlerRegistry_.find(surfaceId);

    if (iterator == surfaceHandlerRegistry_.end()) {
      LOG(ERROR)
          << "Binding::setConstraints: Surface with given id is not found";
      return;
    }

    auto& surfaceHandler = iterator->second;
    surfaceHandler.constraintLayout(constraints, context);
  }
}

#pragma mark - Install/uninstall java binding

void Binding::installFabricUIManager(
    jni::alias_ref<JRuntimeExecutor::javaobject> runtimeExecutorHolder,
    jni::alias_ref<JRuntimeScheduler::javaobject> runtimeSchedulerHolder,
    jni::alias_ref<JFabricUIManager::javaobject> javaUIManager,
    EventBeatManager* eventBeatManager,
    ComponentFactory* componentsRegistry,
    jni::alias_ref<jobject> reactNativeConfig) {
  SystraceSection s("FabricUIManagerBinding::installFabricUIManager");

  std::shared_ptr<const ReactNativeConfig> config =
      std::make_shared<const ReactNativeConfigHolder>(reactNativeConfig);

  enableFabricLogs_ =
      config->getBool("react_fabric:enabled_android_fabric_logs");

  if (enableFabricLogs_) {
    LOG(WARNING) << "Binding::installFabricUIManager() was called (address: "
                 << this << ").";
  }

  std::unique_lock lock(installMutex_);

  auto globalJavaUiManager = make_global(javaUIManager);
  mountingManager_ =
      std::make_shared<FabricMountingManager>(config, globalJavaUiManager);

  ContextContainer::Shared contextContainer =
      std::make_shared<ContextContainer>();

  auto runtimeExecutor = runtimeExecutorHolder->cthis()->get();

  if (runtimeSchedulerHolder) {
    auto runtimeScheduler = runtimeSchedulerHolder->cthis()->get().lock();
    if (runtimeScheduler) {
      runtimeExecutor =
          [runtimeScheduler](
              std::function<void(jsi::Runtime & runtime)>&& callback) {
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
          const EventBeat::SharedOwnerBox& ownerBox)
      -> std::unique_ptr<EventBeat> {
    return std::make_unique<AsyncEventBeat>(
        ownerBox, eventBeatManager, runtimeExecutor, globalJavaUiManager);
  };

  EventBeat::Factory asynchronousBeatFactory =
      [eventBeatManager, runtimeExecutor, globalJavaUiManager](
          const EventBeat::SharedOwnerBox& ownerBox)
      -> std::unique_ptr<EventBeat> {
    return std::make_unique<AsyncEventBeat>(
        ownerBox, eventBeatManager, runtimeExecutor, globalJavaUiManager);
  };

  contextContainer->insert("ReactNativeConfig", config);
  contextContainer->insert("FabricUIManager", globalJavaUiManager);

  // Keep reference to config object and cache some feature flags here
  reactNativeConfig_ = config;

  contextContainer->insert(
      "CalculateTransformedFramesEnabled",
      getFeatureFlagValue("calculateTransformedFramesEnabled"));

  CoreFeatures::enablePropIteratorSetter =
      getFeatureFlagValue("enableCppPropsIteratorSetter");
  CoreFeatures::enableClonelessStateProgression =
      getFeatureFlagValue("enableClonelessStateProgression");
  CoreFeatures::excludeYogaFromRawProps =
      getFeatureFlagValue("excludeYogaFromRawProps");

  // RemoveDelete mega-op
  ShadowViewMutation::PlatformSupportsRemoveDeleteTreeInstruction =
      getFeatureFlagValue("enableRemoveDeleteTreeInstruction");

  auto toolbox = SchedulerToolbox{};
  toolbox.contextContainer = contextContainer;
  toolbox.componentRegistryFactory = componentsRegistry->buildRegistryFunction;

  // TODO: (T132338609) runtimeExecutor should execute lambdas after
  // main bundle eval, and bindingsInstallExecutor should execute before.
  toolbox.bridgelessBindingsExecutor = std::nullopt;
  toolbox.runtimeExecutor = runtimeExecutor;

  toolbox.synchronousEventBeatFactory = synchronousBeatFactory;
  toolbox.asynchronousEventBeatFactory = asynchronousBeatFactory;

  if (ReactNativeFeatureFlags::enableBackgroundExecutor()) {
    backgroundExecutor_ = JBackgroundExecutor::create("fabric_bg");
    toolbox.backgroundExecutor = backgroundExecutor_;
  }

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

  std::unique_lock lock(installMutex_);
  animationDriver_ = nullptr;
  scheduler_ = nullptr;
  mountingManager_ = nullptr;
  reactNativeConfig_ = nullptr;
}

std::shared_ptr<FabricMountingManager> Binding::getMountingManager(
    const char* locationHint) {
  std::shared_lock lock(installMutex_);
  if (!mountingManager_) {
    LOG(ERROR) << "FabricMountingManager::" << locationHint
               << " mounting manager disappeared";
  }
  // Need to return a copy of the shared_ptr to make sure this is safe if called
  // concurrently with uninstallFabricUIManager
  return mountingManager_;
}

void Binding::schedulerDidFinishTransaction(
    const MountingCoordinator::Shared& mountingCoordinator) {
  auto mountingManager = getMountingManager("schedulerDidFinishTransaction");
  if (!mountingManager) {
    return;
  }

  auto mountingTransaction = mountingCoordinator->pullTransaction();
  if (!mountingTransaction.has_value()) {
    return;
  }
  mountingManager->executeMount(*mountingTransaction);
}

void Binding::schedulerDidRequestPreliminaryViewAllocation(
    const SurfaceId surfaceId,
    const ShadowNode& shadowNode) {
  if (!shadowNode.getTraits().check(ShadowNodeTraits::Trait::FormsView)) {
    return;
  }

  auto mountingManager = getMountingManager("preallocateView");
  if (!mountingManager) {
    return;
  }
  mountingManager->preallocateShadowView(surfaceId, ShadowView(shadowNode));
}

void Binding::schedulerDidDispatchCommand(
    const ShadowView& shadowView,
    const std::string& commandName,
    const folly::dynamic& args) {
  auto mountingManager = getMountingManager("schedulerDidDispatchCommand");
  if (!mountingManager) {
    return;
  }
  mountingManager->dispatchCommand(shadowView, commandName, args);
}

void Binding::schedulerDidSendAccessibilityEvent(
    const ShadowView& shadowView,
    const std::string& eventType) {
  auto mountingManager =
      getMountingManager("schedulerDidSendAccessibilityEvent");
  if (!mountingManager) {
    return;
  }
  mountingManager->sendAccessibilityEvent(shadowView, eventType);
}

void Binding::schedulerDidSetIsJSResponder(
    const ShadowView& shadowView,
    bool isJSResponder,
    bool blockNativeResponder) {
  auto mountingManager = getMountingManager("schedulerDidSetIsJSResponder");
  if (!mountingManager) {
    return;
  }
  mountingManager->setIsJSResponder(
      shadowView, isJSResponder, blockNativeResponder);
}

void Binding::onAnimationStarted() {
  auto mountingManager = getMountingManager("onAnimationStarted");
  if (!mountingManager) {
    return;
  }
  mountingManager->onAnimationStarted();
}

void Binding::onAllAnimationsComplete() {
  auto mountingManager = getMountingManager("onAnimationComplete");
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
      makeNativeMethod("stopSurface", Binding::stopSurface),
      makeNativeMethod("setConstraints", Binding::setConstraints),
      makeNativeMethod("setPixelDensity", Binding::setPixelDensity),
      makeNativeMethod("driveCxxAnimations", Binding::driveCxxAnimations),
      makeNativeMethod("reportMount", Binding::reportMount),
      makeNativeMethod(
          "uninstallFabricUIManager", Binding::uninstallFabricUIManager),
      makeNativeMethod("registerSurface", Binding::registerSurface),
      makeNativeMethod("unregisterSurface", Binding::unregisterSurface),
  });
}

} // namespace facebook::react
