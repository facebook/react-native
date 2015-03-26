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
#import "RCTSparseArray.h"
#import "RCTUtils.h"

typedef void (^RCTActionBlock)(RCTShadowView *shadowViewSelf, id value);
typedef void (^RCTResetActionBlock)(RCTShadowView *shadowViewSelf);

const NSString *const RCTBackgroundColorProp = @"backgroundColor";

typedef enum {
  META_PROP_LEFT,
  META_PROP_TOP,
  META_PROP_RIGHT,
  META_PROP_BOTTOM,
  META_PROP_HORIZONTAL,
  META_PROP_VERTICAL,
  META_PROP_ALL,
  META_PROP_COUNT,
} meta_prop_t;

@implementation RCTShadowView
{
  RCTUpdateLifecycle _propagationLifecycle;
  RCTUpdateLifecycle _textLifecycle;
  NSDictionary *_lastParentProperties;
  NSMutableArray *_reactSubviews;
  BOOL _recomputePadding;
  BOOL _recomputeMargin;
  float _paddingMetaProps[META_PROP_COUNT];
  float _marginMetaProps[META_PROP_COUNT];
}

@synthesize reactTag = _reactTag;

// css_node api

static void RCTPrint(void *context)
{
  RCTShadowView *shadowView = (__bridge RCTShadowView *)context;
  printf("%s(%zd), ", shadowView.viewName.UTF8String, shadowView.reactTag.integerValue);
}

static css_node_t *RCTGetChild(void *context, int i)
{
  RCTShadowView *shadowView = (__bridge RCTShadowView *)context;
  RCTShadowView *child = [shadowView reactSubviews][i];
  return child->_cssNode;
}

static bool RCTIsDirty(void *context)
{
  RCTShadowView *shadowView = (__bridge RCTShadowView *)context;
  return [shadowView isLayoutDirty];
}

// Enforces precedence rules, e.g. marginLeft > marginHorizontal > margin.
static void RCTProcessMetaProps(const float metaProps[META_PROP_COUNT], float style[CSS_POSITION_COUNT]) {
  style[CSS_LEFT] = !isUndefined(metaProps[META_PROP_LEFT]) ? metaProps[META_PROP_LEFT]
  : !isUndefined(metaProps[META_PROP_HORIZONTAL]) ? metaProps[META_PROP_HORIZONTAL]
  : !isUndefined(metaProps[META_PROP_ALL]) ? metaProps[META_PROP_ALL]
  : 0;
  style[CSS_RIGHT] = !isUndefined(metaProps[META_PROP_RIGHT]) ? metaProps[META_PROP_RIGHT]
  : !isUndefined(metaProps[META_PROP_HORIZONTAL]) ? metaProps[META_PROP_HORIZONTAL]
  : !isUndefined(metaProps[META_PROP_ALL]) ? metaProps[META_PROP_ALL]
  : 0;
  style[CSS_TOP] = !isUndefined(metaProps[META_PROP_TOP]) ? metaProps[META_PROP_TOP]
  : !isUndefined(metaProps[META_PROP_VERTICAL]) ? metaProps[META_PROP_VERTICAL]
  : !isUndefined(metaProps[META_PROP_ALL]) ? metaProps[META_PROP_ALL]
  : 0;
  style[CSS_BOTTOM] = !isUndefined(metaProps[META_PROP_BOTTOM]) ? metaProps[META_PROP_BOTTOM]
  : !isUndefined(metaProps[META_PROP_VERTICAL]) ? metaProps[META_PROP_VERTICAL]
  : !isUndefined(metaProps[META_PROP_ALL]) ? metaProps[META_PROP_ALL]
  : 0;
}

- (void)fillCSSNode:(css_node_t *)node
{
  node->children_count = (int)_reactSubviews.count;
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

- (void)applyLayoutNode:(css_node_t *)node viewsWithNewFrame:(NSMutableSet *)viewsWithNewFrame absolutePosition:(CGPoint)absolutePosition
{
  if (!node->layout.should_update) {
    return;
  }
  node->layout.should_update = false;
  _layoutLifecycle = RCTUpdateLifecycleComputed;

  CGPoint absoluteTopLeft = {
    RCTRoundPixelValue(absolutePosition.x + node->layout.position[CSS_LEFT]),
    RCTRoundPixelValue(absolutePosition.y + node->layout.position[CSS_TOP])
  };

  CGPoint absoluteBottomRight = {
    RCTRoundPixelValue(absolutePosition.x + node->layout.position[CSS_LEFT] + node->layout.dimensions[CSS_WIDTH]),
    RCTRoundPixelValue(absolutePosition.y + node->layout.position[CSS_TOP] + node->layout.dimensions[CSS_HEIGHT])
  };

  CGRect frame = {{
    RCTRoundPixelValue(node->layout.position[CSS_LEFT]),
    RCTRoundPixelValue(node->layout.position[CSS_TOP]),
  }, {
    RCTRoundPixelValue(absoluteBottomRight.x - absoluteTopLeft.x),
    RCTRoundPixelValue(absoluteBottomRight.y - absoluteTopLeft.y)
  }};

  if (!CGRectEqualToRect(frame, _frame)) {
    _frame = frame;
    [viewsWithNewFrame addObject:self];
  }

  absolutePosition.x += node->layout.position[CSS_LEFT];
  absolutePosition.y += node->layout.position[CSS_TOP];

  node->layout.dimensions[CSS_WIDTH] = CSS_UNDEFINED;
  node->layout.dimensions[CSS_HEIGHT] = CSS_UNDEFINED;
  node->layout.position[CSS_LEFT] = 0;
  node->layout.position[CSS_TOP] = 0;

  for (int i = 0; i < node->children_count; ++i) {
    RCTShadowView *child = (RCTShadowView *)_reactSubviews[i];
    [child applyLayoutNode:node->get_child(node->context, i) viewsWithNewFrame:viewsWithNewFrame absolutePosition:absolutePosition];
  }
}

- (NSDictionary *)processBackgroundColor:(NSMutableSet *)applierBlocks parentProperties:(NSDictionary *)parentProperties
{
  if (!_isBGColorExplicitlySet) {
    UIColor *parentBackgroundColor = parentProperties[RCTBackgroundColorProp];
    if (parentBackgroundColor && ![_backgroundColor isEqual:parentBackgroundColor]) {
      _backgroundColor = parentBackgroundColor;
      [applierBlocks addObject:^(RCTSparseArray *viewRegistry) {
        UIView *view = viewRegistry[_reactTag];
        view.backgroundColor = parentBackgroundColor;
      }];
    }
  }
  if (_isBGColorExplicitlySet) {
    // Update parent properties for children
    NSMutableDictionary *properties = [NSMutableDictionary dictionaryWithDictionary:parentProperties];
    CGFloat alpha = CGColorGetAlpha(_backgroundColor.CGColor);
    if (alpha < 1.0 && alpha > 0.0) {
      // If we see partial transparency, start propagating full transparency
      properties[RCTBackgroundColorProp] = [UIColor clearColor];
    } else {
      properties[RCTBackgroundColorProp] = _backgroundColor;
    }
    return properties;
  }
  return parentProperties;
}

- (void)collectUpdatedProperties:(NSMutableSet *)applierBlocks parentProperties:(NSDictionary *)parentProperties
{
  if (_propagationLifecycle == RCTUpdateLifecycleComputed && [parentProperties isEqualToDictionary:_lastParentProperties]) {
    return;
  }
  _propagationLifecycle = RCTUpdateLifecycleComputed;
  _lastParentProperties = parentProperties;
  NSDictionary *nextProps = [self processBackgroundColor:applierBlocks parentProperties:parentProperties];
  for (RCTShadowView *child in _reactSubviews) {
    [child collectUpdatedProperties:applierBlocks parentProperties:nextProps];
  }
}

- (void)collectRootUpdatedFrames:(NSMutableSet *)viewsWithNewFrame parentConstraint:(CGSize)parentConstraint
{
  [self fillCSSNode:_cssNode];
  layoutNode(_cssNode, CSS_UNDEFINED);
  [self applyLayoutNode:_cssNode viewsWithNewFrame:viewsWithNewFrame absolutePosition:CGPointZero];
}

- (CGRect)measureLayoutRelativeToAncestor:(RCTShadowView *)ancestor
{
  CGFloat totalOffsetTop = 0.0;
  CGFloat totalOffsetLeft = 0.0;
  CGSize size = self.frame.size;
  NSInteger depth = 30; // max depth to search
  RCTShadowView *shadowView = self;
  while (depth && shadowView && shadowView != ancestor) {
    totalOffsetTop += shadowView.frame.origin.y;
    totalOffsetLeft += shadowView.frame.origin.x;
    shadowView = shadowView->_superview;
    depth--;
  }
  if (ancestor != shadowView) {
    return CGRectNull;
  }
  return (CGRect){{totalOffsetLeft, totalOffsetTop}, size};
}

- (instancetype)init
{
  if ((self = [super init])) {

    _frame = CGRectMake(0, 0, CSS_UNDEFINED, CSS_UNDEFINED);

    for (int ii = 0; ii < META_PROP_COUNT; ii++) {
      _paddingMetaProps[ii] = CSS_UNDEFINED;
      _marginMetaProps[ii] = CSS_UNDEFINED;
    }

    _newView = YES;
    _layoutLifecycle = RCTUpdateLifecycleUninitialized;
    _propagationLifecycle = RCTUpdateLifecycleUninitialized;
    _textLifecycle = RCTUpdateLifecycleUninitialized;

    _reactSubviews = [NSMutableArray array];

    _cssNode = new_css_node();
    _cssNode->context = (__bridge void *)self;
    _cssNode->print = RCTPrint;
    _cssNode->get_child = RCTGetChild;
    _cssNode->is_dirty = RCTIsDirty;
    [self fillCSSNode:_cssNode];
  }
  return self;
}

- (BOOL)isReactRootView
{
  return RCTIsReactRootView(self.reactTag);
}

- (void)dealloc
{
  free_css_node(_cssNode);
}

- (void)dirtyLayout
{
  if (_layoutLifecycle != RCTUpdateLifecycleDirtied) {
    _layoutLifecycle = RCTUpdateLifecycleDirtied;
    [_superview dirtyLayout];
  }
}

- (BOOL)isLayoutDirty
{
  return _layoutLifecycle != RCTUpdateLifecycleComputed;
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
  _cssNode->children_count = (int)[_reactSubviews count];
  subview->_superview = self;
  [self dirtyText];
  [self dirtyLayout];
  [self dirtyPropagation];
}

- (void)removeReactSubview:(RCTShadowView *)subview
{
  [subview dirtyText];
  [subview dirtyLayout];
  [subview dirtyPropagation];
  subview->_superview = nil;
  [_reactSubviews removeObject:subview];
  _cssNode->children_count = (int)[_reactSubviews count];
}

- (NSArray *)reactSubviews
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
  return (UIEdgeInsets){
    _cssNode->style.padding[CSS_TOP],
    _cssNode->style.padding[CSS_LEFT],
    _cssNode->style.padding[CSS_BOTTOM],
    _cssNode->style.padding[CSS_RIGHT]
  };
}

// Border

#define RCT_BORDER_PROPERTY(prop, metaProp)            \
- (void)setBorder##prop##Width:(CGFloat)value          \
{                                                      \
  _cssNode->style.border[CSS_##metaProp] = value;      \
  [self dirtyLayout];                                  \
}                                                      \
- (CGFloat)border##prop##Width                         \
{                                                      \
  return _cssNode->style.border[META_PROP_##metaProp]; \
}

RCT_BORDER_PROPERTY(Top, TOP)
RCT_BORDER_PROPERTY(Left, LEFT)
RCT_BORDER_PROPERTY(Bottom, BOTTOM)
RCT_BORDER_PROPERTY(Right, RIGHT)

- (void)setBorderWidth:(CGFloat)value
{
  for (int i = 0; i < 4; i++) {
    _cssNode->style.border[i] = value;
  }
  [self dirtyLayout];
}

// Dimensions

#define RCT_DIMENSIONS_PROPERTY(setProp, getProp, cssProp) \
- (void)set##setProp:(CGFloat)value                        \
{                                                          \
  _cssNode->style.dimensions[CSS_##cssProp] = value;       \
  [self dirtyLayout];                                      \
}                                                          \
- (CGFloat)getProp                                         \
{                                                          \
  return _cssNode->style.dimensions[CSS_##cssProp];        \
}

RCT_DIMENSIONS_PROPERTY(Width, width, WIDTH)
RCT_DIMENSIONS_PROPERTY(Height, height, HEIGHT)

// Position

#define RCT_POSITION_PROPERTY(setProp, getProp, cssProp) \
- (void)set##setProp:(CGFloat)value                      \
{                                                        \
  _cssNode->style.position[CSS_##cssProp] = value;       \
  [self dirtyLayout];                                    \
}                                                        \
- (CGFloat)getProp                                       \
{                                                        \
  return _cssNode->style.position[CSS_##cssProp];        \
}

RCT_POSITION_PROPERTY(Top, top, TOP)
RCT_POSITION_PROPERTY(Right, right, RIGHT)
RCT_POSITION_PROPERTY(Bottom, bottom, BOTTOM)
RCT_POSITION_PROPERTY(Left, left, LEFT)

- (void)setFrame:(CGRect)frame
{
  _cssNode->style.position[CSS_LEFT] = CGRectGetMinX(frame);
  _cssNode->style.position[CSS_TOP] = CGRectGetMinY(frame);
  _cssNode->style.dimensions[CSS_WIDTH] = CGRectGetWidth(frame);
  _cssNode->style.dimensions[CSS_HEIGHT] = CGRectGetHeight(frame);
  [self dirtyLayout];
}

- (void)setTopLeft:(CGPoint)topLeft
{
  _cssNode->style.position[CSS_LEFT] = topLeft.x;
  _cssNode->style.position[CSS_TOP] = topLeft.y;
  [self dirtyLayout];
}

- (void)setSize:(CGSize)size
{
  _cssNode->style.dimensions[CSS_WIDTH] = size.width;
  _cssNode->style.dimensions[CSS_HEIGHT] = size.height;
  [self dirtyLayout];
}

// Flex

#define RCT_STYLE_PROPERTY(setProp, getProp, cssProp, type) \
- (void)set##setProp:(type)value                            \
{                                                           \
  _cssNode->style.cssProp = value;                          \
  [self dirtyLayout];                                       \
}                                                           \
- (type)getProp                                             \
{                                                           \
  return _cssNode->style.cssProp;                           \
}

RCT_STYLE_PROPERTY(Flex, flex, flex, CGFloat)
RCT_STYLE_PROPERTY(FlexDirection, flexDirection, flex_direction, css_flex_direction_t)
RCT_STYLE_PROPERTY(JustifyContent, justifyContent, justify_content, css_justify_t)
RCT_STYLE_PROPERTY(AlignSelf, alignSelf, align_self, css_align_t)
RCT_STYLE_PROPERTY(AlignItems, alignItems, align_items, css_align_t)
RCT_STYLE_PROPERTY(PositionType, positionType, position_type, css_position_type_t)
RCT_STYLE_PROPERTY(FlexWrap, flexWrap, flex_wrap, css_wrap_type_t)

- (void)setBackgroundColor:(UIColor *)color
{
  _backgroundColor = color;
  [self dirtyPropagation];
}

- (void)updateLayout
{
  if (_recomputePadding) {
    RCTProcessMetaProps(_paddingMetaProps, _cssNode->style.padding);
  }
  if (_recomputeMargin) {
    RCTProcessMetaProps(_marginMetaProps, _cssNode->style.margin);
  }
  if (_recomputePadding || _recomputeMargin) {
    [self dirtyLayout];
  }
  [self fillCSSNode:_cssNode];
  _recomputeMargin = NO;
  _recomputePadding = NO;
}

@end
