/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTabBarItem.h"

#import "RCTConvert.h"
#import "RCTLog.h"
#import "UIView+React.h"

@implementation RCTConvert (UITabBarSystemItem)

RCT_ENUM_CONVERTER(UITabBarSystemItem, (@{
  @"bookmarks": @(UITabBarSystemItemBookmarks),
  @"contacts": @(UITabBarSystemItemContacts),
  @"downloads": @(UITabBarSystemItemDownloads),
  @"favorites": @(UITabBarSystemItemFavorites),
  @"featured": @(UITabBarSystemItemFeatured),
  @"history": @(UITabBarSystemItemHistory),
  @"more": @(UITabBarSystemItemMore),
  @"most-recent": @(UITabBarSystemItemMostRecent),
  @"most-viewed": @(UITabBarSystemItemMostViewed),
  @"recents": @(UITabBarSystemItemRecents),
  @"search": @(UITabBarSystemItemSearch),
  @"top-rated": @(UITabBarSystemItemTopRated),
}), NSNotFound, integerValue)

@end

@implementation RCTTabBarItem{
  UITapGestureRecognizer *_selectRecognizer;
}

@synthesize barItem = _barItem;

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    _systemIcon = NSNotFound;
  }
  return self;
}

- (UITabBarItem *)barItem
{
  if (!_barItem) {
    _barItem = [UITabBarItem new];
    _systemIcon = NSNotFound;
  }
  return _barItem;
}

- (void)setBadge:(id)badge
{
  _badge = [badge copy];
  self.barItem.badgeValue = [badge description];
}

- (void)setSystemIcon:(UITabBarSystemItem)systemIcon
{
  if (_systemIcon != systemIcon) {
    _systemIcon = systemIcon;
    UITabBarItem *oldItem = _barItem;
    _barItem = [[UITabBarItem alloc] initWithTabBarSystemItem:_systemIcon
                                                          tag:oldItem.tag];
    _barItem.title = oldItem.title;
    _barItem.imageInsets = oldItem.imageInsets;
    _barItem.badgeValue = oldItem.badgeValue;
  }
}

- (void)setIcon:(UIImage *)icon
{
  _icon = icon;
  if (_icon && _systemIcon != NSNotFound) {
    _systemIcon = NSNotFound;
    UITabBarItem *oldItem = _barItem;
    _barItem = [UITabBarItem new];
    _barItem.title = oldItem.title;
    _barItem.imageInsets = oldItem.imageInsets;
    _barItem.selectedImage = oldItem.selectedImage;
    _barItem.badgeValue = oldItem.badgeValue;
  }

  if (_renderAsOriginal) {
    self.barItem.image = [_icon imageWithRenderingMode:UIImageRenderingModeAlwaysOriginal];
  } else {
    self.barItem.image = _icon;
  }
}

- (void)setSelectedIcon:(UIImage *)selectedIcon
{
  _selectedIcon = selectedIcon;

  if (_renderAsOriginal) {
    self.barItem.selectedImage = [_selectedIcon imageWithRenderingMode:UIImageRenderingModeAlwaysOriginal];
  } else {
    self.barItem.selectedImage = _selectedIcon;
  }
}

- (void)setBadgeColor:(UIColor *)badgeColor
{
#if !TARGET_OS_TV && defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_10_0
  _barItem.badgeColor = badgeColor;
#endif
}

- (UIViewController *)reactViewController
{
  return self.superview.reactViewController;
}

@end
