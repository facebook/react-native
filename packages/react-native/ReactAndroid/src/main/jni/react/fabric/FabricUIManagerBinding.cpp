/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FabricUIManagerBinding.h"

#include "AndroidEventBeat.h"
#include "ComponentFactory.h"
#include "EventBeatManager.h"
#include "EventEmitterWrapper.h"
#include "FabricMountingManager.h"
#include "FocusOrderingHelper.h"

#include <cxxreact/TraceSection.h>
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
#include <react/renderer/scheduler/Scheduler.h>
#include <react/renderer/scheduler/SchedulerDelegate.h>
#include <react/renderer/scheduler/SchedulerToolbox.h>
#include <react/renderer/uimanager/primitives.h>
#include <react/utils/ContextContainer.h>

namespace facebook::react {

void FabricUIManagerBinding::initHybrid(jni::alias_ref<jhybridobject> jobj) {
  setCxxInstance(jobj);
}

// Thread-safe getter
std::shared_ptr<Scheduler> FabricUIManagerBinding::getScheduler() {
  std::shared_lock lock(installMutex_);
  // Need to return a copy of the shared_ptr to make sure this is safe if called
  // concurrently with uninstallFabricUIManager
  return scheduler_;
}

void FabricUIManagerBinding::setPixelDensity(float pointScaleFactor) {
  pointScaleFactor_ = pointScaleFactor;
}

void FabricUIManagerBinding::driveCxxAnimations() {
  getScheduler()->animationTick();
}

void FabricUIManagerBinding::drainPreallocateViewsQueue() {
  auto mountingManager = getMountingManager("drainPreallocateViewsQueue");
  if (!mountingManager) {
    return;
  }
  mountingManager->drainPreallocateViewsQueue();
}

void FabricUIManagerBinding::reportMount(SurfaceId surfaceId) {
  if (ReactNativeFeatureFlags::
          fixMountingCoordinatorReportedPendingTransactionsOnAndroid()) {
    // This is a fix for `MountingCoordinator::hasPendingTransactions` on
    // Android, which otherwise would report no pending transactions
    // incorrectly. This is due to the push model used on Android and can be
    // removed when we migrate to a pull model.
    std::shared_lock lock(surfaceHandlerRegistryMutex_);
    auto iterator = surfaceHandlerRegistry_.find(surfaceId);
    if (iterator != surfaceHandlerRegistry_.end()) {
      const auto* surfaceHandler =
          std::get_if<SurfaceHandler>(&iterator->second);
      if (surfaceHandler == nullptr) {
        auto javaSurfaceHandler =
            std::get<jni::weak_ref<SurfaceHandlerBinding::jhybridobject>>(
                iterator->second)
                .lockLocal();
        if (javaSurfaceHandler) {
          surfaceHandler = &javaSurfaceHandler->cthis()->getSurfaceHandler();
        }
      }
      if (surfaceHandler != nullptr) {
        auto mountingCoordinator = surfaceHandler->getMountingCoordinator();
        if (mountingCoordinator != nullptr) {
          mountingCoordinator->didPerformAsyncTransactions();
        }
      }
    } else {
      LOG(ERROR) << "FabricUIManagerBinding::reportMount: Surface with id "
                 << surfaceId << " is not found";
    }
  }

  auto scheduler = getScheduler();
  if (!scheduler) {
    LOG(ERROR) << "FabricUIManagerBinding::reportMount: scheduler disappeared";
    return;
  }
  scheduler->reportMount(surfaceId);
}

#pragma mark - Surface management

// Used by bridgeless
void FabricUIManagerBinding::startSurfaceWithSurfaceHandler(
    jint surfaceId,
    jni::alias_ref<SurfaceHandlerBinding::jhybridobject> surfaceHandlerBinding,
    jboolean isMountable) {
  TraceSection s("FabricUIManagerBinding::startSurfaceWithSurfaceHandler");
  if (enableFabricLogs_) {
    LOG(WARNING)
        << "FabricUIManagerBinding::startSurfaceWithSurfaceHandler() was called (address: "
        << this << ", surfaceId: " << surfaceId << ").";
  }

  const auto& surfaceHandler =
      surfaceHandlerBinding->cthis()->getSurfaceHandler();
  surfaceHandler.setSurfaceId(surfaceId);
  surfaceHandler.setDisplayMode(
      isMountable != 0 ? DisplayMode::Visible : DisplayMode::Suspended);

  auto scheduler = getScheduler();
  if (!scheduler) {
    LOG(ERROR)
        << "FabricUIManagerBinding::startSurfaceWithSurfaceHandler: scheduler disappeared";
    return;
  }
  scheduler->registerSurface(surfaceHandler);

  auto mountingManager = getMountingManager("startSurfaceWithSurfaceHandler");
  if (mountingManager != nullptr) {
    mountingManager->onSurfaceStart(surfaceId);
  }

  surfaceHandler.start();

  if (ReactNativeFeatureFlags::enableLayoutAnimationsOnAndroid()) {
    surfaceHandler.getMountingCoordinator()->setMountingOverrideDelegate(
        animationDriver_);
  }

  {
    std::unique_lock lock(surfaceHandlerRegistryMutex_);
    surfaceHandlerRegistry_.emplace(
        surfaceId, jni::make_weak(surfaceHandlerBinding));
  }
}

// Used by non-bridgeless+Fabric
void FabricUIManagerBinding::startSurface(
    jint surfaceId,
    jni::alias_ref<jstring> moduleName,
    NativeMap* initialProps) {
  TraceSection s("FabricUIManagerBinding::startSurface");

  if (enableFabricLogs_) {
    LOG(WARNING)
        << "FabricUIManagerBinding::startSurface() was called (address: "
        << this << ", surfaceId: " << surfaceId << ").";
  }

  auto scheduler = getScheduler();
  if (!scheduler) {
    LOG(ERROR) << "FabricUIManagerBinding::startSurface: scheduler disappeared";
    return;
  }

  auto layoutContext = LayoutContext{};
  layoutContext.pointScaleFactor = pointScaleFactor_;

  auto surfaceHandler = SurfaceHandler{moduleName->toStdString(), surfaceId};
  surfaceHandler.setContextContainer(scheduler->getContextContainer());
  surfaceHandler.setProps(initialProps->consume());
  surfaceHandler.constraintLayout({}, layoutContext);

  scheduler->registerSurface(surfaceHandler);

  auto mountingManager = getMountingManager("startSurface");
  if (mountingManager != nullptr) {
    mountingManager->onSurfaceStart(surfaceId);
  }

  surfaceHandler.start();

  if (ReactNativeFeatureFlags::enableLayoutAnimationsOnAndroid()) {
    surfaceHandler.getMountingCoordinator()->setMountingOverrideDelegate(
        animationDriver_);
  }

  {
    std::unique_lock lock(surfaceHandlerRegistryMutex_);
    surfaceHandlerRegistry_.emplace(surfaceId, std::move(surfaceHandler));
  }
}

jfloatArray FabricUIManagerBinding::findNextFocusableElementMetrics(
    jint parentTag,
    jint focusedTag,
    jint direction) {
  /*
   * Holds the values of the next focusable element
   * [0] - tag
   * [1] - delta
   */
  std::array<float, 2> nodeValues{-1, -1};

  JNIEnv* env = jni::Environment::current();

  ShadowNode::Shared nextNode;

  auto nodeValuesSize = static_cast<jsize>(nodeValues.size());
  jfloatArray result = env->NewFloatArray(nodeValuesSize);

  std::optional<FocusDirection> focusDirection =
      FocusOrderingHelper::resolveFocusDirection(direction);

  if (!focusDirection.has_value()) {
    return nullptr;
  }

  ShadowNode::Shared parentShadowNode;
  ShadowNode::Shared focusedShadowNode;
  std::shared_ptr<UIManager> uimanager = getScheduler()->getUIManager();

  parentShadowNode = uimanager->findShadowNodeByTag_DEPRECATED(parentTag);

  if (parentShadowNode == nullptr) {
    return nullptr;
  }

  focusedShadowNode = FocusOrderingHelper::findShadowNodeByTagRecursively(
      parentShadowNode, focusedTag);

  if (focusedShadowNode == nullptr) {
    return nullptr;
  }

  LayoutMetrics childLayoutMetrics = uimanager->getRelativeLayoutMetrics(
      *focusedShadowNode, parentShadowNode.get(), {.includeTransform = true});

  /*
   * Set currentDelta to the origin of the focused node
   * Set nextDelta to the max int value in the direction we want to go (down =
   * INT_MIN, up = INT_MAX)
   */
  auto [currentDelta, nextDelta] = FocusOrderingHelper::initScrollDeltas(
      focusDirection.value(), childLayoutMetrics.frame.origin);

  /*
   * Traverse the tree recursively to find the next focusable element in the
   * given direction
   */
  FocusOrderingHelper::traverseAndUpdateNextFocusableElementMetrics(
      parentShadowNode,
      focusedShadowNode,
      parentShadowNode,
      focusDirection.value(),
      *uimanager,
      currentDelta,
      nextDelta,
      nextNode);

  if (nextNode == nullptr) {
    return nullptr;
  }

  LayoutMetrics nextNodeLayoutMetrics = uimanager->getRelativeLayoutMetrics(
      *nextNode, parentShadowNode.get(), {.includeTransform = true});

  LayoutMetrics parentNodeLayoutMetrics = uimanager->getRelativeLayoutMetrics(
      *parentShadowNode, nullptr, {.includeTransform = true});

  nodeValues[0] = static_cast<float>(nextNode->getTag());

  /*
   * In the end we want to scroll enough to make the next node visible
   * When going up or right we want delta to be the origin of the next node
   * When going down or left we want delta to be the end of the next node
   */
  switch (focusDirection.value()) {
    case FocusDirection::FocusDown:
      nextDelta = (nextNodeLayoutMetrics.frame.origin.y -
                   parentNodeLayoutMetrics.frame.size.height) +
          nextNodeLayoutMetrics.frame.size.height;
      nodeValues[1] = nextDelta;
      break;
    case FocusDirection::FocusRight:
      nextDelta = (nextNodeLayoutMetrics.frame.origin.x -
                   parentNodeLayoutMetrics.frame.size.width) +
          nextNodeLayoutMetrics.frame.size.width;
      nodeValues[1] = nextDelta;
      break;
    case FocusDirection::FocusLeft:
    case FocusDirection::FocusUp:
      nodeValues[1] = nextDelta;
      break;
  }

  // Build the jfloatArray with the updates nodeValues
  env->SetFloatArrayRegion(result, 0, nodeValuesSize, nodeValues.data());

  return result;
}

// Used by non-bridgeless+Fabric
void FabricUIManagerBinding::startSurfaceWithConstraints(
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
  TraceSection s("FabricUIManagerBinding::startSurfaceWithConstraints");

  if (enableFabricLogs_) {
    LOG(WARNING)
        << "FabricUIManagerBinding::startSurfaceWithConstraints() was called (address: "
        << this << ", surfaceId: " << surfaceId << ").";
  }

  auto scheduler = getScheduler();
  if (!scheduler) {
    LOG(ERROR)
        << "FabricUIManagerBinding::startSurfaceWithConstraints: scheduler disappeared";
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
  context.swapLeftAndRightInRTL = doLeftAndRightSwapInRTL != 0;
  LayoutConstraints constraints = {};
  constraints.minimumSize = minimumSize;
  constraints.maximumSize = maximumSize;
  constraints.layoutDirection =
      isRTL != 0 ? LayoutDirection::RightToLeft : LayoutDirection::LeftToRight;

  auto surfaceHandler = SurfaceHandler{moduleName->toStdString(), surfaceId};
  surfaceHandler.setContextContainer(scheduler->getContextContainer());
  surfaceHandler.setProps(initialProps->consume());
  surfaceHandler.constraintLayout(constraints, context);

  scheduler->registerSurface(surfaceHandler);

  auto mountingManager = getMountingManager("startSurfaceWithConstraints");
  if (mountingManager != nullptr) {
    mountingManager->onSurfaceStart(surfaceId);
  }

  surfaceHandler.start();

  if (ReactNativeFeatureFlags::enableLayoutAnimationsOnAndroid()) {
    surfaceHandler.getMountingCoordinator()->setMountingOverrideDelegate(
        animationDriver_);
  }

  {
    std::unique_lock lock(surfaceHandlerRegistryMutex_);
    surfaceHandlerRegistry_.emplace(surfaceId, std::move(surfaceHandler));
  }
}

// Used by non-bridgeless+Fabric
void FabricUIManagerBinding::stopSurface(jint surfaceId) {
  TraceSection s("FabricUIManagerBinding::stopSurface");
  if (enableFabricLogs_) {
    LOG(WARNING)
        << "FabricUIManagerBinding::stopSurface() was called (address: " << this
        << ", surfaceId: " << surfaceId << ").";
  }

  auto scheduler = getScheduler();
  if (!scheduler) {
    LOG(ERROR) << "FabricUIManagerBinding::stopSurface: scheduler disappeared";
    return;
  }

  {
    std::unique_lock lock(surfaceHandlerRegistryMutex_);
    auto iterator = surfaceHandlerRegistry_.find(surfaceId);
    if (iterator == surfaceHandlerRegistry_.end()) {
      LOG(ERROR)
          << "FabricUIManagerBinding::stopSurface: Surface with given id is not found";
      return;
    }

    auto* surfaceHandler = std::get_if<SurfaceHandler>(&iterator->second);
    if (surfaceHandler != nullptr) {
      surfaceHandler->stop();
      scheduler->unregisterSurface(*surfaceHandler);
    } else {
      LOG(ERROR) << "Java-owned SurfaceHandler found in stopSurface";
    }
    surfaceHandlerRegistry_.erase(iterator);
  }

  auto mountingManager = getMountingManager("stopSurface");
  if (!mountingManager) {
    return;
  }
  mountingManager->onSurfaceStop(surfaceId);
}

// Used by bridgeless
void FabricUIManagerBinding::stopSurfaceWithSurfaceHandler(
    jni::alias_ref<SurfaceHandlerBinding::jhybridobject>
        surfaceHandlerBinding) {
  TraceSection s("FabricUIManagerBinding::stopSurfaceWithSurfaceHandler");
  const auto& surfaceHandler =
      surfaceHandlerBinding->cthis()->getSurfaceHandler();
  if (enableFabricLogs_) {
    LOG(WARNING)
        << "FabricUIManagerBinding::stopSurfaceWithSurfaceHandler() was called (address: "
        << this << ", surfaceId: " << surfaceHandler.getSurfaceId() << ").";
  }

  surfaceHandler.stop();

  auto scheduler = getScheduler();
  if (!scheduler) {
    LOG(ERROR)
        << "FabricUIManagerBinding::unregisterSurface: scheduler disappeared";
    return;
  }
  scheduler->unregisterSurface(surfaceHandler);

  {
    std::unique_lock lock(surfaceHandlerRegistryMutex_);
    surfaceHandlerRegistry_.erase(surfaceHandler.getSurfaceId());
  }

  auto mountingManager = getMountingManager("unregisterSurface");
  if (!mountingManager) {
    return;
  }
  mountingManager->onSurfaceStop(surfaceHandler.getSurfaceId());
}

void FabricUIManagerBinding::setConstraints(
    jint surfaceId,
    jfloat minWidth,
    jfloat maxWidth,
    jfloat minHeight,
    jfloat maxHeight,
    jfloat offsetX,
    jfloat offsetY,
    jboolean isRTL,
    jboolean doLeftAndRightSwapInRTL) {
  TraceSection s("FabricUIManagerBinding::setConstraints");

  auto scheduler = getScheduler();
  if (!scheduler) {
    LOG(ERROR)
        << "FabricUIManagerBinding::setConstraints: scheduler disappeared";
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
  context.swapLeftAndRightInRTL = doLeftAndRightSwapInRTL != 0;
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
          << "FabricUIManagerBinding::setConstraints: Surface with given id is not found";
      return;
    }
    auto* surfaceHandler = std::get_if<SurfaceHandler>(&iterator->second);
    if (surfaceHandler != nullptr) {
      surfaceHandler->constraintLayout(constraints, context);
    }
  }
}

#pragma mark - Install/uninstall java binding

void FabricUIManagerBinding::installFabricUIManager(
    jni::alias_ref<JRuntimeExecutor::javaobject> runtimeExecutorHolder,
    jni::alias_ref<JRuntimeScheduler::javaobject> runtimeSchedulerHolder,
    jni::alias_ref<JFabricUIManager::javaobject> javaUIManager,
    EventBeatManager* eventBeatManager,
    ComponentFactory* componentsRegistry) {
  TraceSection s("FabricUIManagerBinding::installFabricUIManager");

  enableFabricLogs_ = ReactNativeFeatureFlags::enableFabricLogs();

  if (enableFabricLogs_) {
    LOG(WARNING)
        << "FabricUIManagerBinding::installFabricUIManager() was called (address: "
        << this << ").";
  }

  std::unique_lock lock(installMutex_);

  auto globalJavaUiManager = make_global(javaUIManager);
  mountingManager_ =
      std::make_shared<FabricMountingManager>(globalJavaUiManager);

  ContextContainer::Shared contextContainer =
      std::make_shared<ContextContainer>();

  auto runtimeExecutor = runtimeExecutorHolder->cthis()->get();

  auto runtimeScheduler = runtimeSchedulerHolder->cthis()->get().lock();
  if (runtimeScheduler) {
    runtimeExecutor =
        [runtimeScheduler](
            std::function<void(jsi::Runtime & runtime)>&& callback) {
          runtimeScheduler->scheduleWork(std::move(callback));
        };
    contextContainer->insert(
        "RuntimeScheduler", std::weak_ptr<RuntimeScheduler>(runtimeScheduler));
  }

  EventBeat::Factory eventBeatFactory =
      [eventBeatManager, &runtimeScheduler, globalJavaUiManager](
          std::shared_ptr<EventBeat::OwnerBox> ownerBox)
      -> std::unique_ptr<EventBeat> {
    return std::make_unique<AndroidEventBeat>(
        std::move(ownerBox),
        eventBeatManager,
        *runtimeScheduler,
        globalJavaUiManager);
  };

  contextContainer->insert("FabricUIManager", globalJavaUiManager);

  auto toolbox = SchedulerToolbox{};
  toolbox.contextContainer = contextContainer;
  toolbox.componentRegistryFactory = componentsRegistry->buildRegistryFunction;

  // TODO: (T132338609) runtimeExecutor should execute lambdas after
  // main bundle eval, and bindingsInstallExecutor should execute before.
  toolbox.bridgelessBindingsExecutor = std::nullopt;
  toolbox.runtimeExecutor = runtimeExecutor;

  toolbox.eventBeatFactory = eventBeatFactory;

  animationDriver_ = std::make_shared<LayoutAnimationDriver>(
      runtimeExecutor, contextContainer, this);
  scheduler_ =
      std::make_shared<Scheduler>(toolbox, animationDriver_.get(), this);
}

void FabricUIManagerBinding::uninstallFabricUIManager() {
  if (enableFabricLogs_) {
    LOG(WARNING)
        << "FabricUIManagerBinding::uninstallFabricUIManager() was called (address: "
        << this << ").";
  }

  std::unique_lock lock(installMutex_);
  animationDriver_ = nullptr;
  scheduler_ = nullptr;
  mountingManager_ = nullptr;
}

std::shared_ptr<FabricMountingManager>
FabricUIManagerBinding::getMountingManager(const char* locationHint) {
  std::shared_lock lock(installMutex_);
  if (!mountingManager_) {
    LOG(ERROR) << "FabricMountingManager::" << locationHint
               << " mounting manager disappeared";
  }
  // Need to return a copy of the shared_ptr to make sure this is safe if called
  // concurrently with uninstallFabricUIManager
  return mountingManager_;
}

void FabricUIManagerBinding::schedulerDidFinishTransaction(
    const std::shared_ptr<const MountingCoordinator>& mountingCoordinator) {
  if (ReactNativeFeatureFlags::enableAccumulatedUpdatesInRawPropsAndroid()) {
    // We don't do anything here. We will pull the transaction in
    // `schedulerShouldRenderTransactions`.
  } else {
    // We shouldn't be pulling the transaction here (which triggers diffing of
    // the trees to determine the mutations to run on the host platform),
    // but we have to due to current limitations in the Android implementation.
    auto mountingTransaction = mountingCoordinator->pullTransaction(
        // Indicate that the transaction will be performed asynchronously
        ReactNativeFeatureFlags::
            fixMountingCoordinatorReportedPendingTransactionsOnAndroid());
    if (!mountingTransaction.has_value()) {
      return;
    }

    std::unique_lock<std::mutex> lock(pendingTransactionsMutex_);
    auto pendingTransaction = std::find_if(
        pendingTransactions_.begin(),
        pendingTransactions_.end(),
        [&](const auto& transaction) {
          return transaction.getSurfaceId() ==
              mountingTransaction->getSurfaceId();
        });

    if (pendingTransaction != pendingTransactions_.end()) {
      pendingTransaction->mergeWith(std::move(*mountingTransaction));
    } else {
      pendingTransactions_.push_back(std::move(*mountingTransaction));
    }
  }
}

void FabricUIManagerBinding::schedulerShouldRenderTransactions(
    const std::shared_ptr<const MountingCoordinator>& mountingCoordinator) {
  auto mountingManager =
      getMountingManager("schedulerShouldRenderTransactions");
  if (!mountingManager) {
    return;
  }
  if (ReactNativeFeatureFlags::enableAccumulatedUpdatesInRawPropsAndroid()) {
    auto mountingTransaction = mountingCoordinator->pullTransaction();
    if (mountingTransaction.has_value()) {
      auto transaction = std::move(*mountingTransaction);
      mountingManager->executeMount(transaction);
    }
  } else {
    std::vector<MountingTransaction> pendingTransactions;

    {
      // Retain the lock to access the pending transactions but not to execute
      // the mount operations because that method can call into this method
      // again.
      //
      // This can be re-entrant when mounting manager triggers state updates
      // synchronously (this can happen when committing from the UI thread).
      // This is safe because we're already combining all the transactions for
      // the same surface ID in a single transaction in the pending transactions
      // list, so operations won't run out of order.
      std::unique_lock<std::mutex> lock(pendingTransactionsMutex_);
      pendingTransactions_.swap(pendingTransactions);
    }

    for (auto& transaction : pendingTransactions) {
      mountingManager->executeMount(transaction);
    }
  }
}

void FabricUIManagerBinding::schedulerDidRequestPreliminaryViewAllocation(
    const ShadowNode& shadowNode) {
  auto mountingManager = getMountingManager("preallocateView");
  if (!mountingManager) {
    return;
  }
  mountingManager->maybePreallocateShadowNode(shadowNode);
  // Only the Views of ShadowNode that were pre-allocated (forms views) needs
  // to be destroyed if the ShadowNode is destroyed but it was never mounted
  // on the screen.
  if (shadowNode.getTraits().check(ShadowNodeTraits::Trait::FormsView)) {
    shadowNode.getFamily().onUnmountedFamilyDestroyed(
        [weakMountingManager =
             std::weak_ptr(mountingManager)](const ShadowNodeFamily& family) {
          if (auto mountingManager = weakMountingManager.lock()) {
            mountingManager->destroyUnmountedShadowNode(family);
          }
        });
  }
}

void FabricUIManagerBinding::schedulerDidDispatchCommand(
    const ShadowView& shadowView,
    const std::string& commandName,
    const folly::dynamic& args) {
  auto mountingManager = getMountingManager("schedulerDidDispatchCommand");
  if (!mountingManager) {
    return;
  }
  mountingManager->dispatchCommand(shadowView, commandName, args);
}

void FabricUIManagerBinding::schedulerDidSendAccessibilityEvent(
    const ShadowView& shadowView,
    const std::string& eventType) {
  auto mountingManager =
      getMountingManager("schedulerDidSendAccessibilityEvent");
  if (!mountingManager) {
    return;
  }
  mountingManager->sendAccessibilityEvent(shadowView, eventType);
}

void FabricUIManagerBinding::schedulerDidSetIsJSResponder(
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

void FabricUIManagerBinding::onAnimationStarted() {
  auto mountingManager = getMountingManager("onAnimationStarted");
  if (!mountingManager) {
    return;
  }
  mountingManager->onAnimationStarted();
}

void FabricUIManagerBinding::onAllAnimationsComplete() {
  auto mountingManager = getMountingManager("onAnimationComplete");
  if (!mountingManager) {
    return;
  }
  mountingManager->onAllAnimationsComplete();
}

void FabricUIManagerBinding::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", FabricUIManagerBinding::initHybrid),
      makeNativeMethod(
          "installFabricUIManager",
          FabricUIManagerBinding::installFabricUIManager),
      makeNativeMethod("startSurface", FabricUIManagerBinding::startSurface),
      makeNativeMethod(
          "startSurfaceWithConstraints",
          FabricUIManagerBinding::startSurfaceWithConstraints),
      makeNativeMethod("stopSurface", FabricUIManagerBinding::stopSurface),
      makeNativeMethod(
          "setConstraints", FabricUIManagerBinding::setConstraints),
      makeNativeMethod(
          "setPixelDensity", FabricUIManagerBinding::setPixelDensity),
      makeNativeMethod(
          "driveCxxAnimations", FabricUIManagerBinding::driveCxxAnimations),
      makeNativeMethod(
          "drainPreallocateViewsQueue",
          FabricUIManagerBinding::drainPreallocateViewsQueue),
      makeNativeMethod("reportMount", FabricUIManagerBinding::reportMount),
      makeNativeMethod(
          "uninstallFabricUIManager",
          FabricUIManagerBinding::uninstallFabricUIManager),
      makeNativeMethod(
          "startSurfaceWithSurfaceHandler",
          FabricUIManagerBinding::startSurfaceWithSurfaceHandler),
      makeNativeMethod(
          "stopSurfaceWithSurfaceHandler",
          FabricUIManagerBinding::stopSurfaceWithSurfaceHandler),
      makeNativeMethod(
          "findNextFocusableElementMetrics",
          FabricUIManagerBinding::findNextFocusableElementMetrics),
  });
}

} // namespace facebook::react
