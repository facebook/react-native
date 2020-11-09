/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTScheduler.h"

#import <react/renderer/animations/LayoutAnimationDriver.h>
#import <react/renderer/componentregistry/ComponentDescriptorFactory.h>
#import <react/renderer/debug/SystraceSection.h>
#import <react/renderer/scheduler/Scheduler.h>
#import <react/renderer/scheduler/SchedulerDelegate.h>
#include <react/utils/RunLoopObserver.h>

#import <React/RCTFollyConvert.h>

#import "RCTConversions.h"

using namespace facebook::react;

class SchedulerDelegateProxy : public SchedulerDelegate {
 public:
  SchedulerDelegateProxy(void *scheduler) : scheduler_(scheduler) {}

  void schedulerDidFinishTransaction(MountingCoordinator::Shared const &mountingCoordinator) override
  {
    RCTScheduler *scheduler = (__bridge RCTScheduler *)scheduler_;
    [scheduler.delegate schedulerDidFinishTransaction:mountingCoordinator];
  }

  void schedulerDidRequestPreliminaryViewAllocation(SurfaceId surfaceId, const ShadowView &shadowView) override
  {
    // Does nothing.
    // Preemptive allocation of native views on iOS does not require this call.
  }

  void schedulerDidDispatchCommand(
      const ShadowView &shadowView,
      const std::string &commandName,
      const folly::dynamic args) override
  {
    RCTScheduler *scheduler = (__bridge RCTScheduler *)scheduler_;
    [scheduler.delegate schedulerDidDispatchCommand:shadowView commandName:commandName args:args];
  }

  void schedulerDidSetJSResponder(
      SurfaceId surfaceId,
      const ShadowView &shadowView,
      const ShadowView &initialShadowView,
      bool blockNativeResponder) override
  {
    // Does nothing for now.
  }

  void schedulerDidClearJSResponder() override
  {
    // Does nothing for now.
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

  void activityDidChange(RunLoopObserver::Delegate const *delegate, RunLoopObserver::Activity activity) const
      noexcept override
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
  std::shared_ptr<SchedulerDelegateProxy> _delegateProxy;
  std::shared_ptr<LayoutAnimationDelegateProxy> _layoutAnimationDelegateProxy;
  RunLoopObserver::Unique _uiRunLoopObserver;
  BOOL _layoutAnimationsEnabled;
}

- (instancetype)initWithToolbox:(facebook::react::SchedulerToolbox)toolbox
{
  if (self = [super init]) {
    auto reactNativeConfig =
        toolbox.contextContainer->at<std::shared_ptr<const ReactNativeConfig>>("ReactNativeConfig");
    _layoutAnimationsEnabled = reactNativeConfig->getBool("react_fabric:enabled_layout_animations_ios");

    _delegateProxy = std::make_shared<SchedulerDelegateProxy>((__bridge void *)self);

    if (_layoutAnimationsEnabled) {
      _layoutAnimationDelegateProxy = std::make_shared<LayoutAnimationDelegateProxy>((__bridge void *)self);
      _animationDriver =
          std::make_shared<LayoutAnimationDriver>(toolbox.runtimeExecutor, _layoutAnimationDelegateProxy.get());
      _uiRunLoopObserver =
          toolbox.mainRunLoopObserverFactory(RunLoopObserver::Activity::BeforeWaiting, _layoutAnimationDelegateProxy);
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

- (void)dealloc
{
  if (_animationDriver) {
    _animationDriver->setLayoutAnimationStatusDelegate(nullptr);
  }
  _animationDriver = nullptr;
}

- (void)startSurfaceWithSurfaceId:(SurfaceId)surfaceId
                       moduleName:(NSString *)moduleName
                     initialProps:(NSDictionary *)initialProps
                layoutConstraints:(LayoutConstraints)layoutConstraints
                    layoutContext:(LayoutContext)layoutContext
{
  SystraceSection s("-[RCTScheduler startSurfaceWithSurfaceId:...]");

  auto props = convertIdToFollyDynamic(initialProps);
  _scheduler->startSurface(
      surfaceId, RCTStringFromNSString(moduleName), props, layoutConstraints, layoutContext, _animationDriver);
  _scheduler->renderTemplateToSurface(
      surfaceId, props.getDefault("navigationConfig").getDefault("initialUITemplate", "").getString());
}

- (void)stopSurfaceWithSurfaceId:(SurfaceId)surfaceId
{
  SystraceSection s("-[RCTScheduler stopSurfaceWithSurfaceId:]");
  _scheduler->stopSurface(surfaceId);
}

- (CGSize)measureSurfaceWithLayoutConstraints:(LayoutConstraints)layoutConstraints
                                layoutContext:(LayoutContext)layoutContext
                                    surfaceId:(SurfaceId)surfaceId
{
  SystraceSection s("-[RCTScheduler measureSurfaceWithLayoutConstraints:]");
  return RCTCGSizeFromSize(_scheduler->measureSurface(surfaceId, layoutConstraints, layoutContext));
}

- (void)constraintSurfaceLayoutWithLayoutConstraints:(LayoutConstraints)layoutConstraints
                                       layoutContext:(LayoutContext)layoutContext
                                           surfaceId:(SurfaceId)surfaceId
{
  SystraceSection s("-[RCTScheduler constraintSurfaceLayoutWithLayoutConstraints:]");
  _scheduler->constraintSurfaceLayout(surfaceId, layoutConstraints, layoutContext);
}

- (ComponentDescriptor const *)findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN:(ComponentHandle)handle
{
  return _scheduler->findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN(handle);
}

- (MountingCoordinator::Shared)mountingCoordinatorWithSurfaceId:(SurfaceId)surfaceId
{
  return _scheduler->findMountingCoordinator(surfaceId);
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

@end
