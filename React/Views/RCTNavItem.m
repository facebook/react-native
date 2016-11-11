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

- (UIImageView *)titleImageView
{
  if (_titleImage) {
    return [[UIImageView alloc] initWithImage:_titleImage];
  } else {
    return nil;
  }
}

-(instancetype)init
{
  if (self = [super init]) {
    _leftButtonSystemIcon = NSNotFound;
    _rightButtonSystemIcon = NSNotFound;
  }
  return self;
}

- (void)setBackButtonTitle:(NSString *)backButtonTitle
{
  _backButtonTitle = backButtonTitle;
  _backButtonItem = nil;
  if (self.delegate != nil) [self.delegate navItemPropsDidUpdate];
}

- (void)setBackButtonIcon:(UIImage *)backButtonIcon
{
  _backButtonIcon = backButtonIcon;
  _backButtonItem = nil;
  if (self.delegate != nil) [self.delegate navItemPropsDidUpdate];
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
  if (self.delegate != nil) [self.delegate navItemPropsDidUpdate];
}

- (void)setLeftButtonIcon:(UIImage *)leftButtonIcon
{
  _leftButtonIcon = leftButtonIcon;
  _leftButtonItem = nil;
  if (self.delegate != nil) [self.delegate navItemPropsDidUpdate];
}

- (void)setLeftButtonSystemIcon:(UIBarButtonSystemItem)leftButtonSystemIcon
{
  _leftButtonSystemIcon = leftButtonSystemIcon;
  _leftButtonItem = nil;
  if (self.delegate != nil) [self.delegate navItemPropsDidUpdate];
}

- (UIBarButtonItem *)leftButtonItem
{
  if (!_leftButtonItem) {
    if (_leftButtonIcon) {
      _leftButtonItem =
      [[UIBarButtonItem alloc] initWithImage:_leftButtonIcon
                                       style:UIBarButtonItemStylePlain
                                      target:self
                                      action:@selector(handleLeftButtonPress)];

    } else if (_leftButtonTitle.length) {
      _leftButtonItem =
      [[UIBarButtonItem alloc] initWithTitle:_leftButtonTitle
                                       style:UIBarButtonItemStylePlain
                                      target:self
                                      action:@selector(handleLeftButtonPress)];

    } else if (_leftButtonSystemIcon != NSNotFound) {
      _leftButtonItem =
      [[UIBarButtonItem alloc] initWithBarButtonSystemItem:_leftButtonSystemIcon
                                                    target:self
                                                    action:@selector(handleLeftButtonPress)];
    } else {
      _leftButtonItem = nil;
    }
  }
  return _leftButtonItem;
}

- (void)handleLeftButtonPress
{
  if (_onLeftButtonPress) {
    _onLeftButtonPress(nil);
  }
}

- (void)setRightButtonTitle:(NSString *)rightButtonTitle
{
  _rightButtonTitle = rightButtonTitle;
  _rightButtonItem = nil;
  if (self.delegate != nil) [self.delegate navItemPropsDidUpdate];
}

- (void)setRightButtonIcon:(UIImage *)rightButtonIcon
{
  _rightButtonIcon = rightButtonIcon;
  _rightButtonItem = nil;
  if (self.delegate != nil) [self.delegate navItemPropsDidUpdate];
}

- (void)setRightButtonSystemIcon:(UIBarButtonSystemItem)rightButtonSystemIcon
{
  _rightButtonSystemIcon = rightButtonSystemIcon;
  _rightButtonItem = nil;
  if (self.delegate != nil) [self.delegate navItemPropsDidUpdate];
}

- (UIBarButtonItem *)rightButtonItem
{
  if (!_rightButtonItem) {
    if (_rightButtonIcon) {
      _rightButtonItem =
      [[UIBarButtonItem alloc] initWithImage:_rightButtonIcon
                                       style:UIBarButtonItemStylePlain
                                      target:self
                                      action:@selector(handleRightButtonPress)];

    } else if (_rightButtonTitle.length) {
      _rightButtonItem =
      [[UIBarButtonItem alloc] initWithTitle:_rightButtonTitle
                                       style:UIBarButtonItemStylePlain
                                      target:self
                                      action:@selector(handleRightButtonPress)];

    } else if (_rightButtonSystemIcon != NSNotFound) {
      _rightButtonItem =
      [[UIBarButtonItem alloc] initWithBarButtonSystemItem:_rightButtonSystemIcon
                                      target:self
                                      action:@selector(handleRightButtonPress)];
    } else {
      _rightButtonItem = nil;
    }
  }
  return _rightButtonItem;
}

- (void)handleRightButtonPress
{
  if (_onRightButtonPress) {
    _onRightButtonPress(nil);
  }
}

- (void)setNavigationBarHidden:(BOOL)navigationBarHidden
{
  _navigationBarHidden = navigationBarHidden;
  if (self.delegate != nil) [self.delegate navItemPropsDidUpdate];
}

- (void)setShadowHidden:(BOOL)shadowHidden
{
  _shadowHidden = shadowHidden;
  if (self.delegate != nil) [self.delegate navItemPropsDidUpdate];
}

- (void)setTintColor:(UIColor *)tintColor
{
  _tintColor = tintColor;
  if (self.delegate != nil) [self.delegate navItemPropsDidUpdate];
}

- (void)setBarTintColor:(UIColor *)barTintColor
{
  _barTintColor = barTintColor;
  if (self.delegate != nil) [self.delegate navItemPropsDidUpdate];
}

- (void)setTranslucent:(BOOL)translucent
{
  _translucent = translucent;
  if (self.delegate != nil) [self.delegate navItemPropsDidUpdate];
}

- (void)setTitle:(NSString *)title
{
  _title = title;
  if (self.delegate != nil) [self.delegate navItemPropsDidUpdate];
}

- (void)setTitleTextColor:(UIColor *)titleTextColor
{
  _titleTextColor = titleTextColor;
  if (self.delegate != nil) [self.delegate navItemPropsDidUpdate];
}

- (void)setTitleImage:(UIImage *)titleImage
{
  _titleImage = titleImage;
  if (self.delegate != nil) [self.delegate navItemPropsDidUpdate];
}

@end
