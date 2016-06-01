/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
#import "RCTNativeAnimatedModule.h"
#import "RCTBridge.h"
#import "RCTNativeAnimationManager.h"

@implementation RCTNativeAnimatedModule

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE(NativeAnimatedModule)

- (instancetype)init
{
  self = [super init];
  if (self) {
    [[RCTNativeAnimationManager sharedManager] setNativeAnimationModule:self];
  }
  return self;
}

RCT_EXPORT_METHOD(createAnimatedNode:(nonnull NSNumber *)tag
                  config:(NSDictionary *)config)
{
  [[RCTNativeAnimationManager sharedManager] createAnimatedNode:tag
                                                         config:config];
}

RCT_EXPORT_METHOD(connectAnimatedNodes:(nonnull NSNumber *)parentTag
                  childTag:(nonnull NSNumber *)childTag)
{
  [[RCTNativeAnimationManager sharedManager] connectAnimatedNodes:parentTag
                                                         childTag:childTag];
}

RCT_EXPORT_METHOD(disconnectAnimatedNodes:(nonnull NSNumber *)parentTag
                  childTag:(nonnull NSNumber *)childTag)
{
  [[RCTNativeAnimationManager sharedManager] disconnectAnimatedNodes:parentTag
                                                            childTag:childTag];
}

RCT_EXPORT_METHOD(startAnimatingNode:(nonnull NSNumber *)animationId
                  nodeTag:(nonnull NSNumber *)nodeTag
                  config:(NSDictionary *)config
                  endCallback:(RCTResponseSenderBlock)callBack
                  )
{
  [[RCTNativeAnimationManager sharedManager] startAnimatingNode:animationId
                                                        nodeTag:nodeTag
                                                         config:config
                                                    endCallback:callBack];
}

RCT_EXPORT_METHOD(stopAnimation:(nonnull NSNumber *)animationId)
{
  [[RCTNativeAnimationManager sharedManager] stopAnimation:animationId];
}

RCT_EXPORT_METHOD(setAnimatedNodeValue:(nonnull NSNumber *)nodeTag
                  value:(nonnull NSNumber *)value)
{
  [[RCTNativeAnimationManager sharedManager] setAnimatedNodeValue:nodeTag
                                                            value:value];
}

RCT_EXPORT_METHOD(connectAnimatedNodeToView:(nonnull NSNumber *)nodeTag
                  viewTag:(nonnull NSNumber *)viewTag)
{
  [[RCTNativeAnimationManager sharedManager] connectAnimatedNodeToView:nodeTag
                                                               viewTag:viewTag];
}

RCT_EXPORT_METHOD(disconnectAnimatedNodeFromView:(nonnull NSNumber *)nodeTag
                  viewTag:(nonnull NSNumber *)viewTag)
{
  [[RCTNativeAnimationManager sharedManager] disconnectAnimatedNodeFromView:nodeTag
                                                                    viewTag:viewTag];
}

RCT_EXPORT_METHOD(dropAnimatedNode:(nonnull NSNumber *)tag)
{
  [[RCTNativeAnimationManager sharedManager] dropAnimatedNode:tag];
}


@end
