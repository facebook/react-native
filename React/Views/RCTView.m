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
#import "RCTConvert.h"
#import "RCTLog.h"
#import "RCTUtils.h"
#import "UIView+React.h"

static UIView *RCTViewHitTest(UIView *view, CGPoint point, UIEvent *event)
{
  for (UIView *subview in [view.subviews reverseObjectEnumerator]) {
    if (!subview.isHidden && subview.isUserInteractionEnabled && subview.alpha > 0) {
      CGPoint convertedPoint = [subview convertPoint:point fromView:view];
      UIView *subviewHitTestView = [subview hitTest:convertedPoint withEvent:event];
      if (subviewHitTestView != nil) {
        return subviewHitTestView;
      }
    }
  }
  return nil;
}

static BOOL RCTEllipseGetIntersectionsWithLine(CGRect ellipseBoundingRect, CGPoint p1, CGPoint p2, CGPoint intersections[2]);
static CGPathRef RCTPathCreateWithRoundedRect(CGRect rect, CGFloat topLeftRadiusX, CGFloat topLeftRadiusY, CGFloat topRightRadiusX, CGFloat topRightRadiusY, CGFloat bottomLeftRadiusX, CGFloat bottomLeftRadiusY, CGFloat bottomRightRadiusX, CGFloat bottomRightRadiusY, const CGAffineTransform *transform);
static void RCTPathAddEllipticArc(CGMutablePathRef path, const CGAffineTransform *m, CGFloat x, CGFloat y, CGFloat xRadius, CGFloat yRadius, CGFloat startAngle, CGFloat endAngle, bool clockwise);

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

  if (self.clipsToBounds && [self.subviews count] > 0) {
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
    testView = testView.superview;
  }
  return clipView ?: self.window;
}

@end

static NSString *RCTRecursiveAccessibilityLabel(UIView *view)
{
  NSMutableString *str = [NSMutableString stringWithString:@""];
  for (UIView *subview in view.subviews) {
    NSString *label = [subview accessibilityLabel];
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
  NSMutableArray *_reactSubviews;
  UIColor *_backgroundColor;
}

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

    _backgroundColor = [super backgroundColor];
  }

  return self;
}

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
  switch (_pointerEvents) {
    case RCTPointerEventsNone:
      return nil;
    case RCTPointerEventsUnspecified:
      return RCTViewHitTest(self, point, event) ?: [super hitTest:point withEvent:event];
    case RCTPointerEventsBoxOnly:
      return [super hitTest:point withEvent:event] ? self: nil;
    case RCTPointerEventsBoxNone:
      return RCTViewHitTest(self, point, event);
    default:
      RCTLogError(@"Invalid pointer-events specified %zd on %@", _pointerEvents, self);
      return [super hitTest:point withEvent:event];
  }
}

- (BOOL)accessibilityActivate
{
  if (self.accessibilityTapHandler) {
    self.accessibilityTapHandler(self);
    return YES;
  } else {
    return NO;
  }
}

- (BOOL)accessibilityPerformMagicTap
{
  if (self.magicTapHandler) {
    self.magicTapHandler(self);
    return YES;
  } else {
    return NO;
  }
}

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
  [scrollView setContentInset:baseInset];
  [scrollView setScrollIndicatorInsets:baseInset];

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
    UIViewController *controller = view.backingViewController;
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
  if (_reactSubviews) {
    NSInteger index = 0;
    for (UIView *view in _reactSubviews) {
      if (view.superview != self) {
        if (index < [self subviews].count) {
          [self insertSubview:view atIndex:index];
        } else {
          [self addSubview:view];
        }
        [view react_remountAllSubviews];
      }
      index++;
    }
  } else {
    // If react_subviews is nil, we must already be showing all subviews
    [super react_remountAllSubviews];
  }
}

- (void)remountSubview:(UIView *)view
{
  // Calculate insertion index for view
  NSInteger index = 0;
  for (UIView *subview in _reactSubviews) {
    if (subview == view) {
      [self insertSubview:view atIndex:index];
      break;
    }
    if (subview.superview) {
      // View is mounted, so bump the index
      index++;
    }
  }
}

- (void)mountOrUnmountSubview:(UIView *)view withClipRect:(CGRect)clipRect relativeToView:(UIView *)clipView
{
  if (view.clipsToBounds) {

    // View has cliping enabled, so we can easily test if it is partially
    // or completely within the clipRect, and mount or unmount it accordingly

    if (CGRectIntersectsRect(clipRect, view.frame)) {

      // View is at least partially visible, so remount it if unmounted
      if (view.superview == nil) {
        [self remountSubview:view];
      }

      // Then test its subviews
      if (CGRectContainsRect(clipRect, view.frame)) {
        [view react_remountAllSubviews];
      } else {
        [view react_updateClippedSubviewsWithClipRect:clipRect relativeToView:clipView];
      }

    } else if (view.superview) {

      // View is completely outside the clipRect, so unmount it
      [view removeFromSuperview];
    }

  } else {

    // View has clipping disabled, so there's no way to tell if it has
    // any visible subviews without an expensive recursive test, so we'll
    // just add it.

    if (view.superview == nil) {
      [self remountSubview:view];
    }

    // Check if subviews need to be mounted/unmounted
    [view react_updateClippedSubviewsWithClipRect:clipRect relativeToView:clipView];
  }
}

- (void)react_updateClippedSubviewsWithClipRect:(CGRect)clipRect relativeToView:(UIView *)clipView
{
  // TODO (#5906496): for scrollviews (the primary use-case) we could
  // optimize this by only doing a range check along the scroll axis,
  // instead of comparing the whole frame

  if (_reactSubviews == nil) {
    // Use default behavior if unmounting is disabled
    return [super react_updateClippedSubviewsWithClipRect:clipRect relativeToView:clipView];
  }

  if ([_reactSubviews count] == 0) {
    // Do nothing if we have no subviews
    return;
  }

  if (CGSizeEqualToSize(self.bounds.size, CGSizeZero)) {
    // Do nothing if layout hasn't happened yet
    return;
  }

  // Convert clipping rect to local coordinates
  clipRect = [clipView convertRect:clipRect toView:self];
  clipView = self;
  if (self.clipsToBounds) {
    clipRect = CGRectIntersection(clipRect, self.bounds);
  }

  // Mount / unmount views
  for (UIView *view in _reactSubviews) {
    [self mountOrUnmountSubview:view withClipRect:clipRect relativeToView:clipView];
  }
}

- (void)setRemoveClippedSubviews:(BOOL)removeClippedSubviews
{
  if (removeClippedSubviews && !_reactSubviews) {
    _reactSubviews = [self.subviews mutableCopy];
  } else if (!removeClippedSubviews && _reactSubviews) {
    [self react_remountAllSubviews];
    _reactSubviews = nil;
  }
}

- (BOOL)removeClippedSubviews
{
  return _reactSubviews != nil;
}

- (void)insertReactSubview:(UIView *)view atIndex:(NSInteger)atIndex
{
  if (_reactSubviews == nil) {
    [self insertSubview:view atIndex:atIndex];
  } else {
    [_reactSubviews insertObject:view atIndex:atIndex];

    // Find a suitable view to use for clipping
    UIView *clipView = [self react_findClipView];
    if (clipView) {

      // If possible, don't add subviews if they are clipped
      [self mountOrUnmountSubview:view withClipRect:clipView.bounds relativeToView:clipView];

    } else {

      // Fallback if we can't find a suitable clipView
      [self remountSubview:view];
    }
  }
}

- (void)removeReactSubview:(UIView *)subview
{
  [_reactSubviews removeObject:subview];
  [subview removeFromSuperview];
}

- (NSArray *)reactSubviews
{
  // The _reactSubviews array is only used when we have hidden
  // offscreen views. If _reactSubviews is nil, we can assume
  // that [self reactSubviews] and [self subviews] are the same

  return _reactSubviews ?: [self subviews];
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

  if (_reactSubviews) {
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

- (UIImage *)generateBorderImage:(out CGRect *)contentsCenter
{
  static const CGFloat threshold = 0.001;

  const CGFloat maxRadius = MIN(self.bounds.size.height, self.bounds.size.width);
  const CGFloat radius = MAX(0, _borderRadius);
  const CGFloat topLeftRadius =     MIN(_borderTopLeftRadius     >= 0 ? _borderTopLeftRadius     : radius, maxRadius);
  const CGFloat topRightRadius =    MIN(_borderTopRightRadius    >= 0 ? _borderTopRightRadius    : radius, maxRadius);
  const CGFloat bottomLeftRadius =  MIN(_borderBottomLeftRadius  >= 0 ? _borderBottomLeftRadius  : radius, maxRadius);
  const CGFloat bottomRightRadius = MIN(_borderBottomRightRadius >= 0 ? _borderBottomRightRadius : radius, maxRadius);

  const CGFloat borderWidth = MAX(0, _borderWidth);
  const CGFloat topWidth    = _borderTopWidth    >= 0 ? _borderTopWidth    : borderWidth;
  const CGFloat rightWidth  = _borderRightWidth  >= 0 ? _borderRightWidth  : borderWidth;
  const CGFloat bottomWidth = _borderBottomWidth >= 0 ? _borderBottomWidth : borderWidth;
  const CGFloat leftWidth   = _borderLeftWidth   >= 0 ? _borderLeftWidth   : borderWidth;

  if (topLeftRadius < threshold &&
      topRightRadius < threshold &&
      bottomLeftRadius < threshold &&
      bottomRightRadius < threshold &&
      topWidth < threshold &&
      rightWidth < threshold &&
      bottomWidth < threshold &&
      leftWidth < threshold) {
    return nil;
  }

  const CGFloat innerTopLeftRadiusX = MAX(0, topLeftRadius - leftWidth);
  const CGFloat innerTopLeftRadiusY = MAX(0, topLeftRadius - topWidth);

  const CGFloat innerTopRightRadiusX = MAX(0, topRightRadius - rightWidth);
  const CGFloat innerTopRightRadiusY = MAX(0, topRightRadius - topWidth);

  const CGFloat innerBottomLeftRadiusX = MAX(0, bottomLeftRadius - leftWidth);
  const CGFloat innerBottomLeftRadiusY = MAX(0, bottomLeftRadius - bottomWidth);

  const CGFloat innerBottomRightRadiusX = MAX(0, bottomRightRadius - rightWidth);
  const CGFloat innerBottomRightRadiusY = MAX(0, bottomRightRadius - bottomWidth);

  const UIEdgeInsets edgeInsets = UIEdgeInsetsMake(topWidth + MAX(innerTopLeftRadiusY, innerTopRightRadiusY), leftWidth + MAX(innerTopLeftRadiusX, innerBottomLeftRadiusX), bottomWidth + MAX(innerBottomLeftRadiusY, innerBottomRightRadiusY), rightWidth + + MAX(innerBottomRightRadiusX, innerTopRightRadiusX));
  const CGSize size = CGSizeMake(edgeInsets.left + 1 + edgeInsets.right, edgeInsets.top + 1 + edgeInsets.bottom);

  UIGraphicsBeginImageContextWithOptions(size, NO, 0.0);

  CGContextRef ctx = UIGraphicsGetCurrentContext();
  const CGRect rect = {CGPointZero, size};
  CGPathRef path = RCTPathCreateWithRoundedRect(rect, topLeftRadius, topLeftRadius, topRightRadius, topRightRadius, bottomLeftRadius, bottomLeftRadius, bottomRightRadius, bottomRightRadius, NULL);

  if (_backgroundColor) {
    CGContextSaveGState(ctx);

    CGContextAddPath(ctx, path);
    CGContextSetFillColorWithColor(ctx, _backgroundColor.CGColor);
    CGContextFillPath(ctx);

    CGContextRestoreGState(ctx);
  }

  CGContextAddPath(ctx, path);
  CGPathRelease(path);

  BOOL hasRadius = topLeftRadius > 0 || topRightRadius > 0 || bottomLeftRadius > 0 || bottomRightRadius > 0;
  if (hasRadius && topWidth > 0 && rightWidth > 0 && bottomWidth > 0 && leftWidth > 0) {
    const UIEdgeInsets insetEdgeInsets = UIEdgeInsetsMake(topWidth, leftWidth, bottomWidth, rightWidth);
    const CGRect insetRect = UIEdgeInsetsInsetRect(rect, insetEdgeInsets);
    CGPathRef insetPath = RCTPathCreateWithRoundedRect(insetRect, innerTopLeftRadiusX, innerTopLeftRadiusY, innerTopRightRadiusX, innerTopRightRadiusY, innerBottomLeftRadiusX, innerBottomLeftRadiusY, innerBottomRightRadiusX, innerBottomRightRadiusY, NULL);
    CGContextAddPath(ctx, insetPath);
    CGPathRelease(insetPath);
  }

  CGContextEOClip(ctx);

  BOOL hasEqualColor = !_borderTopColor && !_borderRightColor && !_borderBottomColor && !_borderLeftColor;
  BOOL hasEqualBorder = _borderWidth >= 0 && _borderTopWidth < 0 && _borderRightWidth < 0 && _borderBottomWidth < 0 && _borderLeftWidth < 0;
  if (!hasRadius && hasEqualBorder && hasEqualColor) {
    CGContextSetStrokeColorWithColor(ctx, _borderColor);
    CGContextSetLineWidth(ctx, 2 * _borderWidth);
    CGContextClipToRect(ctx, rect);
    CGContextStrokeRect(ctx, rect);
  } else if (!hasRadius && hasEqualColor) {
    CGContextSetFillColorWithColor(ctx, _borderColor);
    CGContextAddRect(ctx, rect);
    const CGRect insetRect = UIEdgeInsetsInsetRect(rect, edgeInsets);
    CGContextAddRect(ctx, insetRect);
    CGContextEOFillPath(ctx);
  } else {
    BOOL didSet = NO;
    CGPoint topLeft;
    if (innerTopLeftRadiusX > 0 && innerTopLeftRadiusY > 0) {
      CGPoint points[2];
      RCTEllipseGetIntersectionsWithLine(CGRectMake(leftWidth, topWidth, 2 * innerTopLeftRadiusX, 2 * innerTopLeftRadiusY), CGPointMake(0, 0), CGPointMake(leftWidth, topWidth), points);
      if (!isnan(points[1].x) && !isnan(points[1].y)) {
        topLeft = points[1];
        didSet = YES;
      }
    }

    if (!didSet) {
      topLeft = CGPointMake(leftWidth, topWidth);
    }

    didSet = NO;
    CGPoint bottomLeft;
    if (innerBottomLeftRadiusX > 0 && innerBottomLeftRadiusY > 0) {
      CGPoint points[2];
      RCTEllipseGetIntersectionsWithLine(CGRectMake(leftWidth, (size.height - bottomWidth) - 2 * innerBottomLeftRadiusY, 2 * innerBottomLeftRadiusX, 2 * innerBottomLeftRadiusY), CGPointMake(0, size.height), CGPointMake(leftWidth, size.height - bottomWidth), points);
      if (!isnan(points[1].x) && !isnan(points[1].y)) {
        bottomLeft = points[1];
        didSet = YES;
      }
    }

    if (!didSet) {
      bottomLeft = CGPointMake(leftWidth, size.height - bottomWidth);
    }

    didSet = NO;
    CGPoint topRight;
    if (innerTopRightRadiusX > 0 && innerTopRightRadiusY > 0) {
      CGPoint points[2];
      RCTEllipseGetIntersectionsWithLine(CGRectMake((size.width - rightWidth) - 2 * innerTopRightRadiusX, topWidth, 2 * innerTopRightRadiusX, 2 * innerTopRightRadiusY), CGPointMake(size.width, 0), CGPointMake(size.width - rightWidth, topWidth), points);
      if (!isnan(points[0].x) && !isnan(points[0].y)) {
        topRight = points[0];
        didSet = YES;
      }
    }

    if (!didSet) {
      topRight = CGPointMake(size.width - rightWidth, topWidth);
    }

    didSet = NO;
    CGPoint bottomRight;
    if (innerBottomRightRadiusX > 0 && innerBottomRightRadiusY > 0) {
      CGPoint points[2];
      RCTEllipseGetIntersectionsWithLine(CGRectMake((size.width - rightWidth) - 2 * innerBottomRightRadiusX, (size.height - bottomWidth) - 2 * innerBottomRightRadiusY, 2 * innerBottomRightRadiusX, 2 * innerBottomRightRadiusY), CGPointMake(size.width, size.height), CGPointMake(size.width - rightWidth, size.height - bottomWidth), points);
      if (!isnan(points[0].x) && !isnan(points[0].y)) {
        bottomRight = points[0];
        didSet = YES;
      }
    }

    if (!didSet) {
      bottomRight = CGPointMake(size.width - rightWidth, size.height - bottomWidth);
    }

    // RIGHT
    if (rightWidth > 0) {
      CGContextSaveGState(ctx);

      const CGPoint points[] = {
        CGPointMake(size.width, 0),
        topRight,
        bottomRight,
        CGPointMake(size.width, size.height),
      };

      CGContextSetFillColorWithColor(ctx, _borderRightColor ?: _borderColor);
      CGContextAddLines(ctx, points, sizeof(points)/sizeof(*points));
      CGContextFillPath(ctx);

      CGContextRestoreGState(ctx);
    }

    // BOTTOM
    if (bottomWidth > 0) {
      CGContextSaveGState(ctx);

      const CGPoint points[] = {
        CGPointMake(0, size.height),
        bottomLeft,
        bottomRight,
        CGPointMake(size.width, size.height),
      };

      CGContextSetFillColorWithColor(ctx, _borderBottomColor ?: _borderColor);
      CGContextAddLines(ctx, points, sizeof(points)/sizeof(*points));
      CGContextFillPath(ctx);

      CGContextRestoreGState(ctx);
    }

    // LEFT
    if (leftWidth > 0) {
      CGContextSaveGState(ctx);

      const CGPoint points[] = {
        CGPointMake(0, 0),
        topLeft,
        bottomLeft,
        CGPointMake(0, size.height),
      };

      CGContextSetFillColorWithColor(ctx, _borderLeftColor ?: _borderColor);
      CGContextAddLines(ctx, points, sizeof(points)/sizeof(*points));
      CGContextFillPath(ctx);

      CGContextRestoreGState(ctx);
    }

    // TOP
    if (topWidth > 0) {
      CGContextSaveGState(ctx);

      const CGPoint points[] = {
        CGPointMake(0, 0),
        topLeft,
        topRight,
        CGPointMake(size.width, 0),
      };

      CGContextSetFillColorWithColor(ctx, _borderTopColor ?: _borderColor);
      CGContextAddLines(ctx, points, sizeof(points)/sizeof(*points));
      CGContextFillPath(ctx);

      CGContextRestoreGState(ctx);
    }
  }

  UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
  UIGraphicsEndImageContext();

  *contentsCenter = CGRectMake(edgeInsets.left / size.width, edgeInsets.top / size.height, 1.0 / size.width, 1.0 / size.height);
  return [image resizableImageWithCapInsets:edgeInsets];
}

- (void)displayLayer:(CALayer *)layer
{
  CGRect contentsCenter = (CGRect){CGPointZero, {1, 1}};
  UIImage *image = [self generateBorderImage:&contentsCenter];

  if (image && RCTRunningInTestEnvironment()) {
    const CGSize size = self.bounds.size;
    UIGraphicsBeginImageContextWithOptions(size, NO, image.scale);
    [image drawInRect:(CGRect){CGPointZero, size}];
    image = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();
  }

  layer.backgroundColor = [image ? [UIColor clearColor] : _backgroundColor CGColor];
  layer.contents = (id)image.CGImage;
  layer.contentsCenter = contentsCenter;
  layer.contentsScale = image.scale ?: 1.0;
  layer.magnificationFilter = kCAFilterNearest;
}

#pragma mark Border Color

#define setBorderColor(side)                                              \
  - (void)setBorder##side##Color:(CGColorRef)border##side##Color          \
  {                                                                       \
    if (CGColorEqualToColor(_border##side##Color, border##side##Color)) { \
      return;                                                             \
    }                                                                     \
    _border##side##Color = border##side##Color;                           \
    [self.layer setNeedsDisplay];                                         \
  }

setBorderColor()
setBorderColor(Top)
setBorderColor(Right)
setBorderColor(Bottom)
setBorderColor(Left)

#pragma mark - Border Width

#define setBorderWidth(side)                                  \
  - (void)setBorder##side##Width:(CGFloat)border##side##Width \
  {                                                           \
    if (_border##side##Width == border##side##Width) {        \
      return;                                                 \
    }                                                         \
    _border##side##Width = border##side##Width;               \
    [self.layer setNeedsDisplay];                             \
  }

setBorderWidth()
setBorderWidth(Top)
setBorderWidth(Right)
setBorderWidth(Bottom)
setBorderWidth(Left)

#define setBorderRadius(side) \
  - (void)setBorder##side##Radius:(CGFloat)border##side##Radius \
  {                                                             \
    if (_border##side##Radius == border##side##Radius) {        \
      return;                                                   \
    }                                                           \
    _border##side##Radius = border##side##Radius;               \
    [self.layer setNeedsDisplay];                               \
  }

setBorderRadius()
setBorderRadius(TopLeft)
setBorderRadius(TopRight)
setBorderRadius(BottomLeft)
setBorderRadius(BottomRight)

@end

static void RCTPathAddEllipticArc(CGMutablePathRef path, const CGAffineTransform *m, CGFloat x, CGFloat y, CGFloat xRadius, CGFloat yRadius, CGFloat startAngle, CGFloat endAngle, bool clockwise)
{
  CGFloat xScale = 1, yScale = 1, radius = 0;
  if (xRadius != 0) {
    xScale = 1;
    yScale = yRadius / xRadius;
    radius = xRadius;
  } else if (yRadius != 0) {
    xScale = xRadius / yRadius;
    yScale = 1;
    radius = yRadius;
  }

  CGAffineTransform t = CGAffineTransformMakeTranslation(x, y);
  t = CGAffineTransformScale(t, xScale, yScale);
  if (m != NULL) {
    t = CGAffineTransformConcat(t, *m);
  }

  CGPathAddArc(path, &t, 0, 0, radius, startAngle, endAngle, clockwise);
}

static CGPathRef RCTPathCreateWithRoundedRect(CGRect rect, CGFloat topLeftRadiusX, CGFloat topLeftRadiusY, CGFloat topRightRadiusX, CGFloat topRightRadiusY, CGFloat bottomLeftRadiusX, CGFloat bottomLeftRadiusY, CGFloat bottomRightRadiusX, CGFloat bottomRightRadiusY, const CGAffineTransform *transform)
{
  const CGFloat minX = CGRectGetMinX(rect);
  const CGFloat minY = CGRectGetMinY(rect);
  const CGFloat maxX = CGRectGetMaxX(rect);
  const CGFloat maxY = CGRectGetMaxY(rect);

  CGMutablePathRef path = CGPathCreateMutable();
  RCTPathAddEllipticArc(path, transform, minX + topLeftRadiusX, minY + topLeftRadiusY, topLeftRadiusX, topLeftRadiusY, M_PI, 3 * M_PI_2, false);
  RCTPathAddEllipticArc(path, transform, maxX - topRightRadiusX, minY + topRightRadiusY, topRightRadiusX, topRightRadiusY, 3 * M_PI_2, 0, false);
  RCTPathAddEllipticArc(path, transform, maxX - bottomRightRadiusX, maxY - bottomRightRadiusY, bottomRightRadiusX, bottomRightRadiusY, 0, M_PI_2, false);
  RCTPathAddEllipticArc(path, transform, minX + bottomLeftRadiusX, maxY - bottomLeftRadiusY, bottomLeftRadiusX, bottomLeftRadiusY, M_PI_2, M_PI, false);
  CGPathCloseSubpath(path);
  return path;
}

static BOOL RCTEllipseGetIntersectionsWithLine(CGRect ellipseBoundingRect, CGPoint p1, CGPoint p2, CGPoint intersections[2])
{
  const CGFloat ellipseCenterX = CGRectGetMidX(ellipseBoundingRect);
  const CGFloat ellipseCenterY = CGRectGetMidY(ellipseBoundingRect);

  // ellipseBoundingRect.origin.x -= ellipseCenterX;
  // ellipseBoundingRect.origin.y -= ellipseCenterY;

  p1.x -= ellipseCenterX;
  p1.y -= ellipseCenterY;

  p2.x -= ellipseCenterX;
  p2.y -= ellipseCenterY;

  const CGFloat m = (p2.y - p1.y) / (p2.x - p1.x);
  const CGFloat a = ellipseBoundingRect.size.width / 2;
  const CGFloat b = ellipseBoundingRect.size.height / 2;
  const CGFloat c = p1.y - m * p1.x;
  const CGFloat A = (b * b + a * a * m * m);
  const CGFloat B = 2 * a * a * c * m;
  const CGFloat D = sqrt((a * a * (b * b - c * c)) / A + pow(B / (2 * A), 2));

  const CGFloat x_ = -B / (2 * A);
  const CGFloat x1 = x_ + D;
  const CGFloat x2 = x_ - D;
  const CGFloat y1 = m * x1 + c;
  const CGFloat y2 = m * x2 + c;

  intersections[0] = CGPointMake(x1 + ellipseCenterX, y1 + ellipseCenterY);
  intersections[1] = CGPointMake(x2 + ellipseCenterX, y2 + ellipseCenterY);
  return YES;
}
