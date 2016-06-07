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
#import "RCTAnimation.h"
#import "RCTLog.h"
#import <UIKit/UIKit.h>

@interface RCTNativeAnimatedModule ()

@property (nonatomic, readonly) NSMutableDictionary <NSNumber *, RCTAnimatedNode *> *animationNodes;
@property (nonatomic, readonly) NSMutableDictionary <NSNumber *, RCTAnimationDriverNode *> *animationDrivers;
@property (nonatomic, readonly) NSMutableSet <RCTAnimationDriverNode *> *activeAnimations;
@property (nonatomic, readonly) NSMutableSet <RCTAnimationDriverNode *> *finishedAnimations;
@property (nonatomic, readonly) NSMutableSet <RCTValueAnimatedNode *> *updatedValueNodes;
@property (nonatomic, readonly) NSMutableSet <RCTPropsAnimatedNode *> *propAnimationNodes;

@end

@implementation RCTNativeAnimatedModule {
  CADisplayLink *_displayLink;
}

@synthesize animationDrivers = _animationDrivers;
@synthesize animationNodes = _animationNodes;
@synthesize finishedAnimations = _finishedAnimations;
@synthesize propAnimationNodes = _propAnimationNodes;
@synthesize activeAnimations = _activeAnimations;
@synthesize updatedValueNodes = _updatedValueNodes;

@synthesize bridge = _bridge;

- (NSMutableDictionary<NSNumber *,RCTAnimatedNode *> *)animationNodes {
  if (!_animationNodes) {
    _animationNodes = [NSMutableDictionary new];
  }
  return _animationNodes;
}

- (NSMutableDictionary<NSNumber *,RCTAnimationDriverNode *> *)animationDrivers {
  if (!_animationDrivers) {
    _animationDrivers = [NSMutableDictionary new];
  }
  return _animationDrivers;
}

- (NSMutableSet<RCTAnimationDriverNode *> *)activeAnimations {
  if (!_activeAnimations) {
    _activeAnimations = [NSMutableSet new];
  }
  return _activeAnimations;
}

- (NSMutableSet<RCTAnimationDriverNode *> *)finishedAnimations {
  if (!_finishedAnimations) {
    _finishedAnimations = [NSMutableSet new];
  }
  return _finishedAnimations;
}

- (NSMutableSet<RCTValueAnimatedNode *> *)updatedValueNodes {
  if (!_updatedValueNodes) {
    _updatedValueNodes = [NSMutableSet new];
  }
  return _updatedValueNodes;
}

- (NSMutableSet<RCTPropsAnimatedNode *> *)propAnimationNodes {
  if (!_propAnimationNodes) {
    _propAnimationNodes = [NSMutableSet new];
  }
  return _propAnimationNodes;
}

RCT_EXPORT_MODULE(NativeAnimatedModule)

RCT_EXPORT_METHOD(createAnimatedNode:(nonnull NSNumber *)tag
                  config:(NSDictionary *)config)
{
  [self _createAnimatedNode:tag config:config];
}

RCT_EXPORT_METHOD(connectAnimatedNodes:(nonnull NSNumber *)parentTag
                  childTag:(nonnull NSNumber *)childTag)
{
  [self _connectAnimatedNodes:parentTag childTag:childTag];
}

RCT_EXPORT_METHOD(disconnectAnimatedNodes:(nonnull NSNumber *)parentTag
                  childTag:(nonnull NSNumber *)childTag)
{
  [self _disconnectAnimatedNodes:parentTag childTag:childTag];
}

RCT_EXPORT_METHOD(startAnimatingNode:(nonnull NSNumber *)animationId
                  nodeTag:(nonnull NSNumber *)nodeTag
                  config:(NSDictionary *)config
                  endCallback:(RCTResponseSenderBlock)callBack
                  )
{
  [self _startAnimatingNode:animationId nodeTag:nodeTag config:config endCallback:callBack];
}

RCT_EXPORT_METHOD(stopAnimation:(nonnull NSNumber *)animationId)
{
  [self _stopAnimation:animationId];
}

RCT_EXPORT_METHOD(setAnimatedNodeValue:(nonnull NSNumber *)nodeTag
                  value:(nonnull NSNumber *)value)
{
  [self _setAnimatedNodeValue:nodeTag value:value];
}

RCT_EXPORT_METHOD(connectAnimatedNodeToView:(nonnull NSNumber *)nodeTag
                  viewTag:(nonnull NSNumber *)viewTag)
{
  [self _connectAnimatedNodeToView:nodeTag viewTag:viewTag];
}

RCT_EXPORT_METHOD(disconnectAnimatedNodeFromView:(nonnull NSNumber *)nodeTag
                  viewTag:(nonnull NSNumber *)viewTag)
{
  [self _disconnectAnimatedNodeFromView:nodeTag viewTag:viewTag];
}

RCT_EXPORT_METHOD(dropAnimatedNode:(nonnull NSNumber *)tag)
{
  [self _dropAnimatedNode:tag];
}

- (void)_createAnimatedNode:(nonnull NSNumber *)tag
                     config:(NSDictionary *)config {
  
  static NSDictionary *map;
  static dispatch_once_t mapToken;
  
  dispatch_once(&mapToken, ^{
    map = @{
            @"style" : [RCTStyleAnimatedNode class],
            @"value" : [RCTValueAnimatedNode class],
            @"props" : [RCTPropsAnimatedNode class],
            @"interpolation" : [RCTInterpolationAnimatedNode class],
            @"addition" : [RCTAdditionAnimatedNode class],
            @"multiplication" : [RCTMultiplicationAnimatedNode class],
            @"transform" : [RCTTransformAnimatedNode class]
            };
  });
  
  NSString *nodeType = config[@"type"];
  
  Class nodeClass = map[nodeType];
  if (!nodeClass) {
    RCTLogError(@"Animated node type %@ not supported natively", nodeType);
    return;
  }
  
  RCTAnimatedNode *node = [[nodeClass alloc] initWithTag:tag config:config];
  self.animationNodes[tag] = node;
  
  if ([node isKindOfClass:[RCTPropsAnimatedNode class]]) {
    [self.propAnimationNodes addObject:(RCTPropsAnimatedNode *)node];
  }
}

- (void)_connectAnimatedNodes:(nonnull NSNumber *)parentTag
                     childTag:(nonnull NSNumber *)childTag {
  RCTAssertParam(parentTag);
  RCTAssertParam(childTag);
  
  RCTAnimatedNode *parentNode = self.animationNodes[parentTag];
  RCTAnimatedNode *childNode = self.animationNodes[childTag];
  
  RCTAssertParam(parentNode);
  RCTAssertParam(childNode);
  
  [parentNode addChild:childNode];
}

- (void)_disconnectAnimatedNodes:(nonnull NSNumber *)parentTag
                        childTag:(nonnull NSNumber *)childTag {
  RCTAssertParam(parentTag);
  RCTAssertParam(childTag);
  
  RCTAnimatedNode *parentNode = self.animationNodes[parentTag];
  RCTAnimatedNode *childNode = self.animationNodes[childTag];
  
  RCTAssertParam(parentNode);
  RCTAssertParam(childNode);
  
  [parentNode removeChild:childNode];
}

- (void)_startAnimatingNode:(nonnull NSNumber *)animationId
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
  
  RCTValueAnimatedNode *valueNode = (RCTValueAnimatedNode *)self.animationNodes[nodeTag];
  
  RCTAnimationDriverNode *animationDriver =
  [[RCTAnimationDriverNode alloc] initWithId:animationId
                                       delay:delay
                                     toValue:toValue
                                      frames:frames
                                     forNode:valueNode
                                    callBack:callBack];
  [self.activeAnimations addObject:animationDriver];
  self.animationDrivers[animationId] = animationDriver;
  [animationDriver startAnimation];
  [self startAnimation];
}

- (void)_stopAnimation:(nonnull NSNumber *)animationId {
  RCTAnimationDriverNode *driver = [self.animationDrivers objectForKey:animationId];
  if (driver) {
    [driver removeAnimation];
    [self.animationDrivers removeObjectForKey:animationId];
    [self.activeAnimations removeObject:driver];
    [self.finishedAnimations removeObject:driver];
  }
}

- (void)_setAnimatedNodeValue:(nonnull NSNumber *)nodeTag
                        value:(nonnull NSNumber *)value {
  RCTAnimatedNode *node = self.animationNodes[nodeTag];
  if (!node ||
      ![node isKindOfClass:[RCTValueAnimatedNode class]]) {
    RCTLogError(@"Not a vlue node. Exception");
    return;
  }
  RCTValueAnimatedNode *valueNode = (RCTValueAnimatedNode *)node;
  valueNode.value = value.floatValue;
  [valueNode setNeedsUpdate];
}

- (void)_connectAnimatedNodeToView:(nonnull NSNumber *)nodeTag
                           viewTag:(nonnull NSNumber *)viewTag {
  RCTAnimatedNode *node = self.animationNodes[nodeTag];
  if (viewTag && [node isKindOfClass:[RCTPropsAnimatedNode class]]) {
    [(RCTPropsAnimatedNode *)node connectToView:viewTag animatedModule:self];
  }
}

- (void)_disconnectAnimatedNodeFromView:(nonnull NSNumber *)nodeTag
                                viewTag:(nonnull NSNumber *)viewTag {
  RCTAnimatedNode *node = self.animationNodes[nodeTag];
  if (viewTag && node && [node isKindOfClass:[RCTPropsAnimatedNode class]]) {
    [(RCTPropsAnimatedNode *)node disconnectFromView:viewTag];
  }
}

- (void)_dropAnimatedNode:(nonnull NSNumber *)tag {
  RCTAnimatedNode *node = self.animationNodes[tag];
  if (node) {
    [node dettachNode];
    [self.animationNodes removeObjectForKey:tag];
    if ([node isKindOfClass:[RCTValueAnimatedNode class]]) {
      [self.updatedValueNodes removeObject:(RCTValueAnimatedNode *)node];
    }
    if ([node isKindOfClass:[RCTPropsAnimatedNode class]]) {
      [self.propAnimationNodes removeObject:(RCTPropsAnimatedNode *)node];
    }
  }
}

#pragma mark -- Animation Loop

- (void)startAnimation {
  if (!_displayLink && self.activeAnimations.count > 0) {
    _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(updateAnimations)];
    [_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
  }
}

- (void)updateAnimations {
  // Step Current active animations
  // This also recursively marks children nodes as needing update
  for (RCTAnimationDriverNode *animationDriver in self.activeAnimations) {
    [animationDriver stepAnimation];
  }
  
  // Perform node updates for marked nodes.
  // At this point all nodes that are in need of an update are properly marked as such.
  for (RCTPropsAnimatedNode *propsNode in self.propAnimationNodes) {
    [propsNode updateNodeIfNecessary];
  }
  
  // Cleanup nodes and prepare for next cycle. Remove updated nodes from bucket.
  for (RCTAnimationDriverNode *animationDriver in self.activeAnimations) {
    [animationDriver cleanupAnimationUpdate];
  }
  
  [self.activeAnimations makeObjectsPerformSelector:@selector(cleanupAnimationUpdate)];
  for (RCTValueAnimatedNode *valueNode in self.updatedValueNodes) {
    [valueNode cleanupAnimationUpdate];
  }
  
  [self.updatedValueNodes removeAllObjects];
  
  for (RCTAnimationDriverNode *driverNode in self.activeAnimations) {
    if (driverNode.animationHasFinished) {
      [driverNode removeAnimation];
      [self.finishedAnimations addObject:driverNode];
    }
  }
  for (RCTAnimationDriverNode *driverNode in self.finishedAnimations) {
    [self.activeAnimations removeObject:driverNode];
    [self.animationDrivers removeObjectForKey:driverNode.animationId];
  }
  
  [self.finishedAnimations removeAllObjects];
  
  if (self.activeAnimations.count == 0) {
    [_displayLink invalidate];
    _displayLink = nil;
  }
}


@end
