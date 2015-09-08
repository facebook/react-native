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

@synthesize backButtonItem = _backButtonItem;
@synthesize leftButtonItem = _leftButtonItem;
@synthesize rightButtonItem = _rightButtonItem;
@synthesize navigationBarTransparent = _navigationBarTransparent;
@synthesize title = _title;
@synthesize titleIcon = _titleIcon;

-(void)setTitleIcon:(UIImage *)titleIcon{
  _titleIcon = titleIcon;
  [self.delegate update:self];
}

-(void)setTitle:(NSString *)title{
  _title = title;
  [self.delegate update:self];
}
- (void)setNavigationBarTransparent:(BOOL)transparent{
  _navigationBarTransparent = transparent;
  [self.delegate update:self];
}

- (void)setBackButtonTitle:(NSString *)backButtonTitle
{
  _backButtonTitle = backButtonTitle;
  _backButtonItem = nil;
  [self.delegate update:self];
}

- (void)setBackButtonIcon:(UIImage *)backButtonIcon
{
  _backButtonIcon = backButtonIcon;
  _backButtonItem = nil;
  [self.delegate update:self];
}

- (UIBarButtonItem *)backButtonItem
{
  if (!_backButtonItem) {
    if (_backButtonIcon) {
      _backButtonItem = [[UIBarButtonItem alloc] initWithImage:_backButtonIcon
                                                         style:UIBarButtonItemStylePlain
                                                        target:nil
                                                        action:nil];
    } else if (_backButtonTitle.length) {
      _backButtonItem = [[UIBarButtonItem alloc] initWithTitle:_backButtonTitle
                                                         style:UIBarButtonItemStylePlain
                                                        target:nil
                                                        action:nil];
    } else {
      _backButtonItem = nil;
    }
  }
  return _backButtonItem;
}

- (void)setLeftButtonTitle:(NSString *)leftButtonTitle
{
  _leftButtonTitle = leftButtonTitle;
  _leftButtonItem = nil;
  [self.delegate update:self];
}

- (void)setLeftButtonIcon:(UIImage *)leftButtonIcon
{
  _leftButtonIcon = leftButtonIcon;
  _leftButtonItem = nil;
  [self.delegate update:self];
}

- (UIBarButtonItem *)leftButtonItem
{
  if (!_leftButtonItem) {
    if (_leftButtonIcon) {
      _leftButtonItem =
      [[UIBarButtonItem alloc] initWithImage:_leftButtonIcon
                                       style:UIBarButtonItemStylePlain
                                      target:self
                                      action:@selector(handleNavLeftButtonTapped)];

    } else if (_leftButtonTitle.length) {
      _leftButtonItem =
      [[UIBarButtonItem alloc] initWithTitle:_leftButtonTitle
                                       style:UIBarButtonItemStylePlain
                                      target:self
                                      action:@selector(handleNavLeftButtonTapped)];
    } else {
      _leftButtonItem = nil;
    }
  }
  return _leftButtonItem;
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
  _rightButtonItem = nil;
  [self.delegate update:self];
}

- (void)setRightButtonIcon:(UIImage *)rightButtonIcon
{
  _rightButtonIcon = rightButtonIcon;
  _rightButtonItem = nil;
  [self.delegate update:self];
}

- (UIBarButtonItem *)rightButtonItem
{
  if (!_rightButtonItem) {
    if (_rightButtonIcon) {
      _rightButtonItem =
      [[UIBarButtonItem alloc] initWithImage:_rightButtonIcon
                                       style:UIBarButtonItemStylePlain
                                      target:self
                                      action:@selector(handleNavRightButtonTapped)];

    } else if (_rightButtonTitle.length) {
      _rightButtonItem =
      [[UIBarButtonItem alloc] initWithTitle:_rightButtonTitle
                                       style:UIBarButtonItemStylePlain
                                      target:self
                                      action:@selector(handleNavRightButtonTapped)];
    } else {
      _rightButtonItem = nil;
    }
  }
  return _rightButtonItem;
}

- (void)handleNavRightButtonTapped
{
  if (_onNavRightButtonTap) {
    _onNavRightButtonTap(nil);
  }
}

@end
