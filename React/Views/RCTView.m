/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTView.h"

#import "RCTAutoInsetsProtocol.h"
#import "RCTBorderDrawing.h"
#import "RCTConvert.h"
#import "RCTLog.h"
#import "RCTRootContentView.h" // TODO(macOS ISS#2323203)
#import "RCTUtils.h"
#import "UIView+React.h"
#import "RCTI18nUtil.h"

@implementation RCTPlatformView (RCTViewUnmounting) // TODO(macOS ISS#2323203)

- (void)react_remountAllSubviews
{
  // Normal views don't support unmounting, so all
  // this does is forward message to our subviews,
  // in case any of those do support it

  for (UIView *subview in self.subviews) {
    [subview react_remountAllSubviews];
  }
}

- (void)react_updateClippedSubviewsWithClipRect:(CGRect)clipRect relativeToView:(RCTPlatformView *)clipView // TODO(macOS ISS#2323203)
{
  // Even though we don't support subview unmounting
  // we do support clipsToBounds, so if that's enabled
  // we'll update the clipping

  if (UIViewSetClipsToBounds(self) && self.subviews.count > 0) { // TODO(macOS ISS#2323203)
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

- (RCTPlatformView *)react_findClipView // TODO(macOS ISS#2323203)
{
  RCTPlatformView *testView = self; // TODO(macOS ISS#2323203)
  RCTPlatformView *clipView = nil; // TODO(macOS ISS#2323203)
  CGRect clipRect = self.bounds;
  // We will only look for a clipping view up the view hierarchy until we hit the root view.
  while (testView) {
    if (UIViewSetClipsToBounds(testView)) { // TODO(macOS ISS#2323203)
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
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  return clipView ?: self.window;
#else // [TODO(macOS ISS#2323203)
  return clipView ?: self.window.contentView;
#endif // ]TODO(macOS ISS#2323203)
}

@end

static NSString *RCTRecursiveAccessibilityLabel(UIView *view)
{
  NSMutableString *str = [NSMutableString stringWithString:@""];
  for (UIView *subview in view.subviews) {
    NSString *label = subview.accessibilityLabel;
    if (!label) {
      label = RCTRecursiveAccessibilityLabel(subview);
    }
    if (label && label.length > 0) {
      if (str.length > 0) {
        [str appendString:@" "];
      }
      [str appendString:label];
    }
  }
  return str;
}

@implementation RCTView
{
  UIColor *_backgroundColor;
#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
  NSTrackingArea *_trackingArea;
  BOOL _hasMouseOver;
#endif // ]TODO(macOS ISS#2323203)
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    _borderWidth = -1;
    _borderTopWidth = -1;
    _borderRightWidth = -1;
    _borderBottomWidth = -1;
    _borderLeftWidth = -1;
    _borderStartWidth = -1;
    _borderEndWidth = -1;
    _borderTopLeftRadius = -1;
    _borderTopRightRadius = -1;
    _borderTopStartRadius = -1;
    _borderTopEndRadius = -1;
    _borderBottomLeftRadius = -1;
    _borderBottomRightRadius = -1;
    _borderBottomStartRadius = -1;
    _borderBottomEndRadius = -1;
    _borderStyle = RCTBorderStyleSolid;
    _hitTestEdgeInsets = UIEdgeInsetsZero;

    _backgroundColor = super.backgroundColor;
  }

  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:unused)

- (void)setReactLayoutDirection:(UIUserInterfaceLayoutDirection)layoutDirection
{
  if (_reactLayoutDirection != layoutDirection) {
    _reactLayoutDirection = layoutDirection;
    [self.layer setNeedsDisplay];
  }

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  if ([self respondsToSelector:@selector(setSemanticContentAttribute:)]) {
#pragma clang diagnostic push // TODO(OSS Candidate ISS#2710739)
#pragma clang diagnostic ignored "-Wunguarded-availability" // TODO(OSS Candidate ISS#2710739)
    self.semanticContentAttribute =
      layoutDirection == UIUserInterfaceLayoutDirectionLeftToRight ?
        UISemanticContentAttributeForceLeftToRight :
        UISemanticContentAttributeForceRightToLeft;
#pragma clang diagnostic pop // TODO(OSS Candidate ISS#2710739)
  }
#else // [TODO(macOS ISS#2323203)
  self.userInterfaceLayoutDirection =
  layoutDirection == UIUserInterfaceLayoutDirectionLeftToRight ?
  NSUserInterfaceLayoutDirectionLeftToRight :
  NSUserInterfaceLayoutDirectionRightToLeft;
#endif // ]TODO(macOS ISS#2323203)
}

- (NSString *)accessibilityLabel
{
  NSString *label = super.accessibilityLabel;
  if (label) {
    return label;
  }
  return RCTRecursiveAccessibilityLabel(self);
}

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
- (NSArray <UIAccessibilityCustomAction *> *)accessibilityCustomActions
{
  if (!_accessibilityActions.count) {
    return nil;
  }

  NSMutableArray *actions = [NSMutableArray array];
  for (NSString *action in _accessibilityActions) {
    [actions addObject:[[UIAccessibilityCustomAction alloc] initWithName:action
                                                                  target:self
                                                                selector:@selector(didActivateAccessibilityCustomAction:)]];
  }

  return [actions copy];
}

- (BOOL)didActivateAccessibilityCustomAction:(UIAccessibilityCustomAction *)action
{
  if (!_onAccessibilityAction) {
    return NO;
  }

  _onAccessibilityAction(@{
    @"action": action.name,
    @"target": self.reactTag
  });

  return YES;
}
#endif // TODO(macOS ISS#2323203)

- (void)setPointerEvents:(RCTPointerEvents)pointerEvents
{
  _pointerEvents = pointerEvents;
  self.userInteractionEnabled = (pointerEvents != RCTPointerEventsNone);
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  if (pointerEvents == RCTPointerEventsBoxNone) {
    self.accessibilityViewIsModal = NO;
  }
#endif // TODO(macOS ISS#2323203)
}

- (RCTPlatformView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event // TODO(macOS ISS#2323203)
{
  BOOL canReceiveTouchEvents = ([self isUserInteractionEnabled] && ![self isHidden]);
  if(!canReceiveTouchEvents) {
    return nil;
  }

  // `hitSubview` is the topmost subview which was hit. The hit point can
  // be outside the bounds of `view` (e.g., if -clipsToBounds is NO).
  RCTPlatformView *hitSubview = nil; // TODO(macOS ISS#2323203)
  BOOL isPointInside = [self pointInside:point withEvent:event];
  BOOL needsHitSubview = !(_pointerEvents == RCTPointerEventsNone || _pointerEvents == RCTPointerEventsBoxOnly);
  if (needsHitSubview && (![self clipsToBounds] || isPointInside)) {
    // Take z-index into account when calculating the touch target.
    NSArray<UIView *> *sortedSubviews = [self reactZIndexSortedSubviews];

    // The default behaviour of UIKit is that if a view does not contain a point,
    // then no subviews will be returned from hit testing, even if they contain
    // the hit point. By doing hit testing directly on the subviews, we bypass
    // the strict containment policy (i.e., UIKit guarantees that every ancestor
    // of the hit view will return YES from -pointInside:withEvent:). See:
    //  - https://developer.apple.com/library/ios/qa/qa2013/qa1812.html
    for (UIView *subview in [sortedSubviews reverseObjectEnumerator]) {
      CGPoint pointForHitTest = CGPointZero; // [TODO(macOS ISS#2323203)
#if TARGET_OS_OSX
      if ([subview isKindOfClass:[RCTView class]]) {
        pointForHitTest = [subview convertPoint:point fromView:self];
      } else {
        pointForHitTest = point;
      }
#else
      pointForHitTest = [subview convertPoint:point fromView:self];
#endif
      hitSubview = UIViewHitTestWithEvent(subview, pointForHitTest, event); // ]TODO(macOS ISS#2323203)
      if (hitSubview != nil) {
        break;
      }
    }
  }

  RCTPlatformView *hitView = (isPointInside ? self : nil); // TODO(macOS ISS#2323203)

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
      RCTLogError(@"Invalid pointer-events specified %lld on %@", (long long)_pointerEvents, self);
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

- (RCTPlatformView *)reactAccessibilityElement // TODO(macOS ISS#2323203)
{
  return self;
}

- (BOOL)isAccessibilityElement
{
  if (self.reactAccessibilityElement == self) {
    return [super isAccessibilityElement];
  }

  return NO;
}

#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
- (BOOL)isAccessibilitySelectorAllowed:(SEL)selector
{
  if (selector == @selector(accessibilityPerformPress)) {
    return _onAccessibilityTap ? YES : NO;
  }
  return [super isAccessibilitySelectorAllowed:selector];
}
#endif

#if !TARGET_OS_OSX // ]TODO(macOS ISS#2323203)
- (BOOL)accessibilityActivate
#else // [TODO(macOS ISS#2323203)
- (BOOL)accessibilityPerformPress
#endif // ]TODO(macOS ISS#2323203)
{
  if (_onAccessibilityTap) {
    _onAccessibilityTap(nil);
    return YES;
  } else {
    return NO;
  }
}

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
- (BOOL)accessibilityPerformMagicTap
{
  if (_onMagicTap) {
    _onMagicTap(nil);
    return YES;
  } else {
    return NO;
  }
}
#endif // TODO(macOS ISS#2323203)

- (NSString *)description
{
  NSString *superDescription = super.description;
  NSRange semicolonRange = [superDescription rangeOfString:@";"];
  if (semicolonRange.location == NSNotFound) { // [TODO(macOS ISS#2323203)
    return [[superDescription substringToIndex:superDescription.length - 1] stringByAppendingFormat:@"; reactTag: %@; frame = %@; layer = %@>", self.reactTag, NSStringFromCGRect(self.frame), self.layer];
  } else { // ]TODO(macOS ISS#2323203)
    NSString *replacement = [NSString stringWithFormat:@"; reactTag: %@;", self.reactTag];
    return [superDescription stringByReplacingCharactersInRange:semicolonRange withString:replacement];
  } // TODO(macOS ISS#2323203)
}

#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
- (void)viewDidMoveToWindow
{
  // Subscribe to view bounds changed notification so that the view can be notified when a
  // scroll event occurs either due to trackpad/gesture based scrolling or a scrollwheel event
  // both of which would not cause the mouseExited to be invoked.

  if ([self window] == nil) {
    [[NSNotificationCenter defaultCenter] removeObserver:self
                                                    name:NSViewBoundsDidChangeNotification
                                                  object:nil];
  }
  else if ([[self enclosingScrollView] contentView] != nil) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(viewBoundsChanged:)
                                                 name:NSViewBoundsDidChangeNotification
                                               object:[[self enclosingScrollView] contentView]];
  }
  [super viewDidMoveToWindow];
}

- (void)viewBoundsChanged:(NSNotification*)__unused inNotif
{
  // When an enclosing scrollview is scrolled using the scrollWheel or trackpad,
  // the mouseExited: event does not get called on the view where mouseEntered: was previously called.
  // This creates an unnatural pairing of mouse enter and exit events and can cause problems.
  // We therefore explicitly check for this here and handle them by calling the appropriate callbacks.
  
  if (!_hasMouseOver && self.onMouseEnter)
  {
    NSPoint locationInWindow = [[self window] mouseLocationOutsideOfEventStream];
    NSPoint locationInView = [self convertPoint:locationInWindow fromView:nil];
    
    if (NSPointInRect(locationInView, [self bounds]))
    {
      _hasMouseOver = YES;
      
      [self sendMouseEventWithBlock:self.onMouseEnter
                       locationInfo:[self locationInfoFromDraggingLocation:locationInWindow]
                      modifierFlags:0
                     additionalData:nil];
    }
  }
  else if (_hasMouseOver && self.onMouseLeave)
  {
    NSPoint locationInWindow = [[self window] mouseLocationOutsideOfEventStream];
    NSPoint locationInView = [self convertPoint:locationInWindow fromView:nil];
    
    if (!NSPointInRect(locationInView, [self bounds]))
    {
      _hasMouseOver = NO;
      
      [self sendMouseEventWithBlock:self.onMouseLeave
                       locationInfo:[self locationInfoFromDraggingLocation:locationInWindow]
                      modifierFlags:0
                     additionalData:nil];
    }
  }
}
#endif // ]TODO(macOS ISS#2323203)

#pragma mark - Statics for dealing with layoutGuides

+ (void)autoAdjustInsetsForView:(UIView<RCTAutoInsetsProtocol> *)parentView
                 withScrollView:(UIScrollView *)scrollView
                   updateOffset:(BOOL)updateOffset
{
  UIEdgeInsets baseInset = parentView.contentInset;
  CGFloat previousInsetTop = scrollView.contentInset.top;
  CGPoint contentOffset = scrollView.contentOffset;

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  if (parentView.automaticallyAdjustContentInsets) {
    UIEdgeInsets autoInset = [self contentInsetsForView:parentView];
    baseInset.top += autoInset.top;
    baseInset.bottom += autoInset.bottom;
    baseInset.left += autoInset.left;
    baseInset.right += autoInset.right;
  }
#endif // TODO(macOS ISS#2323203)
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

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
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
#endif // TODO(macOS ISS#2323203)

#pragma mark - View unmounting

- (void)react_remountAllSubviews
{
  if (_removeClippedSubviews) {
    for (UIView *view in self.reactSubviews) {
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

- (void)react_updateClippedSubviewsWithClipRect:(CGRect)clipRect relativeToView:(RCTPlatformView *)clipView // TODO(macOS ISS#2323203)
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
  for (UIView *view in self.reactSubviews) {
    if (!CGSizeEqualToSize(CGRectIntersection(clipRect, view.frame).size, CGSizeZero)) {
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
  RCTPlatformView *clipView = [self react_findClipView]; // TODO(macOS ISS#2323203)
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

// [TODO(OSS Candidate ISS#2710739)
- (BOOL)becomeFirstResponder
{
  if (![super becomeFirstResponder]) {
    return NO;
  }

  // If we've gained focus, notify listeners
  if (self.onFocus != nil ) {
    self.onFocus(nil);
  }
  return YES;
}
- (BOOL)resignFirstResponder
{
  if (![super resignFirstResponder]) {
    return NO;
  }

  // If we've gained focus, notify listeners
  if (self.onBlur != nil ) {
    self.onBlur(nil);
  }
  return YES;
}
// ]TODO(OSS Candidate ISS#2710739)

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

static CGFloat RCTDefaultIfNegativeTo(CGFloat defaultValue, CGFloat x) {
  return x >= 0 ? x : defaultValue;
};

- (UIEdgeInsets)bordersAsInsets
{
  const CGFloat borderWidth = MAX(0, _borderWidth);
  const BOOL isRTL = _reactLayoutDirection == UIUserInterfaceLayoutDirectionRightToLeft;

  if ([[RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    const CGFloat borderStartWidth = RCTDefaultIfNegativeTo(_borderLeftWidth, _borderStartWidth);
    const CGFloat borderEndWidth = RCTDefaultIfNegativeTo(_borderRightWidth, _borderEndWidth);

    const CGFloat directionAwareBorderLeftWidth = isRTL ? borderEndWidth : borderStartWidth;
    const CGFloat directionAwareBorderRightWidth = isRTL ? borderStartWidth : borderEndWidth;

    return (UIEdgeInsets) {
      RCTDefaultIfNegativeTo(borderWidth, _borderTopWidth),
      RCTDefaultIfNegativeTo(borderWidth, directionAwareBorderLeftWidth),
      RCTDefaultIfNegativeTo(borderWidth, _borderBottomWidth),
      RCTDefaultIfNegativeTo(borderWidth, directionAwareBorderRightWidth),
    };
  }

  const CGFloat directionAwareBorderLeftWidth = isRTL ? _borderEndWidth : _borderStartWidth;
  const CGFloat directionAwareBorderRightWidth = isRTL ? _borderStartWidth : _borderEndWidth;

  return (UIEdgeInsets) {
    RCTDefaultIfNegativeTo(borderWidth, _borderTopWidth),
    RCTDefaultIfNegativeTo(borderWidth, RCTDefaultIfNegativeTo(_borderLeftWidth, directionAwareBorderLeftWidth)),
    RCTDefaultIfNegativeTo(borderWidth, _borderBottomWidth),
    RCTDefaultIfNegativeTo(borderWidth, RCTDefaultIfNegativeTo(_borderRightWidth, directionAwareBorderRightWidth)),
  };
}

- (RCTCornerRadii)cornerRadii
{
  const BOOL isRTL = _reactLayoutDirection == UIUserInterfaceLayoutDirectionRightToLeft;
  const CGFloat radius = MAX(0, _borderRadius);

  CGFloat topLeftRadius;
  CGFloat topRightRadius;
  CGFloat bottomLeftRadius;
  CGFloat bottomRightRadius;

  if ([[RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    const CGFloat topStartRadius = RCTDefaultIfNegativeTo(_borderTopLeftRadius, _borderTopStartRadius);
    const CGFloat topEndRadius = RCTDefaultIfNegativeTo(_borderTopRightRadius, _borderTopEndRadius);
    const CGFloat bottomStartRadius = RCTDefaultIfNegativeTo(_borderBottomLeftRadius, _borderBottomStartRadius);
    const CGFloat bottomEndRadius = RCTDefaultIfNegativeTo(_borderBottomRightRadius, _borderBottomEndRadius);

    const CGFloat directionAwareTopLeftRadius = isRTL ? topEndRadius : topStartRadius;
    const CGFloat directionAwareTopRightRadius = isRTL ? topStartRadius : topEndRadius;
    const CGFloat directionAwareBottomLeftRadius = isRTL ? bottomEndRadius : bottomStartRadius;
    const CGFloat directionAwareBottomRightRadius = isRTL ? bottomStartRadius : bottomEndRadius;

    topLeftRadius = RCTDefaultIfNegativeTo(radius, directionAwareTopLeftRadius);
    topRightRadius = RCTDefaultIfNegativeTo(radius, directionAwareTopRightRadius);
    bottomLeftRadius = RCTDefaultIfNegativeTo(radius, directionAwareBottomLeftRadius);
    bottomRightRadius = RCTDefaultIfNegativeTo(radius, directionAwareBottomRightRadius);
  } else {
    const CGFloat directionAwareTopLeftRadius = isRTL ? _borderTopEndRadius : _borderTopStartRadius;
    const CGFloat directionAwareTopRightRadius = isRTL ? _borderTopStartRadius : _borderTopEndRadius;
    const CGFloat directionAwareBottomLeftRadius = isRTL ? _borderBottomEndRadius : _borderBottomStartRadius;
    const CGFloat directionAwareBottomRightRadius = isRTL ? _borderBottomStartRadius : _borderBottomEndRadius;

    topLeftRadius = RCTDefaultIfNegativeTo(radius, RCTDefaultIfNegativeTo(_borderTopLeftRadius, directionAwareTopLeftRadius));
    topRightRadius = RCTDefaultIfNegativeTo(radius, RCTDefaultIfNegativeTo(_borderTopRightRadius, directionAwareTopRightRadius));
    bottomLeftRadius = RCTDefaultIfNegativeTo(radius, RCTDefaultIfNegativeTo(_borderBottomLeftRadius, directionAwareBottomLeftRadius));
    bottomRightRadius = RCTDefaultIfNegativeTo(radius, RCTDefaultIfNegativeTo(_borderBottomRightRadius, directionAwareBottomRightRadius));
  }

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
  const BOOL isRTL = _reactLayoutDirection == UIUserInterfaceLayoutDirectionRightToLeft;

  if ([[RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    const CGColorRef borderStartColor = _borderStartColor ?: _borderLeftColor;
    const CGColorRef borderEndColor = _borderEndColor ?: _borderRightColor;

    const CGColorRef directionAwareBorderLeftColor = isRTL ? borderEndColor : borderStartColor;
    const CGColorRef directionAwareBorderRightColor = isRTL ? borderStartColor : borderEndColor;

    return (RCTBorderColors){
      _borderTopColor ?: _borderColor,
      directionAwareBorderLeftColor ?: _borderColor,
      _borderBottomColor ?: _borderColor,
      directionAwareBorderRightColor ?: _borderColor,
    };
  }

  const CGColorRef directionAwareBorderLeftColor = isRTL ? _borderEndColor : _borderStartColor;
  const CGColorRef directionAwareBorderRightColor = isRTL ? _borderStartColor : _borderEndColor;

  return (RCTBorderColors){
    _borderTopColor ?: _borderColor,
    directionAwareBorderLeftColor ?: _borderLeftColor ?: _borderColor,
    _borderBottomColor ?: _borderColor,
    directionAwareBorderRightColor ?: _borderRightColor ?: _borderColor,
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

#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
  CGFloat scaleFactor = self.window.backingScaleFactor;
  if (scaleFactor == 0.0 && RCTRunningInTestEnvironment()) {
    // When running in the test environment the view is not on screen.
    // Use a scaleFactor of 1 so that the test results are machine independent.
    scaleFactor = 1;
  }
  RCTAssert(scaleFactor != 0.0, @"displayLayer occurs before the view is in a window?");
#else
  // On iOS setting the scaleFactor to 0.0 will default to the device's native scale factor.
  CGFloat scaleFactor = 0.0;
#endif // ]TODO(macOS ISS#2323203)
  
  UIImage *image = RCTGetBorderImage(_borderStyle,
                                     layer.bounds.size,
                                     cornerRadii,
                                     borderInsets,
                                     borderColors,
                                     _backgroundColor.CGColor,
                                     self.clipsToBounds,
                                     scaleFactor); // TODO(OSS Candidate ISS#2710739)

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

#if !TARGET_OS_OSX // [TODO(macOS ISS#2323203)
  CGFloat scale = image.scale;
#else // TODO(macOS ISS#2323203)
  CGFloat scale = scaleFactor;
#endif // ]TODO(macOS ISS#2323203)
  if (RCTRunningInTestEnvironment()) {
    const CGSize size = self.bounds.size;
    UIGraphicsBeginImageContextWithOptions(size, NO, scale); // TODO(macOS ISS#2323203)
    [image drawInRect:(CGRect){CGPointZero, size}];
    image = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();
    contentsCenter = CGRectMake(0, 0, 1, 1);
  }

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  layer.contents = (id)image.CGImage;
  layer.contentsScale = image.scale;
#else // [TODO(macOS ISS#2323203)
  layer.contents = [image layerContentsForContentsScale:scale];
  layer.contentsScale = scale;
#endif // ]TODO(macOS ISS#2323203)
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

      RCTLogAdvice(@"View #%@ of type %@ has a shadow set but cannot calculate "
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
setBorderColor(Start)
setBorderColor(End)

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
setBorderWidth(Start)
setBorderWidth(End)

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
setBorderRadius(TopStart)
setBorderRadius(TopEnd)
setBorderRadius(BottomLeft)
setBorderRadius(BottomRight)
setBorderRadius(BottomStart)
setBorderRadius(BottomEnd)

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
#if TARGET_OS_OSX // TODO(macOS ISS#2323203)
  [[NSNotificationCenter defaultCenter] removeObserver:self];
#endif // TODO(macOS ISS#2323203)
  CGColorRelease(_borderColor);
  CGColorRelease(_borderTopColor);
  CGColorRelease(_borderRightColor);
  CGColorRelease(_borderBottomColor);
  CGColorRelease(_borderLeftColor);
  CGColorRelease(_borderStartColor);
  CGColorRelease(_borderEndColor);
}

#pragma mark Focus ring // [TODO(macOS ISS#2323203)

#if TARGET_OS_OSX
- (CGRect)focusRingMaskBounds
{
  return self.bounds;
}

- (void)drawFocusRingMask
{
  if ([self enableFocusRing]) {
    NSRectFill(self.bounds);
  }
}
#endif

#pragma mark - macOS Event Handler

#if TARGET_OS_OSX
- (void)setOnDoubleClick:(RCTDirectEventBlock)block
{
  if (_onDoubleClick != block) {
    _onDoubleClick = [block copy];
  }
}

- (void)mouseUp:(NSEvent *)event
{
  if (_onDoubleClick && event.clickCount == 2) {
    _onDoubleClick(nil);
  }
  else {
    [super mouseUp:event];
  }
}

- (BOOL)acceptsFirstResponder
{
  return ([self acceptsKeyboardFocus] && [NSApp isFullKeyboardAccessEnabled]) || [super acceptsFirstResponder];
}

- (BOOL)performKeyEquivalent:(NSEvent *)theEvent
{
  if (self.onClick != nil &&
      [self acceptsKeyboardFocus] &&
      [[self window] firstResponder] == self) {
    if ([[theEvent characters] isEqualToString:@" "] || [[theEvent characters] isEqualToString:@"\r"]) {
      self.onClick(nil);
      return YES;
    }
  }
  return [super performKeyEquivalent:theEvent];
}

- (void)updateTrackingAreas
{
  if (_trackingArea) {
    [self removeTrackingArea:_trackingArea];
  }
  
  if (self.onMouseEnter || self.onMouseLeave) {
    _trackingArea = [[NSTrackingArea alloc] initWithRect:self.bounds
                                                 options:NSTrackingActiveAlways|NSTrackingMouseEnteredAndExited
                                                   owner:self
                                                userInfo:nil];
    [self addTrackingArea:_trackingArea];
  }
  
  [super updateTrackingAreas];
}

- (void)mouseEntered:(NSEvent *)event
{
  _hasMouseOver = YES;
  [self sendMouseEventWithBlock:self.onMouseEnter
                   locationInfo:[self locationInfoFromEvent:event]
                  modifierFlags:event.modifierFlags
                 additionalData:nil];
}

- (void)mouseExited:(NSEvent *)event
{
  _hasMouseOver = NO;
  [self sendMouseEventWithBlock:self.onMouseLeave
                   locationInfo:[self locationInfoFromEvent:event]
                  modifierFlags:event.modifierFlags
                 additionalData:nil];
}

- (NSDictionary*)locationInfoFromEvent:(NSEvent*)event
{
  NSPoint locationInWindow = event.locationInWindow;
  NSPoint locationInView = [self convertPoint:locationInWindow fromView:nil];
  
  return @{@"screenX": @(locationInWindow.x),
           @"screenY": @(locationInWindow.y),
           @"clientX": @(locationInView.x),
           @"clientY": @(locationInView.y)
           };
}

- (void)sendMouseEventWithBlock:(RCTDirectEventBlock)block
                   locationInfo:(NSDictionary*)locationInfo
                  modifierFlags:(NSEventModifierFlags)modifierFlags
                 additionalData:(NSDictionary*)additionalData
{
  if (block == nil) {
    return;
  }
  
  NSMutableDictionary *body = [[NSMutableDictionary alloc] init];
  
  if (modifierFlags & NSEventModifierFlagShift) {
    body[@"shiftKey"] = @YES;
  }
  if (modifierFlags & NSEventModifierFlagControl) {
    body[@"ctrlKey"] = @YES;
  }
  if (modifierFlags & NSEventModifierFlagOption) {
    body[@"altKey"] = @YES;
  }
  if (modifierFlags & NSEventModifierFlagCommand) {
    body[@"metaKey"] = @YES;
  }
  
  if (locationInfo) {
    [body addEntriesFromDictionary:locationInfo];
  }
  
  if (additionalData) {
    [body addEntriesFromDictionary:additionalData];
  }
  
  block(body);
}

- (NSDictionary*)dataTransferInfoFromPastboard:(NSPasteboard*)pastboard
{
  if (![pastboard.types containsObject:NSFilenamesPboardType]) {
    return @{};
  }
  
  NSArray *fileNames = [pastboard propertyListForType:NSFilenamesPboardType];
  NSMutableArray *files = [[NSMutableArray alloc] initWithCapacity:fileNames.count];
  NSMutableArray *items = [[NSMutableArray alloc] initWithCapacity:fileNames.count];
  NSMutableArray *types = [[NSMutableArray alloc] initWithCapacity:fileNames.count];
  for (NSString *file in fileNames) {
    NSURL *fileURL = [NSURL fileURLWithPath:file];
    BOOL isDir = NO;
    BOOL isValid = (![[NSFileManager defaultManager] fileExistsAtPath:fileURL.path isDirectory:&isDir] || isDir) ? NO : YES;
    if (isValid) {
      
      NSString *MIMETypeString = nil;
      if (fileURL.pathExtension) {
        CFStringRef fileExtension = (__bridge CFStringRef)fileURL.pathExtension;
        CFStringRef UTI = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, fileExtension, NULL);
        if (UTI != NULL) {
          CFStringRef MIMEType = UTTypeCopyPreferredTagWithClass(UTI, kUTTagClassMIMEType);
          CFRelease(UTI);
          MIMETypeString = (__bridge_transfer NSString *)MIMEType;
        }
      }
      
      NSNumber *fileSizeValue = nil;
      NSError *fileSizeError = nil;
      BOOL success = [fileURL getResourceValue:&fileSizeValue
                                        forKey:NSURLFileSizeKey
                                         error:&fileSizeError];
      
      [files addObject:@{@"name": RCTNullIfNil(fileURL.lastPathComponent),
                         @"type": RCTNullIfNil(MIMETypeString),
                         @"uri": RCTNullIfNil(fileURL.absoluteString),
                         @"size": success ? fileSizeValue : (id)kCFNull
                         }];
      
      [items addObject:@{@"kind": @"file",
                         @"type": RCTNullIfNil(MIMETypeString),
                         }];
      
      [types addObject:RCTNullIfNil(MIMETypeString)];
    }
  }
  
  return @{@"dataTransfer": @{@"files": files,
                              @"items": items,
                              @"types": types}};
}

- (NSDictionary*)locationInfoFromDraggingLocation:(NSPoint)locationInWindow
{
  NSPoint locationInView = [self convertPoint:locationInWindow fromView:nil];
  
  return @{@"screenX": @(locationInWindow.x),
           @"screenY": @(locationInWindow.y),
           @"clientX": @(locationInView.x),
           @"clientY": @(locationInView.y)
           };
}

- (NSDragOperation)draggingEntered:(id <NSDraggingInfo>)sender
{
  NSPasteboard *pboard = sender.draggingPasteboard;
  NSDragOperation sourceDragMask = sender.draggingSourceOperationMask;
  
  [self sendMouseEventWithBlock:self.onDragEnter
                   locationInfo:[self locationInfoFromDraggingLocation:sender.draggingLocation]
                  modifierFlags:0
                 additionalData:[self dataTransferInfoFromPastboard:pboard]];
  
  if ([pboard.types containsObject:NSFilenamesPboardType]) {
    if (sourceDragMask & NSDragOperationLink) {
      return NSDragOperationLink;
    } else if (sourceDragMask & NSDragOperationCopy) {
      return NSDragOperationCopy;
    }
  }
  return NSDragOperationNone;
}

- (void)draggingExited:(id<NSDraggingInfo>)sender
{
  [self sendMouseEventWithBlock:self.onDragLeave
                   locationInfo:[self locationInfoFromDraggingLocation:sender.draggingLocation]
                  modifierFlags:0
                 additionalData:[self dataTransferInfoFromPastboard:sender.draggingPasteboard]];
}

- (BOOL)performDragOperation:(id <NSDraggingInfo>)sender
{
  [self sendMouseEventWithBlock:self.onDrop
                   locationInfo:[self locationInfoFromDraggingLocation:sender.draggingLocation]
                  modifierFlags:0
                 additionalData:[self dataTransferInfoFromPastboard:[sender draggingPasteboard]]];
  return YES;
}
#endif // ]TODO(macOS ISS#2323203)

@end
