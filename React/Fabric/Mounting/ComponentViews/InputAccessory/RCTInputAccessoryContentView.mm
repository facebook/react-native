/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTInputAccessoryContentView.h"

@implementation RCTInputAccessoryContentView {
  UIView *_safeAreaContainer;
  NSLayoutConstraint *_heightConstraint;
}

- (instancetype)init
{
  if (self = [super init]) {
    self.autoresizingMask = UIViewAutoresizingFlexibleHeight;

    _safeAreaContainer = [UIView new];
    _safeAreaContainer.translatesAutoresizingMaskIntoConstraints = NO;
    [self addSubview:_safeAreaContainer];

    _heightConstraint = [_safeAreaContainer.heightAnchor constraintEqualToConstant:0];
    _heightConstraint.active = YES;

    if (@available(iOS 11.0, *)) {
      [NSLayoutConstraint activateConstraints:@[
        [_safeAreaContainer.bottomAnchor constraintEqualToAnchor:self.safeAreaLayoutGuide.bottomAnchor],
        [_safeAreaContainer.topAnchor constraintEqualToAnchor:self.safeAreaLayoutGuide.topAnchor],
        [_safeAreaContainer.leadingAnchor constraintEqualToAnchor:self.safeAreaLayoutGuide.leadingAnchor],
        [_safeAreaContainer.trailingAnchor constraintEqualToAnchor:self.safeAreaLayoutGuide.trailingAnchor]
      ]];
    } else {
      [NSLayoutConstraint activateConstraints:@[
        [_safeAreaContainer.bottomAnchor constraintEqualToAnchor:self.bottomAnchor],
        [_safeAreaContainer.topAnchor constraintEqualToAnchor:self.topAnchor],
        [_safeAreaContainer.leadingAnchor constraintEqualToAnchor:self.leadingAnchor],
        [_safeAreaContainer.trailingAnchor constraintEqualToAnchor:self.trailingAnchor]
      ]];
    }
  }
  return self;
}

- (CGSize)intrinsicContentSize
{
  // This is needed so the view size is based on autolayout constraints.
  return CGSizeZero;
}

- (void)insertSubview:(UIView *)view atIndex:(NSInteger)index
{
  [_safeAreaContainer insertSubview:view atIndex:index];
}

- (void)setFrame:(CGRect)frame
{
  [super setFrame:frame];
  [_safeAreaContainer setFrame:frame];
  _heightConstraint.constant = frame.size.height;
  [self layoutIfNeeded];
}

- (BOOL)canBecomeFirstResponder
{
  return true;
}

@end
