/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <React/RCTDefines.h>

/**
 * This constant can be returned from +methodQueue to force module
 * methods to be called on the JavaScript thread. This can have serious
 * implications for performance, so only use this if you're sure it's what
 * you need.
 *
 * NOTE: RCTJSThread is not a real libdispatch queue
 */
RCT_EXTERN dispatch_queue_t RCTJSThread;

/**
 * Initializes the RCTJSThread constant.
 * Exported because the bridgeless initialization layer needs to initialize
 * RCTJSThread. In bridgeless mode, RCTBridge isn't accessed, and RCTJSThread
 * therefore isn't initialized.
 */
RCT_EXTERN void _RCTInitializeJSThreadConstantInternal(void);
