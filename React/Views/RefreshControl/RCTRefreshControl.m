/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTRefreshControl.h"
#import "RCTRefreshableProtocol.h"

#import "RCTUtils.h"

@interface RCTRefreshControl () <RCTRefreshableProtocol>
@end

@implementation RCTRefreshControl {
  BOOL _isInitialRender;
  BOOL _currentRefreshingState;
  UInt64 _currentRefreshingStateClock;
  UInt64 _currentRefreshingStateTimestamp;
  BOOL _refreshingProgrammatically;
  NSString *_title;
  UIColor *_titleColor;
  CGFloat _progressViewOffset;
}

- (instancetype)init
{
  if ((self = [super init])) {
    [self addTarget:self action:@selector(refreshControlValueChanged) forControlEvents:UIControlEventValueChanged];
    _currentRefreshingStateClock = 1;
    _currentRefreshingStateTimestamp = 0;
    _isInitialRender = true;
    _currentRefreshingState = false;
  }
  return self;
}

RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : (NSCoder *)aDecoder)

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self _applyProgressViewOffset];

  // Fix for bug #7976
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
  UInt64 beginRefreshingTimestamp = _currentRefreshingStateTimestamp;
  _refreshingProgrammatically = YES;

  // Fix for bug #24855
  [self sizeToFit];

  if (self.scrollView) {
    // When using begin refreshing we need to adjust the ScrollView content offset manually.
    UIScrollView *scrollView = (UIScrollView *)self.scrollView;

    CGPoint offset = {scrollView.contentOffset.x, scrollView.contentOffset.y - self.frame.size.height};

    // `beginRefreshing` must be called after the animation is done. This is why it is impossible
    // to use `setContentOffset` with `animated:YES`.
    [UIView animateWithDuration:0.25
        delay:0
        options:UIViewAnimationOptionBeginFromCurrentState
        animations:^(void) {
          [scrollView setContentOffset:offset];
        }
        completion:^(__unused BOOL finished) {
          if (beginRefreshingTimestamp == self->_currentRefreshingStateTimestamp) {
            [super beginRefreshing];
            [self setCurrentRefreshingState:super.refreshing];
          }
        }];
  } else if (beginRefreshingTimestamp == self->_currentRefreshingStateTimestamp) {
    [super beginRefreshing];
    [self setCurrentRefreshingState:super.refreshing];
  }
}

- (void)endRefreshingProgrammatically
{
  // The contentOffset of the scrollview MUST be greater than the contentInset before calling
  // endRefreshing otherwise the next pull to refresh will not work properly.
  UIScrollView *scrollView = self.scrollView;
  if (scrollView && _refreshingProgrammatically && scrollView.contentOffset.y < -scrollView.contentInset.top) {
    UInt64 endRefreshingTimestamp = _currentRefreshingStateTimestamp;
    CGPoint offset = {scrollView.contentOffset.x, -scrollView.contentInset.top};
    [UIView animateWithDuration:0.25
        delay:0
        options:UIViewAnimationOptionBeginFromCurrentState
        animations:^(void) {
          [scrollView setContentOffset:offset];
        }
        completion:^(__unused BOOL finished) {
          if (endRefreshingTimestamp == self->_currentRefreshingStateTimestamp) {
            [super endRefreshing];
            [self setCurrentRefreshingState:super.refreshing];
          }
        }];
  } else {
    [super endRefreshing];
  }
}

- (void)_applyProgressViewOffset
{
  // Setting the UIRefreshControl's frame breaks integration with ContentInset from the superview
  // if it is a UIScrollView. This integration happens when setting the UIScrollView's .refreshControl
  // property. For this reason, setting the frame manually should be avoided, if not needed.
  if (_progressViewOffset == 0.f) {
    return;
  }

  // progressViewOffset must be converted from the ScrollView parent's coordinate space to
  // the coordinate space of the RefreshControl. This ensures that the control respects any
  // offset in the view hierarchy, and that progressViewOffset is not inadvertently applied
  // multiple times.
  UIView *scrollView = self.superview;
  UIView *target = scrollView.superview;
  CGPoint rawOffset = CGPointMake(0, _progressViewOffset);
  CGPoint converted = [self convertPoint:rawOffset fromView:target];
  self.frame = CGRectOffset(self.frame, 0, converted.y);
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
    [self setCurrentRefreshingState:refreshing];

    if (refreshing) {
      if (!_isInitialRender) {
        [self beginRefreshingProgrammatically];
      }
    } else {
      [self endRefreshingProgrammatically];
    }
  }
}

- (void)setCurrentRefreshingState:(BOOL)refreshing
{
  _currentRefreshingState = refreshing;
  _currentRefreshingStateTimestamp = _currentRefreshingStateClock++;
}

- (void)setProgressViewOffset:(CGFloat)offset
{
  _progressViewOffset = offset;
  [self _applyProgressViewOffset];
}

- (void)refreshControlValueChanged
{
  [self setCurrentRefreshingState:super.refreshing];
  _refreshingProgrammatically = NO;

  if (_onRefresh) {
    _onRefresh(nil);
  }
}

@end
