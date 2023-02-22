/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTComponent.h>
#import <UIKit/UIKit.h>

/**
 * Protocol used to dispatch commands in `RCTRefreshControlManager.h`.
 * This is in order to support commands for both Paper and Fabric components
 * during migration.
 */
@protocol RCTRefreshableProtocol

- (void)setRefreshing:(BOOL)refreshing;

@end
