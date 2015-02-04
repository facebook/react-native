// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTEventDispatcher.h"

#import "RCTBridge.h"
#import "RCTModuleIDs.h"
#import "UIView+ReactKit.h"

@implementation RCTEventDispatcher
{
  RCTBridge *_bridge;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if ((self = [super init])) {
    _bridge = bridge;
  }
  return self;
}

- (NSArray *)touchEvents
{
  static NSArray *events;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    events = @[
      @"topTouchStart",
      @"topTouchMove",
      @"topTouchEnd",
      @"topTouchCancel",
    ];
  });
  
  return events;
}

- (void)sendRawEventWithType:(NSString *)eventType body:(NSDictionary *)body
{
  static NSSet *touchEvents;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    touchEvents = [NSSet setWithArray:[self touchEvents]];
  });
  
  RCTAssert(![touchEvents containsObject:eventType], @"Touch events must be"
    "sent via the sendTouchEventWithOrderedTouches: method, not sendRawEventWithType:");
  
  RCTAssert([body[@"target"] isKindOfClass:[NSNumber class]],
    @"Event body dictionary must include a 'target' property containing a react tag");
  
  [_bridge enqueueJSCall:RCTModuleIDReactIOSEventEmitter
                methodID:RCTEventEmitterReceiveEvent
                    args:@[body[@"target"], eventType, body]];
}

/**
 * Constructs information about touch events to send across the serialized
 * boundary. This data should be compliant with W3C `Touch` objects. This data
 * alone isn't sufficient to construct W3C `Event` objects. To construct that,
 * there must be a simple receiver on the other side of the bridge that
 * organizes the touch objects into `Event`s.
 *
 * We send the data as an array of `Touch`es, the type of action
 * (start/end/move/cancel) and the indices that represent "changed" `Touch`es
 * from that array.
 */
- (void)sendTouchEventWithType:(RCTTouchEventType)type
                       touches:(NSArray *)touches
                changedIndexes:(NSArray *)changedIndexes
{
  RCTAssert(touches.count, @"No touches in touchEventArgsForOrderedTouches");

  [_bridge enqueueJSCall:RCTModuleIDReactIOSEventEmitter
                methodID:RCTEventEmitterReceiveTouches
                    args:@[[self touchEvents][type], touches, changedIndexes]];
}

- (void)sendTextEventWithType:(RCTTextEventType)type
                     reactTag:(NSNumber *)reactTag
                         text:(NSString *)text
{
  static NSArray *events;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    events = @[
      @"topFocus",
      @"topBlur",
      @"topChange",
      @"topSubmitEditing",
      @"topEndEditing",
    ];
  });
  
  [self sendRawEventWithType:events[type] body:@{
    @"text": text,
    @"target": reactTag
  }];
}

/**
 * TODO: throttling
 * NOTE: the old system used a per-scrollview throttling
 * which would be fairly easy to re-implement if needed,
 * but this is non-optimal as it leads to degradation in
 * scroll responsiveness. A better solution would be to
 * coalesce multiple scroll events into a single batch.
 */
- (void)sendScrollEventWithType:(RCTScrollEventType)type
                       reactTag:(NSNumber *)reactTag
                     scrollView:(UIScrollView *)scrollView
                       userData:(NSDictionary *)userData
{
  static NSArray *events;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    events = @[
      @"topScrollBeginDrag",
      @"topScroll",
      @"topScrollEndDrag",
      @"topMomentumScrollBegin",
      @"topMomentumScrollEnd",
      @"topScrollAnimationEnd",
    ];
  });
  
  NSDictionary *body = @{
    @"contentOffset": @{
      @"x": @(scrollView.contentOffset.x),
      @"y": @(scrollView.contentOffset.y)
    },
    @"contentSize": @{
      @"width": @(scrollView.contentSize.width),
      @"height": @(scrollView.contentSize.height)
    },
    @"layoutMeasurement": @{
      @"width": @(scrollView.frame.size.width),
      @"height": @(scrollView.frame.size.height)
    },
    @"zoomScale": @(scrollView.zoomScale ?: 1),
    @"target": reactTag
  };
  
  if (userData) {
    NSMutableDictionary *mutableBody = [body mutableCopy];
    [mutableBody addEntriesFromDictionary:userData];
    body = mutableBody;
  }
  
  [self sendRawEventWithType:events[type] body:body];
}

@end
