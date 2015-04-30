//
//  RCTSegmentedControl.h
//  React
//
//  Created by Clay Allsopp on 3/31/15.
//  Copyright (c) 2015 Facebook. All rights reserved.
//

#import <UIKit/UIKit.h>

@class RCTEventDispatcher;

@interface RCTSegmentedControl : UISegmentedControl

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher NS_DESIGNATED_INITIALIZER;

@property (nonatomic, copy) NSArray *values;
@property (nonatomic, assign) NSInteger selectedIndex;

@end
