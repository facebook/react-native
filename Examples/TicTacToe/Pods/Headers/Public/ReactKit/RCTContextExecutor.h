// Copyright 2004-present Facebook. All Rights Reserved.

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
