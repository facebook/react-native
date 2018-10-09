/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTScheduler.h"

#import <fabric/uimanager/ContextContainer.h>
#import <fabric/uimanager/Scheduler.h>
#import <fabric/uimanager/SchedulerDelegate.h>

#import <React/RCTFollyConvert.h>

#import "RCTConversions.h"

using namespace facebook::react;

class SchedulerDelegateProxy: public SchedulerDelegate {
public:
  SchedulerDelegateProxy(void *scheduler):
    scheduler_(scheduler) {}

  void schedulerDidFinishTransaction(Tag rootTag, const ShadowViewMutationList &mutations) override {
    RCTScheduler *scheduler = (__bridge RCTScheduler *)scheduler_;
    [scheduler.delegate schedulerDidFinishTransaction:mutations rootTag:rootTag];
  }

  void schedulerDidRequestPreliminaryViewAllocation(ComponentName componentName) override {
    RCTScheduler *scheduler = (__bridge RCTScheduler *)scheduler_;
    [scheduler.delegate schedulerDidRequestPreliminaryViewAllocationWithComponentName:RCTNSStringFromString(componentName, NSASCIIStringEncoding)];
  }

private:
  void *scheduler_;
};

@implementation RCTScheduler {
  std::shared_ptr<Scheduler> _scheduler;
  std::shared_ptr<SchedulerDelegateProxy> _delegateProxy;
}

- (instancetype)initWithContextContainer:(std::shared_ptr<void>)contextContatiner
{
  if (self = [super init]) {
    _delegateProxy = std::make_shared<SchedulerDelegateProxy>((__bridge void *)self);
    _scheduler = std::make_shared<Scheduler>(std::static_pointer_cast<ContextContainer>(contextContatiner));
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
{
  _scheduler->startSurface(
    surfaceId,
    RCTStringFromNSString(moduleName),
    convertIdToFollyDynamic(initialProps)
  );
}

- (void)stopSurfaceWithSurfaceId:(SurfaceId)surfaceId
{
  _scheduler->stopSurface(surfaceId);
}

- (CGSize)measureSurfaceWithLayoutConstraints:(LayoutConstraints)layoutConstraints
                                layoutContext:(LayoutContext)layoutContext
                                    surfaceId:(SurfaceId)surfaceId
{
  return RCTCGSizeFromSize(_scheduler->measureSurface(surfaceId, layoutConstraints, layoutContext));
}

- (BOOL)constraintSurfaceLayoutWithLayoutConstraints:(LayoutConstraints)layoutConstraints
                                       layoutContext:(LayoutContext)layoutContext
                                           surfaceId:(SurfaceId)surfaceId
{
  return _scheduler->constraintSurfaceLayout(surfaceId, layoutConstraints, layoutContext);
}

@end

@implementation RCTScheduler (Deprecated)

- (std::shared_ptr<FabricUIManager>)uiManager_DO_NOT_USE
{
  return _scheduler->getUIManager_DO_NOT_USE();
}

@end
