/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTRefreshControl.h"

#import "RCTUtils.h"

@implementation RCTRefreshControl {
  BOOL _isInitialRender;
  BOOL _currentRefreshingState;
  BOOL _refreshingProgrammatically;
  NSString *_title;
  UIColor *_titleColor;
}

- (instancetype)init
{
  if ((self = [super init])) {
    [self addTarget:self action:@selector(refreshControlValueChanged) forControlEvents:UIControlEventValueChanged];
    _isInitialRender = true;
    _currentRefreshingState = false;
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

- (void)layoutSubviews
{
  [super layoutSubviews];

  // Fix for bug #7976
  // TODO: Remove when updating to use iOS 10 refreshControl UIScrollView prop.
  if (self.backgroundColor == nil) {
    self.backgroundColor = [UIColor clearColor];
  }

  // If the control is refreshing when mounted we need to call
  // beginRefreshing in layoutSubview or it doesn't work.
  if (_currentRefreshingState && _isInitialRender) {
    [self beginRefreshingProgrammatically];
  }
  _isInitialRender = false;
}

- (void)beginRefreshingProgrammatically
{
  _refreshingProgrammatically = YES;
  // When using begin refreshing we need to adjust the ScrollView content offset manually.
  UIScrollView *scrollView = (UIScrollView *)self.superview;
  CGPoint offset = {scrollView.contentOffset.x, scrollView.contentOffset.y - self.frame.size.height};

  // `beginRefreshing` must be called after the animation is done. This is why it is impossible
  // to use `setContentOffset` with `animated:YES`.
  [UIView animateWithDuration:0.25
                          delay:0
                        options:UIViewAnimationOptionBeginFromCurrentState
                     animations:^(void) {
                       [scrollView setContentOffset:offset];
                     } completion:^(__unused BOOL finished) {
                       [super beginRefreshing];
                     }];
}

- (void)endRefreshingProgrammatically
{
  // The contentOffset of the scrollview MUST be greater than 0 before calling
  // endRefreshing otherwise the next pull to refresh will not work properly.
  UIScrollView *scrollView = (UIScrollView *)self.superview;
  if (_refreshingProgrammatically && scrollView.contentOffset.y < 0) {
    CGPoint offset = {scrollView.contentOffset.x, 0};
    [UIView animateWithDuration:0.25
                          delay:0
                        options:UIViewAnimationOptionBeginFromCurrentState
                     animations:^(void) {
                       [scrollView setContentOffset:offset];
                     } completion:^(__unused BOOL finished) {
                       [super endRefreshing];
                     }];
  } else {
    [super endRefreshing];
  }
}

- (NSString *)title
{
  return _title;
}

- (void)setTitle:(NSString *)title
{
  _title = title;
  [self _updateTitle];
}

- (void)setTitleColor:(UIColor *)color
{
  _titleColor = color;
  [self _updateTitle];
}

- (void)_updateTitle
{
  if (!_title) {
    return;
  }

  NSMutableDictionary *attributes = [NSMutableDictionary dictionary];
  if (_titleColor) {
    attributes[NSForegroundColorAttributeName] = _titleColor;
  }

  self.attributedTitle = [[NSAttributedString alloc] initWithString:_title attributes:attributes];
}

- (void)setRefreshing:(BOOL)refreshing
{
  if (_currentRefreshingState != refreshing) {
    _currentRefreshingState = refreshing;

    if (refreshing) {
      if (!_isInitialRender) {
        [self beginRefreshingProgrammatically];
      }
    } else {
      [self endRefreshingProgrammatically];
    }
  }
}

- (void)refreshControlValueChanged
{
  _currentRefreshingState = super.refreshing;
  _refreshingProgrammatically = NO;

  if (_onRefresh) {
    _onRefresh(nil);
  }
}

@end
