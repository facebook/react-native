/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

#import <XCTest/XCTest.h>

#import <OCMock/OCMock.h>

#import <RCTAnimation/RCTNativeAnimatedNodesManager.h>
#import <RCTAnimation/RCTValueAnimatedNode.h>
#import <React/RCTUIManager.h>

static const NSTimeInterval FRAME_LENGTH = 1.0 / 60.0;

@interface RCTFakeDisplayLink : CADisplayLink

@end

@implementation RCTFakeDisplayLink
{
  NSTimeInterval _timestamp;
}

- (instancetype)init
{
  self = [super init];
  if (self) {
    _timestamp = 1124.1234143251; // Random
  }
  return self;
}

- (NSTimeInterval)timestamp
{
  _timestamp += FRAME_LENGTH;
  return _timestamp;
}

@end

@interface RCTFakeValueObserver : NSObject<RCTValueAnimatedNodeObserver>

@property (nonatomic, strong) NSMutableArray<NSNumber *> *calls;

@end

@implementation RCTFakeValueObserver

- (instancetype)init
{
  self = [super init];
  if (self) {
    _calls = [NSMutableArray new];
  }
  return self;
}

- (void)animatedNode:(__unused RCTValueAnimatedNode *)node didUpdateValue:(CGFloat)value
{
  [_calls addObject:@(value)];
}

@end

@interface RCTFakeEvent : NSObject<RCTEvent>

@end

@implementation RCTFakeEvent
{
  NSArray *_arguments;
}

@synthesize eventName = _eventName;
@synthesize viewTag = _viewTag;
@synthesize coalescingKey = _coalescingKey;

- (instancetype)initWithName:(NSString *)name viewTag:(NSNumber *)viewTag arguments:(NSArray *)arguments
{
  self = [super init];
  if (self) {
    _eventName = name;
    _viewTag = viewTag;
    _arguments = arguments;
  }
  return self;
}

- (NSArray *)arguments
{
  return _arguments;
}

RCT_NOT_IMPLEMENTED(+ (NSString *)moduleDotMethod);
RCT_NOT_IMPLEMENTED(- (BOOL)canCoalesce);
RCT_NOT_IMPLEMENTED(- (id<RCTEvent>)coalesceWithEvent:(id<RCTEvent>)newEvent);

@end

static id RCTPropChecker(NSString *prop, NSNumber *value)
{
  return [OCMArg checkWithBlock:^BOOL(NSDictionary<NSString *, NSNumber *> *props) {
    BOOL match = fabs(props[prop].doubleValue - value.doubleValue) < FLT_EPSILON;
    if (!match) {
      NSLog(@"Props `%@` with value `%@` is not close to `%@`", prop, props[prop], value);
    }
    return match;
  }];
}

@interface RCTNativeAnimatedNodesManagerTests : XCTestCase

@end

@implementation RCTNativeAnimatedNodesManagerTests
{
  id _uiManager;
  RCTNativeAnimatedNodesManager *_nodesManager;
  RCTFakeDisplayLink *_displayLink;
}

- (void)setUp
{
  [super setUp];

  _uiManager = [OCMockObject niceMockForClass:[RCTUIManager class]];
  _nodesManager = [[RCTNativeAnimatedNodesManager alloc] initWithUIManager:_uiManager];
  _displayLink = [RCTFakeDisplayLink new];
}

/**
 * Generates a simple animated nodes graph and attaches the props node to a given viewTag
 * Parameter opacity is used as a initial value for the "opacity" attribute.
 *
 * Nodes are connected as follows (nodes IDs in parens):
 * ValueNode(1) -> StyleNode(2) -> PropNode(3)
 */
- (void)createSimpleAnimatedView:(NSNumber *)viewTag withOpacity:(CGFloat)opacity
{
  [_nodesManager createAnimatedNode:@1
                             config:@{@"type": @"value", @"value": @(opacity), @"offset": @0}];
  [_nodesManager createAnimatedNode:@2
                             config:@{@"type": @"style", @"style": @{@"opacity": @1}}];
  [_nodesManager createAnimatedNode:@3
                             config:@{@"type": @"props", @"props": @{@"style": @2}}];

  [_nodesManager connectAnimatedNodes:@1 childTag:@2];
  [_nodesManager connectAnimatedNodes:@2 childTag:@3];
  [_nodesManager connectAnimatedNodeToView:@3 viewTag:viewTag viewName:@"UIView"];
}

- (void)testFramesAnimation
{
  [self createSimpleAnimatedView:@1000 withOpacity:0];
  NSArray<NSNumber *> *frames = @[@0, @0.2, @0.4, @0.6, @0.8, @1];
  [_nodesManager startAnimatingNode:@1
                            nodeTag:@1
                             config:@{@"type": @"frames", @"frames": frames, @"toValue": @1}
                        endCallback:nil];

  for (NSNumber *frame in frames) {
    [[_uiManager expect] synchronouslyUpdateViewOnUIThread:@1000
                                                  viewName:@"UIView"
                                                     props:RCTPropChecker(@"opacity", frame)];
    [_nodesManager stepAnimations:_displayLink];
    [_uiManager verify];
  }

  [[_uiManager expect] synchronouslyUpdateViewOnUIThread:@1000
                                                viewName:@"UIView"
                                                   props:RCTPropChecker(@"opacity", @1)];
  [_nodesManager stepAnimations:_displayLink];
  [_uiManager verify];

  [[_uiManager reject] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY viewName:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager stepAnimations:_displayLink];
  [_uiManager verify];
}

- (void)testFramesAnimationLoop
{
  [self createSimpleAnimatedView:@1000 withOpacity:0];
  NSArray<NSNumber *> *frames = @[@0, @0.2, @0.4, @0.6, @0.8, @1];
  [_nodesManager startAnimatingNode:@1
                            nodeTag:@1
                             config:@{@"type": @"frames", @"frames": frames, @"toValue": @1, @"iterations": @5}
                        endCallback:nil];

  for (NSUInteger it = 0; it < 5; it++) {
    for (NSNumber *frame in frames) {
      [[_uiManager expect] synchronouslyUpdateViewOnUIThread:@1000
                                                    viewName:@"UIView"
                                                       props:RCTPropChecker(@"opacity", frame)];
      [_nodesManager stepAnimations:_displayLink];
      [_uiManager verify];
    }
  }

  [[_uiManager expect] synchronouslyUpdateViewOnUIThread:@1000
                                                viewName:@"UIView"
                                                   props:RCTPropChecker(@"opacity", @1)];

  [_nodesManager stepAnimations:_displayLink];
  [_uiManager verify];

  [[_uiManager reject] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY viewName:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager stepAnimations:_displayLink];
  [_uiManager verify];
}

- (void)testNodeValueListenerIfNotListening
{
  NSNumber *nodeId = @1;
  [self createSimpleAnimatedView:@1000 withOpacity:0];
  NSArray<NSNumber *> *frames = @[@0, @0.2, @0.4, @0.6, @0.8, @1];

  RCTFakeValueObserver *observer = [RCTFakeValueObserver new];
  [_nodesManager startListeningToAnimatedNodeValue:nodeId valueObserver:observer];

  [_nodesManager startAnimatingNode:@1
                            nodeTag:nodeId
                             config:@{@"type": @"frames", @"frames": frames, @"toValue": @1}
                        endCallback:nil];

  [_nodesManager stepAnimations:_displayLink];
  XCTAssertEqual(observer.calls.count, 1UL);
  XCTAssertEqualObjects(observer.calls[0], @0);

  [_nodesManager stopListeningToAnimatedNodeValue:nodeId];

  [_nodesManager stepAnimations:_displayLink];
  XCTAssertEqual(observer.calls.count, 1UL);
}

- (void)testNodeValueListenerIfListening
{
  NSNumber *nodeId = @1;
  [self createSimpleAnimatedView:@1000 withOpacity:0];
  NSArray<NSNumber *> *frames = @[@0, @0.2, @0.4, @0.6, @0.8, @1];

  RCTFakeValueObserver *observer = [RCTFakeValueObserver new];
  [_nodesManager startListeningToAnimatedNodeValue:nodeId valueObserver:observer];

  [_nodesManager startAnimatingNode:@1
                            nodeTag:nodeId
                             config:@{@"type": @"frames", @"frames": frames, @"toValue": @1}
                        endCallback:nil];

  for (NSUInteger i = 0; i < frames.count; i++) {
    [_nodesManager stepAnimations:_displayLink];
    XCTAssertEqual(observer.calls.count, i + 1);
    XCTAssertEqualWithAccuracy(observer.calls[i].doubleValue, frames[i].doubleValue, FLT_EPSILON);
  }

  [_nodesManager stepAnimations:_displayLink];
  XCTAssertEqual(observer.calls.count, 7UL);
  XCTAssertEqualObjects(observer.calls[6], @1);

  [_nodesManager stepAnimations:_displayLink];
  XCTAssertEqual(observer.calls.count, 7UL);
}

- (void)testSpringAnimation
{
  [self createSimpleAnimatedView:@1000 withOpacity:0];
  [_nodesManager startAnimatingNode:@1
                            nodeTag:@1
                             config:@{@"type": @"spring",
                                      @"friction": @7,
                                      @"tension": @40,
                                      @"initialVelocity": @0,
                                      @"toValue": @1,
                                      @"restSpeedThreshold": @0.001,
                                      @"restDisplacementThreshold": @0.001,
                                      @"overshootClamping": @NO}
                        endCallback:nil];

  BOOL wasGreaterThanOne = NO;
  CGFloat previousValue = 0;
  __block CGFloat currentValue;
  [[[_uiManager stub] andDo:^(NSInvocation *invocation) {
    __unsafe_unretained NSDictionary<NSString *, NSNumber *> *props;
    [invocation getArgument:&props atIndex:4];
    currentValue = props[@"opacity"].doubleValue;
  }] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY viewName:OCMOCK_ANY props:OCMOCK_ANY];

  // Run for 3 seconds.
  for (NSUInteger i = 0; i < 3 * 60; i++) {
    [_nodesManager stepAnimations:_displayLink];

    if (currentValue > 1) {
      wasGreaterThanOne = YES;
    }

    // Verify that animation step is relatively small.
    XCTAssertLessThan(fabs(currentValue - previousValue), 0.1);

    previousValue = currentValue;
  }

  // Verify that we've reach the final value at the end of animation.
  XCTAssertEqual(previousValue, 1.0);

  // Verify that value has reached some maximum value that is greater than the final value (bounce).
  XCTAssertTrue(wasGreaterThanOne);

  [[_uiManager reject] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY viewName:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager stepAnimations:_displayLink];
  [_uiManager verify];
}

- (void)testDecayAnimation
{
  [self createSimpleAnimatedView:@1000 withOpacity:0];
  [_nodesManager startAnimatingNode:@1
                            nodeTag:@1
                             config:@{@"type": @"decay",
                                      @"velocity": @0.5,
                                      @"deceleration": @0.998}
                        endCallback:nil];


  __block CGFloat previousValue;
  __block CGFloat currentValue;
  CGFloat previousDiff = CGFLOAT_MAX;

  [_nodesManager stepAnimations:_displayLink];

  [[[_uiManager stub] andDo:^(NSInvocation *invocation) {
    __unsafe_unretained NSDictionary<NSString *, NSNumber *> *props;
    [invocation getArgument:&props atIndex:4];
    currentValue = props[@"opacity"].doubleValue;
  }] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY viewName:OCMOCK_ANY props:OCMOCK_ANY];

  // Run 3 secs of animation.
  for (NSUInteger i = 0; i < 3 * 60; i++) {
    [_nodesManager stepAnimations:_displayLink];
    CGFloat currentDiff = currentValue - previousValue;
    // Verify monotonicity.
    // Greater *or equal* because the animation stops during these 3 seconds.
    XCTAssertGreaterThanOrEqual(currentValue, previousValue);
    // Verify decay.
    XCTAssertLessThanOrEqual(currentDiff, previousDiff);
    previousValue = currentValue;
    previousDiff = currentDiff;
  }

  // Should be done in 3 secs.
  [[_uiManager reject] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY viewName:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager stepAnimations:_displayLink];
  [_uiManager verify];
}

- (void)testDecayAnimationLoop
{
  [self createSimpleAnimatedView:@1000 withOpacity:0];
  [_nodesManager startAnimatingNode:@1
                            nodeTag:@1
                             config:@{@"type": @"decay",
                                      @"velocity": @0.5,
                                      @"deceleration": @0.998,
                                      @"iterations": @5}
                        endCallback:nil];


  __block CGFloat previousValue;
  __block CGFloat currentValue;
  BOOL didComeToRest = NO;
  NSUInteger numberOfResets = 0;

  [[[_uiManager stub] andDo:^(NSInvocation *invocation) {
    __unsafe_unretained NSDictionary<NSString *, NSNumber *> *props;
    [invocation getArgument:&props atIndex:4];
    currentValue = props[@"opacity"].doubleValue;
  }] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY viewName:OCMOCK_ANY props:OCMOCK_ANY];

  // Run 3 secs of animation five times.
  for (NSUInteger i = 0; i < 3 * 60 * 5; i++) {
    [_nodesManager stepAnimations:_displayLink];

    // Verify monotonicity when not resetting the animation.
    // Greater *or equal* because the animation stops during these 3 seconds.
    if (!didComeToRest) {
      XCTAssertGreaterThanOrEqual(currentValue, previousValue);
    }

    if (didComeToRest && currentValue != previousValue) {
      numberOfResets++;
      didComeToRest = NO;
    }

    // Test if animation has come to rest using the 0.1 threshold from DecayAnimation.m.
    didComeToRest = fabs(currentValue - previousValue) < 0.1;
    previousValue = currentValue;
  }

  // The animation should have reset 4 times.
  XCTAssertEqual(numberOfResets, 4u);

  [[_uiManager reject] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY viewName:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager stepAnimations:_displayLink];
  [_uiManager verify];
}

- (void)testSpringAnimationLoop
{
  [self createSimpleAnimatedView:@1000 withOpacity:0];
  [_nodesManager startAnimatingNode:@1
                            nodeTag:@1
                             config:@{@"type": @"spring",
                                      @"iterations": @5,
                                      @"friction": @7,
                                      @"tension": @40,
                                      @"initialVelocity": @0,
                                      @"toValue": @1,
                                      @"restSpeedThreshold": @0.001,
                                      @"restDisplacementThreshold": @0.001,
                                      @"overshootClamping": @NO}
                        endCallback:nil];

  BOOL didComeToRest = NO;
  CGFloat previousValue = 0;
  NSUInteger numberOfResets = 0;
  __block CGFloat currentValue;
  [[[_uiManager stub] andDo:^(NSInvocation *invocation) {
    __unsafe_unretained NSDictionary<NSString *, NSNumber *> *props;
    [invocation getArgument:&props atIndex:4];
    currentValue = props[@"opacity"].doubleValue;
  }] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY viewName:OCMOCK_ANY props:OCMOCK_ANY];

  // Run for 3 seconds five times.
  for (NSUInteger i = 0; i < 3 * 60 * 5; i++) {
    [_nodesManager stepAnimations:_displayLink];

    if (!didComeToRest) {
      // Verify that animation step is relatively small.
      XCTAssertLessThan(fabs(currentValue - previousValue), 0.1);
    }

    // Test to see if it reset after coming to rest
    if (didComeToRest && currentValue == 0) {
      didComeToRest = NO;
      numberOfResets++;
    }

    // Record that the animation did come to rest when it rests on toValue.
    didComeToRest = fabs(currentValue - 1) < 0.001 && fabs(currentValue - previousValue) < 0.001;

    previousValue = currentValue;
  }

  // Verify that value reset 4 times after finishing a full animation and is currently resting.
  XCTAssertEqual(numberOfResets, 4u);
  XCTAssertTrue(didComeToRest);

  [[_uiManager reject] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY viewName:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager stepAnimations:_displayLink];
  [_uiManager verify];
}

- (void)testAnimationCallbackFinish
{
  [self createSimpleAnimatedView:@1000 withOpacity:0];
  NSArray<NSNumber *> *frames = @[@0, @1];

  __block NSInteger endCallbackCalls = 0;

  RCTResponseSenderBlock endCallback = ^(NSArray *response) {
    endCallbackCalls++;
    XCTAssertEqualObjects(response, @[@{@"finished": @YES}]);
  };

  [_nodesManager startAnimatingNode:@1
                            nodeTag:@1
                             config:@{@"type": @"frames", @"frames": frames, @"toValue": @1}
                        endCallback:endCallback];

  [_nodesManager stepAnimations:_displayLink];
  [_nodesManager stepAnimations:_displayLink];
  XCTAssertEqual(endCallbackCalls, 0);
  [_nodesManager stepAnimations:_displayLink];
  XCTAssertEqual(endCallbackCalls, 1);
  [_nodesManager stepAnimations:_displayLink];
  XCTAssertEqual(endCallbackCalls, 1);
}

/**
 * Creates a following graph of nodes:
 * Value(1, firstValue) ----> Add(3) ---> Style(4) ---> Props(5) ---> View(viewTag)
 *                         |
 * Value(2, secondValue) --+
 *
 * Add(3) node maps to a "translateX" attribute of the Style(4) node.
 */
- (void)createAnimatedGraphWithAdditionNode:(NSNumber *)viewTag
                                 firstValue:(CGFloat)firstValue
                                secondValue:(CGFloat)secondValue
{
  [_nodesManager createAnimatedNode:@1
                             config:@{@"type": @"value", @"value": @(firstValue), @"offset": @0}];
  [_nodesManager createAnimatedNode:@2
                             config:@{@"type": @"value", @"value": @(secondValue), @"offset": @0}];
  [_nodesManager createAnimatedNode:@3
                             config:@{@"type": @"addition", @"input": @[@1, @2]}];
  [_nodesManager createAnimatedNode:@4
                             config:@{@"type": @"style", @"style": @{@"translateX": @3}}];
  [_nodesManager createAnimatedNode:@5
                             config:@{@"type": @"props", @"props": @{@"style": @4}}];

  [_nodesManager connectAnimatedNodes:@1 childTag:@3];
  [_nodesManager connectAnimatedNodes:@2 childTag:@3];
  [_nodesManager connectAnimatedNodes:@3 childTag:@4];
  [_nodesManager connectAnimatedNodes:@4 childTag:@5];
  [_nodesManager connectAnimatedNodeToView:@5 viewTag:viewTag viewName:@"UIView"];
}

- (void)testAdditionNode
{
  NSNumber *viewTag = @50;
  [self createAnimatedGraphWithAdditionNode:viewTag firstValue:100 secondValue:1000];

  NSArray<NSNumber *> *frames = @[@0, @1];
  [_nodesManager startAnimatingNode:@1
                            nodeTag:@1
                             config:@{@"type": @"frames", @"frames": frames, @"toValue": @101}
                        endCallback:nil];
  [_nodesManager startAnimatingNode:@2
                            nodeTag:@2
                             config:@{@"type": @"frames", @"frames": frames, @"toValue": @1010}
                        endCallback:nil];

  [[_uiManager expect] synchronouslyUpdateViewOnUIThread:viewTag
                                                viewName:@"UIView"
                                                   props:RCTPropChecker(@"translateX", @1100)];
  [_nodesManager stepAnimations:_displayLink];
  [_uiManager verify];

  [[_uiManager expect] synchronouslyUpdateViewOnUIThread:viewTag
                                                viewName:@"UIView"
                                                   props:RCTPropChecker(@"translateX", @1111)];
  [_nodesManager stepAnimations:_displayLink];
  [_uiManager verify];

  [[_uiManager expect] synchronouslyUpdateViewOnUIThread:viewTag
                                                viewName:@"UIView"
                                                   props:RCTPropChecker(@"translateX", @1111)];
  [_nodesManager stepAnimations:_displayLink];
  [_uiManager verify];

  [[_uiManager reject] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY viewName:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager stepAnimations:_displayLink];
  [_uiManager verify];
}

/**
 * Verifies that views are updated properly when one of the addition input nodes has started animating
 * while the other one has not.
 *
 * We expect that the output of the addition node will take the starting value of the second input
 * node even though the node hasn't been connected to an active animation driver.
 */
- (void)testViewReceiveUpdatesIfOneOfAnimationHasntStarted
{
  NSNumber *viewTag = @50;
  [self createAnimatedGraphWithAdditionNode:viewTag firstValue:100 secondValue:1000];

  NSArray<NSNumber *> *frames = @[@0, @1];
  [_nodesManager startAnimatingNode:@1
                            nodeTag:@1
                             config:@{@"type": @"frames", @"frames": frames, @"toValue": @101}
                        endCallback:nil];

  [[_uiManager expect] synchronouslyUpdateViewOnUIThread:viewTag
                                                viewName:@"UIView"
                                                   props:RCTPropChecker(@"translateX", @1100)];
  [_nodesManager stepAnimations:_displayLink];
  [_uiManager verify];

  [[_uiManager expect] synchronouslyUpdateViewOnUIThread:viewTag
                                                viewName:@"UIView"
                                                   props:RCTPropChecker(@"translateX", @1101)];
  [_nodesManager stepAnimations:_displayLink];
  [_uiManager verify];

  [[_uiManager expect] synchronouslyUpdateViewOnUIThread:viewTag
                                                viewName:@"UIView"
                                                   props:RCTPropChecker(@"translateX", @1101)];
  [_nodesManager stepAnimations:_displayLink];
  [_uiManager verify];

  [[_uiManager reject] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY viewName:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager stepAnimations:_displayLink];
  [_uiManager verify];
}

/**
 * Verifies that views are updated properly when one of the addition input nodes animation finishes
 * before the other.
 *
 * We expect that the output of the addition node after one of the animation has finished will
 * take the last value of the animated node and the view will receive updates up until the second
 * animation is over.
 */
- (void)testViewReceiveUpdatesWhenOneOfAnimationHasFinished
{
  NSNumber *viewTag = @50;
  [self createAnimatedGraphWithAdditionNode:viewTag firstValue:100 secondValue:1000];

  NSArray<NSNumber *> *firstFrames = @[@0, @1];
  [_nodesManager startAnimatingNode:@1
                            nodeTag:@1
                             config:@{@"type": @"frames", @"frames": firstFrames, @"toValue": @200}
                        endCallback:nil];
  NSArray<NSNumber *> *secondFrames = @[@0, @0.2, @0.4, @0.6, @0.8, @1];
  [_nodesManager startAnimatingNode:@2
                            nodeTag:@2
                             config:@{@"type": @"frames", @"frames": secondFrames, @"toValue": @1010}
                        endCallback:nil];

  [[_uiManager expect] synchronouslyUpdateViewOnUIThread:viewTag
                                                viewName:@"UIView"
                                                   props:RCTPropChecker(@"translateX", @1100)];
  [_nodesManager stepAnimations:_displayLink];
  [_uiManager verify];

  for (NSUInteger i = 1; i < secondFrames.count; i++) {
    CGFloat expected = 1200.0 + secondFrames[i].doubleValue * 10.0;
    [[_uiManager expect] synchronouslyUpdateViewOnUIThread:viewTag
                                                  viewName:@"UIView"
                                                     props:RCTPropChecker(@"translateX", @(expected))];
    [_nodesManager stepAnimations:_displayLink];
    [_uiManager verify];
  }

  [[_uiManager expect] synchronouslyUpdateViewOnUIThread:viewTag
                                                viewName:@"UIView"
                                                   props:RCTPropChecker(@"translateX", @1210)];
  [_nodesManager stepAnimations:_displayLink];
  [_uiManager verify];

  [[_uiManager reject] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY viewName:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager stepAnimations:_displayLink];
  [_uiManager verify];
}

- (void)testMultiplicationNode
{
  NSNumber *viewTag = @50;
  [_nodesManager createAnimatedNode:@1
                             config:@{@"type": @"value", @"value": @1, @"offset": @0}];
  [_nodesManager createAnimatedNode:@2
                             config:@{@"type": @"value", @"value": @5, @"offset": @0}];
  [_nodesManager createAnimatedNode:@3
                             config:@{@"type": @"multiplication", @"input": @[@1, @2]}];
  [_nodesManager createAnimatedNode:@4
                             config:@{@"type": @"style", @"style": @{@"translateX": @3}}];
  [_nodesManager createAnimatedNode:@5
                             config:@{@"type": @"props", @"props": @{@"style": @4}}];

  [_nodesManager connectAnimatedNodes:@1 childTag:@3];
  [_nodesManager connectAnimatedNodes:@2 childTag:@3];
  [_nodesManager connectAnimatedNodes:@3 childTag:@4];
  [_nodesManager connectAnimatedNodes:@4 childTag:@5];
  [_nodesManager connectAnimatedNodeToView:@5 viewTag:viewTag viewName:@"UIView"];

  NSArray<NSNumber *> *frames = @[@0, @1];
  [_nodesManager startAnimatingNode:@1
                            nodeTag:@1
                             config:@{@"type": @"frames", @"frames": frames, @"toValue": @2}
                        endCallback:nil];
  [_nodesManager startAnimatingNode:@2
                            nodeTag:@2
                             config:@{@"type": @"frames", @"frames": frames, @"toValue": @10}
                        endCallback:nil];

  [[_uiManager expect] synchronouslyUpdateViewOnUIThread:viewTag
                                                viewName:@"UIView"
                                                   props:RCTPropChecker(@"translateX", @5)];
  [_nodesManager stepAnimations:_displayLink];
  [_uiManager verify];

  [[_uiManager expect] synchronouslyUpdateViewOnUIThread:viewTag
                                                viewName:@"UIView"
                                                   props:RCTPropChecker(@"translateX", @20)];
  [_nodesManager stepAnimations:_displayLink];
  [_uiManager verify];

  [[_uiManager expect] synchronouslyUpdateViewOnUIThread:viewTag
                                                viewName:@"UIView"
                                                   props:RCTPropChecker(@"translateX", @20)];
  [_nodesManager stepAnimations:_displayLink];
  [_uiManager verify];

  [[_uiManager reject] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY viewName:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager stepAnimations:_displayLink];
  [_uiManager verify];
}

- (void)testHandleStoppingAnimation
{
  [self createSimpleAnimatedView:@1000 withOpacity:0];
  NSArray<NSNumber *> *frames = @[@0, @0.2, @0.4, @0.6, @0.8, @1];

  __block BOOL endCallbackCalled = NO;

  RCTResponseSenderBlock endCallback = ^(NSArray *response) {
    endCallbackCalled = YES;
    XCTAssertEqualObjects(response, @[@{@"finished": @NO}]);
  };

  [_nodesManager startAnimatingNode:@404
                            nodeTag:@1
                             config:@{@"type": @"frames", @"frames": frames, @"toValue": @1}
                        endCallback:endCallback];

  [[_uiManager expect] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY viewName:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager stepAnimations:_displayLink];
  [_uiManager verify];
  [[_uiManager expect] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY viewName:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager stepAnimations:_displayLink];
  [_uiManager verify];

  [_nodesManager stopAnimation:@404];
  XCTAssertEqual(endCallbackCalled, YES);

  // Run "update" loop a few more times -> we expect no further updates nor callback calls to be
  // triggered
  for (NSUInteger i = 0; i < 5; i++) {
    [[_uiManager reject] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY viewName:OCMOCK_ANY props:OCMOCK_ANY];
    [_nodesManager stepAnimations:_displayLink];
    [_uiManager verify];
  }
}

- (void)testInterpolationNode
{
  NSNumber *viewTag = @50;
  [_nodesManager createAnimatedNode:@1
                             config:@{@"type": @"value", @"value": @10, @"offset": @0}];
  [_nodesManager createAnimatedNode:@2
                             config:@{@"type": @"interpolation",
                                      @"inputRange": @[@10, @20],
                                      @"outputRange": @[@0, @1],
                                      @"extrapolateLeft": @"extend",
                                      @"extrapolateRight": @"extend"}];
  [_nodesManager createAnimatedNode:@3
                             config:@{@"type": @"style", @"style": @{@"opacity": @2}}];
  [_nodesManager createAnimatedNode:@4
                             config:@{@"type": @"props", @"props": @{@"style": @3}}];

  [_nodesManager connectAnimatedNodes:@1 childTag:@2];
  [_nodesManager connectAnimatedNodes:@2 childTag:@3];
  [_nodesManager connectAnimatedNodes:@3 childTag:@4];
  [_nodesManager connectAnimatedNodeToView:@4 viewTag:viewTag viewName:@"UIView"];

  NSArray<NSNumber *> *frames = @[@0, @0.2, @0.4, @0.6, @0.8, @1];
  [_nodesManager startAnimatingNode:@1
                            nodeTag:@1
                             config:@{@"type": @"frames", @"frames": frames, @"toValue": @20}
                        endCallback:nil];

  for (NSNumber *frame in frames) {
    [[_uiManager expect] synchronouslyUpdateViewOnUIThread:viewTag
                                                  viewName:@"UIView"
                                                     props:RCTPropChecker(@"opacity", frame)];
    [_nodesManager stepAnimations:_displayLink];
    [_uiManager verify];
  }

  [[_uiManager expect] synchronouslyUpdateViewOnUIThread:viewTag
                                                viewName:@"UIView"
                                                   props:RCTPropChecker(@"opacity", @1)];
  [_nodesManager stepAnimations:_displayLink];
  [_uiManager verify];


  [[_uiManager reject] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY viewName:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager stepAnimations:_displayLink];
  [_uiManager verify];
}

- (id<RCTEvent>)createScrollEventWithTag:(NSNumber *)viewTag value:(CGFloat)value
{
  // The event value is the 3rd argument.
  NSArray *arguments = @[@1, @1, @{@"contentOffset": @{@"y": @(value)}}];
  return [[RCTFakeEvent alloc] initWithName:@"topScroll"
                                    viewTag:viewTag
                                  arguments:arguments];
}

- (void)testNativeAnimatedEventDoUpdate
{
  NSNumber *viewTag = @1000;
  [self createSimpleAnimatedView:viewTag withOpacity:0];

  [_nodesManager addAnimatedEventToView:viewTag
                              eventName:@"topScroll"
                           eventMapping:@{@"animatedValueTag": @1,
                                          @"nativeEventPath": @[@"contentOffset", @"y"]}];



  // Make sure that the update actually happened synchronously in `handleAnimatedEvent` and does
  // not wait for the next animation loop.
  [[_uiManager expect] synchronouslyUpdateViewOnUIThread:viewTag
                                                viewName:@"UIView"
                                                   props:RCTPropChecker(@"opacity", @10)];
  [_nodesManager handleAnimatedEvent:[self createScrollEventWithTag:viewTag value:10]];
  [_uiManager verify];

  [[_uiManager reject] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY viewName:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager stepAnimations:_displayLink];
  [_uiManager verify];
}

- (void)testNativeAnimatedEventDoNotUpdate
{
  NSNumber *viewTag = @1000;
  [self createSimpleAnimatedView:viewTag withOpacity:0];

  [_nodesManager addAnimatedEventToView:viewTag
                              eventName:@"otherEvent"
                           eventMapping:@{@"animatedValueTag": @1,
                                          @"nativeEventPath": @[@"contentOffset", @"y"]}];

  [_nodesManager addAnimatedEventToView:@999
                              eventName:@"topScroll"
                           eventMapping:@{@"animatedValueTag": @1,
                                          @"nativeEventPath": @[@"contentOffset", @"y"]}];

  [[_uiManager reject] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY viewName:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager handleAnimatedEvent:[self createScrollEventWithTag:viewTag value:10]];
  [_uiManager verify];
}

@end
