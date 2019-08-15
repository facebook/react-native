/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTPullToRefreshViewComponentView.h"

#import <react/components/rncore/ComponentDescriptors.h>
#import <react/components/rncore/EventEmitters.h>
#import <react/components/rncore/Props.h>

#import <React/RCTConversions.h>
#import <React/RCTScrollViewComponentView.h>

using namespace facebook::react;

@implementation RCTPullToRefreshViewComponentView {
  UIRefreshControl *_refreshControl;
  RCTScrollViewComponentView *_scrollViewComponentView;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    // This view is not designed to be visible, it only serves UIViewController-like purpose managing
    // attaching and detaching of a pull-to-refresh view to a scroll view.
    // The pull-to-refresh view is not a subview of this view.
    self.hidden = YES;

    static auto const defaultProps = std::make_shared<PullToRefreshViewProps const>();
    _props = defaultProps;

    _refreshControl = [[UIRefreshControl alloc] init];
    [_refreshControl addTarget:self
                        action:@selector(handleUIControlEventValueChanged)
              forControlEvents:UIControlEventValueChanged];
  }

  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<PullToRefreshViewComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  auto const &oldConcreteProps = *std::static_pointer_cast<PullToRefreshViewProps const>(_props);
  auto const &newConcreteProps = *std::static_pointer_cast<PullToRefreshViewProps const>(props);

  if (newConcreteProps.refreshing != oldConcreteProps.refreshing) {
    if (newConcreteProps.refreshing) {
      [_refreshControl beginRefreshing];
    } else {
      [_refreshControl endRefreshing];
    }
  }

  BOOL needsUpdateTitle = NO;

  if (newConcreteProps.title != oldConcreteProps.title) {
    needsUpdateTitle = YES;
  }

  if (newConcreteProps.titleColor != oldConcreteProps.titleColor) {
    needsUpdateTitle = YES;
  }

  if (needsUpdateTitle) {
    [self _updateTitle];
  }

  [super updateProps:props oldProps:oldProps];
}

#pragma mark -

- (void)handleUIControlEventValueChanged
{
  std::static_pointer_cast<PullToRefreshViewEventEmitter const>(_eventEmitter)->onRefresh({});
}

- (void)_updateTitle
{
  auto const &concreteProps = *std::static_pointer_cast<PullToRefreshViewProps const>(_props);

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

- (void)didMoveToWindow
{
  if (self.window) {
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

  _scrollViewComponentView.scrollView.refreshControl = _refreshControl;
}

- (void)_detach
{
  if (!_scrollViewComponentView) {
    return;
  }

  // iOS requires to end refreshing before unmounting.
  [_refreshControl endRefreshing];

  _scrollViewComponentView.scrollView.refreshControl = nil;
  _scrollViewComponentView = nil;
}

@end
