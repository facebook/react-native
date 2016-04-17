/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTRefreshControl.h"

#import "RCTUtils.h"

@implementation RCTRefreshControl {
  BOOL _initialRefreshingState;
  BOOL _isInitialRender;
  BOOL _currentRefreshingState;
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

  // If the control is refreshing when mounted we need to call
  // beginRefreshing in layoutSubview or it doesn't work.
  if (_isInitialRender && _initialRefreshingState) {
    [self beginRefreshing];
  }
  _isInitialRender = false;
}

- (void)beginRefreshing
{
  // When using begin refreshing we need to adjust the ScrollView content offset manually.
  UIScrollView *scrollView = (UIScrollView *)self.superview;
  CGPoint offset = {scrollView.contentOffset.x, scrollView.contentOffset.y - self.frame.size.height};
  // Don't animate when the prop is set initialy.
  if (_isInitialRender) {
    scrollView.contentOffset = offset;
    [super beginRefreshing];
  } else {
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
}

- (void)endRefreshing
{
  // The contentOffset of the scrollview MUST be greater than 0 before calling
  // endRefreshing otherwise the next pull to refresh will not work properly.
  UIScrollView *scrollView = (UIScrollView *)self.superview;
  if (scrollView.contentOffset.y < 0) {
    CGPoint offset = {scrollView.contentOffset.x, -scrollView.contentInset.top};
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
  return self.attributedTitle.string;
}

- (void)setTitle:(NSString *)title
{
  NSRange range = NSMakeRange(0, self.attributedTitle.length);
  NSDictionary *attrs = [self.attributedTitle attributesAtIndex:0 effectiveRange: &range];
  self.attributedTitle = [[NSAttributedString alloc] initWithString:title attributes:attrs];
}

- (void)setTitleColor:(UIColor *)color
{
  NSRange range = NSMakeRange(0, self.attributedTitle.length);
  NSDictionary *attrs = [self.attributedTitle attributesAtIndex:0 effectiveRange: &range];
  NSMutableDictionary *attrsMutable = [attrs mutableCopy];
  [attrsMutable setObject:color forKey:NSForegroundColorAttributeName];
  self.attributedTitle = [[NSAttributedString alloc] initWithString:self.attributedTitle.string attributes:attrsMutable];
}

- (void)setRefreshing:(BOOL)refreshing
{
  if (_currentRefreshingState != refreshing) {
    _currentRefreshingState = refreshing;

    if (refreshing) {
      // If it is the initial render, beginRefreshing will get called
      // in layoutSubviews.
      if (_isInitialRender) {
        _initialRefreshingState = refreshing;
      } else {
        [self beginRefreshing];
      }
    } else {
      [self endRefreshing];
    }
  }
}

- (void)refreshControlValueChanged
{
  _currentRefreshingState = super.refreshing;

  if (_onRefresh) {
    _onRefresh(nil);
  }
}

@end
