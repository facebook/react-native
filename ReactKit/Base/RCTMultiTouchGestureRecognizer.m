// Copyright 2004-present Facebook. All Rights Reserved.

// Copyright 2013-present Facebook. All Rights Reserved.

#import "RCTMultiTouchGestureRecognizer.h"

#import <UIKit/UIGestureRecognizerSubclass.h>

#import "RCTLog.h"

@implementation RCTMultiTouchGestureRecognizer

- (void)touchesBegan:(NSSet *)startedTouches withEvent:(UIEvent *)event {
  [super touchesBegan:startedTouches withEvent:event];
  if (!self.touchEventDelegate) {
    RCTLogError(@"No Touch Delegate for Simple Gesture Recognizer");
    return;
  }
  self.state = UIGestureRecognizerStateBegan;
  [self.touchEventDelegate handleTouchesStarted:startedTouches
                      forMultiGestureRecognizer:self
                                      withEvent:event];
}

- (void)touchesMoved:(NSSet *)movedTouches withEvent:(UIEvent *)event {
  [super touchesMoved:movedTouches withEvent:event];
  if (self.state == UIGestureRecognizerStateFailed) {
    return;
  }
  [self.touchEventDelegate handleTouchesMoved:movedTouches
                                   forMultiGestureRecognizer:self
                                    withEvent:event];
}

- (void)touchesEnded:(NSSet *)endedTouches withEvent:(UIEvent *)event {
  [super touchesEnded:endedTouches withEvent:event];
  [self.touchEventDelegate handleTouchesEnded:endedTouches
                                   forMultiGestureRecognizer:self
                                    withEvent:event];
  // These may be a different set than the total set of touches.
  NSSet *touches = [event touchesForGestureRecognizer:self];

  BOOL hasEnded = [self _allTouchesAreCanceledOrEnded:touches];

  if (hasEnded) {
    self.state = UIGestureRecognizerStateEnded;
  } else if ([self _anyTouchesChanged:touches]) {
    self.state = UIGestureRecognizerStateChanged;
  }
}

- (void)touchesCancelled:(NSSet *)cancelledTouches withEvent:(UIEvent *)event {
  [super touchesCancelled:cancelledTouches withEvent:event];
  [self.touchEventDelegate handleTouchesCancelled:cancelledTouches
                        forMultiGestureRecognizer:self
                                        withEvent:event];
  // These may be a different set than the total set of touches.
  NSSet *touches = [event touchesForGestureRecognizer:self];

  BOOL hasCanceled = [self _allTouchesAreCanceledOrEnded:touches];

  if (hasCanceled) {
    self.state = UIGestureRecognizerStateFailed;
  } else if ([self _anyTouchesChanged:touches]) {
    self.state = UIGestureRecognizerStateChanged;
  }
}

- (BOOL)canPreventGestureRecognizer:(UIGestureRecognizer *)preventedGestureRecognizer
{
  return NO;
}

- (BOOL)canBePreventedByGestureRecognizer:(UIGestureRecognizer *)preventingGestureRecognizer
{
  return NO;
}

#pragma mark - Private

- (BOOL)_allTouchesAreCanceledOrEnded:(NSSet *)touches
{
  for (UITouch *touch in touches) {
    if (touch.phase == UITouchPhaseBegan || touch.phase == UITouchPhaseMoved) {
      return NO;
    } else if (touch.phase == UITouchPhaseStationary) {
      return NO;
    }
  }
  return YES;
}

- (BOOL)_anyTouchesChanged:(NSSet *)touches
{
  for (UITouch *touch in touches) {
    if (touch.phase == UITouchPhaseBegan || touch.phase == UITouchPhaseMoved) {
      return YES;
    }
  }
  return NO;
}

@end
