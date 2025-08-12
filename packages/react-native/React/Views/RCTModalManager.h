/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#ifndef RCT_FIT_RM_OLD_COMPONENT

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCTModalManager : RCTEventEmitter <RCTBridgeModule>

- (void)modalDismissed:(NSNumber *)modalID;

@end

#endif // RCT_FIT_RM_OLD_COMPONENT
