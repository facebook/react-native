/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTShadowView.h"

#import "RCTConvert.h"
#import "RCTI18nUtil.h"
#import "RCTLog.h"
#import "RCTShadowView+Layout.h"
#import "RCTUtils.h"
#import "UIView+Private.h"
#import "UIView+React.h"

typedef void (^RCTActionBlock)(RCTShadowView *shadowViewSelf, id value);
typedef void (^RCTResetActionBlock)(RCTShadowView *shadowViewSelf);

typedef NS_ENUM(unsigned int, meta_prop_t) {
  META_PROP_LEFT,
  META_PROP_TOP,
  META_PROP_RIGHT,
  META_PROP_BOTTOM,
  META_PROP_START,
  META_PROP_END,
  META_PROP_HORIZONTAL,
  META_PROP_VERTICAL,
  META_PROP_ALL,
  META_PROP_COUNT,
};

@implementation RCTShadowView
{
  NSDictionary *_lastParentProperties;
  NSMutableArray<RCTShadowView *> *_reactSubviews;
  BOOL _recomputePadding;
  BOOL _recomputeMargin;
  BOOL _recomputeBorder;
  YGValue _paddingMetaProps[META_PROP_COUNT];
  YGValue _marginMetaProps[META_PROP_COUNT];
  YGValue _borderMetaProps[META_PROP_COUNT];
}

+ (YGConfigRef)yogaConfig
{
  static YGConfigRef yogaConfig;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    yogaConfig = YGConfigNew();
    YGConfigSetPointScaleFactor(yogaConfig, RCTScreenScale());
    YGConfigSetUseLegacyStretchBehaviour(yogaConfig, true);
  });
  return yogaConfig;
}

@synthesize reactTag = _reactTag;

// YogaNode API

static void RCTPrint(YGNodeRef node)
{
  RCTShadowView *shadowView = (__bridge RCTShadowView *)YGNodeGetContext(node);
  printf("%s(%lld), ", shadowView.viewName.UTF8String, (long long)shadowView.reactTag.integerValue);
}

#define RCT_SET_YGVALUE(ygvalue, setter, ...)    \
switch (ygvalue.unit) {                          \
  case YGUnitAuto:                               \
  case YGUnitUndefined:                          \
    setter(__VA_ARGS__, YGUndefined);            \
    break;                                       \
  case YGUnitPoint:                              \
    setter(__VA_ARGS__, ygvalue.value);          \
    break;                                       \
  case YGUnitPercent:                            \
    setter##Percent(__VA_ARGS__, ygvalue.value); \
    break;                                       \
}

#define RCT_SET_YGVALUE_AUTO(ygvalue, setter, ...) \
switch (ygvalue.unit) {                            \
  case YGUnitAuto:                                 \
    setter##Auto(__VA_ARGS__);                     \
    break;                                         \
  case YGUnitUndefined:                            \
    setter(__VA_ARGS__, YGUndefined);              \
    break;                                         \
  case YGUnitPoint:                                \
    setter(__VA_ARGS__, ygvalue.value);            \
    break;                                         \
  case YGUnitPercent:                              \
    setter##Percent(__VA_ARGS__, ygvalue.value);   \
    break;                                         \
}

static void RCTProcessMetaPropsPadding(const YGValue metaProps[META_PROP_COUNT], YGNodeRef node) {
  if (![[RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    RCT_SET_YGVALUE(metaProps[META_PROP_START], YGNodeStyleSetPadding, node, YGEdgeStart);
    RCT_SET_YGVALUE(metaProps[META_PROP_END], YGNodeStyleSetPadding, node, YGEdgeEnd);
    RCT_SET_YGVALUE(metaProps[META_PROP_LEFT], YGNodeStyleSetPadding, node, YGEdgeLeft);
    RCT_SET_YGVALUE(metaProps[META_PROP_RIGHT], YGNodeStyleSetPadding, node, YGEdgeRight);
  } else {
    YGValue start = metaProps[META_PROP_START].unit == YGUnitUndefined ? metaProps[META_PROP_LEFT] : metaProps[META_PROP_START];
    YGValue end = metaProps[META_PROP_END].unit == YGUnitUndefined ? metaProps[META_PROP_RIGHT] : metaProps[META_PROP_END];
    RCT_SET_YGVALUE(start, YGNodeStyleSetPadding, node, YGEdgeStart);
    RCT_SET_YGVALUE(end, YGNodeStyleSetPadding, node, YGEdgeEnd);
  }
  RCT_SET_YGVALUE(metaProps[META_PROP_TOP], YGNodeStyleSetPadding, node, YGEdgeTop);
  RCT_SET_YGVALUE(metaProps[META_PROP_BOTTOM], YGNodeStyleSetPadding, node, YGEdgeBottom);
  RCT_SET_YGVALUE(metaProps[META_PROP_HORIZONTAL], YGNodeStyleSetPadding, node, YGEdgeHorizontal);
  RCT_SET_YGVALUE(metaProps[META_PROP_VERTICAL], YGNodeStyleSetPadding, node, YGEdgeVertical);
  RCT_SET_YGVALUE(metaProps[META_PROP_ALL], YGNodeStyleSetPadding, node, YGEdgeAll);
}

static void RCTProcessMetaPropsMargin(const YGValue metaProps[META_PROP_COUNT], YGNodeRef node) {
  if (![[RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    RCT_SET_YGVALUE_AUTO(metaProps[META_PROP_START], YGNodeStyleSetMargin, node, YGEdgeStart);
    RCT_SET_YGVALUE_AUTO(metaProps[META_PROP_END], YGNodeStyleSetMargin, node, YGEdgeEnd);
    RCT_SET_YGVALUE_AUTO(metaProps[META_PROP_LEFT], YGNodeStyleSetMargin, node, YGEdgeLeft);
    RCT_SET_YGVALUE_AUTO(metaProps[META_PROP_RIGHT], YGNodeStyleSetMargin, node, YGEdgeRight);
  } else {
    YGValue start = metaProps[META_PROP_START].unit == YGUnitUndefined ? metaProps[META_PROP_LEFT] : metaProps[META_PROP_START];
    YGValue end = metaProps[META_PROP_END].unit == YGUnitUndefined ? metaProps[META_PROP_RIGHT] : metaProps[META_PROP_END];
    RCT_SET_YGVALUE_AUTO(start, YGNodeStyleSetMargin, node, YGEdgeStart);
    RCT_SET_YGVALUE_AUTO(end, YGNodeStyleSetMargin, node, YGEdgeEnd);
  }
  RCT_SET_YGVALUE_AUTO(metaProps[META_PROP_TOP], YGNodeStyleSetMargin, node, YGEdgeTop);
  RCT_SET_YGVALUE_AUTO(metaProps[META_PROP_BOTTOM], YGNodeStyleSetMargin, node, YGEdgeBottom);
  RCT_SET_YGVALUE_AUTO(metaProps[META_PROP_HORIZONTAL], YGNodeStyleSetMargin, node, YGEdgeHorizontal);
  RCT_SET_YGVALUE_AUTO(metaProps[META_PROP_VERTICAL], YGNodeStyleSetMargin, node, YGEdgeVertical);
  RCT_SET_YGVALUE_AUTO(metaProps[META_PROP_ALL], YGNodeStyleSetMargin, node, YGEdgeAll);
}

static void RCTProcessMetaPropsBorder(const YGValue metaProps[META_PROP_COUNT], YGNodeRef node) {
  if (![[RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    YGNodeStyleSetBorder(node, YGEdgeStart, metaProps[META_PROP_START].value);
    YGNodeStyleSetBorder(node, YGEdgeEnd, metaProps[META_PROP_END].value);
    YGNodeStyleSetBorder(node, YGEdgeLeft, metaProps[META_PROP_LEFT].value);
    YGNodeStyleSetBorder(node, YGEdgeRight, metaProps[META_PROP_RIGHT].value);
  } else {
    const float start = YGFloatIsUndefined(metaProps[META_PROP_START].value) ? metaProps[META_PROP_LEFT].value : metaProps[META_PROP_START].value;
    const float end = YGFloatIsUndefined(metaProps[META_PROP_END].value) ? metaProps[META_PROP_RIGHT].value : metaProps[META_PROP_END].value;
    YGNodeStyleSetBorder(node, YGEdgeStart, start);
    YGNodeStyleSetBorder(node, YGEdgeEnd, end);
  }
  YGNodeStyleSetBorder(node, YGEdgeTop, metaProps[META_PROP_TOP].value);
  YGNodeStyleSetBorder(node, YGEdgeBottom, metaProps[META_PROP_BOTTOM].value);
  YGNodeStyleSetBorder(node, YGEdgeHorizontal, metaProps[META_PROP_HORIZONTAL].value);
  YGNodeStyleSetBorder(node, YGEdgeVertical, metaProps[META_PROP_VERTICAL].value);
  YGNodeStyleSetBorder(node, YGEdgeAll, metaProps[META_PROP_ALL].value);
}

- (CGRect)measureLayoutRelativeToAncestor:(RCTShadowView *)ancestor
{
  CGPoint offset = CGPointZero;
  NSInteger depth = 30; // max depth to search
  RCTShadowView *shadowView = self;
  while (depth && shadowView && shadowView != ancestor) {
    offset.x += shadowView.layoutMetrics.frame.origin.x;
    offset.y += shadowView.layoutMetrics.frame.origin.y;
    shadowView = shadowView->_superview;
    depth--;
  }
  if (ancestor != shadowView) {
    return CGRectNull;
  }
  return (CGRect){offset, self.layoutMetrics.frame.size};
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
  if (self = [super init]) {
    for (unsigned int ii = 0; ii < META_PROP_COUNT; ii++) {
      _paddingMetaProps[ii] = YGValueUndefined;
      _marginMetaProps[ii] = YGValueUndefined;
      _borderMetaProps[ii] = YGValueUndefined;
    }

    _intrinsicContentSize = CGSizeMake(UIViewNoIntrinsicMetric, UIViewNoIntrinsicMetric);

    _newView = YES;

    _reactSubviews = [NSMutableArray array];

    _yogaNode = YGNodeNewWithConfig([[self class] yogaConfig]);
     YGNodeSetContext(_yogaNode, (__bridge void *)self);
     YGNodeSetPrintFunc(_yogaNode, RCTPrint);
  }
  return self;
}

- (BOOL)isReactRootView
{
  return RCTIsReactRootView(self.reactTag);
}

- (void)dealloc
{
  YGNodeFree(_yogaNode);
}

- (BOOL)canHaveSubviews
{
  return YES;
}

- (BOOL)isYogaLeafNode
{
  return NO;
}

- (void)insertReactSubview:(RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  RCTAssert(self.canHaveSubviews, @"Attempt to insert subview inside leaf view.");

  [_reactSubviews insertObject:subview atIndex:atIndex];
  if (![self isYogaLeafNode]) {
    YGNodeInsertChild(_yogaNode, subview.yogaNode, (uint32_t)atIndex);
  }
  subview->_superview = self;
}

- (void)removeReactSubview:(RCTShadowView *)subview
{
  subview->_superview = nil;
  [_reactSubviews removeObject:subview];
  if (![self isYogaLeafNode]) {
    YGNodeRemoveChild(_yogaNode, subview.yogaNode);
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

#pragma mark - Layout

- (void)layoutWithMinimumSize:(CGSize)minimumSize
                  maximumSize:(CGSize)maximumSize
              layoutDirection:(UIUserInterfaceLayoutDirection)layoutDirection
                layoutContext:(RCTLayoutContext)layoutContext
{
  YGNodeRef yogaNode = _yogaNode;

  CGSize oldMinimumSize = (CGSize){
    RCTCoreGraphicsFloatFromYogaValue(YGNodeStyleGetMinWidth(yogaNode), 0.0),
    RCTCoreGraphicsFloatFromYogaValue(YGNodeStyleGetMinHeight(yogaNode), 0.0)
  };

  if (!CGSizeEqualToSize(oldMinimumSize, minimumSize)) {
    YGNodeStyleSetMinWidth(yogaNode, RCTYogaFloatFromCoreGraphicsFloat(minimumSize.width));
    YGNodeStyleSetMinHeight(yogaNode, RCTYogaFloatFromCoreGraphicsFloat(minimumSize.height));
  }

  YGNodeCalculateLayout(
    yogaNode,
    RCTYogaFloatFromCoreGraphicsFloat(maximumSize.width),
    RCTYogaFloatFromCoreGraphicsFloat(maximumSize.height),
    RCTYogaLayoutDirectionFromUIKitLayoutDirection(layoutDirection)
  );

  RCTAssert(!YGNodeIsDirty(yogaNode), @"Attempt to get layout metrics from dirtied Yoga node.");

  if (!YGNodeGetHasNewLayout(yogaNode)) {
    return;
  }

  RCTLayoutMetrics layoutMetrics = RCTLayoutMetricsFromYogaNode(yogaNode);

  layoutContext.absolutePosition.x += layoutMetrics.frame.origin.x;
  layoutContext.absolutePosition.y += layoutMetrics.frame.origin.y;

  [self layoutWithMetrics:layoutMetrics
            layoutContext:layoutContext];

  [self layoutSubviewsWithContext:layoutContext];
}

- (void)layoutWithMetrics:(RCTLayoutMetrics)layoutMetrics
            layoutContext:(RCTLayoutContext)layoutContext
{
  if (!RCTLayoutMetricsEqualToLayoutMetrics(self.layoutMetrics, layoutMetrics)) {
    self.layoutMetrics = layoutMetrics;
    [layoutContext.affectedShadowViews addObject:self];
  }
}

- (void)layoutSubviewsWithContext:(RCTLayoutContext)layoutContext
{
  RCTLayoutMetrics layoutMetrics = self.layoutMetrics;

  if (layoutMetrics.displayType == RCTDisplayTypeNone) {
    return;
  }

  for (RCTShadowView *childShadowView in _reactSubviews) {
    YGNodeRef childYogaNode = childShadowView.yogaNode;

    RCTAssert(!YGNodeIsDirty(childYogaNode), @"Attempt to get layout metrics from dirtied Yoga node.");

    if (!YGNodeGetHasNewLayout(childYogaNode)) {
      continue;
    }

    RCTLayoutMetrics childLayoutMetrics = RCTLayoutMetricsFromYogaNode(childYogaNode);

    layoutContext.absolutePosition.x += childLayoutMetrics.frame.origin.x;
    layoutContext.absolutePosition.y += childLayoutMetrics.frame.origin.y;

    [childShadowView layoutWithMetrics:childLayoutMetrics
                         layoutContext:layoutContext];

    // Recursive call.
    [childShadowView layoutSubviewsWithContext:layoutContext];
  }
}

- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize
{
  YGNodeRef clonnedYogaNode = YGNodeClone(self.yogaNode);
  YGNodeRef constraintYogaNode = YGNodeNewWithConfig([[self class] yogaConfig]);

  YGNodeInsertChild(constraintYogaNode, clonnedYogaNode, 0);

  YGNodeStyleSetMinWidth(constraintYogaNode, RCTYogaFloatFromCoreGraphicsFloat(minimumSize.width));
  YGNodeStyleSetMinHeight(constraintYogaNode, RCTYogaFloatFromCoreGraphicsFloat(minimumSize.height));
  YGNodeStyleSetMaxWidth(constraintYogaNode, RCTYogaFloatFromCoreGraphicsFloat(maximumSize.width));
  YGNodeStyleSetMaxHeight(constraintYogaNode, RCTYogaFloatFromCoreGraphicsFloat(maximumSize.height));

  YGNodeCalculateLayout(
    constraintYogaNode,
    YGUndefined,
    YGUndefined,
    self.layoutMetrics.layoutDirection
  );

  CGSize measuredSize = (CGSize){
    RCTCoreGraphicsFloatFromYogaFloat(YGNodeLayoutGetWidth(constraintYogaNode)),
    RCTCoreGraphicsFloatFromYogaFloat(YGNodeLayoutGetHeight(constraintYogaNode)),
  };

  YGNodeRemoveChild(constraintYogaNode, clonnedYogaNode);
  YGNodeFree(constraintYogaNode);
  YGNodeFree(clonnedYogaNode);

  return measuredSize;
}

- (NSNumber *)reactTagAtPoint:(CGPoint)point
{
  for (RCTShadowView *shadowView in _reactSubviews) {
    if (CGRectContainsPoint(shadowView.layoutMetrics.frame, point)) {
      CGPoint relativePoint = point;
      CGPoint origin = shadowView.layoutMetrics.frame.origin;
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
  description = [[description substringToIndex:description.length - 1] stringByAppendingFormat:@"; viewName: %@; reactTag: %@; frame: %@>", self.viewName, self.reactTag, NSStringFromCGRect(self.layoutMetrics.frame)];
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
RCT_MARGIN_PROPERTY(Start, START)
RCT_MARGIN_PROPERTY(End, END)

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
RCT_PADDING_PROPERTY(Start, START)
RCT_PADDING_PROPERTY(End, END)

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
RCT_BORDER_PROPERTY(Start, START)
RCT_BORDER_PROPERTY(End, END)

// Dimensions
#define RCT_DIMENSION_PROPERTY(setProp, getProp, cssProp)           \
- (void)set##setProp:(YGValue)value                                 \
{                                                                   \
  RCT_SET_YGVALUE_AUTO(value, YGNodeStyleSet##cssProp, _yogaNode);  \
}                                                                   \
- (YGValue)getProp                                                  \
{                                                                   \
  return YGNodeStyleGet##cssProp(_yogaNode);                        \
}

#define RCT_MIN_MAX_DIMENSION_PROPERTY(setProp, getProp, cssProp)   \
- (void)set##setProp:(YGValue)value                                 \
{                                                                   \
  RCT_SET_YGVALUE(value, YGNodeStyleSet##cssProp, _yogaNode);       \
}                                                                   \
- (YGValue)getProp                                                  \
{                                                                   \
  return YGNodeStyleGet##cssProp(_yogaNode);                        \
}

RCT_DIMENSION_PROPERTY(Width, width, Width)
RCT_DIMENSION_PROPERTY(Height, height, Height)
RCT_MIN_MAX_DIMENSION_PROPERTY(MinWidth, minWidth, MinWidth)
RCT_MIN_MAX_DIMENSION_PROPERTY(MinHeight, minHeight, MinHeight)
RCT_MIN_MAX_DIMENSION_PROPERTY(MaxWidth, maxWidth, MaxWidth)
RCT_MIN_MAX_DIMENSION_PROPERTY(MaxHeight, maxHeight, MaxHeight)

// Position

#define RCT_POSITION_PROPERTY(setProp, getProp, edge)               \
- (void)set##setProp:(YGValue)value                                 \
{                                                                   \
  RCT_SET_YGVALUE(value, YGNodeStyleSetPosition, _yogaNode, edge);  \
}                                                                   \
- (YGValue)getProp                                                  \
{                                                                   \
  return YGNodeStyleGetPosition(_yogaNode, edge);                   \
}


RCT_POSITION_PROPERTY(Top, top, YGEdgeTop)
RCT_POSITION_PROPERTY(Bottom, bottom, YGEdgeBottom)
RCT_POSITION_PROPERTY(Start, start, YGEdgeStart)
RCT_POSITION_PROPERTY(End, end, YGEdgeEnd)

- (void)setLeft:(YGValue)value
{
  YGEdge edge = [[RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? YGEdgeStart : YGEdgeLeft;
  RCT_SET_YGVALUE(value, YGNodeStyleSetPosition, _yogaNode, edge);
}
- (YGValue)left
{
  YGEdge edge = [[RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? YGEdgeStart : YGEdgeLeft;
  return YGNodeStyleGetPosition(_yogaNode, edge);
}

- (void)setRight:(YGValue)value
{
  YGEdge edge = [[RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? YGEdgeEnd : YGEdgeRight;
  RCT_SET_YGVALUE(value, YGNodeStyleSetPosition, _yogaNode, edge);
}
- (YGValue)right
{
  YGEdge edge = [[RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? YGEdgeEnd : YGEdgeRight;
  return YGNodeStyleGetPosition(_yogaNode, edge);
}

// Size

- (CGSize)size
{
  YGValue width = YGNodeStyleGetWidth(_yogaNode);
  YGValue height = YGNodeStyleGetHeight(_yogaNode);

  return CGSizeMake(
    width.unit == YGUnitPoint ? width.value : NAN,
    height.unit == YGUnitPoint ? height.value : NAN
  );
}

- (void)setSize:(CGSize)size
{
  YGNodeStyleSetWidth(_yogaNode, size.width);
  YGNodeStyleSetHeight(_yogaNode, size.height);
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
    YGNodeSetMeasureFunc(_yogaNode, NULL);
  } else {
    YGNodeSetMeasureFunc(_yogaNode, RCTShadowViewMeasure);
  }

  YGNodeMarkDirty(_yogaNode);
}

// Local Data

- (void)setLocalData:(__unused NSObject *)localData
{
  // Do nothing by default.
}

// Flex

- (void)setFlexBasis:(YGValue)value
{
  RCT_SET_YGVALUE_AUTO(value, YGNodeStyleSetFlexBasis, _yogaNode);
}

- (YGValue)flexBasis
{
  return YGNodeStyleGetFlexBasis(_yogaNode);
}

#define RCT_STYLE_PROPERTY(setProp, getProp, cssProp, type) \
- (void)set##setProp:(type)value                            \
{                                                           \
  YGNodeStyleSet##cssProp(_yogaNode, value);                \
}                                                           \
- (type)getProp                                             \
{                                                           \
  return YGNodeStyleGet##cssProp(_yogaNode);                \
}

RCT_STYLE_PROPERTY(Flex, flex, Flex, float)
RCT_STYLE_PROPERTY(FlexGrow, flexGrow, FlexGrow, float)
RCT_STYLE_PROPERTY(FlexShrink, flexShrink, FlexShrink, float)
RCT_STYLE_PROPERTY(FlexDirection, flexDirection, FlexDirection, YGFlexDirection)
RCT_STYLE_PROPERTY(JustifyContent, justifyContent, JustifyContent, YGJustify)
RCT_STYLE_PROPERTY(AlignSelf, alignSelf, AlignSelf, YGAlign)
RCT_STYLE_PROPERTY(AlignItems, alignItems, AlignItems, YGAlign)
RCT_STYLE_PROPERTY(AlignContent, alignContent, AlignContent, YGAlign)
RCT_STYLE_PROPERTY(Position, position, PositionType, YGPositionType)
RCT_STYLE_PROPERTY(FlexWrap, flexWrap, FlexWrap, YGWrap)
RCT_STYLE_PROPERTY(Overflow, overflow, Overflow, YGOverflow)
RCT_STYLE_PROPERTY(Display, display, Display, YGDisplay)
RCT_STYLE_PROPERTY(Direction, direction, Direction, YGDirection)
RCT_STYLE_PROPERTY(AspectRatio, aspectRatio, AspectRatio, float)

- (void)didUpdateReactSubviews
{
  // Does nothing by default
}

- (void)didSetProps:(__unused NSArray<NSString *> *)changedProps
{
  if (_recomputePadding) {
    RCTProcessMetaPropsPadding(_paddingMetaProps, _yogaNode);
  }
  if (_recomputeMargin) {
    RCTProcessMetaPropsMargin(_marginMetaProps, _yogaNode);
  }
  if (_recomputeBorder) {
    RCTProcessMetaPropsBorder(_borderMetaProps, _yogaNode);
  }
  _recomputeMargin = NO;
  _recomputePadding = NO;
  _recomputeBorder = NO;
}

@end
