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
@interface RCTDevMenu : NSObject

/**
 * Is the menu enabled. The menu is enabled by default if RCT_DEV=1, but
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
 * Shows the FPS monitor for the JS and Main threads
 */
@property (nonatomic, assign) BOOL showFPS;

/**
 * Manually show the dev menu (can be called from JS).
 */
- (void)show;

/**
 * Manually reload the application. Equivalent to calling [bridge reload]
 * directly, but can be called from JS.
 */
- (void)reload;

/**
 * Add custom item to the development menu. The handler will be called
 * when user selects the item.
 */
- (void)addItem:(NSString *)title handler:(dispatch_block_t)handler;

@end

/**
 * This category makes the developer menu instance available via the
 * RCTBridge, which is useful for any class that needs to access the menu.
 */
@interface RCTBridge (RCTDevMenu)

@property (nonatomic, readonly) RCTDevMenu *devMenu;

@end
