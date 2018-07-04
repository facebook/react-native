/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTComponent.h>
#import <React/RCTConvert.h>

@interface RCTConvert (UITabBarSystemItem)

+ (UITabBarSystemItem)UITabBarSystemItem:(id)json;

@end

@interface RCTTabBarItem : UIView

@property (nonatomic, copy) id /* NSString or NSNumber */ badge;
@property (nonatomic, strong) UIImage *icon;
@property (nonatomic, strong) UIImage *selectedIcon;
@property (nonatomic, assign) UITabBarSystemItem systemIcon;
@property (nonatomic, assign) BOOL renderAsOriginal;
@property (nonatomic, assign, getter=isSelected) BOOL selected;
@property (nonatomic, readonly) UITabBarItem *barItem;
@property (nonatomic, copy) RCTBubblingEventBlock onPress;
@property (nonatomic, strong) NSString *testID;

#if TARGET_OS_TV
@property (nonatomic, assign) BOOL wasSelectedInJS;
#endif

@end
