/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#ifdef __cplusplus
#import <ReactCommon/RuntimeExecutor.h>

NS_ASSUME_NONNULL_BEGIN

@class RCTBridge;

facebook::react::RuntimeExecutor RCTRuntimeExecutorFromBridge(RCTBridge *bridge);

NS_ASSUME_NONNULL_END
#endif
