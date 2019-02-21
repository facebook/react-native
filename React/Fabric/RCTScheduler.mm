/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTScheduler.h"

#import <react/debug/SystraceSection.h>
#import <react/uimanager/ComponentDescriptorFactory.h>
#import <react/uimanager/ContextContainer.h>
#import <react/uimanager/Scheduler.h>
#import <react/uimanager/SchedulerDelegate.h>

#import <React/RCTFollyConvert.h>

#import "RCTConversions.h"

using namespace facebook::react;

class SchedulerDelegateProxy: public SchedulerDelegate {
public:
  SchedulerDelegateProxy(void *scheduler):
    scheduler_(scheduler) {}

  void schedulerDidFinishTransaction(Tag rootTag, const ShadowViewMutationList &mutations, const long commitStartTime, const long layoutTime) override {
    RCTScheduler *scheduler = (__bridge RCTScheduler *)scheduler_;
    [scheduler.delegate schedulerDidFinishTransaction:mutations rootTag:rootTag];
  }

  void schedulerDidRequestPreliminaryViewAllocation(SurfaceId surfaceId, ComponentName componentName, bool isLayoutable, ComponentHandle componentHandle) override {
    if (!isLayoutable) {
      return;
    }

    RCTScheduler *scheduler = (__bridge RCTScheduler *)scheduler_;
    [scheduler.delegate schedulerOptimisticallyCreateComponentViewWithComponentHandle:componentHandle];
  }

private:
  void *scheduler_;
};

@implementation RCTScheduler {
  std::shared_ptr<Scheduler> _scheduler;
  std::shared_ptr<SchedulerDelegateProxy> _delegateProxy;
}

- (instancetype)initWithContextContainer:(std::shared_ptr<void>)contextContainer
{
  if (self = [super init]) {
    _delegateProxy = std::make_shared<SchedulerDelegateProxy>((__bridge void *)self);
    _scheduler = std::make_shared<Scheduler>(std::static_pointer_cast<ContextContainer>(contextContainer), getDefaultComponentRegistryFactory());
    _scheduler->setDelegate(_delegateProxy.get());
  }

  return self;
}

- (void)dealloc
{
  _scheduler->setDelegate(nullptr);
}

- (void)startSurfaceWithSurfaceId:(SurfaceId)surfaceId
                       moduleName:(NSString *)moduleName
                     initailProps:(NSDictionary *)initialProps
                layoutConstraints:(LayoutConstraints)layoutConstraints
                    layoutContext:(LayoutContext)layoutContext;
{
  SystraceSection s("-[RCTScheduler startSurfaceWithSurfaceId:...]");

  auto props = convertIdToFollyDynamic(initialProps);
  _scheduler->startSurface(
      surfaceId,
      RCTStringFromNSString(moduleName),
      props,
      layoutConstraints,
      layoutContext);
  _scheduler->renderTemplateToSurface(
      surfaceId,
      props.getDefault("navigationConfig")
          .getDefault("initialUITemplate", "")
          .getString());
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

@end
