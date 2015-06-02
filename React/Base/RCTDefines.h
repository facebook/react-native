/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

/**
 * Make global functions usable in C++
 */
#if defined(__cplusplus)
#define RCT_EXTERN extern "C" __attribute__((visibility("default")))
#else
#define RCT_EXTERN extern __attribute__((visibility("default")))
#endif

/**
 * The RCT_DEBUG macro can be used to exclude error checking and logging code
 * from release builds to improve performance and reduce binary size.
 */
#ifndef RCT_DEBUG
#if DEBUG
#define RCT_DEBUG 1
#else
#define RCT_DEBUG 0
#endif
#endif

/**
 * The RCT_DEV macro can be used to enable or disable development tools
 * such as the debug executors, dev menu, red box, etc.
 */
#ifndef RCT_DEV
#if DEBUG
#define RCT_DEV 1
#else
#define RCT_DEV 0
#endif
#endif

/**
 * By default, only raise an NSAssertion in debug mode
 * (custom assert functions will still be called).
 */
#ifndef RCT_NSASSERT
#if RCT_DEBUG
#define RCT_NSASSERT 1
#else
#define RCT_NSASSERT 0
#endif
#endif
