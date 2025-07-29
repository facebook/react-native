/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTVirtualViewContainerState.h"

/**
 * Denotes a view which implements custom pull to refresh functionality.
 */
@protocol RCTVirtualViewContainerProtocol

@property (nonatomic, strong, readonly) RCTVirtualViewContainerState *virtualViewContainerState;

@end
