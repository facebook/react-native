// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

@class RCTEventDispatcher;

@interface RCTPicker : UIPickerView

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher NS_DESIGNATED_INITIALIZER;

@property (nonatomic, copy) NSArray *items;
@property (nonatomic, assign) NSInteger selectedIndex;

@end
