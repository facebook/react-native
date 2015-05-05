/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "RCTJavaScriptExecutor.h"

@class RCTBridge;

/**
 * Class that allows easy embedding, loading, life-cycle management of a
 * JavaScript application inside of a native application.
 * TODO: Incremental module loading. (low pri).
 */
@interface RCTJavaScriptLoader : NSObject

- (instancetype)initWithBridge:(RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

- (void)loadBundleAtURL:(NSURL *)moduleURL onComplete:(void (^)(NSError *, NSString *))onComplete;

@end
