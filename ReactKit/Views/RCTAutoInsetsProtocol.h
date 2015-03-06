// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

/**
 * Defines a View that wants to support auto insets adjustment
 */
@protocol RCTAutoInsetsProtocol

@property (nonatomic, assign, readwrite) UIEdgeInsets contentInset;
@property (nonatomic, assign, readwrite) BOOL automaticallyAdjustContentInsets;

@end
