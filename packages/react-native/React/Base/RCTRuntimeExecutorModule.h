/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@class RCTRuntimeExecutor;

/**
 * Have your module conform to this protocol to access the RuntimeExecutor.
 * Only available in the bridgeless runtime.
 */
@protocol RCTRuntimeExecutorModule <NSObject>

@property (nonatomic, nullable, readwrite) RCTRuntimeExecutor *runtimeExecutor;

@end
