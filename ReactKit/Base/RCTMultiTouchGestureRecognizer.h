// Copyright 2004-present Facebook. All Rights Reserved.

// Copyright 2013-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

@class RCTMultiTouchGestureRecognizer;

@protocol RCTMultiTouchGestureRecognizerListener <NSObject>

- (void)handleTouchesStarted:(NSSet *)startedTouches
   forMultiGestureRecognizer:(RCTMultiTouchGestureRecognizer *)multiTouchGestureRecognizer
                   withEvent:(UIEvent *)event;

- (void)handleTouchesMoved:(NSSet *)movedTouches
 forMultiGestureRecognizer:(RCTMultiTouchGestureRecognizer *)multiTouchGestureRecognizer
                 withEvent:(UIEvent *)event;

- (void)handleTouchesEnded:(NSSet *)endedTouches
 forMultiGestureRecognizer:(RCTMultiTouchGestureRecognizer *)multiTouchGestureRecognizer
                 withEvent:(UIEvent *)event;

- (void)handleTouchesCancelled:(NSSet *)cancelledTouches
     forMultiGestureRecognizer:(RCTMultiTouchGestureRecognizer *)multiTouchGestureRecognizer
                     withEvent:(UIEvent *)event;

@end

@interface RCTMultiTouchGestureRecognizer : UIGestureRecognizer

@property (nonatomic, weak) id<RCTMultiTouchGestureRecognizerListener> touchEventDelegate;

@end
