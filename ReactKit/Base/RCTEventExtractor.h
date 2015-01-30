// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

#import "RCTModuleIDs.h"

/**
 * Simple utility to help extract arguments to JS invocations of React event
 * emitter (IOS version).
 */
@interface RCTEventExtractor : NSObject

+ (NSArray *)eventArgs:(NSNumber *)tag type:(RCTEventType)type nativeEventObj:(NSDictionary *)nativeEventObj;

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
+ (NSArray *)touchEventArgsForOrderedTouches:(NSArray *)orderedTouches
                            orderedStartTags:(NSArray *)orderedStartTags
                             orderedTouchIDs:(NSArray *)orderedTouchIDs
                              changedIndices:(NSArray *)changedIndices
                                        type:(RCTEventType)type
                                        view:(UIView *)view;

+ (NSDictionary *)scrollEventObject:(UIScrollView *)scrollView reactTag:(NSNumber *)reactTag;

/**
 * Useful when having to simply communicate the fact that *something* scrolled.
 * When JavaScript infers gestures based on the event stream, any type of
 * scroll that occurs in the native platform will cause ongoing gestures to
 * cancel. Scroll/table views already send scroll events appropriately, but
 * this method is useful for other views that don't actually scroll, but should
 * interrupt JavaScript gestures as scrolls do.
 */
+ (NSDictionary *)fakeScrollEventObjectFor:(NSNumber *)reactTag;

/**
 * Finds the React target of a touch. This must be done when the touch starts,
 * else `UIKit` gesture recognizers may destroy the touch's target.
 */
+ (NSNumber *)touchStartTarget:(UITouch *)touch inView:(UIView *)view;

@end

