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
#import "UIView+React.h"
#import "UIView+Private.h"

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
  float _paddingMetaProps[META_PROP_COUNT];
  float _marginMetaProps[META_PROP_COUNT];
  float _borderMetaProps[META_PROP_COUNT];
}

@synthesize reactTag = _reactTag;

// cssNode api

static void RCTPrint(void *context)
{
  RCTShadowView *shadowView = (__bridge RCTShadowView *)context;
  printf("%s(%zd), ", shadowView.viewName.UTF8String, shadowView.reactTag.integerValue);
}

// Enforces precedence rules, e.g. marginLeft > marginHorizontal > margin.
#define DEFINE_PROCESS_META_PROPS(type)                                                            \
static void RCTProcessMetaProps##type(const float metaProps[META_PROP_COUNT], CSSNodeRef node) {   \
  if (!CSSValueIsUndefined(metaProps[META_PROP_LEFT])) {                                           \
    CSSNodeStyleSet##type(node, CSSEdgeStart, metaProps[META_PROP_LEFT]);                          \
  } else if (!CSSValueIsUndefined(metaProps[META_PROP_HORIZONTAL])) {                              \
    CSSNodeStyleSet##type(node, CSSEdgeStart, metaProps[META_PROP_HORIZONTAL]);                    \
  } else if (!CSSValueIsUndefined(metaProps[META_PROP_ALL])) {                                     \
    CSSNodeStyleSet##type(node, CSSEdgeStart, metaProps[META_PROP_ALL]);                           \
  } else {                                                                                         \
    CSSNodeStyleSet##type(node, CSSEdgeStart, 0);                                                  \
  }                                                                                                \
                                                                                                   \
  if (!CSSValueIsUndefined(metaProps[META_PROP_RIGHT])) {                                          \
    CSSNodeStyleSet##type(node, CSSEdgeEnd, metaProps[META_PROP_RIGHT]);                           \
  } else if (!CSSValueIsUndefined(metaProps[META_PROP_HORIZONTAL])) {                              \
    CSSNodeStyleSet##type(node, CSSEdgeEnd, metaProps[META_PROP_HORIZONTAL]);                      \
  } else if (!CSSValueIsUndefined(metaProps[META_PROP_ALL])) {                                     \
    CSSNodeStyleSet##type(node, CSSEdgeEnd, metaProps[META_PROP_ALL]);                             \
  } else {                                                                                         \
    CSSNodeStyleSet##type(node, CSSEdgeEnd, 0);                                                    \
  }                                                                                                \
                                                                                                   \
  if (!CSSValueIsUndefined(metaProps[META_PROP_TOP])) {                                            \
    CSSNodeStyleSet##type(node, CSSEdgeTop, metaProps[META_PROP_TOP]);                             \
  } else if (!CSSValueIsUndefined(metaProps[META_PROP_VERTICAL])) {                                \
    CSSNodeStyleSet##type(node, CSSEdgeTop, metaProps[META_PROP_VERTICAL]);                        \
  } else if (!CSSValueIsUndefined(metaProps[META_PROP_ALL])) {                                     \
    CSSNodeStyleSet##type(node, CSSEdgeTop, metaProps[META_PROP_ALL]);                             \
  } else {                                                                                         \
    CSSNodeStyleSet##type(node, CSSEdgeTop, 0);                                                    \
  }                                                                                                \
                                                                                                   \
  if (!CSSValueIsUndefined(metaProps[META_PROP_BOTTOM])) {                                         \
    CSSNodeStyleSet##type(node, CSSEdgeBottom, metaProps[META_PROP_BOTTOM]);                       \
  } else if (!CSSValueIsUndefined(metaProps[META_PROP_VERTICAL])) {                                \
    CSSNodeStyleSet##type(node, CSSEdgeBottom, metaProps[META_PROP_VERTICAL]);                     \
  } else if (!CSSValueIsUndefined(metaProps[META_PROP_ALL])) {                                     \
    CSSNodeStyleSet##type(node, CSSEdgeBottom, metaProps[META_PROP_ALL]);                          \
  } else {                                                                                         \
    CSSNodeStyleSet##type(node, CSSEdgeBottom, 0);                                                 \
  }                                                                                                \
}

DEFINE_PROCESS_META_PROPS(Padding);
DEFINE_PROCESS_META_PROPS(Margin);
DEFINE_PROCESS_META_PROPS(Border);

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

- (void)applyLayoutNode:(CSSNodeRef)node
      viewsWithNewFrame:(NSMutableSet<RCTShadowView *> *)viewsWithNewFrame
       absolutePosition:(CGPoint)absolutePosition
{
  if (!CSSNodeGetHasNewLayout(node)) {
    return;
  }
  CSSNodeSetHasNewLayout(node, false);

  CGPoint absoluteTopLeft = {
    absolutePosition.x + CSSNodeLayoutGetLeft(node),
    absolutePosition.y + CSSNodeLayoutGetTop(node)
  };

  CGPoint absoluteBottomRight = {
    absolutePosition.x + CSSNodeLayoutGetLeft(node) + CSSNodeLayoutGetWidth(node),
    absolutePosition.y + CSSNodeLayoutGetTop(node) + CSSNodeLayoutGetHeight(node)
  };

  CGRect frame = {{
    RCTRoundPixelValue(CSSNodeLayoutGetLeft(node)),
    RCTRoundPixelValue(CSSNodeLayoutGetTop(node)),
  }, {
    RCTRoundPixelValue(absoluteBottomRight.x - absoluteTopLeft.x),
    RCTRoundPixelValue(absoluteBottomRight.y - absoluteTopLeft.y)
  }};

  if (!CGRectEqualToRect(frame, _frame)) {
    _frame = frame;
    [viewsWithNewFrame addObject:self];
  }

  absolutePosition.x += CSSNodeLayoutGetLeft(node);
  absolutePosition.y += CSSNodeLayoutGetTop(node);

  [self applyLayoutToChildren:node viewsWithNewFrame:viewsWithNewFrame absolutePosition:absolutePosition];
}

- (void)applyLayoutToChildren:(CSSNodeRef)node
            viewsWithNewFrame:(NSMutableSet<RCTShadowView *> *)viewsWithNewFrame
             absolutePosition:(CGPoint)absolutePosition
{
  for (unsigned int i = 0; i < CSSNodeChildCount(node); ++i) {
    RCTShadowView *child = (RCTShadowView *)_reactSubviews[i];
    [child applyLayoutNode:CSSNodeGetChild(node, i)
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
    CSSNodeStyleSetPositionType(_cssNode, CSSPositionTypeAbsolute);
    CSSNodeStyleSetWidth(_cssNode, frame.size.width);
    CSSNodeStyleSetHeight(_cssNode, frame.size.height);
    CSSNodeStyleSetPosition(_cssNode, CSSEdgeLeft, frame.origin.x);
    CSSNodeStyleSetPosition(_cssNode, CSSEdgeTop, frame.origin.y);
  }

  CSSNodeCalculateLayout(_cssNode, frame.size.width, frame.size.height, CSSDirectionInherit);
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

    _frame = CGRectMake(0, 0, CSSUndefined, CSSUndefined);

    for (unsigned int ii = 0; ii < META_PROP_COUNT; ii++) {
      _paddingMetaProps[ii] = CSSUndefined;
      _marginMetaProps[ii] = CSSUndefined;
      _borderMetaProps[ii] = CSSUndefined;
    }

    _newView = YES;
    _propagationLifecycle = RCTUpdateLifecycleUninitialized;
    _textLifecycle = RCTUpdateLifecycleUninitialized;

    _reactSubviews = [NSMutableArray array];

    _cssNode = CSSNodeNew();
    CSSNodeSetContext(_cssNode, (__bridge void *)self);
    CSSNodeSetPrintFunc(_cssNode, RCTPrint);
  }
  return self;
}

- (BOOL)isReactRootView
{
  return RCTIsReactRootView(self.reactTag);
}

- (void)dealloc
{
  CSSNodeFree(_cssNode);
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
    CSSNodeInsertChild(_cssNode, subview.cssNode, (uint32_t)atIndex);
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
    CSSNodeRemoveChild(_cssNode, subview.cssNode);
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
- (void)setMargin##prop:(CGFloat)value            \
{                                                 \
  _marginMetaProps[META_PROP_##metaProp] = value; \
  _recomputeMargin = YES;                         \
}                                                 \
- (CGFloat)margin##prop                           \
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
- (void)setPadding##prop:(CGFloat)value            \
{                                                  \
  _paddingMetaProps[META_PROP_##metaProp] = value; \
  _recomputePadding = YES;                         \
}                                                  \
- (CGFloat)padding##prop                           \
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
  if (CSSNodeLayoutGetDirection(_cssNode) == CSSDirectionRTL) {
    return (UIEdgeInsets){
      CSSNodeStyleGetPadding(_cssNode, CSSEdgeTop),
      !CSSValueIsUndefined(CSSNodeStyleGetPadding(_cssNode, CSSEdgeEnd)) ?
      CSSNodeStyleGetPadding(_cssNode, CSSEdgeEnd) :
      CSSNodeStyleGetPadding(_cssNode, CSSEdgeLeft),
      CSSNodeStyleGetPadding(_cssNode, CSSEdgeBottom),
      !CSSValueIsUndefined(CSSNodeStyleGetPadding(_cssNode, CSSEdgeStart)) ?
      CSSNodeStyleGetPadding(_cssNode, CSSEdgeStart) :
      CSSNodeStyleGetPadding(_cssNode, CSSEdgeRight)
    };
  } else {
    return (UIEdgeInsets){
      CSSNodeStyleGetPadding(_cssNode, CSSEdgeTop),
      !CSSValueIsUndefined(CSSNodeStyleGetPadding(_cssNode, CSSEdgeStart)) ?
      CSSNodeStyleGetPadding(_cssNode, CSSEdgeStart) :
      CSSNodeStyleGetPadding(_cssNode, CSSEdgeLeft),
      CSSNodeStyleGetPadding(_cssNode, CSSEdgeBottom),
      !CSSValueIsUndefined(CSSNodeStyleGetPadding(_cssNode, CSSEdgeEnd)) ?
      CSSNodeStyleGetPadding(_cssNode, CSSEdgeEnd) :
      CSSNodeStyleGetPadding(_cssNode, CSSEdgeRight)
    };
  }
}

// Border

#define RCT_BORDER_PROPERTY(prop, metaProp)            \
- (void)setBorder##prop##Width:(CGFloat)value          \
{                                                      \
  _borderMetaProps[META_PROP_##metaProp] = value;      \
  _recomputeBorder = YES;                              \
}                                                      \
- (CGFloat)border##prop##Width                         \
{                                                      \
  return _borderMetaProps[META_PROP_##metaProp];       \
}

RCT_BORDER_PROPERTY(, ALL)
RCT_BORDER_PROPERTY(Top, TOP)
RCT_BORDER_PROPERTY(Left, LEFT)
RCT_BORDER_PROPERTY(Bottom, BOTTOM)
RCT_BORDER_PROPERTY(Right, RIGHT)

// Dimensions


#define RCT_DIMENSION_PROPERTY(setProp, getProp, cssProp)           \
- (void)set##setProp:(CGFloat)value                                 \
{                                                                   \
  CSSNodeStyleSet##cssProp(_cssNode, value);                        \
  [self dirtyText];                                                 \
}                                                                   \
- (CGFloat)getProp                                                  \
{                                                                   \
  return CSSNodeStyleGet##cssProp(_cssNode);                        \
}

RCT_DIMENSION_PROPERTY(Width, width, Width)
RCT_DIMENSION_PROPERTY(Height, height, Height)
RCT_DIMENSION_PROPERTY(MinWidth, minWidth, MinWidth)
RCT_DIMENSION_PROPERTY(MinHeight, minHeight, MinHeight)
RCT_DIMENSION_PROPERTY(MaxWidth, maxWidth, MaxWidth)
RCT_DIMENSION_PROPERTY(MaxHeight, maxHeight, MaxHeight)

// Position

#define RCT_POSITION_PROPERTY(setProp, getProp, edge)               \
- (void)set##setProp:(CGFloat)value                                 \
{                                                                   \
  CSSNodeStyleSetPosition(_cssNode, edge, value);                   \
  [self dirtyText];                                                 \
}                                                                   \
- (CGFloat)getProp                                                  \
{                                                                   \
  return CSSNodeStyleGetPosition(_cssNode, edge);                   \
}

RCT_POSITION_PROPERTY(Top, top, CSSEdgeTop)
RCT_POSITION_PROPERTY(Right, right, CSSEdgeEnd)
RCT_POSITION_PROPERTY(Bottom, bottom, CSSEdgeBottom)
RCT_POSITION_PROPERTY(Left, left, CSSEdgeStart)

- (void)setFrame:(CGRect)frame
{
  if (!CGRectEqualToRect(frame, _frame)) {
    _frame = frame;
    CSSNodeStyleSetPosition(_cssNode, CSSEdgeLeft, CGRectGetMinX(frame));
    CSSNodeStyleSetPosition(_cssNode, CSSEdgeTop, CGRectGetMinY(frame));
    CSSNodeStyleSetWidth(_cssNode, CGRectGetWidth(frame));
    CSSNodeStyleSetHeight(_cssNode, CGRectGetHeight(frame));
  }
}

static inline void RCTAssignSuggestedDimension(CSSNodeRef cssNode, CSSDimension dimension, CGFloat amount)
{
  if (amount != UIViewNoIntrinsicMetric) {
    switch (dimension) {
      case CSSDimensionWidth:
        if (isnan(CSSNodeStyleGetWidth(cssNode))) {
          CSSNodeStyleSetWidth(cssNode, amount);
        }
        break;
      case CSSDimensionHeight:
        if (isnan(CSSNodeStyleGetHeight(cssNode))) {
          CSSNodeStyleSetHeight(cssNode, amount);
        }
        break;
    }
  }
}

- (void)setIntrinsicContentSize:(CGSize)size
{
  if (CSSNodeStyleGetFlex(_cssNode) == 0) {
    RCTAssignSuggestedDimension(_cssNode, CSSDimensionHeight, size.height);
    RCTAssignSuggestedDimension(_cssNode, CSSDimensionWidth, size.width);
  }
}

- (void)setTopLeft:(CGPoint)topLeft
{
  CSSNodeStyleSetPosition(_cssNode, CSSEdgeLeft, topLeft.x);
  CSSNodeStyleSetPosition(_cssNode, CSSEdgeTop, topLeft.y);
}

- (void)setSize:(CGSize)size
{
  CSSNodeStyleSetWidth(_cssNode, size.width);
  CSSNodeStyleSetHeight(_cssNode, size.height);
}

// Flex

#define RCT_STYLE_PROPERTY(setProp, getProp, cssProp, type) \
- (void)set##setProp:(type)value                            \
{                                                           \
  CSSNodeStyleSet##cssProp(_cssNode, value);                \
}                                                           \
- (type)getProp                                             \
{                                                           \
  return CSSNodeStyleGet##cssProp(_cssNode);                \
}

RCT_STYLE_PROPERTY(Flex, flex, Flex, CGFloat)
RCT_STYLE_PROPERTY(FlexGrow, flexGrow, FlexGrow, CGFloat)
RCT_STYLE_PROPERTY(FlexShrink, flexShrink, FlexShrink, CGFloat)
RCT_STYLE_PROPERTY(FlexBasis, flexBasis, FlexBasis, CGFloat)
RCT_STYLE_PROPERTY(FlexDirection, flexDirection, FlexDirection, CSSFlexDirection)
RCT_STYLE_PROPERTY(JustifyContent, justifyContent, JustifyContent, CSSJustify)
RCT_STYLE_PROPERTY(AlignSelf, alignSelf, AlignSelf, CSSAlign)
RCT_STYLE_PROPERTY(AlignItems, alignItems, AlignItems, CSSAlign)
RCT_STYLE_PROPERTY(Position, position, PositionType, CSSPositionType)
RCT_STYLE_PROPERTY(FlexWrap, flexWrap, FlexWrap, CSSWrapType)
RCT_STYLE_PROPERTY(Overflow, overflow, Overflow, CSSOverflow)

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
