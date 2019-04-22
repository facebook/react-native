/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTVView.h"

#import "RCTAutoInsetsProtocol.h"
#import "RCTBorderDrawing.h"
#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "RCTRootViewInternal.h"
#import "RCTTVNavigationEventEmitter.h"
#import "RCTUtils.h"
#import "RCTView.h"
#import "UIView+React.h"

@implementation RCTTVView
{
  UITapGestureRecognizer *_selectRecognizer;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    dispatch_once(&onceToken, ^{
      defaultTVParallaxProperties = @{
        @"enabled": @YES,
        @"shiftDistanceX": @2.0f,
        @"shiftDistanceY": @2.0f,
        @"tiltAngle": @0.05f,
        @"magnification": @1.0f,
        @"pressMagnification": @1.0f,
        @"pressDuration": @0.3f,
        @"pressDelay": @0.0f
      };
    });
    self.tvParallaxProperties = defaultTVParallaxProperties;
  }

  return self;
}

static NSDictionary* defaultTVParallaxProperties = nil;
static dispatch_once_t onceToken;

- (void)setTvParallaxProperties:(NSDictionary *)tvParallaxProperties {
  if (_tvParallaxProperties == nil) {
    _tvParallaxProperties = [defaultTVParallaxProperties copy];
    return;
  }

  NSMutableDictionary *newParallaxProperties = [NSMutableDictionary dictionaryWithDictionary:_tvParallaxProperties];
  for (NSString *k in [defaultTVParallaxProperties allKeys]) {
    if (tvParallaxProperties[k]) {
      newParallaxProperties[k] = tvParallaxProperties[k];
    }
  }
  _tvParallaxProperties = [newParallaxProperties copy];
}

RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:unused)

- (void)setIsTVSelectable:(BOOL)isTVSelectable {
  self->_isTVSelectable = isTVSelectable;
  if (isTVSelectable) {
    UITapGestureRecognizer *recognizer = [[UITapGestureRecognizer alloc] 
                                           initWithTarget:self 
                                                   action:@selector(handleSelect:)];
    recognizer.allowedPressTypes = @[@(UIPressTypeSelect)];
    _selectRecognizer = recognizer;
    [self addGestureRecognizer:_selectRecognizer];
  } else {
    if(_selectRecognizer) {
      [self removeGestureRecognizer:_selectRecognizer];
    }
  }
}

- (void)handleSelect:(__unused UIGestureRecognizer *)r
{
	if ([self.tvParallaxProperties[@"enabled"] boolValue] == YES) {
    float magnification = [self.tvParallaxProperties[@"magnification"] floatValue];
    float pressMagnification = [self.tvParallaxProperties[@"pressMagnification"] floatValue];
		
		// Duration of press animation
		float pressDuration = [self.tvParallaxProperties[@"pressDuration"] floatValue];
		
		// Delay of press animation
		float pressDelay = [self.tvParallaxProperties[@"pressDelay"] floatValue];
		
    [[NSRunLoop currentRunLoop] runUntilDate:[NSDate dateWithTimeIntervalSinceNow:pressDelay]];
    
    [UIView animateWithDuration:(pressDuration/2)
      animations:^{
        self.transform = CGAffineTransformMakeScale(pressMagnification, pressMagnification);
      }
      completion:^(__unused BOOL finished1){
        [UIView animateWithDuration:(pressDuration/2)
          animations:^{
            self.transform = CGAffineTransformMakeScale(magnification, magnification);
          }
          completion:^(__unused BOOL finished2) {
            [[NSNotificationCenter defaultCenter] postNotificationName:RCTTVNavigationEventNotification 
              object:@{@"eventType":@"select",@"tag":self.reactTag}];
          }];
       }];
    
	} else {
		[[NSNotificationCenter defaultCenter] postNotificationName:RCTTVNavigationEventNotification
															                          object:@{@"eventType":@"select",@"tag":self.reactTag}];
	}
}

- (BOOL)isUserInteractionEnabled
{
  return YES;
}

- (BOOL)canBecomeFocused
{
  return (self.isTVSelectable);
}

- (void)addParallaxMotionEffects
{
  // Size of shift movements
  CGFloat const shiftDistanceX = [self.tvParallaxProperties[@"shiftDistanceX"] floatValue];
  CGFloat const shiftDistanceY = [self.tvParallaxProperties[@"shiftDistanceY"] floatValue];

  // Make horizontal movements shift the centre left and right
  UIInterpolatingMotionEffect *xShift = [[UIInterpolatingMotionEffect alloc]
                                          initWithKeyPath:@"center.x"
                                                     type:UIInterpolatingMotionEffectTypeTiltAlongHorizontalAxis];
  xShift.minimumRelativeValue = @( shiftDistanceX * -1.0f);
  xShift.maximumRelativeValue = @( shiftDistanceX);

  // Make vertical movements shift the centre up and down
  UIInterpolatingMotionEffect *yShift = [[UIInterpolatingMotionEffect alloc]
                                          initWithKeyPath:@"center.y"
                                                     type:UIInterpolatingMotionEffectTypeTiltAlongVerticalAxis];
  yShift.minimumRelativeValue = @( shiftDistanceY * -1.0f);
  yShift.maximumRelativeValue = @( shiftDistanceY);

  // Size of tilt movements
  CGFloat const tiltAngle = [self.tvParallaxProperties[@"tiltAngle"] floatValue];

  // Now make horizontal movements effect a rotation about the Y axis for side-to-side rotation.
  UIInterpolatingMotionEffect *xTilt = [[UIInterpolatingMotionEffect alloc] 
                                         initWithKeyPath:@"layer.transform"
                                                    type:UIInterpolatingMotionEffectTypeTiltAlongHorizontalAxis];

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
  UIInterpolatingMotionEffect *yTilt = [[UIInterpolatingMotionEffect alloc] 
                                         initWithKeyPath:@"layer.transform" 
                                                    type:UIInterpolatingMotionEffectTypeTiltAlongVerticalAxis];

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

  float magnification = [self.tvParallaxProperties[@"magnification"] floatValue];

  [UIView animateWithDuration:0.2 animations:^{
    self.transform = CGAffineTransformMakeScale(magnification, magnification);
  }];
}

- (void)didUpdateFocusInContext:(UIFocusUpdateContext *)context withAnimationCoordinator:(UIFocusAnimationCoordinator *)coordinator
{
  if (context.nextFocusedView == self && self.isTVSelectable ) {
    [self becomeFirstResponder];
    [coordinator addCoordinatedAnimations:^(void){
      if([self.tvParallaxProperties[@"enabled"] boolValue]) {
        [self addParallaxMotionEffects];
      }
      [[NSNotificationCenter defaultCenter] postNotificationName:RCTTVNavigationEventNotification
                                                          object:@{@"eventType":@"focus",@"tag":self.reactTag}];
    } completion:^(void){}];
  } else {
    [coordinator addCoordinatedAnimations:^(void){
      [[NSNotificationCenter defaultCenter] postNotificationName:RCTTVNavigationEventNotification
                                                          object:@{@"eventType":@"blur",@"tag":self.reactTag}];
      [UIView animateWithDuration:0.2 animations:^{
        self.transform = CGAffineTransformMakeScale(1, 1);
      }];

      for (UIMotionEffect *effect in [self.motionEffects copy]){
        [self removeMotionEffect:effect];
      }
    } completion:^(void){}];
    [self resignFirstResponder];
  }
}

- (void)setHasTVPreferredFocus:(BOOL)hasTVPreferredFocus
{
  _hasTVPreferredFocus = hasTVPreferredFocus;
  if (hasTVPreferredFocus) {
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(1.0 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
      UIView *rootview = self;
      while (![rootview isReactRootView] && rootview != nil) {
        rootview = [rootview superview];
      }
      if (rootview == nil) return;

      rootview = [rootview superview];

      [rootview setNeedsFocusUpdate];
      [rootview updateFocusIfNeeded];
    });
  }
}

@end
