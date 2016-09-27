/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
#import "RCTNativeAnimatedModule.h"

#import "RCTAdditionAnimatedNode.h"
#import "RCTAnimationDriverNode.h"
#import "RCTAnimationUtils.h"
#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTInterpolationAnimatedNode.h"
#import "RCTLog.h"
#import "RCTDiffClampAnimatedNode.h"
#import "RCTDivisionAnimatedNode.h"
#import "RCTModuloAnimatedNode.h"
#import "RCTMultiplicationAnimatedNode.h"
#import "RCTPropsAnimatedNode.h"
#import "RCTStyleAnimatedNode.h"
#import "RCTTransformAnimatedNode.h"
#import "RCTValueAnimatedNode.h"

@implementation RCTNativeAnimatedModule
{
  NSMutableDictionary<NSNumber *, RCTAnimatedNode *> *_animationNodes;
  NSMutableDictionary<NSNumber *, RCTAnimationDriverNode *> *_animationDrivers;
  NSMutableSet<RCTAnimationDriverNode *> *_activeAnimations;
  NSMutableSet<RCTAnimationDriverNode *> *_finishedAnimations;
  NSMutableSet<RCTValueAnimatedNode *> *_updatedValueNodes;
  NSMutableSet<RCTPropsAnimatedNode *> *_propAnimationNodes;
  CADisplayLink *_displayLink;
}

RCT_EXPORT_MODULE()

- (void)setBridge:(RCTBridge *)bridge
{
  [super setBridge:bridge];

  _animationNodes = [NSMutableDictionary new];
  _animationDrivers = [NSMutableDictionary new];
  _activeAnimations = [NSMutableSet new];
  _finishedAnimations = [NSMutableSet new];
  _updatedValueNodes = [NSMutableSet new];
  _propAnimationNodes = [NSMutableSet new];
}


- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onAnimatedValueUpdate"];
}

RCT_EXPORT_METHOD(createAnimatedNode:(nonnull NSNumber *)tag
                  config:(NSDictionary<NSString *, id> *)config)
{
  static NSDictionary *map;
  static dispatch_once_t mapToken;
  dispatch_once(&mapToken, ^{
    map = @{@"style" : [RCTStyleAnimatedNode class],
            @"value" : [RCTValueAnimatedNode class],
            @"props" : [RCTPropsAnimatedNode class],
            @"interpolation" : [RCTInterpolationAnimatedNode class],
            @"addition" : [RCTAdditionAnimatedNode class],
            @"diffclamp": [RCTDiffClampAnimatedNode class],
            @"division" : [RCTDivisionAnimatedNode class],
            @"multiplication" : [RCTMultiplicationAnimatedNode class],
            @"modulus" : [RCTModuloAnimatedNode class],
            @"transform" : [RCTTransformAnimatedNode class]};
  });

  NSString *nodeType = [RCTConvert NSString:config[@"type"]];

  Class nodeClass = map[nodeType];
  if (!nodeClass) {
    RCTLogError(@"Animated node type %@ not supported natively", nodeType);
    return;
  }

  RCTAnimatedNode *node = [[nodeClass alloc] initWithTag:tag config:config];
  _animationNodes[tag] = node;

  if ([node isKindOfClass:[RCTPropsAnimatedNode class]]) {
    [_propAnimationNodes addObject:(RCTPropsAnimatedNode *)node];
  }
}

RCT_EXPORT_METHOD(connectAnimatedNodes:(nonnull NSNumber *)parentTag
                  childTag:(nonnull NSNumber *)childTag)
{
  RCTAssertParam(parentTag);
  RCTAssertParam(childTag);

  RCTAnimatedNode *parentNode = _animationNodes[parentTag];
  RCTAnimatedNode *childNode = _animationNodes[childTag];

  RCTAssertParam(parentNode);
  RCTAssertParam(childNode);

  [parentNode addChild:childNode];
}

RCT_EXPORT_METHOD(disconnectAnimatedNodes:(nonnull NSNumber *)parentTag
                  childTag:(nonnull NSNumber *)childTag)
{
  RCTAssertParam(parentTag);
  RCTAssertParam(childTag);

  RCTAnimatedNode *parentNode = _animationNodes[parentTag];
  RCTAnimatedNode *childNode = _animationNodes[childTag];

  RCTAssertParam(parentNode);
  RCTAssertParam(childNode);

  [parentNode removeChild:childNode];
}

RCT_EXPORT_METHOD(startAnimatingNode:(nonnull NSNumber *)animationId
                  nodeTag:(nonnull NSNumber *)nodeTag
                  config:(NSDictionary<NSString *, id> *)config
                  endCallback:(RCTResponseSenderBlock)callBack)
{
  if (RCT_DEBUG && ![config[@"type"] isEqual:@"frames"]) {
    RCTLogError(@"Unsupported animation type: %@", config[@"type"]);
    return;
  }

  NSTimeInterval delay = [RCTConvert double:config[@"delay"]];
  NSNumber *toValue = [RCTConvert NSNumber:config[@"toValue"]] ?: @1;
  NSArray<NSNumber *> *frames = [RCTConvert NSNumberArray:config[@"frames"]];

  RCTValueAnimatedNode *valueNode = (RCTValueAnimatedNode *)_animationNodes[nodeTag];

  RCTAnimationDriverNode *animationDriver =
  [[RCTAnimationDriverNode alloc] initWithId:animationId
                                       delay:delay
                                     toValue:toValue.doubleValue
                                      frames:frames
                                     forNode:valueNode
                                    callBack:callBack];
  [_activeAnimations addObject:animationDriver];
  _animationDrivers[animationId] = animationDriver;
  [animationDriver startAnimation];
  [self startAnimation];
}

RCT_EXPORT_METHOD(stopAnimation:(nonnull NSNumber *)animationId)
{
  RCTAnimationDriverNode *driver = _animationDrivers[animationId];
  if (driver) {
    [driver removeAnimation];
    [_animationDrivers removeObjectForKey:animationId];
    [_activeAnimations removeObject:driver];
    [_finishedAnimations removeObject:driver];
  }
}

RCT_EXPORT_METHOD(setAnimatedNodeValue:(nonnull NSNumber *)nodeTag
                  value:(nonnull NSNumber *)value)
{
  RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (![node isKindOfClass:[RCTValueAnimatedNode class]]) {
    RCTLogError(@"Not a value node.");
    return;
  }
  RCTValueAnimatedNode *valueNode = (RCTValueAnimatedNode *)node;
  valueNode.value = value.floatValue;
  [valueNode setNeedsUpdate];
}

RCT_EXPORT_METHOD(setAnimatedNodeOffset:(nonnull NSNumber *)nodeTag
                  offset:(nonnull NSNumber *)offset)
{
  RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (![node isKindOfClass:[RCTValueAnimatedNode class]]) {
    RCTLogError(@"Not a value node.");
    return;
  }

  RCTValueAnimatedNode *valueNode = (RCTValueAnimatedNode *)node;
  [valueNode setOffset:offset.floatValue];
  [_updatedValueNodes addObject:valueNode];
}

RCT_EXPORT_METHOD(flattenAnimatedNodeOffset:(nonnull NSNumber *)nodeTag)
{
  RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (![node isKindOfClass:[RCTValueAnimatedNode class]]) {
    RCTLogError(@"Not a value node.");
    return;
  }

  RCTValueAnimatedNode *valueNode = (RCTValueAnimatedNode *)node;
  [valueNode flattenOffset];
}

RCT_EXPORT_METHOD(connectAnimatedNodeToView:(nonnull NSNumber *)nodeTag
                  viewTag:(nonnull NSNumber *)viewTag)
{
  RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (viewTag && [node isKindOfClass:[RCTPropsAnimatedNode class]]) {
    [(RCTPropsAnimatedNode *)node connectToView:viewTag animatedModule:self];
  }
}

RCT_EXPORT_METHOD(disconnectAnimatedNodeFromView:(nonnull NSNumber *)nodeTag
                  viewTag:(nonnull NSNumber *)viewTag)
{
  RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (viewTag && node && [node isKindOfClass:[RCTPropsAnimatedNode class]]) {
    [(RCTPropsAnimatedNode *)node disconnectFromView:viewTag];
  }
}

RCT_EXPORT_METHOD(dropAnimatedNode:(nonnull NSNumber *)tag)
{
  RCTAnimatedNode *node = _animationNodes[tag];
  if (node) {
    [node detachNode];
    [_animationNodes removeObjectForKey:tag];
    if ([node isKindOfClass:[RCTValueAnimatedNode class]]) {
      [_updatedValueNodes removeObject:(RCTValueAnimatedNode *)node];
    } else if ([node isKindOfClass:[RCTPropsAnimatedNode class]]) {
      [_propAnimationNodes removeObject:(RCTPropsAnimatedNode *)node];
    }
  }
}

RCT_EXPORT_METHOD(startListeningToAnimatedNodeValue:(nonnull NSNumber *)tag)
{
  RCTAnimatedNode *node = _animationNodes[tag];
  if (node && [node isKindOfClass:[RCTValueAnimatedNode class]]) {
    ((RCTValueAnimatedNode *)node).valueObserver = self;
  }
}

RCT_EXPORT_METHOD(stopListeningToAnimatedNodeValue:(nonnull NSNumber *)tag)
{
  RCTAnimatedNode *node = _animationNodes[tag];
  if (node && [node isKindOfClass:[RCTValueAnimatedNode class]]) {
    ((RCTValueAnimatedNode *)node).valueObserver = nil;
  }
}

- (void)animatedNode:(RCTValueAnimatedNode *)node didUpdateValue:(CGFloat)value
{
  [self sendEventWithName:@"onAnimatedValueUpdate"
                     body:@{@"tag": node.nodeTag, @"value": @(value)}];
}


#pragma mark -- Animation Loop

- (void)startAnimation
{
  if (!_displayLink && _activeAnimations.count > 0) {
    _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(updateAnimations)];
    [_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
  }
}

- (void)updateAnimations
{
  // Step Current active animations
  // This also recursively marks children nodes as needing update
  for (RCTAnimationDriverNode *animationDriver in _activeAnimations) {
    [animationDriver stepAnimation];
  }

  // Perform node updates for marked nodes.
  // At this point all nodes that are in need of an update are properly marked as such.
  for (RCTPropsAnimatedNode *propsNode in _propAnimationNodes) {
    [propsNode updateNodeIfNecessary];
  }

  // Cleanup nodes and prepare for next cycle. Remove updated nodes from bucket.
  for (RCTAnimationDriverNode *driverNode in _activeAnimations) {
    [driverNode cleanupAnimationUpdate];
  }
  for (RCTValueAnimatedNode *valueNode in _updatedValueNodes) {
    [valueNode cleanupAnimationUpdate];
  }
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
    [_displayLink invalidate];
    _displayLink = nil;
  }
}

@end
