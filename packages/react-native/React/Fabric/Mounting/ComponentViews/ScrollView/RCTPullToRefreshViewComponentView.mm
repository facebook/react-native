/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTPullToRefreshViewComponentView.h"

#import <react/renderer/components/rncore/ComponentDescriptors.h>
#import <react/renderer/components/rncore/EventEmitters.h>
#import <react/renderer/components/rncore/Props.h>
#import <react/renderer/components/rncore/RCTComponentViewHelpers.h>

#import <React/RCTConversions.h>
#import <React/RCTRefreshableProtocol.h>
#import <React/RCTScrollViewComponentView.h>

#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

@interface RCTPullToRefreshViewComponentView () <RCTPullToRefreshViewViewProtocol, RCTRefreshableProtocol>
@end

@implementation RCTPullToRefreshViewComponentView {
  BOOL _isBeforeInitialLayout;
  UIRefreshControl *_refreshControl;
  RCTScrollViewComponentView *__weak _scrollViewComponentView;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    // This view is not designed to be visible, it only serves UIViewController-like purpose managing
    // attaching and detaching of a pull-to-refresh view to a scroll view.
    // The pull-to-refresh view is not a subview of this view.
    self.hidden = YES;

    _isBeforeInitialLayout = YES;
    [self _initializeUIRefreshControl];
  }

  return self;
}

- (void)_initializeUIRefreshControl
{
  _refreshControl = [UIRefreshControl new];
  [_refreshControl addTarget:self
                      action:@selector(handleUIControlEventValueChanged)
            forControlEvents:UIControlEventValueChanged];
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<PullToRefreshViewComponentDescriptor>();
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _scrollViewComponentView = nil;
  _props = nil;
  _isBeforeInitialLayout = YES;
  [self _initializeUIRefreshControl];
}

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
  // Prop updates are ignored by _refreshControl until after the initial layout, so just store them in _props until then
  if (_isBeforeInitialLayout) {
    _props = std::static_pointer_cast<const BaseViewProps>(props);
    return;
  }

  const auto &oldConcreteProps = static_cast<const PullToRefreshViewProps &>(*oldProps);
  const auto &newConcreteProps = static_cast<const PullToRefreshViewProps &>(*props);

  if (newConcreteProps.tintColor != oldConcreteProps.tintColor) {
    _refreshControl.tintColor = RCTUIColorFromSharedColor(newConcreteProps.tintColor);
  }

  if (newConcreteProps.progressViewOffset != oldConcreteProps.progressViewOffset) {
    [self _updateProgressViewOffset:newConcreteProps.progressViewOffset];
  }

  BOOL needsUpdateTitle = NO;

  if (newConcreteProps.title != oldConcreteProps.title) {
    needsUpdateTitle = YES;
  }

  if (newConcreteProps.titleColor != oldConcreteProps.titleColor) {
    needsUpdateTitle = YES;
  }

  [super updateProps:props oldProps:oldProps];

  if (needsUpdateTitle) {
    [self _updateTitle];
  }

  // All prop updates must happen above the call to begin refreshing, or else _refreshControl will ignore the updates
  if (newConcreteProps.refreshing != oldConcreteProps.refreshing) {
    if (newConcreteProps.refreshing) {
      [self beginRefreshingProgrammatically];
    } else {
      [_refreshControl endRefreshing];
    }
  }
}

#pragma mark -

- (void)handleUIControlEventValueChanged
{
  static_cast<const PullToRefreshViewEventEmitter &>(*_eventEmitter).onRefresh({});
}

- (void)_updateProgressViewOffset:(Float)progressViewOffset
{
  _refreshControl.bounds = CGRectMake(
      _refreshControl.bounds.origin.x,
      -progressViewOffset,
      _refreshControl.bounds.size.width,
      _refreshControl.bounds.size.height);
}

- (void)_updateTitle
{
  const auto &concreteProps = static_cast<const PullToRefreshViewProps &>(*_props);

  if (concreteProps.title.empty()) {
    _refreshControl.attributedTitle = nil;
    return;
  }

  NSMutableDictionary *attributes = [NSMutableDictionary dictionary];
  if (concreteProps.titleColor) {
    attributes[NSForegroundColorAttributeName] = RCTUIColorFromSharedColor(concreteProps.titleColor);
  }

  _refreshControl.attributedTitle =
      [[NSAttributedString alloc] initWithString:RCTNSStringFromString(concreteProps.title) attributes:attributes];
}

#pragma mark - Attaching & Detaching

- (void)layoutSubviews
{
  [super layoutSubviews];

  // Attempts to begin refreshing before the initial layout are ignored by _refreshControl. So if the control is
  // refreshing when mounted, we need to call beginRefreshing in layoutSubviews or it won't work.
  if (_isBeforeInitialLayout) {
    _isBeforeInitialLayout = NO;

    [self updateProps:_props oldProps:PullToRefreshViewShadowNode::defaultSharedProps()];
  }
}

- (void)didMoveToSuperview
{
  [super didMoveToSuperview];
  if (self.superview) {
    [self _attach];
  } else {
    [self _detach];
  }
}

- (void)_attach
{
  if (_scrollViewComponentView) {
    [self _detach];
  }

  _scrollViewComponentView = [RCTScrollViewComponentView findScrollViewComponentViewForView:self];
  if (!_scrollViewComponentView) {
    return;
  }

  if (@available(macCatalyst 13.1, *)) {
    _scrollViewComponentView.scrollView.refreshControl = _refreshControl;

    // This ensures that layoutSubviews is called. Without this, recycled instances won't refresh on mount
    [self setNeedsLayout];
  }
}

- (void)_detach
{
  if (!_scrollViewComponentView) {
    return;
  }

  // iOS requires to end refreshing before unmounting.
  [_refreshControl endRefreshing];

  if (@available(macCatalyst 13.1, *)) {
    _scrollViewComponentView.scrollView.refreshControl = nil;
  }
  _scrollViewComponentView = nil;
}

- (void)beginRefreshingProgrammatically
{
  if (!_scrollViewComponentView) {
    return;
  }

  // When refreshing programmatically (i.e. without pulling down), we must explicitly adjust the ScrollView content
  // offset, or else the _refreshControl won't be visible
  UIScrollView *scrollView = _scrollViewComponentView.scrollView;
  CGPoint offset = {scrollView.contentOffset.x, scrollView.contentOffset.y - _refreshControl.frame.size.height};
  [scrollView setContentOffset:offset];

  [_refreshControl beginRefreshing];
}

#pragma mark - Native commands

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
  RCTPullToRefreshViewHandleCommand(self, commandName, args);
}

- (void)setNativeRefreshing:(BOOL)refreshing
{
  if (refreshing) {
    [self beginRefreshingProgrammatically];
  } else {
    [_refreshControl endRefreshing];
  }
}

#pragma mark - RCTRefreshableProtocol

- (void)setRefreshing:(BOOL)refreshing
{
  [self setNativeRefreshing:refreshing];
}

#pragma mark -

- (NSString *)componentViewName_DO_NOT_USE_THIS_IS_BROKEN
{
  return @"RefreshControl";
}

@end

Class<RCTComponentViewProtocol> RCTPullToRefreshViewCls(void)
{
  return RCTPullToRefreshViewComponentView.class;
}
