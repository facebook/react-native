/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RCTLegacyViewManagerInteropCoordinator.h"
#include <React/RCTBridge+Private.h>
#include <React/RCTBridgeMethod.h>
#include <React/RCTComponentData.h>
#include <React/RCTFollyConvert.h>
#include <React/RCTModuleData.h>
#include <React/RCTUIManager.h>
#include <React/RCTUIManagerUtils.h>
#include <React/RCTUtils.h>
#include <folly/json.h>

using namespace facebook::react;

@implementation RCTLegacyViewManagerInteropCoordinator {
  RCTComponentData *_componentData;
  RCTBridge *_bridge;
  /*
   Each instnace of `RCTLegacyViewManagerInteropComponentView` registers a block to which events are dispatched.
   This is the container that maps unretained UIView pointer to a block to which the event is dispatched.
   */
  NSMutableDictionary<NSNumber *, InterceptorBlock> *_eventInterceptors;
}

- (instancetype)initWithComponentData:(RCTComponentData *)componentData bridge:(RCTBridge *)bridge;
{
  if (self = [super init]) {
    _componentData = componentData;
    _bridge = bridge;

    _eventInterceptors = [NSMutableDictionary new];

    __weak __typeof(self) weakSelf = self;
    _componentData.eventInterceptor = ^(NSString *eventName, NSDictionary *event, NSNumber *reactTag) {
      __typeof(self) strongSelf = weakSelf;
      InterceptorBlock block = [strongSelf->_eventInterceptors objectForKey:reactTag];
      if (block) {
        block(std::string([RCTNormalizeInputEventName(eventName) UTF8String]), convertIdToFollyDynamic(event));
      }
    };
  }
  return self;
}

- (void)addObserveForTag:(NSInteger)tag usingBlock:(InterceptorBlock)block
{
  [_eventInterceptors setObject:block forKey:[NSNumber numberWithInteger:tag]];
}

- (void)removeObserveForTag:(NSInteger)tag
{
  [_eventInterceptors removeObjectForKey:[NSNumber numberWithInteger:tag]];
}

- (UIView *)paperView
{
  // TODO: pass in the right tags?
  return [_componentData createViewWithTag:NULL rootTag:NULL];
}

- (void)setProps:(folly::dynamic const &)props forView:(UIView *)view
{
  NSDictionary<NSString *, id> *convertedProps = convertFollyDynamicToId(props);
  [_componentData setProps:convertedProps forView:view];
}

- (NSString *)componentViewName
{
  return RCTDropReactPrefixes(_componentData.name);
}

- (void)handleCommand:(NSString *)commandName args:(NSArray *)args reactTag:(NSInteger)tag
{
  Class managerClass = _componentData.managerClass;
  RCTModuleData *moduleData = [_bridge.batchedBridge moduleDataForName:RCTBridgeModuleNameForClass(managerClass)];
  id<RCTBridgeMethod> method;
  if ([commandName isKindOfClass:[NSNumber class]]) {
    method = moduleData.methods[[commandName intValue]];
  } else if ([commandName isKindOfClass:[NSString class]]) {
    method = moduleData.methodsByName[commandName];
    if (method == nil) {
      RCTLogError(@"No command found with name \"%@\"", commandName);
    }
  } else {
    RCTLogError(@"dispatchViewManagerCommand must be called with a string or integer command");
    return;
  }

  NSArray *newArgs = [@[ [NSNumber numberWithInteger:tag] ] arrayByAddingObjectsFromArray:args];
  [_bridge.batchedBridge
      dispatchBlock:^{
        [method invokeWithBridge:self->_bridge module:self->_componentData.manager arguments:newArgs];
        [self->_bridge.uiManager setNeedsLayout];
      }
              queue:RCTGetUIManagerQueue()];
}

@end
