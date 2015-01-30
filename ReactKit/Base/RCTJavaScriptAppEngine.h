// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

#import "RCTInvalidating.h"
#import "RCTJavaScriptExecutor.h"

@class RCTBridge;

/**
 * Class that allows easy embedding, loading, life-cycle management of a
 * JavaScript application inside of a native application.
 * TODO: Before loading new application source, publish global notification in
 * JavaScript so that applications can clean up resources. (launch blocker).
 * TODO: Incremental module loading. (low pri).
 */
@interface RCTJavaScriptAppEngine : NSObject <RCTInvalidating>

@property (nonatomic, readonly, strong) RCTBridge *bridge;

- (instancetype)initWithBridge:(RCTBridge *)bridge;
- (void)loadBundleAtURL:(NSURL *)moduleURL useCache:(BOOL)useCache onComplete:(RCTJavaScriptCompleteBlock)onComplete;
+ (void)resetCacheForBundleAtURL:(NSURL *)moduleURL;

@end
