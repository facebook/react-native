/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTScheduler.h"

#import <cxxreact/SystraceSection.h>
#import <react/featureflags/ReactNativeFeatureFlags.h>
#import <react/renderer/animations/LayoutAnimationDriver.h>
#import <react/renderer/componentregistry/ComponentDescriptorFactory.h>
#import <react/renderer/scheduler/Scheduler.h>
#import <react/renderer/scheduler/SchedulerDelegate.h>
#import <react/utils/RunLoopObserver.h>

#import <React/RCTFollyConvert.h>

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

 private:
  void *scheduler_;
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

@end
