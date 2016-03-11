/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "RCTBridgeDelegate.h"

/**
 * Class that allows easy embedding, loading, life-cycle management of a
 * JavaScript application inside of a native application.
 */
@interface RCTJavaScriptLoader : NSObject

+ (void)setURLSessionConfiguration:(NSURLSessionConfiguration *)urlSessionConfiguration;

+ (void)loadBundleAtURL:(NSURL *)moduleURL onComplete:(RCTSourceLoadBlock)onComplete;

@end
