/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTComponentViewRegistry.h"

#import <Foundation/NSMapTable.h>
#import <React/RCTAssert.h>

#define LEGACY_UIMANAGER_INTEGRATION_ENABLED 1

#ifdef LEGACY_UIMANAGER_INTEGRATION_ENABLED

#import <React/RCTUIManager.h>
#import <React/RCTBridge+Private.h>

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
  NSMapTable<id, UIView<RCTComponentViewProtocol> *> *_registry;
  NSMapTable<NSString *, NSHashTable<UIView<RCTComponentViewProtocol> *> *> *_recyclePool;
}

- (instancetype)init
{
  if (self = [super init]) {
    _registry = [NSMapTable mapTableWithKeyOptions:NSPointerFunctionsIntegerPersonality | NSPointerFunctionsOpaqueMemory
                                      valueOptions:NSPointerFunctionsObjectPersonality];
    _recyclePool = [NSMapTable mapTableWithKeyOptions:NSPointerFunctionsObjectPersonality
                                         valueOptions:NSPointerFunctionsObjectPersonality];
  }

  return self;
}

- (UIView<RCTComponentViewProtocol> *)dequeueComponentViewWithName:(NSString *)componentName
                                                               tag:(ReactTag)tag
{
  RCTAssertMainQueue();

  RCTAssert(![_registry objectForKey:(__bridge id)(void *)tag],
    @"RCTComponentViewRegistry: Attempt to dequeue already registered component.");

  UIView<RCTComponentViewProtocol> *componentView =
    [self _dequeueComponentViewWithName:componentName];
  componentView.tag = tag;
  [_registry setObject:componentView forKey:(__bridge id)(void *)tag];

#ifdef LEGACY_UIMANAGER_INTEGRATION_ENABLED
  [RCTUIManager registerView:componentView];
#endif

  return componentView;
}

- (void)enqueueComponentViewWithName:(NSString *)componentName
                                 tag:(ReactTag)tag
                       componentView:(UIView<RCTComponentViewProtocol> *)componentView
{
  RCTAssertMainQueue();

  RCTAssert([_registry objectForKey:(__bridge id)(void *)tag],
    @"RCTComponentViewRegistry: Attempt to enqueue unregistered component.");

#ifdef LEGACY_UIMANAGER_INTEGRATION_ENABLED
  [RCTUIManager unregisterView:componentView];
#endif

  [_registry removeObjectForKey:(__bridge id)(void *)tag];
  componentView.tag = 0;
  [self _enqueueComponentViewWithName:componentName componentView:componentView];
}

- (void)preliminaryCreateComponentViewWithName:(NSString *)componentName
{
  RCTAssertMainQueue();
  [self _enqueueComponentViewWithName:componentName
                        componentView:[self _createComponentViewWithName:componentName]];
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

- (UIView<RCTComponentViewProtocol> *)_createComponentViewWithName:(NSString *)componentName
{
  RCTAssertMainQueue();
  // This is temporary approach.
  NSString *className = [NSString stringWithFormat:@"RCT%@ComponentView", componentName];
  UIView<RCTComponentViewProtocol> *componentView = [[NSClassFromString(className) alloc] init];
  return componentView;
}

- (nullable UIView<RCTComponentViewProtocol> *)_dequeueComponentViewWithName:(NSString *)componentName
{
  RCTAssertMainQueue();
  NSHashTable<UIView<RCTComponentViewProtocol> *> *componentViews = [_recyclePool objectForKey:componentName];
  if (!componentViews || componentViews.count == 0) {
    return [self _createComponentViewWithName:componentName];
  }

  UIView<RCTComponentViewProtocol> *componentView = [componentViews anyObject];
  [componentViews removeObject:componentView];
  return componentView;
}

- (void)_enqueueComponentViewWithName:(NSString *)componentName
                        componentView:(UIView<RCTComponentViewProtocol> *)componentView
{
  RCTAssertMainQueue();
  [componentView prepareForRecycle];

  NSHashTable<UIView<RCTComponentViewProtocol> *> *componentViews = [_recyclePool objectForKey:componentName];
  if (!componentViews) {
    componentViews = [NSHashTable hashTableWithOptions:NSPointerFunctionsObjectPersonality];
    [_recyclePool setObject:componentViews forKey:componentName];
  }

  if (componentViews.count >= RCTComponentViewRegistryRecyclePoolMaxSize) {
    return;
  }

  [componentViews addObject:componentView];
}

@end
