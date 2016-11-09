//
//  RCTTVView.m
//  React
//
//  Created by Douglas Lowder on 11/5/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import "RCTTVView.h"
#import "RCTView.h"

#import "RCTAutoInsetsProtocol.h"
#import "RCTBorderDrawing.h"
#import "RCTConvert.h"
#import "RCTLog.h"
#import "RCTUtils.h"
#import "UIView+React.h"

#import "RCTBridge.h"
#import "RCTEventDispatcher.h"

@implementation RCTTVView
{
  UITapGestureRecognizer *_selectRecognizer;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    
    _tvParallaxDisable = false;
    _tvParallaxShiftDistanceX = 2.0f;
    _tvParallaxShiftDistanceY = 2.0f;
    _tvParallaxTiltAngle = 0.05f;
    _tvParallaxMagnification = 1.0f;
    
  }
  
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:unused)

#pragma mark - Apple TV specific methods

#if TARGET_OS_TV

- (void)setOnTVSelect:(RCTDirectEventBlock)onTVSelect {
  _onTVSelect = [onTVSelect copy];
  if(_onTVSelect) {
    UITapGestureRecognizer *recognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleSelect:)];
    recognizer.allowedPressTypes = @[[NSNumber numberWithInteger:UIPressTypeSelect]];
    _selectRecognizer = recognizer;
    [self addGestureRecognizer:_selectRecognizer];
  } else {
    if(_selectRecognizer) {
      [self removeGestureRecognizer:_selectRecognizer];
    }
  }
}

- (void)handleSelect:(UIGestureRecognizer*)r {
  RCTTVView *v = (RCTTVView*)r.view;
  if(v.onTVSelect) {
    v.onTVSelect(nil);
  }
}

- (BOOL)isUserInteractionEnabled {
  return YES;
}

- (BOOL)canBecomeFocused {
  return (self.onTVSelect != nil);
}

- (void)addParallaxMotionEffectsWithTiltValue:(CGFloat)tiltValue andPanValue:(CGFloat)panValue {
  // Size of shift movements
  CGFloat const shiftDistanceX = self.tvParallaxShiftDistanceX;
  CGFloat const shiftDistanceY = self.tvParallaxShiftDistanceY;
  
  // Make horizontal movements shift the centre left and right
  UIInterpolatingMotionEffect *xShift = [[UIInterpolatingMotionEffect alloc]
                                         initWithKeyPath:@"center.x"
                                         type:UIInterpolatingMotionEffectTypeTiltAlongHorizontalAxis];
  xShift.minimumRelativeValue = [NSNumber numberWithFloat: shiftDistanceX * -1.0f];
  xShift.maximumRelativeValue = [NSNumber numberWithFloat: shiftDistanceX];
  
  // Make vertical movements shift the centre up and down
  UIInterpolatingMotionEffect *yShift = [[UIInterpolatingMotionEffect alloc]
                                         initWithKeyPath:@"center.y"
                                         type:UIInterpolatingMotionEffectTypeTiltAlongVerticalAxis];
  yShift.minimumRelativeValue = [NSNumber numberWithFloat: shiftDistanceY * -1.0f];
  yShift.maximumRelativeValue = [NSNumber numberWithFloat: shiftDistanceY];
  
  // Size of tilt movements
  CGFloat const tiltAngle = self.tvParallaxTiltAngle;
  
  // Now make horizontal movements effect a rotation about the Y axis for side-to-side rotation.
  UIInterpolatingMotionEffect *xTilt = [[UIInterpolatingMotionEffect alloc] initWithKeyPath:@"layer.transform" type:UIInterpolatingMotionEffectTypeTiltAlongHorizontalAxis];
  
  // CATransform3D value for minimumRelativeValue
  CATransform3D transMinimumTiltAboutY = CATransform3DIdentity;
  transMinimumTiltAboutY.m34 = 1.0 / 500;
  transMinimumTiltAboutY = CATransform3DRotate(transMinimumTiltAboutY, tiltAngle * -1.0, 0, 1, 0);
  
  // CATransform3D value for minimumRelativeValue
  CATransform3D transMaximumTiltAboutY = CATransform3DIdentity;
  transMaximumTiltAboutY.m34 = 1.0 / 500;
  transMaximumTiltAboutY = CATransform3DRotate(transMaximumTiltAboutY, tiltAngle, 0, 1, 0);
  
  // Set the transform property boundaries for the interpolation
  xTilt.minimumRelativeValue = [NSValue valueWithCATransform3D: transMinimumTiltAboutY];
  xTilt.maximumRelativeValue = [NSValue valueWithCATransform3D: transMaximumTiltAboutY];
  
  // Now make vertical movements effect a rotation about the X axis for up and down rotation.
  UIInterpolatingMotionEffect *yTilt = [[UIInterpolatingMotionEffect alloc] initWithKeyPath:@"layer.transform" type:UIInterpolatingMotionEffectTypeTiltAlongVerticalAxis];
  
  // CATransform3D value for minimumRelativeValue
  CATransform3D transMinimumTiltAboutX = CATransform3DIdentity;
  transMinimumTiltAboutX.m34 = 1.0 / 500;
  transMinimumTiltAboutX = CATransform3DRotate(transMinimumTiltAboutX, tiltAngle * -1.0, 1, 0, 0);
  
  // CATransform3D value for minimumRelativeValue
  CATransform3D transMaximumTiltAboutX = CATransform3DIdentity;
  transMaximumTiltAboutX.m34 = 1.0 / 500;
  transMaximumTiltAboutX = CATransform3DRotate(transMaximumTiltAboutX, tiltAngle, 1, 0, 0);
  
  // Set the transform property boundaries for the interpolation
  yTilt.minimumRelativeValue = [NSValue valueWithCATransform3D: transMinimumTiltAboutX];
  yTilt.maximumRelativeValue = [NSValue valueWithCATransform3D: transMaximumTiltAboutX];
  
  // Add all of the motion effects to this group
  self.motionEffects = @[xShift, yShift, xTilt, yTilt];
  
  float magnification = self.tvParallaxMagnification;
  
  [UIView animateWithDuration:0.2 animations:^{
    self.transform = CGAffineTransformMakeScale(magnification, magnification);
  }];
  
  
}

- (void)didUpdateFocusInContext:(UIFocusUpdateContext *)context withAnimationCoordinator:(UIFocusAnimationCoordinator *)coordinator {
  if(context.nextFocusedView == self && self.onTVSelect != nil ) {
    [self becomeFirstResponder];
    [coordinator addCoordinatedAnimations:^(void){
      if(!self.tvParallaxDisable)
        [self addParallaxMotionEffectsWithTiltValue:0.25 andPanValue:5.0];
      if(self.onTVFocus) {
        self.onTVFocus(nil);
      }
    } completion:^(void){}];
  } else {
    [coordinator addCoordinatedAnimations:^(void){
      if(self.onTVBlur) {
        self.onTVBlur(nil);
      }
      [UIView animateWithDuration:0.2 animations:^{
        self.transform = CGAffineTransformMakeScale(1, 1);
      }];
      
      for (UIMotionEffect* effect in [self.motionEffects copy]){
        [self removeMotionEffect:effect];
      }
    } completion:^(void){}];
    [self resignFirstResponder];
  }
}

- (void)setHasTVPreferredFocus:(BOOL)hasTVPreferredFocus {
  self->_hasTVPreferredFocus = hasTVPreferredFocus;
  if(hasTVPreferredFocus) {
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(1.0 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
      UIView *rootview = self;
      while(![rootview isReactRootView]) {
        rootview = [rootview superview];
      }
      rootview = [rootview superview];
      
      [rootview performSelector:@selector(setReactPreferredFocusedView:) withObject:self];
      [rootview setNeedsFocusUpdate];
      [rootview updateFocusIfNeeded];
    });
  }
}

#endif


@end
