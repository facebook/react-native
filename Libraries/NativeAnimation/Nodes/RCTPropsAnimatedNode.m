/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTPropsAnimatedNode.h"

#import "RCTAnimationUtils.h"
#import "RCTStyleAnimatedNode.h"
#import "RCTValueAnimatedNode.h"
#import "RCTViewPropertyMapper.h"

@implementation RCTPropsAnimatedNode

- (void)connectToView:(NSNumber *)viewTag uiManager:(RCTUIManager *)uiManager
{
  _propertyMapper = [[RCTViewPropertyMapper alloc] initWithViewTag:viewTag uiManager:uiManager];
}

- (void)disconnectFromView:(NSNumber *)viewTag
{
  _propertyMapper = nil;
}

- (void)performUpdate
{
  [super performUpdate];
  [self performViewUpdatesIfNecessary];
}

- (NSString *)propertyNameForParentTag:(NSNumber *)parentTag
{
  __block NSString *propertyName;
  [self.config[@"props"] enumerateKeysAndObjectsUsingBlock:^(NSString * _Nonnull property, NSNumber * _Nonnull tag, BOOL * _Nonnull stop) {
    if ([tag isEqualToNumber:parentTag]) {
      propertyName = property;
      *stop = YES;
    }
  }];
  return propertyName;
}

- (void)performViewUpdatesIfNecessary
{
  NSMutableDictionary *props = [NSMutableDictionary dictionary];
  [self.parentNodes enumerateKeysAndObjectsUsingBlock:^(NSNumber * _Nonnull parentTag, RCTAnimatedNode * _Nonnull parentNode, BOOL * _Nonnull stop) {

    if ([parentNode isKindOfClass:[RCTStyleAnimatedNode class]]) {
      [props addEntriesFromDictionary:[(RCTStyleAnimatedNode *)parentNode propsDictionary]];

    } else if ([parentNode isKindOfClass:[RCTValueAnimatedNode class]]) {
      NSString *property = [self propertyNameForParentTag:parentTag];
      CGFloat value = [(RCTValueAnimatedNode *)parentNode value];
      [props setObject:@(value) forKey:property];
    }

  }];

  if (props.count) {
    [_propertyMapper updateViewWithDictionary:props];
  }
}

@end
