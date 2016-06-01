/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTNativeAnimationManager.h"
#import "RCTAnimation.h"
#import <UIKit/UIKit.h>

@implementation RCTNativeAnimationManager {
  NSMutableDictionary *_animationNodes;
  NSMutableDictionary *_animationDrivers;
  NSMutableSet <RCTAnimationDriverNode *> *_activeAnimations;
  NSMutableSet <RCTAnimationDriverNode *> *_finishedAnimations;
  NSMutableSet <RCTValueAnimatedNode *> *_updatedValueNodes;
  NSMutableSet <RCTPropsAnimatedNode *> *_propAnimationNodes;
  CADisplayLink *displayLink_;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    _animationDrivers = [NSMutableDictionary new];
    _animationNodes = [NSMutableDictionary new];
    _finishedAnimations = [NSMutableSet new];
    _propAnimationNodes = [NSMutableSet new];
    _activeAnimations = [NSMutableSet new];
    _updatedValueNodes = [NSMutableSet new];
  }
  return self;
}

+ (instancetype)sharedManager {
  static RCTNativeAnimationManager *sharedManager;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedManager = [[RCTNativeAnimationManager alloc] init];
  });
  return sharedManager;
}

- (void)createAnimatedNode:(nonnull NSNumber *)tag
                    config:(NSDictionary *)config {
  NSString *nodeType = config[@"type"];
  RCTAnimatedNode *node = nil;
  if ([nodeType isEqualToString:@"style"]) {
    node = [[RCTStyleAnimatedNode alloc] initWithTag:tag config:config];
  } else if ([nodeType isEqualToString:@"value"]) {
    node = [[RCTValueAnimatedNode alloc] initWithTag:tag config:config];
  } else if ([nodeType isEqualToString:@"props"]) {
    node = [[RCTPropsAnimatedNode alloc] initWithTag:tag config:config];
    [_propAnimationNodes addObject:(RCTPropsAnimatedNode *)node];
  } else if ([nodeType isEqualToString:@"interpolation"]) {
    node = [[RCTInterpolationAnimatedNode alloc] initWithTag:tag config:config];
  } else if ([nodeType isEqualToString:@"addition"]) {
    node = [[RCTAdditionAnimatedNode alloc] initWithTag:tag config:config];
  } else if ([nodeType isEqualToString:@"multiplication"]) {
    node = [[RCTMultiplicationAnimatedNode alloc] initWithTag:tag config:config];
  } else if ([nodeType isEqualToString:@"transform"]) {
    node = [[RCTTransformAnimatedNode alloc] initWithTag:tag config:config];
  } else {
    // TODO Throw Exception
    NSLog(@"Animated node type %@ not supported natively", nodeType);
  }
  
  if (node) {
    [_animationNodes setObject:node forKey:tag];
  }
}

- (void)connectAnimatedNodes:(nonnull NSNumber *)parentTag
                    childTag:(nonnull NSNumber *)childTag {
  if (!parentTag || !childTag) {
    // TODO Throw Exception
    return;
  }
  
  RCTAnimatedNode *parentNode = [self nodeForTag:parentTag];
  RCTAnimatedNode *childNode = [self nodeForTag:childTag];
  
  if (!parentNode || !childNode) {
    // Throw Exception
    return;
  }
  
  [parentNode addChild:childNode];
}

- (void)disconnectAnimatedNodes:(nonnull NSNumber *)parentTag
                       childTag:(nonnull NSNumber *)childTag {
  if (!parentTag || !childTag) {
    // Throw Exception
    return;
  }
  
  RCTAnimatedNode *parentNode = [self nodeForTag:parentTag];
  RCTAnimatedNode *childNode = [self nodeForTag:childTag];
  
  if (!parentNode || !childNode) {
    // Throw Exception
    return;
  }
  
  [parentNode removeChild:childNode];
}

- (void)startAnimatingNode:(nonnull NSNumber *)animationId
                   nodeTag:(nonnull NSNumber *)nodeTag
                    config:(nonnull NSDictionary *)config
               endCallback:(nullable RCTResponseSenderBlock)callBack {
  if (![config[@"type"] isEqualToString:@"frames"]) {
    // Exception Unsupported animation type
    return;
  }
  
  NSNumber *delay = config[@"delay"];
  NSNumber *toValue = config[@"toValue"] ?: @1;
  NSArray *frames = config[@"frames"];
  
  RCTValueAnimatedNode *valueNode = (RCTValueAnimatedNode *)[self nodeForTag:nodeTag];
  
  RCTAnimationDriverNode *animationDriver =
    [[RCTAnimationDriverNode alloc] initWithId:animationId
                                         delay:delay
                                       toValue:toValue
                                        frames:frames
                                       forNode:valueNode
                                      callBack:callBack];
  [_activeAnimations addObject:animationDriver];
  [_animationDrivers setObject:animationDriver forKey:animationId];
  [animationDriver startAnimation];
  [self startAnimation];
}

- (void)stopAnimation:(nonnull NSNumber *)animationId {
  RCTAnimationDriverNode *driver = [_animationDrivers objectForKey:animationId];
  if (driver) {
    [driver removeAnimation];
    [_animationDrivers removeObjectForKey:animationId];
    [_activeAnimations removeObject:driver];
    [_finishedAnimations removeObject:driver];
  }
}

- (void)setAnimatedNodeValue:(nonnull NSNumber *)nodeTag
                       value:(nonnull NSNumber *)value {
  RCTAnimatedNode *node = [self nodeForTag:nodeTag];
  if (!node ||
      ![node isKindOfClass:[RCTValueAnimatedNode class]]) {
    NSLog(@"Not a vlue node. Exception");
    return;
  }
  RCTValueAnimatedNode *valueNode = (RCTValueAnimatedNode *)node;
  valueNode.value = value;
  [valueNode setNeedsUpdate];
}

- (void)connectAnimatedNodeToView:(nonnull NSNumber *)nodeTag
                          viewTag:(nonnull NSNumber *)viewTag {
  RCTAnimatedNode *node = [self nodeForTag:nodeTag];
  if (viewTag && node && [node isKindOfClass:[RCTPropsAnimatedNode class]]) {
    [(RCTPropsAnimatedNode *)node connectToView:viewTag];
  }
}

- (void)disconnectAnimatedNodeFromView:(nonnull NSNumber *)nodeTag
                               viewTag:(nonnull NSNumber *)viewTag {
  RCTAnimatedNode *node = [self nodeForTag:nodeTag];
  if (viewTag && node && [node isKindOfClass:[RCTPropsAnimatedNode class]]) {
    [(RCTPropsAnimatedNode *)node disconnectFromView:viewTag];
  }
}

- (void)dropAnimatedNode:(nonnull NSNumber *)tag {
  NSLog(@"Dropping animated node %@", tag);
  RCTAnimatedNode *node = [self nodeForTag:tag];
  if (node) {
    [node dettachNode];
    [_animationNodes removeObjectForKey:tag];
    [_updatedValueNodes removeObject:node];
    [_propAnimationNodes removeObject:node];
  }
}

- (RCTAnimatedNode *)nodeForTag:(NSNumber *)tag {
  return [_animationNodes objectForKey:tag];
}

#pragma mark -- Animation Loop

- (void)startAnimation {
  if (!displayLink_ && _activeAnimations.count > 0) {
    displayLink_ = [CADisplayLink displayLinkWithTarget:self selector:@selector(updateAnimations)];
    [displayLink_ addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
  }
}

- (void)updateAnimations {
  // Step Current active animations
  // This also recursively marks children nodes as needing update
  [_activeAnimations makeObjectsPerformSelector:@selector(stepAnimation)];
  
  // Perform node updates for marked nodes.
  // At this point all nodes that are in need of an update are properly marked as such.
  [_propAnimationNodes makeObjectsPerformSelector:@selector(updateNodeIfNecessary)];

  // Cleanup nodes and prepare for next cycle. Remove updated nodes from bucket.
  [_activeAnimations makeObjectsPerformSelector:@selector(cleanupAnimationUpdate)];
  [_updatedValueNodes makeObjectsPerformSelector:@selector(cleanupAnimationUpdate)];
  
  [_updatedValueNodes removeAllObjects];
  
  for (RCTAnimationDriverNode *driverNode in _activeAnimations) {
    if (driverNode.animationHasFinished) {
      [driverNode removeAnimation];
      [_finishedAnimations addObject:driverNode];
    }
  }
  for (RCTAnimationDriverNode *driverNode in _finishedAnimations) {
    [_activeAnimations removeObject:driverNode];
    [_animationDrivers removeObjectForKey:driverNode.animationId];
  }
  
  [_finishedAnimations removeAllObjects];
  
  if (_activeAnimations.count == 0) {
    [displayLink_ invalidate];
    displayLink_ = nil;
  }
}

@end
