/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTViewComponentView.h"

#import <fabric/components/view/ViewProps.h>
#import <fabric/components/view/ViewEventEmitter.h>

#import "RCTConversions.h"

using namespace facebook::react;

@implementation RCTViewComponentView
{
  BOOL _isCoreAnimationBorderRenderingEnabled;
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

- (void)updateProps:(SharedProps)props
           oldProps:(SharedProps)oldProps
{
  if (!oldProps) {
    oldProps = _props ?: std::make_shared<ViewProps>();
  }
  _props = props;

  auto oldViewProps = *std::dynamic_pointer_cast<const ViewProps>(oldProps);
  auto newViewProps = *std::dynamic_pointer_cast<const ViewProps>(props);

  // `opacity`
  if (oldViewProps.opacity != newViewProps.opacity) {
    self.layer.opacity = (CGFloat)newViewProps.opacity;
  }

  // `backgroundColor`
  if (oldViewProps.backgroundColor != newViewProps.backgroundColor) {
    self.backgroundColor = RCTUIColorFromSharedColor(newViewProps.backgroundColor);
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
  }

  // `shadowOffset`
  if (oldViewProps.shadowOffset != newViewProps.shadowOffset) {
    self.layer.shadowOffset = RCTCGSizeFromSize(newViewProps.shadowOffset);
  }

  // `shadowOpacity`
  if (oldViewProps.shadowOpacity != newViewProps.shadowOpacity) {
    self.layer.shadowOpacity = (CGFloat)newViewProps.shadowOpacity;
  }

  // `shadowRadius`
  if (oldViewProps.shadowRadius != newViewProps.shadowRadius) {
    self.layer.shadowRadius = (CGFloat)newViewProps.shadowRadius;
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
  }

  // `zIndex`
  if (oldViewProps.zIndex != newViewProps.zIndex) {
    self.layer.zPosition = (CGFloat)newViewProps.zIndex;
  }

  // `border`
  if (
    oldViewProps.borderWidths != newViewProps.borderWidths ||
    oldViewProps.borderStyles != newViewProps.borderStyles ||
    oldViewProps.borderRadii != newViewProps.borderRadii ||
    oldViewProps.borderColors != newViewProps.borderColors
  ) {
    [self invalidateBorder];
  }

  // `nativeId`
  if (oldViewProps.nativeId != newViewProps.nativeId) {
    self.nativeId = RCTNSStringFromString(newViewProps.nativeId);
  }

  // `accessible`
  if (oldViewProps.accessible != newViewProps.accessible) {
    self.accessibilityElement.isAccessibilityElement = newViewProps.accessible;
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
}

- (void)invalidateBorder
{
  const auto &props = *std::dynamic_pointer_cast<const ViewProps>(_props);

  const auto borderMetrics =
    props.resolveBorderMetrics(_layoutMetrics.layoutDirection == LayoutDirection::RightToLeft);

  const bool useCoreAnimationBorderRendering =
    borderMetrics.borderColors.isUniform() &&
    borderMetrics.borderWidths.isUniform() &&
    borderMetrics.borderStyles.isUniform() &&
    borderMetrics.borderRadii.isUniform() &&
    borderMetrics.borderStyles.left == BorderStyle::Solid;

  CALayer *layer = self.layer;
  if (_isCoreAnimationBorderRenderingEnabled != useCoreAnimationBorderRendering) {
    _isCoreAnimationBorderRenderingEnabled = useCoreAnimationBorderRendering;
    if (!useCoreAnimationBorderRendering) {
      layer.borderWidth = 0;
      layer.borderColor = nil;
      layer.cornerRadius = 0;
    }
  }

  if (useCoreAnimationBorderRendering) {
    layer.borderWidth = (CGFloat)borderMetrics.borderWidths.left;
    layer.borderColor = RCTCGColorRefFromSharedColor(borderMetrics.borderColors.left);
    layer.cornerRadius = (CGFloat)borderMetrics.borderRadii.topLeft;
    _contentView.layer.cornerRadius = (CGFloat)borderMetrics.borderRadii.topLeft;
  } else {
    // Not supported yet.
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
