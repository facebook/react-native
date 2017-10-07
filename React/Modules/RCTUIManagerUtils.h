/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <React/RCTAssert.h>
#import <React/RCTDefines.h>

/**
 * Returns UIManager queue.
 */
RCT_EXTERN dispatch_queue_t RCTGetUIManagerQueue(void);

/**
 * Default name for the UIManager queue.
 */
RCT_EXTERN char *const RCTUIManagerQueueName;

/**
 * Check if we are currently on UIManager queue.
 */
RCT_EXTERN BOOL RCTIsUIManagerQueue(void);

/**
 * *Asynchronously* executes the specified block on the UIManager queue.
 * Unlike `dispatch_async()` this will execute the block immediately
 * if we're already on the UIManager queue.
 */
RCT_EXTERN void RCTExecuteOnUIManagerQueue(dispatch_block_t block);

/**
 * *Synchorously* executes the specified block on the UIManager queue.
 * Unlike `dispatch_sync()` this will execute the block immediately
 * if we're already on the UIManager queue.
 * Please do not use this unless you really know what you're doing.
 */
RCT_EXTERN void RCTUnsafeExecuteOnUIManagerQueueSync(dispatch_block_t block);

/**
 * Convenience macro for asserting that we're running on UIManager queue.
 */
#define RCTAssertUIManagerQueue() RCTAssert(RCTIsUIManagerQueue(), \
@"This function must be called on the UIManager queue")
