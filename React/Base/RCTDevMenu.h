/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "RCTBridge.h"
#import "RCTBridgeModule.h"
#import "RCTInvalidating.h"

/**
 * Developer menu, useful for exposing extra functionality when debugging.
 */
@interface RCTDevMenu : NSObject <RCTBridgeModule, RCTInvalidating>

/**
 * Is the menu enabled. The menu is enabled by default in debug mode, but
 * you may wish to disable it so that you can provide your own shake handler.
 */
@property (nonatomic, assign) BOOL shakeToShow;

/**
 * Enables performance profiling.
 */
@property (nonatomic, assign) BOOL profilingEnabled;

/**
 * Enables automatic polling for JS code changes. Only applicable when
 * running the app from a server.
 */
@property (nonatomic, assign) BOOL liveReloadEnabled;

/**
 * The time between checks for code changes. Defaults to 1 second.
 */
@property (nonatomic, assign) NSTimeInterval liveReloadPeriod;

/**
 * Manually show the menu. This will.
 */
- (void)show;

@end

/**
 * This category makes the developer menu instance available via the
 * RCTBridge, which is useful for any class that needs to access the menu.
 */
@interface RCTBridge (RCTDevMenu)

@property (nonatomic, readonly) RCTDevMenu *devMenu;

@end
