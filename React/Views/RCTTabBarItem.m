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

@implementation RCTTabBarItem

@synthesize barItem = _barItem;

- (UITabBarItem *)barItem
{
  if (!_barItem) {
    _barItem = [UITabBarItem new];
  }
  return _barItem;
}

- (void)setIcon:(id)icon
{
  static NSDictionary *systemIcons;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    systemIcons = @{
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
    };
  });

  // Update icon
  BOOL wasSystemIcon = (systemIcons[_icon] != nil);
  _icon = [icon copy];

  // Check if string matches any custom images first
  UIImage *image = [RCTConvert UIImage:_icon];
  UITabBarItem *oldItem = _barItem;
  if (image) {
    
    // Recreate barItem if previous item was a system icon
    if (wasSystemIcon) {
      _barItem = nil;
      self.barItem.image = image;
    } else {
      self.barItem.image = image;
      return;
    }

  } else {

    // Not a custom image, may be a system item?
    NSNumber *systemIcon = systemIcons[icon];
    if (!systemIcon) {
      RCTLogError(@"The tab bar icon '%@' did not match any known image or system icon", icon);
      return;
    }
    _barItem = [[UITabBarItem alloc] initWithTabBarSystemItem:systemIcon.integerValue tag:oldItem.tag];
  }

  // Reapply previous properties
  _barItem.title = oldItem.title;
  _barItem.imageInsets = oldItem.imageInsets;
  _barItem.selectedImage = oldItem.selectedImage;
  _barItem.badgeValue = oldItem.badgeValue;
}

- (UIViewController *)reactViewController
{
  return self.superview.reactViewController;
}

@end
