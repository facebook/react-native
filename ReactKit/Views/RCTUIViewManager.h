// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

#import "RCTExport.h"

@class RCTEventDispatcher;

@interface RCTUIViewManager : NSObject <RCTNativeViewModule>

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher NS_DESIGNATED_INITIALIZER;

@property (nonatomic, readonly) RCTEventDispatcher *eventDispatcher;

@end
