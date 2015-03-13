// Copyright 2004-present Facebook. All Rights Reserved.

#import <Foundation/Foundation.h>

#import "RCTBridgeModule.h"

@interface RCTSourceCode : NSObject <RCTBridgeModule>

@property (nonatomic, copy) NSString *scriptText;
@property (nonatomic, copy) NSURL *scriptURL;

@end
