//
//  AppDelegate.h
//  RNTester-macOS
//
//  Created by Jeff Cruikshank on 6/5/17.
//  Copyright © 2017 Facebook. All rights reserved.
//

#import <Cocoa/Cocoa.h>

@class RCTBridge;
extern NSString *kBundleNameJS;

@interface AppDelegate : NSObject <NSApplicationDelegate>

@property (nonatomic, readonly) RCTBridge *bridge;

@end
