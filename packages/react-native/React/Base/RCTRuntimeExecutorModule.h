/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <RCTDeprecation/RCTDeprecation.h>

@class RCTRuntimeExecutor;

/**
 * TODO(T187851171): This is deprecated. Use RCTCallInvokerModule instead.
 */
@protocol RCTRuntimeExecutorModule <NSObject>

@property (nonatomic, nullable, readwrite) RCTRuntimeExecutor *runtimeExecutor RCT_DEPRECATED;

@end
