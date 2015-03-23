// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

@interface RCTTabBarItem : UIView

@property (nonatomic, copy) NSString *icon;
@property (nonatomic, assign, getter=isSelected) BOOL selected;
@property (nonatomic, readonly) UITabBarItem *barItem;

@end
