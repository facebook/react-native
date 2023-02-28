/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTWrapperView.h"

#import <React/RCTBridge.h>
#import <React/RCTUIManager.h>

@implementation RCTWrapperView {
  __weak RCTBridge *_bridge;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super initWithFrame:CGRectZero]) {
    _bridge = bridge;
    __weak __typeof(self) weakSelf = self;

    _measureBlock = ^(CGSize minimumSize, CGSize maximumSize) {
      __typeof(self) strongSelf = weakSelf;

      if (!strongSelf) {
        return maximumSize;
      }

      CGSize size = [strongSelf sizeThatFits:maximumSize];

      return CGSizeMake(MAX(size.width, minimumSize.width), MAX(size.height, minimumSize.height));
    };
  }

  return self;
}

#pragma mark - `contentView`

- (nullable UIView *)contentView
{
  return self.subviews.firstObject;
}

- (void)setContentView:(UIView *)contentView
{
  while (self.subviews.firstObject) {
    [self.subviews.firstObject removeFromSuperview];
  }

  if (!contentView) {
    return;
  }

  [super addSubview:contentView];

  contentView.frame = self.bounds;
  contentView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  contentView.translatesAutoresizingMaskIntoConstraints = YES;
}

#pragma mark - Layout

- (void)setNeedsLayout
{
  [super setNeedsLayout];
  [self invalidateIntrinsicContentSize];
}

- (void)invalidateIntrinsicContentSize
{
  [super invalidateIntrinsicContentSize];

  // Setting `intrinsicContentSize` dirties the Yoga node and
  // enforce Yoga to call `measure` function (backed to `measureBlock`).
  [_bridge.uiManager setIntrinsicContentSize:self.intrinsicContentSize forView:self];
}

- (CGSize)intrinsicContentSize
{
  return [self sizeThatFits:CGSizeMake(CGFLOAT_MAX, CGFLOAT_MAX)];
}

- (CGSize)sizeThatFits:(CGSize)size
{
  UIView *contentView = self.contentView;
  if (!contentView) {
    return [super sizeThatFits:size];
  }

  return [contentView sizeThatFits:size];
}

@end
