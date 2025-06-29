/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTMultilineTextInputView.h>

#ifndef RCT_FIT_RM_OLD_COMPONENT

#import <React/RCTUtils.h>

#import <React/RCTUITextView.h>

@implementation RCTMultilineTextInputView {
  RCTUITextView *_backedTextInputView;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super initWithBridge:bridge]) {
    _backedTextInputView = [[RCTUITextView alloc] initWithFrame:self.bounds];
    _backedTextInputView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    _backedTextInputView.textInputDelegate = self;

    [self addSubview:_backedTextInputView];
  }

  return self;
}

- (id<RCTBackedTextInputViewProtocol>)backedTextInputView
{
  return _backedTextInputView;
}

#pragma mark - UIScrollViewDelegate

- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
  RCTDirectEventBlock onScroll = self.onScroll;

  if (onScroll) {
    CGPoint contentOffset = scrollView.contentOffset;
    CGSize contentSize = scrollView.contentSize;
    CGSize size = scrollView.bounds.size;
    UIEdgeInsets contentInset = scrollView.contentInset;

    onScroll(@{
      @"contentOffset" : @{@"x" : @(contentOffset.x), @"y" : @(contentOffset.y)},
      @"contentInset" : @{
        @"top" : @(contentInset.top),
        @"left" : @(contentInset.left),
        @"bottom" : @(contentInset.bottom),
        @"right" : @(contentInset.right)
      },
      @"contentSize" : @{@"width" : @(contentSize.width), @"height" : @(contentSize.height)},
      @"layoutMeasurement" : @{@"width" : @(size.width), @"height" : @(size.height)},
      @"zoomScale" : @(scrollView.zoomScale ?: 1),
    });
  }
}

@end

#endif // RCT_FIT_RM_OLD_COMPONENT
