/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTWrapperViewControllerHostingView.h"

#import <React/UIView+React.h>

#pragma mark - UIViewController+Children

@interface UIViewController (Children)

@property (nonatomic, readonly) BOOL isAttached;
- (void)attachChildViewController:(UIViewController *)childViewController toContainerView:(UIView *)containerView;
- (void)detachChildViewController:(UIViewController *)childViewController;

@end

@implementation UIViewController (Children)

- (BOOL)isAttached
{
  return self.parentViewController != nil;
}

- (void)attachChildViewController:(UIViewController *)childViewController toContainerView:(UIView *)containerView
{
  [self addChildViewController:childViewController];
  // `[childViewController willMoveToParentViewController:self]` is calling automatically
  [containerView addSubview:childViewController.view];
  childViewController.view.frame = containerView.bounds;
  childViewController.view.translatesAutoresizingMaskIntoConstraints = YES;
  childViewController.view.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  [childViewController didMoveToParentViewController:self];

  [childViewController beginAppearanceTransition:true animated:false];
  [childViewController endAppearanceTransition];
}

- (void)detachChildViewController:(UIViewController *)childViewController
{
  [childViewController beginAppearanceTransition:false animated: false];
  [childViewController endAppearanceTransition];

  [childViewController willMoveToParentViewController:nil];
  [childViewController.view removeFromSuperview];
  [childViewController removeFromParentViewController];
  // `[childViewController didMoveToParentViewController:nil]` is calling automatically
}

@end

@implementation RCTWrapperViewControllerHostingView {
  UIViewController *_Nullable _contentViewController;
}

#pragma mark - `contentViewController`

- (nullable UIViewController *)contentViewController
{
  return _contentViewController;
}

- (void)setContentViewController:(UIViewController *)contentViewController
{

  if (_contentViewController) {
    [self detachContentViewControllerIfNeeded];
  }

  _contentViewController = contentViewController;

  if (_contentViewController) {
    [self attachContentViewControllerIfNeeded];
  }
}

#pragma mark - Attaching and Detaching

- (void)attachContentViewControllerIfNeeded
{
  if (self.contentViewController.isAttached) {
    return;
  }

  [self.reactViewController attachChildViewController:self.contentViewController toContainerView:self];
}

- (void)detachContentViewControllerIfNeeded
{
  if (!self.contentViewController.isAttached) {
    return;
  }

  [self.reactViewController detachChildViewController:self.contentViewController];
}

#pragma mark - Life cycle

- (void)willMoveToWindow:(UIWindow *)newWindow
{
  if (newWindow == nil) {
    [self detachContentViewControllerIfNeeded];
  }
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];
  [self attachContentViewControllerIfNeeded];
}

#pragma mark - Layout

- (void)setNeedsLayout
{
  [super setNeedsLayout];
  [self.superview setNeedsLayout];
}

- (CGSize)intrinsicContentSize
{
  return self.contentViewController.view.intrinsicContentSize;
}

- (CGSize)sizeThatFits:(CGSize)size
{
  return [self.contentViewController.view sizeThatFits:size];
}

@end
