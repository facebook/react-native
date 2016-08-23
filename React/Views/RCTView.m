/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTView.h"

#import "RCTAutoInsetsProtocol.h"
#import "RCTBorderDrawing.h"
#import "RCTConvert.h"
#import "RCTLog.h"
#import "RCTUtils.h"
#import "UIView+React.h"

#import "RCTBridge.h"
#import "RCTEventDispatcher.h"

@implementation UIView (RCTViewUnmounting)

- (void)react_remountAllSubviews
{
  // Normal views don't support unmounting, so all
  // this does is forward message to our subviews,
  // in case any of those do support it

  for (UIView *subview in self.subviews) {
    [subview react_remountAllSubviews];
  }
}

- (void)react_updateClippedSubviewsWithClipRect:(CGRect)clipRect relativeToView:(UIView *)clipView
{
  // Even though we don't support subview unmounting
  // we do support clipsToBounds, so if that's enabled
  // we'll update the clipping

  if (self.clipsToBounds && self.subviews.count > 0) {
    clipRect = [clipView convertRect:clipRect toView:self];
    clipRect = CGRectIntersection(clipRect, self.bounds);
    clipView = self;
  }

  // Normal views don't support unmounting, so all
  // this does is forward message to our subviews,
  // in case any of those do support it

  for (UIView *subview in self.subviews) {
    [subview react_updateClippedSubviewsWithClipRect:clipRect relativeToView:clipView];
  }
}

- (UIView *)react_findClipView
{
  UIView *testView = self;
  UIView *clipView = nil;
  CGRect clipRect = self.bounds;
  // We will only look for a clipping view up the view hierarchy until we hit the root view.
  while (testView) {
    if (testView.clipsToBounds) {
      if (clipView) {
        CGRect testRect = [clipView convertRect:clipRect toView:testView];
        if (!CGRectContainsRect(testView.bounds, testRect)) {
          clipView = testView;
          clipRect = CGRectIntersection(testView.bounds, testRect);
        }
      } else {
        clipView = testView;
        clipRect = [self convertRect:self.bounds toView:clipView];
      }
    }
    if ([testView isReactRootView]) {
      break;
    }
    testView = testView.superview;
  }
  return clipView ?: self.window;
}

@end

static NSString *RCTRecursiveAccessibilityLabel(UIView *view)
{
  NSMutableString *str = [NSMutableString stringWithString:@""];
  for (UIView *subview in view.subviews) {
    NSString *label = subview.accessibilityLabel;
    if (label) {
      [str appendString:@" "];
      [str appendString:label];
    } else {
      [str appendString:RCTRecursiveAccessibilityLabel(subview)];
    }
  }
  return str;
}

@implementation RCTView
{
  UIColor *_backgroundColor;
  UITapGestureRecognizer *_selectRecognizer;
}

@synthesize reactZIndex = _reactZIndex;

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    _borderWidth = -1;
    _borderTopWidth = -1;
    _borderRightWidth = -1;
    _borderBottomWidth = -1;
    _borderLeftWidth = -1;
    _borderTopLeftRadius = -1;
    _borderTopRightRadius = -1;
    _borderBottomLeftRadius = -1;
    _borderBottomRightRadius = -1;
    _borderStyle = RCTBorderStyleSolid;
    _hitTestEdgeInsets = UIEdgeInsetsZero;

    _backgroundColor = super.backgroundColor;
    
    _tvParallaxDisable = false;
    _tvParallaxShiftDistanceX = 2.0f;
    _tvParallaxShiftDistanceY = 2.0f;
    _tvParallaxTiltAngle = 0.05f;
    _tvParallaxMagnification = 1.0f;

  }

  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:unused)

- (NSString *)accessibilityLabel
{
  if (super.accessibilityLabel) {
    return super.accessibilityLabel;
  }
  return RCTRecursiveAccessibilityLabel(self);
}

- (void)setPointerEvents:(RCTPointerEvents)pointerEvents
{
  _pointerEvents = pointerEvents;
  self.userInteractionEnabled = (pointerEvents != RCTPointerEventsNone);
  if (pointerEvents == RCTPointerEventsBoxNone) {
    self.accessibilityViewIsModal = NO;
  }
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  BOOL canReceiveTouchEvents = ([self isUserInteractionEnabled] && ![self isHidden]);
  if(!canReceiveTouchEvents) {
    return nil;
  }

  // `hitSubview` is the topmost subview which was hit. The hit point can
  // be outside the bounds of `view` (e.g., if -clipsToBounds is NO).
  UIView *hitSubview = nil;
  BOOL isPointInside = [self pointInside:point withEvent:event];
  BOOL needsHitSubview = !(_pointerEvents == RCTPointerEventsNone || _pointerEvents == RCTPointerEventsBoxOnly);
  if (needsHitSubview && (![self clipsToBounds] || isPointInside)) {
    // The default behaviour of UIKit is that if a view does not contain a point,
    // then no subviews will be returned from hit testing, even if they contain
    // the hit point. By doing hit testing directly on the subviews, we bypass
    // the strict containment policy (i.e., UIKit guarantees that every ancestor
    // of the hit view will return YES from -pointInside:withEvent:). See:
    //  - https://developer.apple.com/library/ios/qa/qa2013/qa1812.html
    for (UIView *subview in [self.subviews reverseObjectEnumerator]) {
      CGPoint convertedPoint = [subview convertPoint:point fromView:self];
      hitSubview = [subview hitTest:convertedPoint withEvent:event];
      if (hitSubview != nil) {
        break;
      }
    }
  }

  UIView *hitView = (isPointInside ? self : nil);

  switch (_pointerEvents) {
    case RCTPointerEventsNone:
      return nil;
    case RCTPointerEventsUnspecified:
      return hitSubview ?: hitView;
    case RCTPointerEventsBoxOnly:
      return hitView;
    case RCTPointerEventsBoxNone:
      return hitSubview;
    default:
      RCTLogError(@"Invalid pointer-events specified %zd on %@", _pointerEvents, self);
      return hitSubview ?: hitView;
  }
}

- (BOOL)pointInside:(CGPoint)point withEvent:(UIEvent *)event
{
  if (UIEdgeInsetsEqualToEdgeInsets(self.hitTestEdgeInsets, UIEdgeInsetsZero)) {
    return [super pointInside:point withEvent:event];
  }
  CGRect hitFrame = UIEdgeInsetsInsetRect(self.bounds, self.hitTestEdgeInsets);
  return CGRectContainsPoint(hitFrame, point);
}

- (BOOL)accessibilityActivate
{
  if (_onAccessibilityTap) {
    _onAccessibilityTap(nil);
    return YES;
  } else {
    return NO;
  }
}

- (BOOL)accessibilityPerformMagicTap
{
  if (_onMagicTap) {
    _onMagicTap(nil);
    return YES;
  } else {
    return NO;
  }
}

- (NSString *)description
{
  NSString *superDescription = super.description;
  NSRange semicolonRange = [superDescription rangeOfString:@";"];
  NSString *replacement = [NSString stringWithFormat:@"; reactTag: %@;", self.reactTag];
  return [superDescription stringByReplacingCharactersInRange:semicolonRange withString:replacement];
}


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
  RCTView *v = (RCTView*)r.view;
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

#pragma mark - Statics for dealing with layoutGuides

+ (void)autoAdjustInsetsForView:(UIView<RCTAutoInsetsProtocol> *)parentView
                 withScrollView:(UIScrollView *)scrollView
                   updateOffset:(BOOL)updateOffset
{
  UIEdgeInsets baseInset = parentView.contentInset;
  CGFloat previousInsetTop = scrollView.contentInset.top;
  CGPoint contentOffset = scrollView.contentOffset;

  if (parentView.automaticallyAdjustContentInsets) {
    UIEdgeInsets autoInset = [self contentInsetsForView:parentView];
    baseInset.top += autoInset.top;
    baseInset.bottom += autoInset.bottom;
    baseInset.left += autoInset.left;
    baseInset.right += autoInset.right;
  }
  scrollView.contentInset = baseInset;
  scrollView.scrollIndicatorInsets = baseInset;

  if (updateOffset) {
    // If we're adjusting the top inset, then let's also adjust the contentOffset so that the view
    // elements above the top guide do not cover the content.
    // This is generally only needed when your views are initially laid out, for
    // manual changes to contentOffset, you can optionally disable this step
    CGFloat currentInsetTop = scrollView.contentInset.top;
    if (currentInsetTop != previousInsetTop) {
      contentOffset.y -= (currentInsetTop - previousInsetTop);
      scrollView.contentOffset = contentOffset;
    }
  }
}

+ (UIEdgeInsets)contentInsetsForView:(UIView *)view
{
  while (view) {
    UIViewController *controller = view.reactViewController;
    if (controller) {
      return (UIEdgeInsets){
        controller.topLayoutGuide.length, 0,
        controller.bottomLayoutGuide.length, 0
      };
    }
    view = view.superview;
  }
  return UIEdgeInsetsZero;
}

#pragma mark - View unmounting

- (void)react_remountAllSubviews
{
  if (_removeClippedSubviews) {
    for (UIView *view in self.sortedReactSubviews) {
      if (view.superview != self) {
        [self addSubview:view];
        [view react_remountAllSubviews];
      }
    }
  } else {
    // If _removeClippedSubviews is false, we must already be showing all subviews
    [super react_remountAllSubviews];
  }
}

- (void)react_updateClippedSubviewsWithClipRect:(CGRect)clipRect relativeToView:(UIView *)clipView
{
  // TODO (#5906496): for scrollviews (the primary use-case) we could
  // optimize this by only doing a range check along the scroll axis,
  // instead of comparing the whole frame

  if (!_removeClippedSubviews) {
    // Use default behavior if unmounting is disabled
    return [super react_updateClippedSubviewsWithClipRect:clipRect relativeToView:clipView];
  }

  if (self.reactSubviews.count == 0) {
    // Do nothing if we have no subviews
    return;
  }

  if (CGSizeEqualToSize(self.bounds.size, CGSizeZero)) {
    // Do nothing if layout hasn't happened yet
    return;
  }

  // Convert clipping rect to local coordinates
  clipRect = [clipView convertRect:clipRect toView:self];
  clipRect = CGRectIntersection(clipRect, self.bounds);
  clipView = self;

  // Mount / unmount views
  for (UIView *view in self.sortedReactSubviews) {
    if (!CGRectIsEmpty(CGRectIntersection(clipRect, view.frame))) {

      // View is at least partially visible, so remount it if unmounted
      [self addSubview:view];

      // Then test its subviews
      if (CGRectContainsRect(clipRect, view.frame)) {
        // View is fully visible, so remount all subviews
        [view react_remountAllSubviews];
      } else {
        // View is partially visible, so update clipped subviews
        [view react_updateClippedSubviewsWithClipRect:clipRect relativeToView:clipView];
      }

    } else if (view.superview) {

      // View is completely outside the clipRect, so unmount it
      [view removeFromSuperview];
    }
  }
}

- (void)setRemoveClippedSubviews:(BOOL)removeClippedSubviews
{
  if (!removeClippedSubviews && _removeClippedSubviews) {
    [self react_remountAllSubviews];
  }
  _removeClippedSubviews = removeClippedSubviews;
}

- (void)didUpdateReactSubviews
{
  if (_removeClippedSubviews) {
    [self updateClippedSubviews];
  } else {
    [super didUpdateReactSubviews];
  }
}

- (void)updateClippedSubviews
{
  // Find a suitable view to use for clipping
  UIView *clipView = [self react_findClipView];
  if (clipView) {
    [self react_updateClippedSubviewsWithClipRect:clipView.bounds relativeToView:clipView];
  }
}

- (void)layoutSubviews
{
  // TODO (#5906496): this a nasty performance drain, but necessary
  // to prevent gaps appearing when the loading spinner disappears.
  // We might be able to fix this another way by triggering a call
  // to updateClippedSubviews manually after loading

  [super layoutSubviews];

  if (_removeClippedSubviews) {
    [self updateClippedSubviews];
  }
}

#pragma mark - Borders

- (UIColor *)backgroundColor
{
  return _backgroundColor;
}

- (void)setBackgroundColor:(UIColor *)backgroundColor
{
  if ([_backgroundColor isEqual:backgroundColor]) {
    return;
  }

  _backgroundColor = backgroundColor;
  [self.layer setNeedsDisplay];
}

- (UIEdgeInsets)bordersAsInsets
{
  const CGFloat borderWidth = MAX(0, _borderWidth);

  return (UIEdgeInsets) {
    _borderTopWidth >= 0 ? _borderTopWidth : borderWidth,
    _borderLeftWidth >= 0 ? _borderLeftWidth : borderWidth,
    _borderBottomWidth >= 0 ? _borderBottomWidth : borderWidth,
    _borderRightWidth  >= 0 ? _borderRightWidth : borderWidth,
  };
}

- (RCTCornerRadii)cornerRadii
{
  // Get corner radii
  const CGFloat radius = MAX(0, _borderRadius);
  const CGFloat topLeftRadius = _borderTopLeftRadius >= 0 ? _borderTopLeftRadius : radius;
  const CGFloat topRightRadius = _borderTopRightRadius >= 0 ? _borderTopRightRadius : radius;
  const CGFloat bottomLeftRadius = _borderBottomLeftRadius >= 0 ? _borderBottomLeftRadius : radius;
  const CGFloat bottomRightRadius = _borderBottomRightRadius >= 0 ? _borderBottomRightRadius : radius;

  // Get scale factors required to prevent radii from overlapping
  const CGSize size = self.bounds.size;
  const CGFloat topScaleFactor = RCTZeroIfNaN(MIN(1, size.width / (topLeftRadius + topRightRadius)));
  const CGFloat bottomScaleFactor = RCTZeroIfNaN(MIN(1, size.width / (bottomLeftRadius + bottomRightRadius)));
  const CGFloat rightScaleFactor = RCTZeroIfNaN(MIN(1, size.height / (topRightRadius + bottomRightRadius)));
  const CGFloat leftScaleFactor = RCTZeroIfNaN(MIN(1, size.height / (topLeftRadius + bottomLeftRadius)));

  // Return scaled radii
  return (RCTCornerRadii){
    topLeftRadius * MIN(topScaleFactor, leftScaleFactor),
    topRightRadius * MIN(topScaleFactor, rightScaleFactor),
    bottomLeftRadius * MIN(bottomScaleFactor, leftScaleFactor),
    bottomRightRadius * MIN(bottomScaleFactor, rightScaleFactor),
  };
}

- (RCTBorderColors)borderColors
{
  return (RCTBorderColors){
    _borderTopColor ?: _borderColor,
    _borderLeftColor ?: _borderColor,
    _borderBottomColor ?: _borderColor,
    _borderRightColor ?: _borderColor,
  };
}

- (void)reactSetFrame:(CGRect)frame
{
  // If frame is zero, or below the threshold where the border radii can
  // be rendered as a stretchable image, we'll need to re-render.
  // TODO: detect up-front if re-rendering is necessary
  CGSize oldSize = self.bounds.size;
  [super reactSetFrame:frame];
  if (!CGSizeEqualToSize(self.bounds.size, oldSize)) {
    [self.layer setNeedsDisplay];
  }
}

- (void)displayLayer:(CALayer *)layer
{
  if (CGSizeEqualToSize(layer.bounds.size, CGSizeZero)) {
    return;
  }

  RCTUpdateShadowPathForView(self);

  const RCTCornerRadii cornerRadii = [self cornerRadii];
  const UIEdgeInsets borderInsets = [self bordersAsInsets];
  const RCTBorderColors borderColors = [self borderColors];

  BOOL useIOSBorderRendering =
  !RCTRunningInTestEnvironment() &&
  RCTCornerRadiiAreEqual(cornerRadii) &&
  RCTBorderInsetsAreEqual(borderInsets) &&
  RCTBorderColorsAreEqual(borderColors) &&
  _borderStyle == RCTBorderStyleSolid &&

  // iOS draws borders in front of the content whereas CSS draws them behind
  // the content. For this reason, only use iOS border drawing when clipping
  // or when the border is hidden.

  (borderInsets.top == 0 || (borderColors.top && CGColorGetAlpha(borderColors.top) == 0) || self.clipsToBounds);

  // iOS clips to the outside of the border, but CSS clips to the inside. To
  // solve this, we'll need to add a container view inside the main view to
  // correctly clip the subviews.

  if (useIOSBorderRendering) {
    layer.cornerRadius = cornerRadii.topLeft;
    layer.borderColor = borderColors.left;
    layer.borderWidth = borderInsets.left;
    layer.backgroundColor = _backgroundColor.CGColor;
    layer.contents = nil;
    layer.needsDisplayOnBoundsChange = NO;
    layer.mask = nil;
    return;
  }

  UIImage *image = RCTGetBorderImage(_borderStyle,
                                     layer.bounds.size,
                                     cornerRadii,
                                     borderInsets,
                                     borderColors,
                                     _backgroundColor.CGColor,
                                     self.clipsToBounds);

  layer.backgroundColor = NULL;

  if (image == nil) {
    layer.contents = nil;
    layer.needsDisplayOnBoundsChange = NO;
    return;
  }

  CGRect contentsCenter = ({
    CGSize size = image.size;
    UIEdgeInsets insets = image.capInsets;
    CGRectMake(
      insets.left / size.width,
      insets.top / size.height,
      1.0 / size.width,
      1.0 / size.height
    );
  });

  if (RCTRunningInTestEnvironment()) {
    const CGSize size = self.bounds.size;
    UIGraphicsBeginImageContextWithOptions(size, NO, image.scale);
    [image drawInRect:(CGRect){CGPointZero, size}];
    image = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();
    contentsCenter = CGRectMake(0, 0, 1, 1);
  }

  layer.contents = (id)image.CGImage;
  layer.contentsScale = image.scale;
  layer.needsDisplayOnBoundsChange = YES;
  layer.magnificationFilter = kCAFilterNearest;

  const BOOL isResizable = !UIEdgeInsetsEqualToEdgeInsets(image.capInsets, UIEdgeInsetsZero);
  if (isResizable) {
    layer.contentsCenter = contentsCenter;
  } else {
    layer.contentsCenter = CGRectMake(0.0, 0.0, 1.0, 1.0);
  }

  [self updateClippingForLayer:layer];
}

static BOOL RCTLayerHasShadow(CALayer *layer)
{
  return layer.shadowOpacity * CGColorGetAlpha(layer.shadowColor) > 0;
}

- (void)reactSetInheritedBackgroundColor:(UIColor *)inheritedBackgroundColor
{
  // Inherit background color if a shadow has been set, as an optimization
  if (RCTLayerHasShadow(self.layer)) {
    self.backgroundColor = inheritedBackgroundColor;
  }
}

static void RCTUpdateShadowPathForView(RCTView *view)
{
  if (RCTLayerHasShadow(view.layer)) {
    if (CGColorGetAlpha(view.backgroundColor.CGColor) > 0.999) {

      // If view has a solid background color, calculate shadow path from border
      const RCTCornerRadii cornerRadii = [view cornerRadii];
      const RCTCornerInsets cornerInsets = RCTGetCornerInsets(cornerRadii, UIEdgeInsetsZero);
      CGPathRef shadowPath = RCTPathCreateWithRoundedRect(view.bounds, cornerInsets, NULL);
      view.layer.shadowPath = shadowPath;
      CGPathRelease(shadowPath);

    } else {

      // Can't accurately calculate box shadow, so fall back to pixel-based shadow
      view.layer.shadowPath = nil;

      RCTLogWarn(@"View #%@ of type %@ has a shadow set but cannot calculate "
                 "shadow efficiently. Consider setting a background color to "
                 "fix this, or apply the shadow to a more specific component.",
                 view.reactTag, [view class]);
    }
  }
}

- (void)updateClippingForLayer:(CALayer *)layer
{
  CALayer *mask = nil;
  CGFloat cornerRadius = 0;

  if (self.clipsToBounds) {

    const RCTCornerRadii cornerRadii = [self cornerRadii];
    if (RCTCornerRadiiAreEqual(cornerRadii)) {

      cornerRadius = cornerRadii.topLeft;

    } else {

      CAShapeLayer *shapeLayer = [CAShapeLayer layer];
      CGPathRef path = RCTPathCreateWithRoundedRect(self.bounds, RCTGetCornerInsets(cornerRadii, UIEdgeInsetsZero), NULL);
      shapeLayer.path = path;
      CGPathRelease(path);
      mask = shapeLayer;
    }
  }

  layer.cornerRadius = cornerRadius;
  layer.mask = mask;
}

#pragma mark Border Color

#define setBorderColor(side)                                \
  - (void)setBorder##side##Color:(CGColorRef)color          \
  {                                                         \
    if (CGColorEqualToColor(_border##side##Color, color)) { \
      return;                                               \
    }                                                       \
    CGColorRelease(_border##side##Color);                   \
    _border##side##Color = CGColorRetain(color);            \
    [self.layer setNeedsDisplay];                           \
  }

setBorderColor()
setBorderColor(Top)
setBorderColor(Right)
setBorderColor(Bottom)
setBorderColor(Left)

#pragma mark - Border Width

#define setBorderWidth(side)                    \
  - (void)setBorder##side##Width:(CGFloat)width \
  {                                             \
    if (_border##side##Width == width) {        \
      return;                                   \
    }                                           \
    _border##side##Width = width;               \
    [self.layer setNeedsDisplay];               \
  }

setBorderWidth()
setBorderWidth(Top)
setBorderWidth(Right)
setBorderWidth(Bottom)
setBorderWidth(Left)

#pragma mark - Border Radius

#define setBorderRadius(side)                     \
  - (void)setBorder##side##Radius:(CGFloat)radius \
  {                                               \
    if (_border##side##Radius == radius) {        \
      return;                                     \
    }                                             \
    _border##side##Radius = radius;               \
    [self.layer setNeedsDisplay];                 \
  }

setBorderRadius()
setBorderRadius(TopLeft)
setBorderRadius(TopRight)
setBorderRadius(BottomLeft)
setBorderRadius(BottomRight)

#pragma mark - Border Style

#define setBorderStyle(side)                           \
  - (void)setBorder##side##Style:(RCTBorderStyle)style \
  {                                                    \
    if (_border##side##Style == style) {               \
      return;                                          \
    }                                                  \
    _border##side##Style = style;                      \
    [self.layer setNeedsDisplay];                      \
  }

setBorderStyle()

- (void)dealloc
{
  CGColorRelease(_borderColor);
  CGColorRelease(_borderTopColor);
  CGColorRelease(_borderRightColor);
  CGColorRelease(_borderBottomColor);
  CGColorRelease(_borderLeftColor);
}

@end
