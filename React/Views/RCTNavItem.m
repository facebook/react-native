/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTNavItem.h"

@implementation RCTNavItem

- (void)setNavigationBar:(UINavigationBar *)navigationBar
{
  _navigationBar = navigationBar;
  _navigationBar.barTintColor = self.barTintColor;
  _navigationBar.tintColor = self.tintColor;
  _navigationBar.translucent = self.translucent;
  _navigationBar.titleTextAttributes = self.titleTextColor ? @{
                                                               NSForegroundColorAttributeName: self.titleTextColor
                                                               } : nil;
  
  RCTFindNavBarShadowViewInView(_navigationBar).hidden = self.shadowHidden;
}

- (void)setNavigationItem:(UINavigationItem *)navigationItem
{
  _navigationItem = navigationItem;
  _navigationItem.title = self.title;
  _navigationItem.backBarButtonItem = self.backButtonItem;
  _navigationItem.leftBarButtonItem = self.leftButtonItem;
  _navigationItem.rightBarButtonItem = self.rightButtonItem;
}

- (void)setTitle:(NSString *)title
{
  _title = title;
  _navigationItem.title = title;
}

- (void)setBackButtonTitle:(NSString *)backButtonTitle
{
  _backButtonTitle = backButtonTitle;
  _navigationItem.backBarButtonItem = nil;
  [self backButtonItem]; // to trigger the reset.
}

- (void)setBackButtonIcon:(UIImage *)backButtonIcon
{
  _backButtonIcon = backButtonIcon;
  _navigationItem.backBarButtonItem = nil;
  [self backButtonItem]; // to trigger the reset.
}

- (UIBarButtonItem *)backButtonItem
{
  if (_navigationItem.backBarButtonItem) {
    return _navigationItem.backBarButtonItem;
  }
  if (self.backButtonIcon) {
    return _navigationItem.backBarButtonItem = [[UIBarButtonItem alloc] initWithImage:self.backButtonIcon
                                                                                style:UIBarButtonItemStylePlain
                                                                               target:nil
                                                                               action:nil];
  }
  if (self.backButtonTitle.length) {
    return _navigationItem.backBarButtonItem = [[UIBarButtonItem alloc] initWithTitle:self.backButtonTitle
                                                                                style:UIBarButtonItemStylePlain
                                                                               target:nil
                                                                               action:nil];
  }
  return _navigationItem.backBarButtonItem = nil;
}

- (void)setLeftButtonTitle:(NSString *)leftButtonTitle
{
  _leftButtonTitle = leftButtonTitle;
  _navigationItem.leftBarButtonItem = nil;
  [self leftButtonItem]; // to trigger the reset.
}

- (void)setLeftButtonIcon:(UIImage *)leftButtonIcon
{
  _leftButtonIcon = leftButtonIcon;
  _navigationItem.leftBarButtonItem = nil;
  [self leftButtonItem]; // to trigger the reset.
}

- (UIBarButtonItem *)leftButtonItem
{
  if (_navigationItem.leftBarButtonItem) {
    return _navigationItem.leftBarButtonItem;
  }
  if (self.leftButtonIcon) {
    return _navigationItem.leftBarButtonItem = [[UIBarButtonItem alloc] initWithImage:self.leftButtonIcon
                                                                                style:UIBarButtonItemStylePlain
                                                                               target:self
                                                                               action:@selector(handleNavLeftButtonTapped)];
  }
  if (self.leftButtonTitle.length) {
    return _navigationItem.leftBarButtonItem = [[UIBarButtonItem alloc] initWithTitle:self.leftButtonTitle
                                                                                style:UIBarButtonItemStylePlain
                                                                               target:self
                                                                               action:@selector(handleNavLeftButtonTapped)];
  }
  return _navigationItem.leftBarButtonItem = nil;
}

- (void)handleNavLeftButtonTapped
{
  if (_onNavLeftButtonTap) {
    _onNavLeftButtonTap(nil);
  }
}

- (void)setRightButtonTitle:(NSString *)rightButtonTitle
{
  _rightButtonTitle = rightButtonTitle;
  _navigationItem.rightBarButtonItem = nil;
  [self rightButtonItem]; // to trigger the reset.
}

- (void)setRightButtonIcon:(UIImage *)rightButtonIcon
{
  _rightButtonIcon = rightButtonIcon;
  _navigationItem.rightBarButtonItem = nil;
  [self rightButtonItem]; // to trigger the reset.
}

- (UIBarButtonItem *)rightButtonItem
{
  if (_navigationItem.rightBarButtonItem) {
    return _navigationItem.rightBarButtonItem;
  }
  if (self.rightButtonIcon) {
    return _navigationItem.rightBarButtonItem = [[UIBarButtonItem alloc] initWithImage:self.rightButtonIcon
                                                                                 style:UIBarButtonItemStylePlain
                                                                                target:self
                                                                                action:@selector(handleNavRightButtonTapped)];
  }
  if (self.rightButtonTitle.length) {
    return _navigationItem.rightBarButtonItem = [[UIBarButtonItem alloc] initWithTitle:self.rightButtonTitle
                                                                                 style:UIBarButtonItemStylePlain
                                                                                target:self
                                                                                action:@selector(handleNavRightButtonTapped)];
  }
  return _navigationItem.rightBarButtonItem = nil;
}

- (void)handleNavRightButtonTapped
{
  if (_onNavRightButtonTap) {
    _onNavRightButtonTap(nil);
  }
}

static UIView *RCTFindNavBarShadowViewInView(UIView *view)
{
  if ([view isKindOfClass:[UIImageView class]] && view.bounds.size.height <= 1) {
    return view;
  }
  for (UIView *subview in view.subviews) {
    UIView *shadowView = RCTFindNavBarShadowViewInView(subview);
    if (shadowView) {
      return shadowView;
    }
  }
  return nil;
}

@end
