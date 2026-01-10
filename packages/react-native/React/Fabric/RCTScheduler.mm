/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTScheduler.h"

#import <cxxreact/TraceSection.h>
#import <react/featureflags/ReactNativeFeatureFlags.h>
#import <react/renderer/animations/LayoutAnimationDriver.h>
#import <react/renderer/componentregistry/ComponentDescriptorFactory.h>
#import <react/renderer/scheduler/Scheduler.h>
#import <react/renderer/scheduler/SchedulerDelegate.h>
#import <react/utils/RunLoopObserver.h>

#include <atomic>
#include <mutex>
#include <unordered_map>

#import "PlatformRunLoopObserver.h"
#import "RCTConversions.h"

using namespace facebook::react;

class SchedulerDelegateProxy : public SchedulerDelegate {
 public:
  SchedulerDelegateProxy(void *scheduler) : scheduler_(scheduler) {}

  void schedulerDidFinishTransaction(const std::shared_ptr<const MountingCoordinator> &mountingCoordinator) override
  {
    RCTScheduler *scheduler = (__bridge RCTScheduler *)scheduler_;
    [scheduler.delegate schedulerDidFinishTransaction:mountingCoordinator];
  }

  void schedulerShouldRenderTransactions(const std::shared_ptr<const MountingCoordinator> &mountingCoordinator) override
  {
    RCTScheduler *scheduler = (__bridge RCTScheduler *)scheduler_;
    [scheduler.delegate schedulerShouldRenderTransactions:mountingCoordinator];
  }

  void schedulerDidRequestPreliminaryViewAllocation(const ShadowNode &shadowNode) override
  {
    // Does nothing.
    // This delegate method is not currently used on iOS.
  }

  void schedulerDidDispatchCommand(
      const ShadowView &shadowView,
      const std::string &commandName,
      const folly::dynamic &args) override
  {
    RCTScheduler *scheduler = (__bridge RCTScheduler *)scheduler_;
    [scheduler.delegate schedulerDidDispatchCommand:shadowView commandName:commandName args:args];
  }

  void schedulerDidSetIsJSResponder(const ShadowView &shadowView, bool isJSResponder, bool blockNativeResponder)
      override
  {
    RCTScheduler *scheduler = (__bridge RCTScheduler *)scheduler_;
    [scheduler.delegate schedulerDidSetIsJSResponder:isJSResponder
                                blockNativeResponder:blockNativeResponder
                                       forShadowView:shadowView];
  }

  void schedulerDidSendAccessibilityEvent(const ShadowView &shadowView, const std::string &eventType) override
  {
    RCTScheduler *scheduler = (__bridge RCTScheduler *)scheduler_;
    [scheduler.delegate schedulerDidSendAccessibilityEvent:shadowView eventType:eventType];
  }

  void schedulerShouldSynchronouslyUpdateViewOnUIThread(facebook::react::Tag tag, const folly::dynamic &props) override
  {
    RCTScheduler *scheduler = (__bridge RCTScheduler *)scheduler_;
    [scheduler.delegate schedulerDidSynchronouslyUpdateViewOnUIThread:tag props:props];
  }

  void schedulerDidUpdateShadowTree(const std::unordered_map<Tag, folly::dynamic> &tagToProps) override
  {
    // Does nothing.
    // This delegate method is not currently used on iOS.
  }

  void schedulerMeasure(SurfaceId surfaceId, Tag tag, MeasureCallback callback) override
  {
    RCTScheduler *scheduler = (__bridge RCTScheduler *)scheduler_;
    id<RCTSchedulerDelegate> delegate = scheduler.delegate;
    if (delegate == nil) {
      callback(std::nullopt);
      return;
    }

    auto callbackId = nextMeasureCallbackId_.fetch_add(1);
    {
      std::lock_guard<std::mutex> lock(pendingMeasureMutex_);
      pendingMeasureCallbacks_.emplace(callbackId, std::move(callback));
    }

    [delegate schedulerMeasure:surfaceId reactTag:tag inWindow:NO callbackId:callbackId];
  }

  void schedulerMeasureInWindow(SurfaceId surfaceId, Tag tag, MeasureInWindowCallback callback) override
  {
    RCTScheduler *scheduler = (__bridge RCTScheduler *)scheduler_;
    id<RCTSchedulerDelegate> delegate = scheduler.delegate;
    if (delegate == nil) {
      callback(std::nullopt);
      return;
    }

    auto callbackId = nextMeasureCallbackId_.fetch_add(1);
    {
      std::lock_guard<std::mutex> lock(pendingMeasureMutex_);
      pendingMeasureInWindowCallbacks_.emplace(callbackId, std::move(callback));
    }

    [delegate schedulerMeasure:surfaceId reactTag:tag inWindow:YES callbackId:callbackId];
  }

  void onMeasureResult(int64_t callbackId, bool inWindow, bool success, double x, double y, double width, double height)
  {
    if (inWindow) {
      MeasureInWindowCallback callback;
      {
        std::lock_guard<std::mutex> lock(pendingMeasureMutex_);
        auto it = pendingMeasureInWindowCallbacks_.find(callbackId);
        if (it == pendingMeasureInWindowCallbacks_.end()) {
          return;
        }
        callback = std::move(it->second);
        pendingMeasureInWindowCallbacks_.erase(it);
      }

      if (!success) {
        callback(std::nullopt);
        return;
      }

      MeasureInWindowResult result;
      result.x = x;
      result.y = y;
      result.width = width;
      result.height = height;
      callback(result);
      return;
    }

    MeasureCallback callback;
    {
      std::lock_guard<std::mutex> lock(pendingMeasureMutex_);
      auto it = pendingMeasureCallbacks_.find(callbackId);
      if (it == pendingMeasureCallbacks_.end()) {
        return;
      }
      callback = std::move(it->second);
      pendingMeasureCallbacks_.erase(it);
    }

    if (!success) {
      callback(std::nullopt);
      return;
    }

    MeasureResult result;
    result.pageX = x;
    result.pageY = y;
    result.width = width;
    result.height = height;
    callback(result);
  }

 private:
  void *scheduler_;

  std::atomic<int64_t> nextMeasureCallbackId_{1};
  std::mutex pendingMeasureMutex_;
  std::unordered_map<int64_t, MeasureCallback> pendingMeasureCallbacks_;
  std::unordered_map<int64_t, MeasureInWindowCallback> pendingMeasureInWindowCallbacks_;
};

class LayoutAnimationDelegateProxy : public LayoutAnimationStatusDelegate, public RunLoopObserver::Delegate {
 public:
  LayoutAnimationDelegateProxy(void *scheduler) : scheduler_(scheduler) {}
  virtual ~LayoutAnimationDelegateProxy() {}

  void onAnimationStarted() override
  {
    RCTScheduler *scheduler = (__bridge RCTScheduler *)scheduler_;
    [scheduler onAnimationStarted];
  }

  /**
   * Called when the LayoutAnimation engine completes all pending animations.
   */
  void onAllAnimationsComplete() override
  {
    RCTScheduler *scheduler = (__bridge RCTScheduler *)scheduler_;
    [scheduler onAllAnimationsComplete];
  }

  void activityDidChange(const RunLoopObserver::Delegate *delegate, RunLoopObserver::Activity activity)
      const noexcept override
  {
    RCTScheduler *scheduler = (__bridge RCTScheduler *)scheduler_;
    [scheduler animationTick];
  }

 private:
  void *scheduler_;
};

@implementation RCTScheduler {
  std::unique_ptr<Scheduler> _scheduler;
  std::shared_ptr<LayoutAnimationDriver> _animationDriver;
  std::unique_ptr<SchedulerDelegateProxy> _delegateProxy;
  std::shared_ptr<LayoutAnimationDelegateProxy> _layoutAnimationDelegateProxy;
  std::unique_ptr<const PlatformRunLoopObserver> _uiRunLoopObserver;
}

- (instancetype)initWithToolbox:(SchedulerToolbox)toolbox
{
  if (self = [super init]) {
    _delegateProxy = std::make_unique<SchedulerDelegateProxy>((__bridge void *)self);

    if (ReactNativeFeatureFlags::enableLayoutAnimationsOnIOS()) {
      _layoutAnimationDelegateProxy = std::make_shared<LayoutAnimationDelegateProxy>((__bridge void *)self);
      _animationDriver = std::make_shared<LayoutAnimationDriver>(
          toolbox.runtimeExecutor, toolbox.contextContainer, _layoutAnimationDelegateProxy.get());

      _uiRunLoopObserver = std::make_unique<MainRunLoopObserver>(
          RunLoopObserver::Activity::BeforeWaiting, _layoutAnimationDelegateProxy);

      _uiRunLoopObserver->setDelegate(_layoutAnimationDelegateProxy.get());
    }

    _scheduler = std::make_unique<Scheduler>(
        toolbox, (_animationDriver ? _animationDriver.get() : nullptr), _delegateProxy.get());
  }

  return self;
}

- (void)animationTick
{
  _scheduler->animationTick();
}

- (void)reportMount:(facebook::react::SurfaceId)surfaceId
{
  _scheduler->reportMount(surfaceId);
}

- (void)dealloc
{
  if (_animationDriver) {
    _animationDriver->setLayoutAnimationStatusDelegate(nullptr);
  }

  _scheduler->setDelegate(nullptr);
}

- (void)registerSurface:(const facebook::react::SurfaceHandler &)surfaceHandler
{
  _scheduler->registerSurface(surfaceHandler);
}

- (void)unregisterSurface:(const facebook::react::SurfaceHandler &)surfaceHandler
{
  _scheduler->unregisterSurface(surfaceHandler);
}

- (const ComponentDescriptor *)findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN:(ComponentHandle)handle
{
  return _scheduler->findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN(handle);
}

- (void)setupAnimationDriver:(const facebook::react::SurfaceHandler &)surfaceHandler
{
  surfaceHandler.getMountingCoordinator()->setMountingOverrideDelegate(_animationDriver);
}

- (void)onAnimationStarted
{
  if (_uiRunLoopObserver) {
    _uiRunLoopObserver->enable();
  }
}

- (void)onAllAnimationsComplete
{
  if (_uiRunLoopObserver) {
    _uiRunLoopObserver->disable();
  }
}

- (void)addEventListener:(const std::shared_ptr<EventListener> &)listener
{
  return _scheduler->addEventListener(listener);
}

- (void)removeEventListener:(const std::shared_ptr<EventListener> &)listener
{
  return _scheduler->removeEventListener(listener);
}

- (const std::shared_ptr<facebook::react::UIManager>)uiManager
{
  return _scheduler->getUIManager();
}

- (void)onMeasureResultWithCallbackId:(int64_t)callbackId
                             inWindow:(BOOL)inWindow
                              success:(BOOL)success
                                    x:(double)x
                                    y:(double)y
                                width:(double)width
                               height:(double)height
{
  if (_delegateProxy) {
    _delegateProxy->onMeasureResult(callbackId, inWindow, success, x, y, width, height);
  }
}

@end
