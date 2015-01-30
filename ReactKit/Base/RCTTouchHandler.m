// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTTouchHandler.h"

#import "RCTAssert.h"
#import "RCTEventExtractor.h"
#import "RCTJavaScriptEventDispatcher.h"
#import "RCTLog.h"
#import "RCTMultiTouchGestureRecognizer.h"
#import "RCTUIManager.h"
#import "RCTUtils.h"
#import "UIView+ReactKit.h"

@interface RCTTouchHandler () <RCTMultiTouchGestureRecognizerListener, UIGestureRecognizerDelegate>

@end

@implementation RCTTouchHandler
{
  UIView *_rootView;
  NSMutableArray *_gestureRecognizers;
}

- (instancetype)init
{
  RCT_NOT_DESIGNATED_INITIALIZER();
}

- (instancetype)initWithEventDispatcher:(RCTJavaScriptEventDispatcher *)eventDispatcher
                               rootView:(UIView *)rootView
{
  if (self = [super init]) {
    RCTAssert(eventDispatcher != nil, @"Expect an event dispatcher");
    RCTAssert(rootView != nil, @"Expect a root view");
    _eventDispatcher = eventDispatcher;
    _rootView = rootView;
    _gestureRecognizers = [NSMutableArray new];
    _orderedTouches = [[NSMutableArray alloc] init];
    _orderedTouchStartTags = [[NSMutableArray alloc] init];
    _orderedTouchIDs = [[NSMutableArray alloc] init];
    [self _loadGestureRecognizers];
  }
  return self;
}

- (void)dealloc
{
  [self removeGestureRecognizers];
}

#pragma mark - Gesture Recognizers

- (void)_loadGestureRecognizers
{
  [self _addRecognizerForEvent:RCTEventTap];
  [self _addRecognizerForEvent:RCTEventLongPress];
  [self _addRecognizerForSimpleTouchEvents];
}

- (void)_addRecognizerForSimpleTouchEvents
{
  RCTMultiTouchGestureRecognizer *multiTouchRecognizer =
  [[RCTMultiTouchGestureRecognizer alloc] initWithTarget:self action:@selector(handleMultiTouchGesture:)];
  multiTouchRecognizer.touchEventDelegate = self;
  [self _addRecognizer:multiTouchRecognizer];
}

- (void)_addRecognizerForEvent:(RCTEventType)event
{
  UIGestureRecognizer *recognizer = nil;
  switch (event) {
    case RCTEventTap:
      recognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleTap:)];
      ((UITapGestureRecognizer *)recognizer).numberOfTapsRequired = 1;
      break;

    case RCTEventVisibleCellsChange:
    case RCTEventNavigateBack:
    case RCTEventNavRightButtonTap:
    case RCTEventChange:
    case RCTEventTextFieldDidFocus:
    case RCTEventTextFieldWillBlur:
    case RCTEventTextFieldSubmitEditing:
    case RCTEventTextFieldEndEditing:
    case RCTEventScroll:
      break;

    case RCTEventLongPress:
      recognizer = [[UILongPressGestureRecognizer alloc] initWithTarget:self action:@selector(handleLongPress:)];
      break;
    default:
      RCTLogError(@"Unrecognized event type for gesture: %zd", event);

  }
  [self _addRecognizer:recognizer];
}

- (void)_addRecognizer:(UIGestureRecognizer *)recognizer
{
  // `cancelsTouchesInView` is needed in order to be used as a top level event delegated recognizer. Otherwise, lower
  // level components not build using RCT, will fail to recognize gestures.
  recognizer.cancelsTouchesInView = NO;
  recognizer.delegate = self;
  [_gestureRecognizers addObject:recognizer];
  [_rootView addGestureRecognizer:recognizer];
}

- (void)removeGestureRecognizers
{
  for (UIGestureRecognizer *recognizer in _gestureRecognizers) {
    [recognizer setDelegate:nil];
    [recognizer removeTarget:nil action:NULL];
    [_rootView removeGestureRecognizer:recognizer];
  }
}

#pragma mark - Bookkeeping for touch indices

- (void)_recordNewTouches:(NSSet *)touches
{
  for (UITouch *touch in touches) {
    NSUInteger currentIndex = [_orderedTouches indexOfObject:touch];
    if (currentIndex != NSNotFound) {
      RCTLogError(@"Touch is already recorded. This is a critical bug.");
      [_orderedTouches removeObjectAtIndex:currentIndex];
      [_orderedTouchStartTags removeObjectAtIndex:currentIndex];
      [_orderedTouchIDs removeObjectAtIndex:currentIndex];
    }
    NSNumber *touchStartTag = [RCTEventExtractor touchStartTarget:touch inView:_rootView];

    // Get new, unique touch id
    const NSUInteger RCTMaxTouches = 11; // This is the maximum supported by iDevices
    NSInteger touchID = ([_orderedTouchIDs.lastObject integerValue] + 1) % RCTMaxTouches;
    for (NSNumber *n in _orderedTouchIDs) {
      NSInteger usedID = [n integerValue];
      if (usedID == touchID) {
        // ID has already been used, try next value
        touchID ++;
      } else if (usedID > touchID) {
        // If usedID > touchID, touchID must be unique, so we can stop looking
        break;
      }
    }

    [_orderedTouches addObject:touch];
    [_orderedTouchStartTags addObject:touchStartTag];
    [_orderedTouchIDs addObject:@(touchID)];
  }
}

- (void)_recordRemovedTouches:(NSSet *)touches
{
  for (UITouch *touch in touches) {
    NSUInteger currentIndex = [_orderedTouches indexOfObject:touch];
    if (currentIndex == NSNotFound) {
      RCTLogError(@"Touch is already removed. This is a critical bug.");
    } else {
      [_orderedTouches removeObjectAtIndex:currentIndex];
      [_orderedTouchStartTags removeObjectAtIndex:currentIndex];
      [_orderedTouchIDs removeObjectAtIndex:currentIndex];
    }
  }
}


#pragma mark - Gesture Recognizer Delegate Callbacks

- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer shouldRecognizeSimultaneouslyWithGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer
{
  return YES;
}

- (NSArray *)_indicesOfTouches:(NSSet *)touchSet inArray:(NSArray *)array
{
  NSMutableArray *result = [[NSMutableArray alloc] init];
  for (UITouch *touch in touchSet) {
    [result addObject:@([array indexOfObject:touch])];
  }
  return result;
}

- (void)handleTouchesStarted:(NSSet *)startedTouches
   forMultiGestureRecognizer:(RCTMultiTouchGestureRecognizer *)multiTouchGestureRecognizer
                   withEvent:(UIEvent *)event
{
  // "start" has to record new touches before extracting the event.
  // "end"/"cancel" needs to remove the touch *after* extracting the event.
  [self _recordNewTouches:startedTouches];
  NSArray *indicesOfStarts = [self _indicesOfTouches:startedTouches inArray:_orderedTouches];
  NSArray *args =
    [RCTEventExtractor touchEventArgsForOrderedTouches:_orderedTouches
                                     orderedStartTags:_orderedTouchStartTags
                                      orderedTouchIDs:_orderedTouchIDs
                                       changedIndices:indicesOfStarts
                                                 type:RCTEventTouchStart
                                                 view:_rootView];
  [_eventDispatcher sendTouchesWithArgs:args];
}

- (void)handleTouchesMoved:(NSSet *)movedTouches
 forMultiGestureRecognizer:(RCTMultiTouchGestureRecognizer *)multiTouchGestureRecognizer
                 withEvent:(UIEvent *)event
{
  NSArray *indicesOfMoves = [self _indicesOfTouches:movedTouches inArray:_orderedTouches];
  NSArray *args =
    [RCTEventExtractor touchEventArgsForOrderedTouches:_orderedTouches
                                     orderedStartTags:_orderedTouchStartTags
                                      orderedTouchIDs:_orderedTouchIDs
                                       changedIndices:indicesOfMoves
                                                 type:RCTEventTouchMove
                                                 view:_rootView];
  [_eventDispatcher sendTouchesWithArgs:args];
}

- (void)handleTouchesEnded:(NSSet *)endedTouches
 forMultiGestureRecognizer:(RCTMultiTouchGestureRecognizer *)multiTouchGestureRecognizer
                 withEvent:(UIEvent *)event
{
  NSArray *indicesOfEnds = [self _indicesOfTouches:endedTouches inArray:_orderedTouches];
  NSArray *args =
    [RCTEventExtractor touchEventArgsForOrderedTouches:_orderedTouches
                                     orderedStartTags:_orderedTouchStartTags
                                      orderedTouchIDs:_orderedTouchIDs
                                       changedIndices:indicesOfEnds
                                                 type:RCTEventTouchEnd
                                                 view:_rootView];
  [_eventDispatcher sendTouchesWithArgs:args];
  [self _recordRemovedTouches:endedTouches];
}

- (void)handleTouchesCancelled:(NSSet *)cancelledTouches
     forMultiGestureRecognizer:(RCTMultiTouchGestureRecognizer *)multiTouchGestureRecognizer
                     withEvent:(UIEvent *)event
{
  NSArray *indicesOfCancels = [self _indicesOfTouches:cancelledTouches inArray:_orderedTouches];
  NSArray *args =
    [RCTEventExtractor touchEventArgsForOrderedTouches:_orderedTouches
                                     orderedStartTags:_orderedTouchStartTags
                                      orderedTouchIDs:_orderedTouchIDs
                                       changedIndices:indicesOfCancels
                                                 type:RCTEventTouchCancel
                                                 view:_rootView];
  [_eventDispatcher sendTouchesWithArgs:args];
  [self _recordRemovedTouches:cancelledTouches];
}


/**
 * Needed simply to be provided to the `RCTMultiTouchGestureRecognizer`. If not,
 * other gestures are cancelled.
 */
- (void)handleMultiTouchGesture:(UIGestureRecognizer *)sender
{

}

- (NSDictionary *)_nativeEventForGesture:(UIGestureRecognizer *)sender
                                         target:(UIView *)target
                                reactTargetView:(UIView *)reactTargetView
{
  return @{
    @"state": @(sender.state),
    @"target": reactTargetView.reactTag,
  };
}

- (void)handleTap:(UIGestureRecognizer *)sender
{
  // This calculation may not be accurate when views overlap.
  UIView *touchedView = sender.view;
  CGPoint location = [sender locationInView:touchedView];
  UIView *target = [touchedView hitTest:location withEvent:nil];

  // Views outside the RCT system can be present (e.g., UITableViewCellContentView)
  // they have no registry. we can safely ignore events happening on them.
  if (sender.state == UIGestureRecognizerStateEnded) {
    UIView *reactTargetView = [RCTUIManager closestReactAncestor:target];
    if (reactTargetView) {
      NSMutableDictionary *nativeEvent =[[self _nativeEventForGesture:sender target:target reactTargetView:reactTargetView] mutableCopy];
      nativeEvent[@"pageX"] = @(location.x);
      nativeEvent[@"pageY"] = @(location.y);
      CGPoint locInView = [sender.view convertPoint:location toView:target];
      nativeEvent[@"locationX"] = @(locInView.x);
      nativeEvent[@"locationY"] = @(locInView.y);
      [_eventDispatcher sendEventWithArgs:[RCTEventExtractor eventArgs:[reactTargetView reactTag]
                                                                 type:RCTEventTap
                                                       nativeEventObj:nativeEvent]];
    }
  }
}

- (void)handleLongPress:(UIGestureRecognizer *)sender
{
}

@end
