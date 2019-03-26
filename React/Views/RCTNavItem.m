/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
}

- (void)setBackButtonIcon:(UIImage *)backButtonIcon
{
  _backButtonIcon = backButtonIcon;
  _backButtonItem = nil;
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
}

- (void)setLeftButtonIcon:(UIImage *)leftButtonIcon
{
  _leftButtonIcon = leftButtonIcon;
  _leftButtonItem = nil;
}

- (void)setLeftButtonSystemIcon:(UIBarButtonSystemItem)leftButtonSystemIcon
{
  _leftButtonSystemIcon = leftButtonSystemIcon;
  _leftButtonItem = nil;
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
}

- (void)setRightButtonIcon:(UIImage *)rightButtonIcon
{
  _rightButtonIcon = rightButtonIcon;
  _rightButtonItem = nil;
}

- (void)setRightButtonSystemIcon:(UIBarButtonSystemItem)rightButtonSystemIcon
{
  _rightButtonSystemIcon = rightButtonSystemIcon;
  _rightButtonItem = nil;
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

@end
