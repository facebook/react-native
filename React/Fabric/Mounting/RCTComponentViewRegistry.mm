/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTComponentViewRegistry.h"

#import <Foundation/NSMapTable.h>
#import <React/RCTAssert.h>

const NSInteger RCTComponentViewRegistryRecyclePoolMaxSize = 256;

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
  UIView<RCTComponentViewProtocol> *componentView =
    [self _dequeueComponentViewWithName:componentName];
  componentView.tag = tag;
  [_registry setObject:componentView forKey:(__bridge id)(void *)tag];
  return componentView;
}

- (void)enqueueComponentViewWithName:(NSString *)componentName
                                 tag:(ReactTag)tag
                       componentView:(UIView<RCTComponentViewProtocol> *)componentView
{
  RCTAssertMainQueue();
  [_registry removeObjectForKey:(__bridge id)(void *)tag];
  componentView.tag = 0;
  [self _enqueueComponentViewWithName:componentName componentView:componentView];
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
