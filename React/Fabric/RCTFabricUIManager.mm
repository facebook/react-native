/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTFabricUIManager.h"

// This file contains experimental placeholders, nothing is finalized.
@implementation RCTFabricUIManager

- (void)dealloc
{
}

- (void)invalidate
{
}

- (RCTShadowView *)createNode:(nonnull NSNumber *)reactTag
                      viewName:(NSString *)viewName
                      rootTag:(nonnull NSNumber *)rootTag
                        props:(NSDictionary *)props
                instanceHandle:(void *)instanceHandle
{
  return nil;
}

- (RCTShadowView *)cloneNode:(RCTShadowView *)node
{
  return nil;
}
- (RCTShadowView *)cloneNodeWithNewChildren:(RCTShadowView *)node
{
  return nil;
}

- (RCTShadowView *)cloneNodeWithNewProps:(RCTShadowView *)node
                                newProps:(NSDictionary *)props
{
  return nil;
}
- (RCTShadowView *)cloneNodeWithNewChildrenAndProps:(RCTShadowView *)node
                                            newProps:(NSDictionary *)props
{
  return nil;
}
- (void)appendChild:(RCTShadowView *)parentNode
          childNode:(RCTShadowView *)childNode
{

}

- (NSMutableArray<RCTShadowView *> *)createChildSet:(nonnull NSNumber *)rootTag
{
  return [NSMutableArray array];
}

- (void)appendChildToSet:(NSMutableArray<RCTShadowView *> *)childSet
               childNode:(RCTShadowView *)childNode
{
  [childSet addObject:childNode];
}

- (void)completeRoot:(nonnull NSNumber *)rootTag
            childSet:(NSArray<RCTShadowView *> *)childSet
{

}

@end
