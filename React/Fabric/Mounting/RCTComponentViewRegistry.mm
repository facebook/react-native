/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTComponentViewRegistry.h"

#import <Foundation/NSMapTable.h>
#import <React/RCTAssert.h>

using namespace facebook::react;

#define LEGACY_UIMANAGER_INTEGRATION_ENABLED 1

#ifdef LEGACY_UIMANAGER_INTEGRATION_ENABLED

#import <React/RCTBridge+Private.h>
#import <React/RCTUIManager.h>

/**
 * Warning: This is a total hack and temporary solution.
 * Unless we have a pure Fabric-based implementation of UIManager commands
 * delivery pipeline, we have to leverage existing infra. This code tricks
 * legacy UIManager by registering all Fabric-managed views in it,
 * hence existing command-delivery infra can reach "foreign" views using
 * the old pipeline.
 */
@interface RCTUIManager ()
- (NSMutableDictionary<NSNumber *, UIView *> *)viewRegistry;
@end

@interface RCTUIManager (Hack)

+ (void)registerView:(UIView *)view;
+ (void)unregisterView:(UIView *)view;

@end

@implementation RCTUIManager (Hack)

+ (void)registerView:(UIView *)view
{
  if (!view) {
    return;
  }

  RCTUIManager *uiManager = [[RCTBridge currentBridge] uiManager];
  view.reactTag = @(view.tag);
  [uiManager.viewRegistry setObject:view forKey:@(view.tag)];
}

+ (void)unregisterView:(UIView *)view
{
  if (!view) {
    return;
  }

  RCTUIManager *uiManager = [[RCTBridge currentBridge] uiManager];
  view.reactTag = nil;
  [uiManager.viewRegistry removeObjectForKey:@(view.tag)];
}

@end

#endif

const NSInteger RCTComponentViewRegistryRecyclePoolMaxSize = 1024;

@implementation RCTComponentViewRegistry {
  NSMapTable<id /* ReactTag */, UIView<RCTComponentViewProtocol> *> *_registry;
  NSMapTable<id /* ComponentHandle */, NSHashTable<UIView<RCTComponentViewProtocol> *> *> *_recyclePool;
}

- (instancetype)init
{
  if (self = [super init]) {
    _registry = [NSMapTable mapTableWithKeyOptions:NSPointerFunctionsIntegerPersonality | NSPointerFunctionsOpaqueMemory
                                      valueOptions:NSPointerFunctionsObjectPersonality];
    _recyclePool =
        [NSMapTable mapTableWithKeyOptions:NSPointerFunctionsOpaquePersonality | NSPointerFunctionsOpaqueMemory
                              valueOptions:NSPointerFunctionsObjectPersonality];
    _componentViewFactory = [RCTComponentViewFactory standardComponentViewFactory];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleApplicationDidReceiveMemoryWarningNotification)
                                                 name:UIApplicationDidReceiveMemoryWarningNotification
                                               object:nil];
  }

  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (UIView<RCTComponentViewProtocol> *)dequeueComponentViewWithComponentHandle:(ComponentHandle)componentHandle
                                                                          tag:(ReactTag)tag
{
  RCTAssertMainQueue();

  RCTAssert(
      ![_registry objectForKey:(__bridge id)(void *)tag],
      @"RCTComponentViewRegistry: Attempt to dequeue already registered component.");

  UIView<RCTComponentViewProtocol> *componentView = [self _dequeueComponentViewWithComponentHandle:componentHandle];
  componentView.tag = tag;
  [_registry setObject:componentView forKey:(__bridge id)(void *)tag];

#ifdef LEGACY_UIMANAGER_INTEGRATION_ENABLED
  [RCTUIManager registerView:componentView];
#endif

  return componentView;
}

- (void)enqueueComponentViewWithComponentHandle:(ComponentHandle)componentHandle
                                            tag:(ReactTag)tag
                                  componentView:(UIView<RCTComponentViewProtocol> *)componentView
{
  RCTAssertMainQueue();

  RCTAssert(
      [_registry objectForKey:(__bridge id)(void *)tag],
      @"RCTComponentViewRegistry: Attempt to enqueue unregistered component.");

#ifdef LEGACY_UIMANAGER_INTEGRATION_ENABLED
  [RCTUIManager unregisterView:componentView];
#endif

  [_registry removeObjectForKey:(__bridge id)(void *)tag];
  componentView.tag = 0;
  [self _enqueueComponentViewWithComponentHandle:componentHandle componentView:componentView];
}

- (void)optimisticallyCreateComponentViewWithComponentHandle:(ComponentHandle)componentHandle
{
  RCTAssertMainQueue();
  [self _enqueueComponentViewWithComponentHandle:componentHandle
                                   componentView:[self.componentViewFactory
                                                     createComponentViewWithComponentHandle:componentHandle]];
}

- (UIView<RCTComponentViewProtocol> *)componentViewByTag:(ReactTag)tag
{
  RCTAssertMainQueue();
  return [_registry objectForKey:(__bridge id)(void *)tag];
}

- (ReactTag)tagByComponentView:(UIView<RCTComponentViewProtocol> *)componentView
{
  RCTAssertMainQueue();
  return componentView.tag;
}

- (nullable UIView<RCTComponentViewProtocol> *)_dequeueComponentViewWithComponentHandle:(ComponentHandle)componentHandle
{
  RCTAssertMainQueue();
  NSHashTable<UIView<RCTComponentViewProtocol> *> *componentViews =
      [_recyclePool objectForKey:(__bridge id)(void *)componentHandle];
  if (!componentViews || componentViews.count == 0) {
    return [self.componentViewFactory createComponentViewWithComponentHandle:componentHandle];
  }

  UIView<RCTComponentViewProtocol> *componentView = [componentViews anyObject];
  [componentViews removeObject:componentView];
  return componentView;
}

- (void)_enqueueComponentViewWithComponentHandle:(ComponentHandle)componentHandle
                                   componentView:(UIView<RCTComponentViewProtocol> *)componentView
{
  RCTAssertMainQueue();
  [componentView prepareForRecycle];

  NSHashTable<UIView<RCTComponentViewProtocol> *> *componentViews =
      [_recyclePool objectForKey:(__bridge id)(void *)componentHandle];
  if (!componentViews) {
    componentViews = [NSHashTable hashTableWithOptions:NSPointerFunctionsObjectPersonality];
    [_recyclePool setObject:componentViews forKey:(__bridge id)(void *)componentHandle];
  }

  if (componentViews.count >= RCTComponentViewRegistryRecyclePoolMaxSize) {
    return;
  }

  [componentViews addObject:componentView];
}

- (void)handleApplicationDidReceiveMemoryWarningNotification
{
  [_recyclePool removeAllObjects];
}

@end
