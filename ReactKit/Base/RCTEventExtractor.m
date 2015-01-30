// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTEventExtractor.h"

#import "RCTLog.h"
#import "RCTUIManager.h"
#import "RCTViewNodeProtocol.h"

@implementation RCTEventExtractor

// TODO (#5906496): an array lookup would be better than a switch statement here

/**
 * Keep in sync with `IOSEventConstants.js`.
 * TODO (#5906496): do this sync programmatically instead of manually
 */
+ (NSString *)topLevelTypeForEventType:(RCTEventType)eventType
{
  switch(eventType) {
    case RCTEventTap:
      return @"topTap";
    case RCTEventVisibleCellsChange:
      return @"topVisibleCellsChange";
    case RCTEventNavigateBack:
      return @"topNavigateBack";
    case RCTEventNavRightButtonTap:
      return @"topNavRightButtonTap";
    case RCTEventChange:
      return @"topChange";
    case RCTEventTextFieldDidFocus:
      return @"topFocus";
    case RCTEventTextFieldWillBlur:
      return @"topBlur";
    case RCTEventTextFieldSubmitEditing:
      return @"topSubmitEditing";
    case RCTEventTextFieldEndEditing:
      return @"topEndEditing";
    case RCTEventTextInput:
      return @"topTextInput";
    case RCTEventLongPress:
      return @"topLongPress"; // Not yet supported
    case RCTEventTouchCancel:
      return @"topTouchCancel";
    case RCTEventTouchEnd:
      return @"topTouchEnd";
    case RCTEventTouchMove:
      return @"topTouchMove";
    case RCTEventTouchStart:
      return @"topTouchStart";
    case RCTEventScrollBeginDrag:
      return @"topScrollBeginDrag";
    case RCTEventScroll:
      return @"topScroll";
    case RCTEventScrollEndDrag:
      return @"topScrollEndDrag";
    case RCTEventScrollAnimationEnd:
      return @"topScrollAnimationEnd";
    case RCTEventSelectionChange:
      return @"topSelectionChange";
    case RCTEventMomentumScrollBegin:
      return @"topMomentumScrollBegin";
    case RCTEventMomentumScrollEnd:
      return @"topMomentumScrollEnd";
    case RCTEventPullToRefresh:
      return @"topPullToRefresh";
    case RCTEventLoadingStart:
      return @"topLoadingStart";
    case RCTEventLoadingFinish:
      return @"topLoadingFinish";
    case RCTEventLoadingError:
      return @"topLoadingError";
    case RCTEventNavigationProgress:
      return @"topNavigationProgress";
    default :
      RCTLogError(@"Unrecognized event type: %tu", eventType);
      return @"unknown";
  }
}

/**
 * TODO (#5906496): Cache created string messages for each event type/tag target (for
 * events that have no data) to save allocations.
 */
+ (NSArray *)eventArgs:(NSNumber *)reactTag
                  type:(RCTEventType)type
        nativeEventObj:(NSDictionary *)nativeEventObj
{
  NSString *topLevelType = [RCTEventExtractor topLevelTypeForEventType:type];
  return @[reactTag ?: @0, topLevelType, nativeEventObj];
}

+ (NSArray *)touchEventArgsForOrderedTouches:(NSArray *)orderedTouches
                            orderedStartTags:(NSArray *)orderedStartTags
                             orderedTouchIDs:(NSArray *)orderedTouchIDs
                              changedIndices:(NSArray *)changedIndices
                                        type:(RCTEventType)type
                                        view:(UIView *)view
{
  if (!orderedTouches || !orderedTouches.count) {
    RCTLogError(@"No touches in touchEventArgsForOrderedTouches");
    return nil;
  }
  NSMutableArray *touchObjects = [[NSMutableArray alloc] init];
  for (NSInteger i = 0; i < orderedTouches.count; i++) {
    NSDictionary *touchObj =
      [RCTEventExtractor touchObj:orderedTouches[i]
                   withTargetTag:orderedStartTags[i]
                     withTouchID:orderedTouchIDs[i]
                          inView:view];
    [touchObjects addObject:touchObj];
  }
  NSString *topLevelType = [RCTEventExtractor topLevelTypeForEventType:type];
  return @[topLevelType, touchObjects, changedIndices];
}

+ (NSNumber *)touchStartTarget:(UITouch *)touch inView:(UIView *)view
{
  UIView <RCTViewNodeProtocol> *closestReactAncestor = [RCTUIManager closestReactAncestorThatRespondsToTouch:touch];
  return [closestReactAncestor reactTag];
}

/**
 * Constructs an object that contains all of the important touch data. This
 * should contain a superset of a W3C `Touch` object. The `Event` objects that
 * reference these touches can only be constructed from a collection of touch
 * objects that are recieved across the serialized bridge.
 *
 * Must accept the `targetReactTag` because targets are reset to `nil` by
 * `UIKit` gesture system. We had to pre-recorded at the time of touch start.
 */
+ (NSDictionary *)touchObj:(UITouch *)touch
             withTargetTag:(NSNumber *)targetReactTag
               withTouchID:(NSNumber *)touchID
                    inView:(UIView *)view
{
  CGPoint location = [touch locationInView:view];
  CGPoint locInView = [touch locationInView:touch.view];
  double timeStamp = touch.timestamp * 1000.0; // convert to ms
  return @{
    @"pageX": @(location.x),
    @"pageY": @(location.y),
    @"locationX": @(locInView.x),
    @"locationY": @(locInView.y),
    @"target": targetReactTag,
    @"identifier": touchID,
    @"timeStamp": @(timeStamp),
    @"touches": [NSNull null],         // We hijack this touchObj to serve both as an event
    @"changedTouches": [NSNull null],  // and as a Touch object, so making this JIT friendly.
  };
}

// TODO (#5906496): shouldn't some of these strings be constants?

+ (NSDictionary *)makeScrollEventObject:(UIScrollView *)uiScrollView reactTag:(NSNumber *)reactTag;
{
  return @{
    @"contentOffset": @{
      @"x": @(uiScrollView.contentOffset.x),
      @"y": @(uiScrollView.contentOffset.y)
    },
    @"contentSize": @{
      @"width": @(uiScrollView.contentSize.width),
      @"height": @(uiScrollView.contentSize.height)
    },
    @"layoutMeasurement": @{
      @"width": @(uiScrollView.frame.size.width),
      @"height": @(uiScrollView.frame.size.height)
    },
    @"zoomScale": @(uiScrollView.zoomScale),
    @"target": reactTag,
  };
}

+ (NSDictionary *)scrollEventObject:(UIScrollView *)scrollView reactTag:(NSNumber *)reactTag
{
  return [RCTEventExtractor makeScrollEventObject:scrollView reactTag:reactTag];
}

+ (NSDictionary *)fakeScrollEventObjectFor:(NSNumber *)reactTag
{
  return @{
    @"contentOffset": @{
      @"x": @0,
      @"y": @0
    },
    @"contentSize": @{
      @"width": @0,
      @"height": @0
    },
    @"layoutMeasurement": @{
      @"width": @0,
      @"height": @0
    },
    @"zoomScale": @1,
    @"target": reactTag
  };
}

@end

