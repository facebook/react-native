/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@class RCTCallInvoker;

/**
 * Have your module conform to this protocol to access the CallInvoker.
 */
@protocol RCTCallInvokerModule <NSObject>

@property (nonatomic, nullable, readwrite) RCTCallInvoker *callInvoker;

@end
