/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTLegacyViewManagerInteropCoordinator.h"
#include <React/RCTComponentData.h>
#include <folly/json.h>

static NSDictionary<NSString *, id> *something(folly::dynamic const &props)
{
  auto json = folly::toJson(props);
  NSData *data = [NSData dataWithBytes:json.c_str() length:json.size()];
  NSDictionary<NSString *, id> *result = [NSJSONSerialization JSONObjectWithData:data options:0 error:NULL];
  return result;
}

@implementation RCTLegacyViewManagerInteropCoordinator {
  RCTComponentData *_componentData;
}

- (instancetype)initWithComponentData:(RCTComponentData *)componentData;
{
  if (self = [super init]) {
    _componentData = componentData;
  }
  return self;
}

- (UIView *)view
{
  return [_componentData createViewWithTag:NULL];
}

- (void)setProps:(folly::dynamic const &)props forView:(UIView *)view
{
  NSDictionary<NSString *, id> *convertedProps = something(props);
  [_componentData setProps:convertedProps forView:view];
}

@end
