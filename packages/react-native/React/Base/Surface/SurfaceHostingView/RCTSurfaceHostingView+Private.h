/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSurfaceHostingView.h"

#ifdef __cplusplus
#import <react/utils/ContextContainer.h>
#endif

NS_ASSUME_NONNULL_BEGIN

@interface RCTSurfaceHostingView (Private)

#ifdef __cplusplus
/**
 * Context container that provides access to the React Native runtime and TurboModule registry.
 * This C++ interface is used internally by React Native for bridgeless mode.
 */
@property (nonatomic, assign, nullable) facebook::react::ContextContainer::Shared contextContainer;
#endif

@end

NS_ASSUME_NONNULL_END