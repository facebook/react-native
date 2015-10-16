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

//- (void)forwardInvocation:(NSInvocation *)invocation
//{
//  if ([_navigationItem respondsToSelector:invocation.selector]) {
//    [invocation invokeWithTarget:_navigationItem];
//  }
//  else {
//    [super forwardInvocation:invocation];
//  }
//}

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
  
  if (self.titleIcon) {
    if ([_navigationItem.titleView isKindOfClass:[UIImageView class]]) {
      UIImageView *titleView = (UIImageView *)_navigationItem.titleView;
      if (titleView.image != self.titleIcon) {
        _navigationItem.titleView = [[UIImageView alloc] initWithImage:self.titleIcon];
      }
    }
  }
}

- (void)setTitle:(NSString *)title
{
  _title = title;
  _navigationItem.title = title;
}

- (void)setBackButtonTitle:(NSString *)backButtonTitle
{
  _backButtonTitle = backButtonTitle;
  if (backButtonTitle) {
    if (_navigationItem.backBarButtonItem &&
        _navigationItem.backBarButtonItem.title) {
      _navigationItem.backBarButtonItem.title = backButtonTitle;
    }
    else {
      _navigationItem.backBarButtonItem = nil;
    }
  }
}

- (void)setBackButtonIcon:(UIImage *)backButtonIcon
{
  _backButtonIcon = backButtonIcon;
  if (backButtonIcon) {
    if (_navigationItem.backBarButtonItem &&
        _navigationItem.backBarButtonItem.image) {
      _navigationItem.backBarButtonItem.image = backButtonIcon;
    }
    else {
      _navigationItem.backBarButtonItem = nil;
    }
  }
}

- (UIBarButtonItem *)backButtonItem
{
  if (!_navigationItem.backBarButtonItem) {
    if (_navigationItem.backBarButtonItem) {
      _navigationItem.backBarButtonItem = [[UIBarButtonItem alloc] initWithImage:self.backButtonIcon
                                                                           style:UIBarButtonItemStylePlain
                                                                          target:nil
                                                                          action:nil];
    } else if (self.backButtonTitle.length) {
      _navigationItem.backBarButtonItem = [[UIBarButtonItem alloc] initWithTitle:self.backButtonTitle
                                                                           style:UIBarButtonItemStylePlain
                                                                          target:nil
                                                                          action:nil];
    } else {
      _navigationItem.backBarButtonItem = nil;
    }
  }
  return _navigationItem.backBarButtonItem;
}

- (void)setLeftButtonTitle:(NSString *)leftButtonTitle
{
  _leftButtonTitle = leftButtonTitle;
  if (leftButtonTitle) {
    if (_navigationItem.leftBarButtonItem && _navigationItem.leftBarButtonItem.title) {
      _navigationItem.leftBarButtonItem.title = leftButtonTitle;
    }
  }
}

- (void)setLeftButtonIcon:(UIImage *)leftButtonIcon
{
  _leftButtonIcon = leftButtonIcon;
  if (leftButtonIcon) {
    if (_navigationItem.leftBarButtonItem && _navigationItem.leftBarButtonItem.image) {
      _navigationItem.leftBarButtonItem.image = leftButtonIcon;
    }
    else {
      _navigationItem.leftBarButtonItem = nil;
    }
  }
}

- (UIBarButtonItem *)leftButtonItem
{
  if (!_navigationItem.leftBarButtonItem) {
    if (_navigationItem.leftBarButtonItem) {
      _navigationItem.leftBarButtonItem = [[UIBarButtonItem alloc] initWithImage:self.leftButtonIcon
                                                                           style:UIBarButtonItemStylePlain
                                                                          target:nil
                                                                          action:@selector(handleNavLeftButtonTapped)];
    } else if (self.leftButtonTitle.length) {
      _navigationItem.leftBarButtonItem = [[UIBarButtonItem alloc] initWithTitle:self.leftButtonTitle
                                                                           style:UIBarButtonItemStylePlain
                                                                          target:nil
                                                                          action:@selector(handleNavLeftButtonTapped)];
    } else {
      _navigationItem.leftBarButtonItem = nil;
    }
  }
  return _navigationItem.leftBarButtonItem;
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
  if (rightButtonTitle) {
    if (_navigationItem.rightBarButtonItem &&
        _navigationItem.rightBarButtonItem.title) {
      _navigationItem.rightBarButtonItem.title = rightButtonTitle;
    }
    else {
      _navigationItem.rightBarButtonItem = [[UIBarButtonItem alloc] initWithTitle:self.rightButtonTitle
                                                                            style:UIBarButtonItemStylePlain
                                                                           target:nil
                                                                           action:@selector(handleNavRightButtonTapped)];
    }
  }
}

- (void)setRightButtonIcon:(UIImage *)rightButtonIcon
{
  _rightButtonIcon = rightButtonIcon;
  if (rightButtonIcon) {
    if (_navigationItem.rightBarButtonItem &&
        _navigationItem.rightBarButtonItem.image) {
      _navigationItem.rightBarButtonItem.image = rightButtonIcon;
    }
    else {
      _navigationItem.rightBarButtonItem = nil;
    }
  }
}

- (UIBarButtonItem *)rightButtonItem
{
  if (!_navigationItem.rightBarButtonItem) {
    if (_navigationItem.rightBarButtonItem) {
      _navigationItem.rightBarButtonItem = [[UIBarButtonItem alloc] initWithImage:self.rightButtonIcon
                                                                            style:UIBarButtonItemStylePlain
                                                                           target:nil
                                                                           action:@selector(handleNavRightButtonTapped)];
    } else if (self.rightButtonTitle.length) {
      _navigationItem.rightBarButtonItem = [[UIBarButtonItem alloc] initWithTitle:self.rightButtonTitle
                                                                            style:UIBarButtonItemStylePlain
                                                                           target:nil
                                                                           action:@selector(handleNavRightButtonTapped)];
    } else {
      _navigationItem.rightBarButtonItem = nil;
    }
  }
  return _navigationItem.rightBarButtonItem;
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
