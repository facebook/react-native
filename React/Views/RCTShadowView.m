/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTShadowView.h"

#import "RCTConvert.h"
#import "RCTLog.h"
#import "RCTUtils.h"
#import "UIView+Private.h"
#import "UIView+React.h"

typedef void (^RCTActionBlock)(RCTShadowView *shadowViewSelf, id value);
typedef void (^RCTResetActionBlock)(RCTShadowView *shadowViewSelf);

static NSString *const RCTBackgroundColorProp = @"backgroundColor";

typedef NS_ENUM(unsigned int, meta_prop_t) {
  META_PROP_LEFT,
  META_PROP_TOP,
  META_PROP_RIGHT,
  META_PROP_BOTTOM,
  META_PROP_HORIZONTAL,
  META_PROP_VERTICAL,
  META_PROP_ALL,
  META_PROP_COUNT,
};

@implementation RCTShadowView
{
  RCTUpdateLifecycle _propagationLifecycle;
  RCTUpdateLifecycle _textLifecycle;
  NSDictionary *_lastParentProperties;
  NSMutableArray<RCTShadowView *> *_reactSubviews;
  BOOL _recomputePadding;
  BOOL _recomputeMargin;
  BOOL _recomputeBorder;
  BOOL _didUpdateSubviews;
  YGValue _paddingMetaProps[META_PROP_COUNT];
  YGValue _marginMetaProps[META_PROP_COUNT];
  YGValue _borderMetaProps[META_PROP_COUNT];
}

@synthesize reactTag = _reactTag;

// cssNode api

static void RCTPrint(YGNodeRef node)
{
  RCTShadowView *shadowView = (__bridge RCTShadowView *)YGNodeGetContext(node);
  printf("%s(%zd), ", shadowView.viewName.UTF8String, shadowView.reactTag.integerValue);
}

#define RCT_SET_YGVALUE(ygvalue, setter, ...)    \
switch (ygvalue.unit) {                          \
  case YGUnitUndefined:                          \
    setter(__VA_ARGS__, YGUndefined);            \
    break;                                       \
  case YGUnitPixel:                              \
    setter(__VA_ARGS__, ygvalue.value);          \
    break;                                       \
  case YGUnitPercent:                            \
    setter##Percent(__VA_ARGS__, ygvalue.value); \
    break;                                       \
}

#define DEFINE_PROCESS_META_PROPS(type)                                                           \
static void RCTProcessMetaProps##type(const YGValue metaProps[META_PROP_COUNT], YGNodeRef node) { \
  RCT_SET_YGVALUE(metaProps[META_PROP_LEFT], YGNodeStyleSet##type, node, YGEdgeStart);            \
  RCT_SET_YGVALUE(metaProps[META_PROP_RIGHT], YGNodeStyleSet##type, node, YGEdgeEnd);             \
  RCT_SET_YGVALUE(metaProps[META_PROP_TOP], YGNodeStyleSet##type, node, YGEdgeTop);               \
  RCT_SET_YGVALUE(metaProps[META_PROP_BOTTOM], YGNodeStyleSet##type, node, YGEdgeBottom);         \
  RCT_SET_YGVALUE(metaProps[META_PROP_HORIZONTAL], YGNodeStyleSet##type, node, YGEdgeHorizontal); \
  RCT_SET_YGVALUE(metaProps[META_PROP_VERTICAL], YGNodeStyleSet##type, node, YGEdgeVertical);     \
  RCT_SET_YGVALUE(metaProps[META_PROP_ALL], YGNodeStyleSet##type, node, YGEdgeAll);               \
}

DEFINE_PROCESS_META_PROPS(Padding);
DEFINE_PROCESS_META_PROPS(Margin);

static void RCTProcessMetaPropsBorder(const YGValue metaProps[META_PROP_COUNT], YGNodeRef node) {
  YGNodeStyleSetBorder(node, YGEdgeStart, metaProps[META_PROP_LEFT].value);
  YGNodeStyleSetBorder(node, YGEdgeEnd, metaProps[META_PROP_RIGHT].value);
  YGNodeStyleSetBorder(node, YGEdgeTop, metaProps[META_PROP_TOP].value);
  YGNodeStyleSetBorder(node, YGEdgeBottom, metaProps[META_PROP_BOTTOM].value);
  YGNodeStyleSetBorder(node, YGEdgeHorizontal, metaProps[META_PROP_HORIZONTAL].value);
  YGNodeStyleSetBorder(node, YGEdgeVertical, metaProps[META_PROP_VERTICAL].value);
  YGNodeStyleSetBorder(node, YGEdgeAll, metaProps[META_PROP_ALL].value);
}

// The absolute stuff is so that we can take into account our absolute position when rounding in order to
// snap to the pixel grid. For example, say you have the following structure:
//
// +--------+---------+--------+
// |        |+-------+|        |
// |        ||       ||        |
// |        |+-------+|        |
// +--------+---------+--------+
//
// Say the screen width is 320 pts so the three big views will get the following x bounds from our layout system:
// {0, 106.667}, {106.667, 213.333}, {213.333, 320}
//
// Assuming screen scale is 2, these numbers must be rounded to the nearest 0.5 to fit the pixel grid:
// {0, 106.5}, {106.5, 213.5}, {213.5, 320}
// You'll notice that the three widths are 106.5, 107, 106.5.
//
// This is great for the parent views but it gets trickier when we consider rounding for the subview.
//
// When we go to round the bounds for the subview in the middle, it's relative bounds are {0, 106.667}
// which gets rounded to {0, 106.5}. This will cause the subview to be one pixel smaller than it should be.
// this is why we need to pass in the absolute position in order to do the rounding relative to the screen's
// grid rather than the view's grid.
//
// After passing in the absolutePosition of {106.667, y}, we do the following calculations:
// absoluteLeft = round(absolutePosition.x + viewPosition.left) = round(106.667 + 0) = 106.5
// absoluteRight = round(absolutePosition.x + viewPosition.left + viewSize.left) + round(106.667 + 0 + 106.667) = 213.5
// width = 213.5 - 106.5 = 107
// You'll notice that this is the same width we calculated for the parent view because we've taken its position into account.

- (void)applyLayoutNode:(YGNodeRef)node
      viewsWithNewFrame:(NSMutableSet<RCTShadowView *> *)viewsWithNewFrame
       absolutePosition:(CGPoint)absolutePosition
{
  if (!YGNodeGetHasNewLayout(node)) {
    return;
  }
  YGNodeSetHasNewLayout(node, false);

#if RCT_DEBUG
  // This works around a breaking change in css-layout where setting flexBasis needs to be set explicitly, instead of relying on flex to propagate.
  // We check for it by seeing if a width/height is provided along with a flexBasis of 0 and the width/height is laid out as 0.
  if (YGNodeStyleGetFlexBasis(node).unit == YGUnitPixel && YGNodeStyleGetFlexBasis(node).value == 0 &&
      ((YGNodeStyleGetWidth(node).unit == YGUnitPixel && YGNodeStyleGetWidth(node).value > 0 && YGNodeLayoutGetWidth(node) == 0) ||
      (YGNodeStyleGetHeight(node).unit == YGUnitPixel && YGNodeStyleGetHeight(node).value > 0 && YGNodeLayoutGetHeight(node) == 0))) {
    RCTLogError(@"View was rendered with explicitly set width/height but with a 0 flexBasis. (This might be fixed by changing flex: to flexGrow:) View: %@", self);
  }
#endif

  CGPoint absoluteTopLeft = {
    absolutePosition.x + YGNodeLayoutGetLeft(node),
    absolutePosition.y + YGNodeLayoutGetTop(node)
  };

  CGPoint absoluteBottomRight = {
    absolutePosition.x + YGNodeLayoutGetLeft(node) + YGNodeLayoutGetWidth(node),
    absolutePosition.y + YGNodeLayoutGetTop(node) + YGNodeLayoutGetHeight(node)
  };

  CGRect frame = {{
    RCTRoundPixelValue(YGNodeLayoutGetLeft(node)),
    RCTRoundPixelValue(YGNodeLayoutGetTop(node)),
  }, {
    RCTRoundPixelValue(absoluteBottomRight.x - absoluteTopLeft.x),
    RCTRoundPixelValue(absoluteBottomRight.y - absoluteTopLeft.y)
  }};

  if (!CGRectEqualToRect(frame, _frame)) {
    _frame = frame;
    [viewsWithNewFrame addObject:self];
  }

  absolutePosition.x += YGNodeLayoutGetLeft(node);
  absolutePosition.y += YGNodeLayoutGetTop(node);

  [self applyLayoutToChildren:node viewsWithNewFrame:viewsWithNewFrame absolutePosition:absolutePosition];
}

- (void)applyLayoutToChildren:(YGNodeRef)node
            viewsWithNewFrame:(NSMutableSet<RCTShadowView *> *)viewsWithNewFrame
             absolutePosition:(CGPoint)absolutePosition
{
  for (unsigned int i = 0; i < YGNodeGetChildCount(node); ++i) {
    RCTShadowView *child = (RCTShadowView *)_reactSubviews[i];
    [child applyLayoutNode:YGNodeGetChild(node, i)
         viewsWithNewFrame:viewsWithNewFrame
          absolutePosition:absolutePosition];
  }
}

- (NSDictionary<NSString *, id> *)processUpdatedProperties:(NSMutableSet<RCTApplierBlock> *)applierBlocks
                                          parentProperties:(NSDictionary<NSString *, id> *)parentProperties
{
  // TODO: we always refresh all propagated properties when propagation is
  // dirtied, but really we should track which properties have changed and
  // only update those.

  if (_didUpdateSubviews) {
    _didUpdateSubviews = NO;
    [self didUpdateReactSubviews];
    [applierBlocks addObject:^(NSDictionary<NSNumber *, UIView *> *viewRegistry) {
      UIView *view = viewRegistry[self->_reactTag];
      [view clearSortedSubviews];
      [view didUpdateReactSubviews];
    }];
  }

  if (!_backgroundColor) {
    UIColor *parentBackgroundColor = parentProperties[RCTBackgroundColorProp];
    if (parentBackgroundColor) {
      [applierBlocks addObject:^(NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        UIView *view = viewRegistry[self->_reactTag];
        [view reactSetInheritedBackgroundColor:parentBackgroundColor];
      }];
    }
  } else {
    // Update parent properties for children
    NSMutableDictionary<NSString *, id> *properties = [NSMutableDictionary dictionaryWithDictionary:parentProperties];
    CGFloat alpha = CGColorGetAlpha(_backgroundColor.CGColor);
    if (alpha < 1.0) {
      // If bg is non-opaque, don't propagate further
      properties[RCTBackgroundColorProp] = [UIColor clearColor];
    } else {
      properties[RCTBackgroundColorProp] = _backgroundColor;
    }
    return properties;
  }
  return parentProperties;
}

- (void)collectUpdatedProperties:(NSMutableSet<RCTApplierBlock> *)applierBlocks
                parentProperties:(NSDictionary<NSString *, id> *)parentProperties
{
  if (_propagationLifecycle == RCTUpdateLifecycleComputed && [parentProperties isEqualToDictionary:_lastParentProperties]) {
    return;
  }
  _propagationLifecycle = RCTUpdateLifecycleComputed;
  _lastParentProperties = parentProperties;
  NSDictionary<NSString *, id> *nextProps = [self processUpdatedProperties:applierBlocks parentProperties:parentProperties];
  for (RCTShadowView *child in _reactSubviews) {
    [child collectUpdatedProperties:applierBlocks parentProperties:nextProps];
  }
}

- (void)collectUpdatedFrames:(NSMutableSet<RCTShadowView *> *)viewsWithNewFrame
                   withFrame:(CGRect)frame
                      hidden:(BOOL)hidden
            absolutePosition:(CGPoint)absolutePosition
{
  if (_hidden != hidden) {
    // The hidden state has changed. Even if the frame hasn't changed, add
    // this ShadowView to viewsWithNewFrame so the UIManager will process
    // this ShadowView's UIView and update its hidden state.
    _hidden = hidden;
    [viewsWithNewFrame addObject:self];
  }

  if (!CGRectEqualToRect(frame, _frame)) {
    YGNodeStyleSetPositionType(_cssNode, YGPositionTypeAbsolute);
    YGNodeStyleSetWidth(_cssNode, frame.size.width);
    YGNodeStyleSetHeight(_cssNode, frame.size.height);
    YGNodeStyleSetPosition(_cssNode, YGEdgeLeft, frame.origin.x);
    YGNodeStyleSetPosition(_cssNode, YGEdgeTop, frame.origin.y);
  }

  YGNodeCalculateLayout(_cssNode, frame.size.width, frame.size.height, YGDirectionInherit);
  [self applyLayoutNode:_cssNode viewsWithNewFrame:viewsWithNewFrame absolutePosition:absolutePosition];
}

- (CGRect)measureLayoutRelativeToAncestor:(RCTShadowView *)ancestor
{
  CGPoint offset = CGPointZero;
  NSInteger depth = 30; // max depth to search
  RCTShadowView *shadowView = self;
  while (depth && shadowView && shadowView != ancestor) {
    offset.x += shadowView.frame.origin.x;
    offset.y += shadowView.frame.origin.y;
    shadowView = shadowView->_superview;
    depth--;
  }
  if (ancestor != shadowView) {
    return CGRectNull;
  }
  return (CGRect){offset, self.frame.size};
}

- (BOOL)viewIsDescendantOf:(RCTShadowView *)ancestor
{
  NSInteger depth = 30; // max depth to search
  RCTShadowView *shadowView = self;
  while (depth && shadowView && shadowView != ancestor) {
    shadowView = shadowView->_superview;
    depth--;
  }
  return ancestor == shadowView;
}

- (instancetype)init
{
  if ((self = [super init])) {

    _frame = CGRectMake(0, 0, YGUndefined, YGUndefined);

    for (unsigned int ii = 0; ii < META_PROP_COUNT; ii++) {
      _paddingMetaProps[ii] = YGValueUndefined;
      _marginMetaProps[ii] = YGValueUndefined;
      _borderMetaProps[ii] = YGValueUndefined;
    }

    _intrinsicContentSize = CGSizeMake(UIViewNoIntrinsicMetric, UIViewNoIntrinsicMetric);

    _newView = YES;
    _propagationLifecycle = RCTUpdateLifecycleUninitialized;
    _textLifecycle = RCTUpdateLifecycleUninitialized;

    _reactSubviews = [NSMutableArray array];

    _cssNode = YGNodeNew();
    YGNodeSetContext(_cssNode, (__bridge void *)self);
    YGNodeSetPrintFunc(_cssNode, RCTPrint);
  }
  return self;
}

- (BOOL)isReactRootView
{
  return RCTIsReactRootView(self.reactTag);
}

- (void)dealloc
{
  YGNodeFree(_cssNode);
}

- (BOOL)isCSSLeafNode
{
  return NO;
}

- (void)dirtyPropagation
{
  if (_propagationLifecycle != RCTUpdateLifecycleDirtied) {
    _propagationLifecycle = RCTUpdateLifecycleDirtied;
    [_superview dirtyPropagation];
  }
}

- (BOOL)isPropagationDirty
{
  return _propagationLifecycle != RCTUpdateLifecycleComputed;
}

- (void)dirtyText
{
  if (_textLifecycle != RCTUpdateLifecycleDirtied) {
    _textLifecycle = RCTUpdateLifecycleDirtied;
    [_superview dirtyText];
  }
}

- (BOOL)isTextDirty
{
  return _textLifecycle != RCTUpdateLifecycleComputed;
}

- (void)setTextComputed
{
  _textLifecycle = RCTUpdateLifecycleComputed;
}

- (void)insertReactSubview:(RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [_reactSubviews insertObject:subview atIndex:atIndex];
  if (![self isCSSLeafNode]) {
    YGNodeInsertChild(_cssNode, subview.cssNode, (uint32_t)atIndex);
  }
  subview->_superview = self;
  _didUpdateSubviews = YES;
  [self dirtyText];
  [self dirtyPropagation];
}

- (void)removeReactSubview:(RCTShadowView *)subview
{
  [subview dirtyText];
  [subview dirtyPropagation];
  _didUpdateSubviews = YES;
  subview->_superview = nil;
  [_reactSubviews removeObject:subview];
  if (![self isCSSLeafNode]) {
    YGNodeRemoveChild(_cssNode, subview.cssNode);
  }
}

- (NSArray<RCTShadowView *> *)reactSubviews
{
  return _reactSubviews;
}

- (RCTShadowView *)reactSuperview
{
  return _superview;
}

- (NSNumber *)reactTagAtPoint:(CGPoint)point
{
  for (RCTShadowView *shadowView in _reactSubviews) {
    if (CGRectContainsPoint(shadowView.frame, point)) {
      CGPoint relativePoint = point;
      CGPoint origin = shadowView.frame.origin;
      relativePoint.x -= origin.x;
      relativePoint.y -= origin.y;
      return [shadowView reactTagAtPoint:relativePoint];
    }
  }
  return self.reactTag;
}

- (NSString *)description
{
  NSString *description = super.description;
  description = [[description substringToIndex:description.length - 1] stringByAppendingFormat:@"; viewName: %@; reactTag: %@; frame: %@>", self.viewName, self.reactTag, NSStringFromCGRect(self.frame)];
  return description;
}

- (void)addRecursiveDescriptionToString:(NSMutableString *)string atLevel:(NSUInteger)level
{
  for (NSUInteger i = 0; i < level; i++) {
    [string appendString:@"  | "];
  }

  [string appendString:self.description];
  [string appendString:@"\n"];

  for (RCTShadowView *subview in _reactSubviews) {
    [subview addRecursiveDescriptionToString:string atLevel:level + 1];
  }
}

- (NSString *)recursiveDescription
{
  NSMutableString *description = [NSMutableString string];
  [self addRecursiveDescriptionToString:description atLevel:0];
  return description;
}

// Margin

#define RCT_MARGIN_PROPERTY(prop, metaProp)       \
- (void)setMargin##prop:(YGValue)value            \
{                                                 \
  _marginMetaProps[META_PROP_##metaProp] = value; \
  _recomputeMargin = YES;                         \
}                                                 \
- (YGValue)margin##prop                           \
{                                                 \
  return _marginMetaProps[META_PROP_##metaProp];  \
}

RCT_MARGIN_PROPERTY(, ALL)
RCT_MARGIN_PROPERTY(Vertical, VERTICAL)
RCT_MARGIN_PROPERTY(Horizontal, HORIZONTAL)
RCT_MARGIN_PROPERTY(Top, TOP)
RCT_MARGIN_PROPERTY(Left, LEFT)
RCT_MARGIN_PROPERTY(Bottom, BOTTOM)
RCT_MARGIN_PROPERTY(Right, RIGHT)

// Padding

#define RCT_PADDING_PROPERTY(prop, metaProp)       \
- (void)setPadding##prop:(YGValue)value            \
{                                                  \
  _paddingMetaProps[META_PROP_##metaProp] = value; \
  _recomputePadding = YES;                         \
}                                                  \
- (YGValue)padding##prop                           \
{                                                  \
  return _paddingMetaProps[META_PROP_##metaProp];  \
}

RCT_PADDING_PROPERTY(, ALL)
RCT_PADDING_PROPERTY(Vertical, VERTICAL)
RCT_PADDING_PROPERTY(Horizontal, HORIZONTAL)
RCT_PADDING_PROPERTY(Top, TOP)
RCT_PADDING_PROPERTY(Left, LEFT)
RCT_PADDING_PROPERTY(Bottom, BOTTOM)
RCT_PADDING_PROPERTY(Right, RIGHT)

- (UIEdgeInsets)paddingAsInsets
{
  return (UIEdgeInsets){
    YGNodeLayoutGetPadding(_cssNode, YGEdgeTop),
    YGNodeLayoutGetPadding(_cssNode, YGEdgeLeft),
    YGNodeLayoutGetPadding(_cssNode, YGEdgeBottom),
    YGNodeLayoutGetPadding(_cssNode, YGEdgeRight)
  };
}

// Border

#define RCT_BORDER_PROPERTY(prop, metaProp)             \
- (void)setBorder##prop##Width:(float)value             \
{                                                       \
  _borderMetaProps[META_PROP_##metaProp].value = value; \
  _recomputeBorder = YES;                               \
}                                                       \
- (float)border##prop##Width                            \
{                                                       \
  return _borderMetaProps[META_PROP_##metaProp].value;  \
}

RCT_BORDER_PROPERTY(, ALL)
RCT_BORDER_PROPERTY(Top, TOP)
RCT_BORDER_PROPERTY(Left, LEFT)
RCT_BORDER_PROPERTY(Bottom, BOTTOM)
RCT_BORDER_PROPERTY(Right, RIGHT)

// Dimensions

#define RCT_DIMENSION_PROPERTY(setProp, getProp, cssProp)           \
- (void)set##setProp:(YGValue)value                                 \
{                                                                   \
  RCT_SET_YGVALUE(value, YGNodeStyleSet##cssProp, _cssNode);        \
  [self dirtyText];                                                 \
}                                                                   \
- (YGValue)getProp                                                  \
{                                                                   \
  return YGNodeStyleGet##cssProp(_cssNode);                         \
}

RCT_DIMENSION_PROPERTY(Width, width, Width)
RCT_DIMENSION_PROPERTY(Height, height, Height)
RCT_DIMENSION_PROPERTY(MinWidth, minWidth, MinWidth)
RCT_DIMENSION_PROPERTY(MinHeight, minHeight, MinHeight)
RCT_DIMENSION_PROPERTY(MaxWidth, maxWidth, MaxWidth)
RCT_DIMENSION_PROPERTY(MaxHeight, maxHeight, MaxHeight)

// Position

#define RCT_POSITION_PROPERTY(setProp, getProp, edge)               \
- (void)set##setProp:(YGValue)value                                 \
{                                                                   \
  RCT_SET_YGVALUE(value, YGNodeStyleSetPosition, _cssNode, edge);   \
  [self dirtyText];                                                 \
}                                                                   \
- (YGValue)getProp                                                  \
{                                                                   \
  return YGNodeStyleGetPosition(_cssNode, edge);                    \
}

RCT_POSITION_PROPERTY(Top, top, YGEdgeTop)
RCT_POSITION_PROPERTY(Right, right, YGEdgeEnd)
RCT_POSITION_PROPERTY(Bottom, bottom, YGEdgeBottom)
RCT_POSITION_PROPERTY(Left, left, YGEdgeStart)

// Size

- (CGSize)size
{
  YGValue width = YGNodeStyleGetWidth(_cssNode);
  YGValue height = YGNodeStyleGetHeight(_cssNode);

  return CGSizeMake(
    width.unit == YGUnitPixel ? width.value : NAN,
    height.unit == YGUnitPixel ? height.value : NAN
  );
}

- (void)setSize:(CGSize)size
{
  YGNodeStyleSetWidth(_cssNode, size.width);
  YGNodeStyleSetHeight(_cssNode, size.height);
}

// IntrinsicContentSize

static inline YGSize RCTShadowViewMeasure(YGNodeRef node, float width, YGMeasureMode widthMode, float height, YGMeasureMode heightMode)
{
  RCTShadowView *shadowView = (__bridge RCTShadowView *)YGNodeGetContext(node);

  CGSize intrinsicContentSize = shadowView->_intrinsicContentSize;
  // Replace `UIViewNoIntrinsicMetric` (which equals `-1`) with zero.
  intrinsicContentSize.width = MAX(0, intrinsicContentSize.width);
  intrinsicContentSize.height = MAX(0, intrinsicContentSize.height);

  YGSize result;

  switch (widthMode) {
    case YGMeasureModeUndefined:
      result.width = intrinsicContentSize.width;
      break;
    case YGMeasureModeExactly:
      result.width = width;
      break;
    case YGMeasureModeAtMost:
      result.width = MIN(width, intrinsicContentSize.width);
      break;
  }

  switch (heightMode) {
    case YGMeasureModeUndefined:
      result.height = intrinsicContentSize.height;
      break;
    case YGMeasureModeExactly:
      result.height = height;
      break;
    case YGMeasureModeAtMost:
      result.height = MIN(height, intrinsicContentSize.height);
      break;
  }

  return result;
}

- (void)setIntrinsicContentSize:(CGSize)intrinsicContentSize
{
  if (CGSizeEqualToSize(_intrinsicContentSize, intrinsicContentSize)) {
    return;
  }

  _intrinsicContentSize = intrinsicContentSize;

  if (CGSizeEqualToSize(_intrinsicContentSize, CGSizeMake(UIViewNoIntrinsicMetric, UIViewNoIntrinsicMetric))) {
    YGNodeSetMeasureFunc(_cssNode, NULL);
  } else {
    YGNodeSetMeasureFunc(_cssNode, RCTShadowViewMeasure);
  }

  YGNodeMarkDirty(_cssNode);
}

// Flex

- (void)setFlex:(float)value
{
  YGNodeStyleSetFlex(_cssNode, value);
}

- (void)setFlexBasis:(YGValue)value
{
  RCT_SET_YGVALUE(value, YGNodeStyleSetFlexBasis, _cssNode);
}

- (YGValue)flexBasis
{
  return YGNodeStyleGetFlexBasis(_cssNode);
}

#define RCT_STYLE_PROPERTY(setProp, getProp, cssProp, type) \
- (void)set##setProp:(type)value                            \
{                                                           \
  YGNodeStyleSet##cssProp(_cssNode, value);                 \
}                                                           \
- (type)getProp                                             \
{                                                           \
  return YGNodeStyleGet##cssProp(_cssNode);                 \
}

RCT_STYLE_PROPERTY(FlexGrow, flexGrow, FlexGrow, float)
RCT_STYLE_PROPERTY(FlexShrink, flexShrink, FlexShrink, float)
RCT_STYLE_PROPERTY(FlexDirection, flexDirection, FlexDirection, YGFlexDirection)
RCT_STYLE_PROPERTY(JustifyContent, justifyContent, JustifyContent, YGJustify)
RCT_STYLE_PROPERTY(AlignSelf, alignSelf, AlignSelf, YGAlign)
RCT_STYLE_PROPERTY(AlignItems, alignItems, AlignItems, YGAlign)
RCT_STYLE_PROPERTY(Position, position, PositionType, YGPositionType)
RCT_STYLE_PROPERTY(FlexWrap, flexWrap, FlexWrap, YGWrap)
RCT_STYLE_PROPERTY(Overflow, overflow, Overflow, YGOverflow)
RCT_STYLE_PROPERTY(AspectRatio, aspectRatio, AspectRatio, float)

- (void)setBackgroundColor:(UIColor *)color
{
  _backgroundColor = color;
  [self dirtyPropagation];
}

- (void)setZIndex:(NSInteger)zIndex
{
  _zIndex = zIndex;
  if (_superview) {
    // Changing zIndex means the subview order of the parent needs updating
    _superview->_didUpdateSubviews = YES;
    [_superview dirtyPropagation];
  }
}

- (void)didUpdateReactSubviews
{
  // Does nothing by default
}

- (void)didSetProps:(__unused NSArray<NSString *> *)changedProps
{
  if (_recomputePadding) {
    RCTProcessMetaPropsPadding(_paddingMetaProps, _cssNode);
  }
  if (_recomputeMargin) {
    RCTProcessMetaPropsMargin(_marginMetaProps, _cssNode);
  }
  if (_recomputeBorder) {
    RCTProcessMetaPropsBorder(_borderMetaProps, _cssNode);
  }
  _recomputeMargin = NO;
  _recomputePadding = NO;
  _recomputeBorder = NO;
}

@end
