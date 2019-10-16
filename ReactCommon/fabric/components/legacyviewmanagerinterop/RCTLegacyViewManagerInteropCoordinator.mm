/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RCTLegacyViewManagerInteropCoordinator.h"
#include <React/RCTComponentData.h>
#include <React/RCTFollyConvert.h>
#include <React/RCTUtils.h>
#include <folly/json.h>

using namespace facebook::react;

@implementation RCTLegacyViewManagerInteropCoordinator {
  RCTComponentData *_componentData;
  /*
   Each instnace of `RCTLegacyViewManagerInteropComponentView` registers a block to which events are dispatched.
   This is the container that maps unretained UIView pointer to a block to which the event is dispatched.
   */
  NSMutableDictionary<NSValue *, InterceptorBlock> *_eventInterceptors;
}

- (instancetype)initWithComponentData:(RCTComponentData *)componentData;
{
  if (self = [super init]) {
    _componentData = componentData;

    _eventInterceptors = [NSMutableDictionary new];

    __weak __typeof(self) weakSelf = self;
    _componentData.eventInterceptor = ^(NSString *eventName, NSDictionary *event, id sender) {
      __typeof(self) strongSelf = weakSelf;
      InterceptorBlock block =
          [strongSelf->_eventInterceptors objectForKey:[NSValue valueWithNonretainedObject:sender]];
      if (block) {
        block(std::string([RCTNormalizeInputEventName(eventName) UTF8String]), convertIdToFollyDynamic(event));
      }
    };
  }
  return self;
}

- (UIView *)viewWithInterceptor:(InterceptorBlock)block
{
  UIView *view = [_componentData createViewWithTag:NULL];
  [_eventInterceptors setObject:block forKey:[NSValue valueWithNonretainedObject:view]];
  return view;
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

@end
