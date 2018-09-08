/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTViewComponentView.h"

#import <fabric/components/view/ViewProps.h>
#import <fabric/components/view/ViewEventEmitter.h>
#import <objc/runtime.h>
#import <React/RCTBorderDrawing.h>

#import "RCTConversions.h"

using namespace facebook::react;

@implementation RCTViewComponentView
{
  UIColor *_backgroundColor;
}

- (void)setContentView:(UIView *)contentView
{
  if (_contentView) {
    [_contentView removeFromSuperview];
  }

  _contentView = contentView;

  if (_contentView) {
    [self addSubview:_contentView];
  }
}

- (void)layoutSubviews
{
  [super layoutSubviews];

  if (_contentView) {
    _contentView.frame = RCTCGRectFromRect(_layoutMetrics.getContentFrame());
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

- (UIColor *)backgroundColor
{
  return _backgroundColor;
}

- (void)setBackgroundColor:(UIColor *)backgroundColor
{
  _backgroundColor = backgroundColor;
}

- (void)updateProps:(SharedProps)props
           oldProps:(SharedProps)oldProps
{
  if (!oldProps) {
    oldProps = _props ?: std::make_shared<ViewProps>();
  }
  _props = props;

  auto oldViewProps = *std::dynamic_pointer_cast<const ViewProps>(oldProps);
  auto newViewProps = *std::dynamic_pointer_cast<const ViewProps>(props);

  BOOL needsInvalidateLayer = NO;

  // `opacity`
  if (oldViewProps.opacity != newViewProps.opacity) {
    self.layer.opacity = (CGFloat)newViewProps.opacity;
    needsInvalidateLayer = YES;
  }

  // `backgroundColor`
  if (oldViewProps.backgroundColor != newViewProps.backgroundColor) {
    _backgroundColor = RCTUIColorFromSharedColor(newViewProps.backgroundColor);
    needsInvalidateLayer = YES;
  }

  // `foregroundColor`
  if (oldViewProps.foregroundColor != newViewProps.foregroundColor) {
    self.foregroundColor = RCTUIColorFromSharedColor(newViewProps.foregroundColor);
  }

  // `shadowColor`
  if (oldViewProps.shadowColor != newViewProps.shadowColor) {
    CGColorRef shadowColor = RCTCGColorRefFromSharedColor(newViewProps.shadowColor);
    self.layer.shadowColor = shadowColor;
    CGColorRelease(shadowColor);
    needsInvalidateLayer = YES;
  }

  // `shadowOffset`
  if (oldViewProps.shadowOffset != newViewProps.shadowOffset) {
    self.layer.shadowOffset = RCTCGSizeFromSize(newViewProps.shadowOffset);
    needsInvalidateLayer = YES;
  }

  // `shadowOpacity`
  if (oldViewProps.shadowOpacity != newViewProps.shadowOpacity) {
    self.layer.shadowOpacity = (CGFloat)newViewProps.shadowOpacity;
    needsInvalidateLayer = YES;
  }

  // `shadowRadius`
  if (oldViewProps.shadowRadius != newViewProps.shadowRadius) {
    self.layer.shadowRadius = (CGFloat)newViewProps.shadowRadius;
    needsInvalidateLayer = YES;
  }

  // `backfaceVisibility`
  if (oldViewProps.backfaceVisibility != newViewProps.backfaceVisibility) {
    self.layer.doubleSided = newViewProps.backfaceVisibility;
  }

  // `shouldRasterize`
  if (oldViewProps.shouldRasterize != newViewProps.shouldRasterize) {
    self.layer.shouldRasterize = newViewProps.shouldRasterize;
    self.layer.rasterizationScale = newViewProps.shouldRasterize ? [UIScreen mainScreen].scale : 1.0;
  }

  // `pointerEvents`
  if (oldViewProps.pointerEvents != newViewProps.pointerEvents) {
    self.userInteractionEnabled = newViewProps.pointerEvents != PointerEventsMode::None;
  }

  // `transform`
  if (oldViewProps.transform != newViewProps.transform) {
    self.layer.transform = RCTCATransform3DFromTransformMatrix(newViewProps.transform);
    self.layer.allowsEdgeAntialiasing = newViewProps.transform != Transform::Identity();
  }

  // `hitSlop`
  if (oldViewProps.hitSlop != newViewProps.hitSlop) {
    self.hitTestEdgeInsets = RCTUIEdgeInsetsFromEdgeInsets(newViewProps.hitSlop);
  }

  // `overflow`
  if (oldViewProps.yogaStyle.overflow != newViewProps.yogaStyle.overflow) {
    self.clipsToBounds = newViewProps.yogaStyle.overflow != YGOverflowVisible;
    needsInvalidateLayer = YES;
  }

  // `zIndex`
  if (oldViewProps.zIndex != newViewProps.zIndex) {
    self.layer.zPosition = (CGFloat)newViewProps.zIndex;
  }

  // `border`
  if (
    oldViewProps.borderStyles != newViewProps.borderStyles ||
    oldViewProps.borderRadii != newViewProps.borderRadii ||
    oldViewProps.borderColors != newViewProps.borderColors
  ) {
    needsInvalidateLayer = YES;
  }

  // `nativeId`
  if (oldViewProps.nativeId != newViewProps.nativeId) {
    self.nativeId = RCTNSStringFromString(newViewProps.nativeId);
  }

  // `accessible`
  if (oldViewProps.accessible != newViewProps.accessible) {
    self.accessibilityElement.isAccessibilityElement = newViewProps.accessible;
  }

  if (needsInvalidateLayer) {
    [self invalidateLayer];
  }
}

- (void)updateEventEmitter:(SharedEventEmitter)eventEmitter
{
  assert(std::dynamic_pointer_cast<const ViewEventEmitter>(eventEmitter));
  _eventEmitter = std::static_pointer_cast<const ViewEventEmitter>(eventEmitter);
}

- (void)updateLayoutMetrics:(LayoutMetrics)layoutMetrics
           oldLayoutMetrics:(LayoutMetrics)oldLayoutMetrics
{
  _layoutMetrics = layoutMetrics;

  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];

  [self invalidateLayer];
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  auto viewProps = *std::static_pointer_cast<const ViewProps>(_props);
  switch (viewProps.pointerEvents) {
    case PointerEventsMode::Auto:
      return [super hitTest:point withEvent:event];
    case PointerEventsMode::None:
      return nil;
    case PointerEventsMode::BoxOnly:
      return [self pointInside:point withEvent:event] ? self : nil;
    case PointerEventsMode::BoxNone:
      UIView *view = [super hitTest:point withEvent:event];
      return view != self ? view : nil;
  }
}

static RCTCornerRadii RCTCornerRadiiFromBorderRadii(BorderRadii borderRadii) {
  return RCTCornerRadii {
    .topLeft = (CGFloat)borderRadii.topLeft,
    .topRight = (CGFloat)borderRadii.topRight,
    .bottomLeft = (CGFloat)borderRadii.bottomLeft,
    .bottomRight = (CGFloat)borderRadii.bottomRight
  };
}

static RCTBorderColors RCTBorderColorsFromBorderColors(BorderColors borderColors) {
  return RCTBorderColors {
    .left = RCTCGColorRefFromSharedColor(borderColors.left),
    .top = RCTCGColorRefFromSharedColor(borderColors.top),
    .bottom = RCTCGColorRefFromSharedColor(borderColors.bottom),
    .right = RCTCGColorRefFromSharedColor(borderColors.right)
  };
}

static UIEdgeInsets UIEdgeInsetsFromBorderInsets(EdgeInsets edgeInsets) {
  return UIEdgeInsets {
    .left = (CGFloat)edgeInsets.left,
    .top = (CGFloat)edgeInsets.top,
    .bottom = (CGFloat)edgeInsets.bottom,
    .right = (CGFloat)edgeInsets.right
  };
}

static RCTBorderStyle RCTBorderStyleFromBorderStyle(BorderStyle borderStyle) {
  switch (borderStyle) {
    case BorderStyle::Solid:
      return RCTBorderStyleSolid;
    case BorderStyle::Dotted:
      return RCTBorderStyleDotted;
    case BorderStyle::Dashed:
      return RCTBorderStyleDashed;
  }
}

- (void)invalidateLayer
{
  const auto &props = *std::dynamic_pointer_cast<const ViewProps>(_props);

  const auto borderMetrics =
    props.resolveBorderMetrics(_layoutMetrics.layoutDirection == LayoutDirection::RightToLeft);

  CALayer *layer = self.layer;

  // Stage 1. Shadow Path
  BOOL layerHasShadow = layer.shadowOpacity > 0 && CGColorGetAlpha(layer.shadowColor) > 0;
  if (layerHasShadow) {
    if (CGColorGetAlpha(_backgroundColor.CGColor) > 0.999) {
      // If view has a solid background color, calculate shadow path from border.
      const RCTCornerInsets cornerInsets =
        RCTGetCornerInsets(RCTCornerRadiiFromBorderRadii(borderMetrics.borderRadii), UIEdgeInsetsZero);
      CGPathRef shadowPath = RCTPathCreateWithRoundedRect(self.bounds, cornerInsets, nil);
      layer.shadowPath = shadowPath;
      CGPathRelease(shadowPath);
    } else {
      // Can't accurately calculate box shadow, so fall back to pixel-based shadow.
      layer.shadowPath = nil;
    }
  } else {
    layer.shadowPath = nil;
  }

  // Stage 2. Border Rendering
  const bool useCoreAnimationBorderRendering =
    borderMetrics.borderColors.isUniform() &&
    borderMetrics.borderWidths.isUniform() &&
    borderMetrics.borderStyles.isUniform() &&
    borderMetrics.borderRadii.isUniform() &&
    borderMetrics.borderStyles.left == BorderStyle::Solid &&
    (
      // iOS draws borders in front of the content whereas CSS draws them behind
      // the content. For this reason, only use iOS border drawing when clipping
      // or when the border is hidden.
      borderMetrics.borderWidths.left == 0 ||
      colorComponentsFromColor(borderMetrics.borderColors.left).alpha == 0 ||
      self.clipsToBounds
    );

  if (useCoreAnimationBorderRendering) {
    layer.contents = nil;
    layer.needsDisplayOnBoundsChange = NO;
    layer.borderWidth = (CGFloat)borderMetrics.borderWidths.left;
    layer.borderColor = RCTCGColorRefFromSharedColor(borderMetrics.borderColors.left);
    layer.cornerRadius = (CGFloat)borderMetrics.borderRadii.topLeft;
    layer.backgroundColor = _backgroundColor.CGColor;
    _contentView.layer.cornerRadius = (CGFloat)borderMetrics.borderRadii.topLeft;
    _contentView.layer.masksToBounds = YES;
  } else {
    layer.backgroundColor = nil;
    layer.borderWidth = 0;
    layer.borderColor = nil;
    layer.cornerRadius = 0;
    _contentView.layer.cornerRadius = 0;
    _contentView.layer.masksToBounds = NO;

    UIImage *image = RCTGetBorderImage(
      RCTBorderStyleFromBorderStyle(borderMetrics.borderStyles.left),
      layer.bounds.size,
      RCTCornerRadiiFromBorderRadii(borderMetrics.borderRadii),
      UIEdgeInsetsFromBorderInsets(borderMetrics.borderWidths),
      RCTBorderColorsFromBorderColors(borderMetrics.borderColors),
      _backgroundColor.CGColor,
      self.clipsToBounds
    );

    if (image == nil) {
      layer.contents = nil;
      layer.needsDisplayOnBoundsChange = NO;
    } else {
      CGSize imageSize = image.size;
      UIEdgeInsets imageCapInsets = image.capInsets;
      CGRect contentsCenter = CGRect {
        CGPoint {imageCapInsets.left / imageSize.width, imageCapInsets.top / imageSize.height},
        CGSize {(CGFloat)1.0 / imageSize.width, (CGFloat)1.0 / imageSize.height}
      };

      layer.contents = (id)image.CGImage;
      layer.contentsScale = image.scale;
      layer.needsDisplayOnBoundsChange = YES;
      layer.magnificationFilter = kCAFilterNearest;

      const BOOL isResizable = !UIEdgeInsetsEqualToEdgeInsets(image.capInsets, UIEdgeInsetsZero);
      if (isResizable) {
        layer.contentsCenter = contentsCenter;
      } else {
        layer.contentsCenter = CGRect { CGPoint {0.0, 0.0}, CGSize {1.0, 1.0}};
      }
    }

    // Stage 2.5. Custom Clipping Mask
    CAShapeLayer *maskLayer = nil;
    CGFloat cornerRadius = 0;
    if (self.clipsToBounds) {
      if (borderMetrics.borderRadii.isUniform()) {
        // In this case we can simply use `cornerRadius` exclusivly.
        cornerRadius = borderMetrics.borderRadii.topLeft;
      } else {
        // In this case we have to generate masking layer manually.
        CGPathRef path = RCTPathCreateWithRoundedRect(
          self.bounds,
          RCTGetCornerInsets(RCTCornerRadiiFromBorderRadii(borderMetrics.borderRadii), UIEdgeInsetsZero),
          nil
        );

        maskLayer = [CAShapeLayer layer];
        maskLayer.path = path;
        CGPathRelease(path);
      }
    }

    layer.cornerRadius = cornerRadius;
    layer.mask = maskLayer;
  }
}

#pragma mark - Accessibility

- (NSObject *)accessibilityElement
{
  return self;
}

#pragma mark - Accessibility Events

- (NSArray<UIAccessibilityCustomAction *> *)accessibilityCustomActions
{
  const auto &accessibilityProps = *std::dynamic_pointer_cast<const AccessibilityProps>(_props);

  if (accessibilityProps.accessibilityActions.size() == 0) {
    return nil;
  }

  NSMutableArray<UIAccessibilityCustomAction *> *customActions = [NSMutableArray array];
  for (const auto &accessibilityAction : accessibilityProps.accessibilityActions) {
    [customActions addObject:[[UIAccessibilityCustomAction alloc] initWithName:RCTNSStringFromString(accessibilityAction)
                                                                        target:self
                                                                      selector:@selector(didActivateAccessibilityCustomAction:)]];
  }

  return [customActions copy];
}

- (BOOL)accessibilityActivate
{
  _eventEmitter->onAccessibilityTap();
  return YES;
}

- (BOOL)accessibilityPerformMagicTap
{
  _eventEmitter->onAccessibilityMagicTap();
  return YES;
}

- (BOOL)didActivateAccessibilityCustomAction:(UIAccessibilityCustomAction *)action
{
  _eventEmitter->onAccessibilityAction(RCTStringFromNSString(action.name));
  return YES;
}

- (SharedEventEmitter)touchEventEmitter
{
  return _eventEmitter;
}

@end
