/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTComponentViewRegistry.h"

#import <Foundation/NSMapTable.h>
#import <React/RCTAssert.h>

@implementation RCTComponentViewRegistry {
  NSMapTable<id, UIView<RCTComponentViewProtocol> *> *_registry;
}

- (instancetype)init
{
  if (self = [super init]) {
    _registry = [NSMapTable mapTableWithKeyOptions:NSPointerFunctionsIntegerPersonality | NSPointerFunctionsOpaqueMemory
                                      valueOptions:NSPointerFunctionsObjectPersonality];
  }

  return self;
}

- (UIView<RCTComponentViewProtocol> *)dequeueComponentViewWithName:(NSString *)componentName
                                                               tag:(ReactTag)tag
{
  RCTAssertMainQueue();
  // This is temporary approach.
  NSString *className = [NSString stringWithFormat:@"RCT%@ComponentView", componentName];
  UIView<RCTComponentViewProtocol> *componentView = [[NSClassFromString(className) alloc] init];
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

@end
