/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "RCTComponent.h"

@interface RCTTabBarItem : UIView

@property (nonatomic, copy) id /* NSString or NSNumber */ badge;
@property (nonatomic, strong) UIImage *icon;
@property (nonatomic, strong) UIImage *selectedIcon;
@property (nonatomic, assign) UITabBarSystemItem systemIcon;
@property (nonatomic, assign) BOOL renderAsOriginal;
@property (nonatomic, assign, getter=isSelected) BOOL selected;
@property (nonatomic, readonly) UITabBarItem *barItem;
@property (nonatomic, copy) RCTBubblingEventBlock onPress;

/**
 * TV event handlers
 */
@property (nonatomic, copy) RCTDirectEventBlock onTVSelect; // Called if this view is focused and the TV remote select button is pressed
@property (nonatomic, copy) RCTDirectEventBlock onTVFocus; // Called when this view comes into focus when navigating via TV remote swipes or arrow keys
@property (nonatomic, copy) RCTDirectEventBlock onTVBlur; // Called when this view leaves focus when navigating via TV remote swipes or arrow keys
@property (nonatomic, copy) RCTDirectEventBlock onTVNavEvent; // Called on any TV remote action other than select (menu, play/pause, swipes or arrow keys);


@end
