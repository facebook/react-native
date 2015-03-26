/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <JavaScriptCore/JavaScriptCore.h>

#import "RCTJavaScriptExecutor.h"

// TODO (#5906496): Might RCTJSCoreExecutor be a better name for this?

/**
 * Uses a JavaScriptCore context as the execution engine.
 */
@interface RCTContextExecutor : NSObject <RCTJavaScriptExecutor>

/**
 * Configures the executor to run JavaScript on a custom performer.
 * You probably don't want to use this; use -init instead.
 */
- (instancetype)initWithJavaScriptThread:(NSThread *)javaScriptThread
                        globalContextRef:(JSGlobalContextRef)context;

@end
