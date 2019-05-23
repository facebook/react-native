/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTScrollViewComponentView.h"

#import <React/RCTAssert.h>

#import <react/components/scrollview/ScrollViewComponentDescriptor.h>
#import <react/components/scrollview/ScrollViewEventEmitter.h>
#import <react/components/scrollview/ScrollViewProps.h>
#import <react/components/scrollview/ScrollViewState.h>
#import <react/graphics/Geometry.h>

#import "RCTConversions.h"
#import "RCTEnhancedScrollView.h"

using namespace facebook::react;

@interface RCTScrollViewComponentView () <UIScrollViewDelegate>

@property (nonatomic, assign) CGFloat scrollEventThrottle;

@end

@implementation RCTScrollViewComponentView {
  ScrollViewShadowNode::ConcreteState::Shared _state;
  CGSize _contentSize;
}

+ (RCTScrollViewComponentView *_Nullable)findScrollViewComponentViewForView:(UIView *)view
{
  do {
    view = view.superview;
  } while (view != nil && ![view isKindOfClass:[RCTScrollViewComponentView class]]);
  return (RCTScrollViewComponentView *)view;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ScrollViewProps>();
    _props = defaultProps;

    _scrollView = [[RCTEnhancedScrollView alloc] initWithFrame:self.bounds];
    _scrollView.delaysContentTouches = NO;
    self.contentView = _scrollView;

    _containerView = [[UIView alloc] initWithFrame:CGRectZero];
    [_scrollView addSubview:_containerView];

    _scrollViewDelegateSplitter = [[RNGenericDelegateSplitter alloc] initWithDelegateUpdateBlock:^(id delegate) {
      self->_scrollView.delegate = delegate;
    }];

    [_scrollViewDelegateSplitter addDelegate:self];
  }

  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ScrollViewComponentDescriptor>();
}

- (void)updateProps:(SharedProps)props oldProps:(SharedProps)oldProps
{
  const auto &oldScrollViewProps = *std::static_pointer_cast<const ScrollViewProps>(oldProps ?: _props);
  const auto &newScrollViewProps = *std::static_pointer_cast<const ScrollViewProps>(props);

  [super updateProps:props oldProps:oldProps];

#define REMAP_PROP(reactName, localName, target)                      \
  if (oldScrollViewProps.reactName != newScrollViewProps.reactName) { \
    target.localName = newScrollViewProps.reactName;                  \
  }

#define REMAP_VIEW_PROP(reactName, localName) REMAP_PROP(reactName, localName, self)
#define MAP_VIEW_PROP(name) REMAP_VIEW_PROP(name, name)
#define REMAP_SCROLL_VIEW_PROP(reactName, localName) \
  REMAP_PROP(reactName, localName, ((RCTEnhancedScrollView *)_scrollView))
#define MAP_SCROLL_VIEW_PROP(name) REMAP_SCROLL_VIEW_PROP(name, name)

  // FIXME: Commented props are not supported yet.
  MAP_SCROLL_VIEW_PROP(alwaysBounceHorizontal);
  MAP_SCROLL_VIEW_PROP(alwaysBounceVertical);
  MAP_SCROLL_VIEW_PROP(bounces);
  MAP_SCROLL_VIEW_PROP(bouncesZoom);
  MAP_SCROLL_VIEW_PROP(canCancelContentTouches);
  MAP_SCROLL_VIEW_PROP(centerContent);
  // MAP_SCROLL_VIEW_PROP(automaticallyAdjustContentInsets);
  MAP_SCROLL_VIEW_PROP(decelerationRate);
  MAP_SCROLL_VIEW_PROP(directionalLockEnabled);
  // MAP_SCROLL_VIEW_PROP(indicatorStyle);
  // MAP_SCROLL_VIEW_PROP(keyboardDismissMode);
  MAP_SCROLL_VIEW_PROP(maximumZoomScale);
  MAP_SCROLL_VIEW_PROP(minimumZoomScale);
  MAP_SCROLL_VIEW_PROP(scrollEnabled);
  MAP_SCROLL_VIEW_PROP(pagingEnabled);
  MAP_SCROLL_VIEW_PROP(pinchGestureEnabled);
  MAP_SCROLL_VIEW_PROP(scrollsToTop);
  MAP_SCROLL_VIEW_PROP(showsHorizontalScrollIndicator);
  MAP_SCROLL_VIEW_PROP(showsVerticalScrollIndicator);
  MAP_VIEW_PROP(scrollEventThrottle);
  MAP_SCROLL_VIEW_PROP(zoomScale);
  // MAP_SCROLL_VIEW_PROP(contentInset);
  // MAP_SCROLL_VIEW_PROP(scrollIndicatorInsets);
  // MAP_SCROLL_VIEW_PROP(snapToInterval);
  // MAP_SCROLL_VIEW_PROP(snapToAlignment);
}

- (void)updateState:(State::Shared)state oldState:(State::Shared)oldState
{
  assert(std::dynamic_pointer_cast<ScrollViewShadowNode::ConcreteState const>(state));
  _state = std::static_pointer_cast<ScrollViewShadowNode::ConcreteState const>(state);

  CGSize contentSize = RCTCGSizeFromSize(_state->getData().getContentSize());

  if (CGSizeEqualToSize(_contentSize, contentSize)) {
    return;
  }

  _contentSize = contentSize;
  _containerView.frame = CGRect{CGPointZero, contentSize};
  _scrollView.contentSize = contentSize;
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [_containerView insertSubview:childComponentView atIndex:index];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  RCTAssert(childComponentView.superview == _containerView, @"Attempt to unmount improperly mounted component view.");
  [childComponentView removeFromSuperview];
}

- (ScrollViewMetrics)_scrollViewMetrics
{
  ScrollViewMetrics metrics;
  metrics.contentSize = RCTSizeFromCGSize(_scrollView.contentSize);
  metrics.contentOffset = RCTPointFromCGPoint(_scrollView.contentOffset);
  metrics.contentInset = RCTEdgeInsetsFromUIEdgeInsets(_scrollView.contentInset);
  metrics.containerSize = RCTSizeFromCGSize(_scrollView.bounds.size);
  metrics.zoomScale = _scrollView.zoomScale;
  return metrics;
}

- (void)_updateStateWithContentOffset
{
  auto contentOffset = RCTPointFromCGPoint(_scrollView.contentOffset);

  _state->updateState([contentOffset](ScrollViewShadowNode::ConcreteState::Data const &data) {
    auto newData = data;
    newData.contentOffset = contentOffset;
    return newData;
  });
}

#pragma mark - UIScrollViewDelegate

- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
  std::static_pointer_cast<const ScrollViewEventEmitter>(_eventEmitter)->onScroll([self _scrollViewMetrics]);
}

- (void)scrollViewDidZoom:(UIScrollView *)scrollView
{
  std::static_pointer_cast<const ScrollViewEventEmitter>(_eventEmitter)->onScroll([self _scrollViewMetrics]);
}

- (void)scrollViewWillBeginDragging:(UIScrollView *)scrollView
{
  std::static_pointer_cast<const ScrollViewEventEmitter>(_eventEmitter)->onScrollBeginDrag([self _scrollViewMetrics]);
}

- (void)scrollViewWillEndDragging:(UIScrollView *)scrollView
                     withVelocity:(CGPoint)velocity
              targetContentOffset:(inout CGPoint *)targetContentOffset
{
  std::static_pointer_cast<const ScrollViewEventEmitter>(_eventEmitter)->onScrollEndDrag([self _scrollViewMetrics]);
}

- (void)scrollViewWillBeginDecelerating:(UIScrollView *)scrollView
{
  std::static_pointer_cast<const ScrollViewEventEmitter>(_eventEmitter)
      ->onMomentumScrollBegin([self _scrollViewMetrics]);
}

- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView
{
  std::static_pointer_cast<const ScrollViewEventEmitter>(_eventEmitter)->onMomentumScrollEnd([self _scrollViewMetrics]);
  [self _updateStateWithContentOffset];
}

- (void)scrollViewDidEndScrollingAnimation:(UIScrollView *)scrollView
{
  std::static_pointer_cast<const ScrollViewEventEmitter>(_eventEmitter)->onMomentumScrollEnd([self _scrollViewMetrics]);
  [self _updateStateWithContentOffset];
}

- (void)scrollViewWillBeginZooming:(UIScrollView *)scrollView withView:(nullable UIView *)view
{
  std::static_pointer_cast<const ScrollViewEventEmitter>(_eventEmitter)->onScrollBeginDrag([self _scrollViewMetrics]);
}

- (void)scrollViewDidEndZooming:(UIScrollView *)scrollView withView:(nullable UIView *)view atScale:(CGFloat)scale
{
  std::static_pointer_cast<const ScrollViewEventEmitter>(_eventEmitter)->onScrollEndDrag([self _scrollViewMetrics]);
  [self _updateStateWithContentOffset];
}

@end
