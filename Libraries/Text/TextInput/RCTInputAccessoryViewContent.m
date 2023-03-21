/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTInputAccessoryViewContent.h>

#import <React/UIView+React.h>

@implementation RCTInputAccessoryViewContent {
  RCTUIView *_safeAreaContainer; // [macOS]
  NSLayoutConstraint *_heightConstraint;
}

- (instancetype)init
{
  if (self = [super init]) {
    _safeAreaContainer = [RCTUIView new]; // [macOS]
    [self addSubview:_safeAreaContainer];

    // Use autolayout to position the view properly and take into account
    // safe area insets on iPhone X.
    // TODO: Support rotation, anchor to left and right without breaking frame x coordinate (T27974328).
    self.autoresizingMask = UIViewAutoresizingFlexibleHeight;
    _safeAreaContainer.translatesAutoresizingMaskIntoConstraints = NO;

    _heightConstraint = [_safeAreaContainer.heightAnchor constraintEqualToConstant:0];
    _heightConstraint.active = YES;

#if !TARGET_OS_OSX // [macOS]
    [_safeAreaContainer.bottomAnchor constraintEqualToAnchor:self.safeAreaLayoutGuide.bottomAnchor].active = YES;
    [_safeAreaContainer.topAnchor constraintEqualToAnchor:self.safeAreaLayoutGuide.topAnchor].active = YES;
    [_safeAreaContainer.leadingAnchor constraintEqualToAnchor:self.safeAreaLayoutGuide.leadingAnchor].active = YES;
    [_safeAreaContainer.trailingAnchor constraintEqualToAnchor:self.safeAreaLayoutGuide.trailingAnchor].active = YES;
#else // [macOS
    [_safeAreaContainer.bottomAnchor constraintEqualToAnchor:self.bottomAnchor].active = YES;
    [_safeAreaContainer.topAnchor constraintEqualToAnchor:self.topAnchor].active = YES;
    [_safeAreaContainer.leadingAnchor constraintEqualToAnchor:self.leadingAnchor].active = YES;
    [_safeAreaContainer.trailingAnchor constraintEqualToAnchor:self.trailingAnchor].active = YES;
#endif // macOS]
  }
  return self;
}

- (CGSize)intrinsicContentSize
{
  // This is needed so the view size is based on autolayout constraints.
  return CGSizeZero;
}

- (void)reactSetFrame:(CGRect)frame
{
  // We still need to set the frame here, otherwise it won't be
  // measured until moved to the window during the keyboard opening
  // animation. If this happens, the height will be animated from 0 to
  // its actual size and we don't want that.
  [self setFrame:frame];
  [_safeAreaContainer setFrame:frame];

  _heightConstraint.constant = frame.size.height;
  [self layoutIfNeeded];
}

- (void)insertReactSubview:(RCTUIView *)subview atIndex:(NSInteger)index // [macOS]
{
  [super insertReactSubview:subview atIndex:index];
  [_safeAreaContainer insertSubview:subview atIndex:index];
}

- (void)removeReactSubview:(RCTUIView *)subview // [macOS]
{
  [super removeReactSubview:subview];
  [subview removeFromSuperview];
  if ([[_safeAreaContainer subviews] count] == 0 && [self isFirstResponder]) {
    [self resignFirstResponder];
  }
}

@end
