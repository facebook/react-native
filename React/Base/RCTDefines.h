/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#if __OBJC__
#  import <Foundation/Foundation.h>
#endif

/**
 * Make global functions usable in C++
 */
#if defined(__cplusplus)
#define RCT_EXTERN extern "C" __attribute__((visibility("default")))
#define RCT_EXTERN_C_BEGIN extern "C" {
#define RCT_EXTERN_C_END }
#else
#define RCT_EXTERN extern __attribute__((visibility("default")))
#define RCT_EXTERN_C_BEGIN
#define RCT_EXTERN_C_END
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

#if RCT_DEV
#define RCT_IF_DEV(...) __VA_ARGS__
#else
#define RCT_IF_DEV(...)
#endif

#ifndef RCT_PROFILE
#define RCT_PROFILE RCT_DEV
#endif

/**
 * By default, only raise an NSAssertion in debug mode
 * (custom assert functions will still be called).
 */
#ifndef RCT_NSASSERT
#define RCT_NSASSERT RCT_DEBUG
#endif

/**
 * Concat two literals. Supports macro expansions,
 * e.g. RCT_CONCAT(foo, __FILE__).
 */
#define RCT_CONCAT2(A, B) A ## B
#define RCT_CONCAT(A, B) RCT_CONCAT2(A, B)

/**
 * Throw an assertion for unimplemented methods.
 */
#define RCT_NOT_IMPLEMENTED(method) \
_Pragma("clang diagnostic push") \
_Pragma("clang diagnostic ignored \"-Wmissing-method-return-type\"") \
_Pragma("clang diagnostic ignored \"-Wunused-parameter\"") \
RCT_EXTERN NSException *_RCTNotImplementedException(SEL, Class); \
method NS_UNAVAILABLE { @throw _RCTNotImplementedException(_cmd, [self class]); } \
_Pragma("clang diagnostic pop")
