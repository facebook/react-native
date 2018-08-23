/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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

#ifndef RCT_ENABLE_INSPECTOR
#if RCT_DEV && __has_include(<React/RCTInspectorDevServerHelper.h>)
#define RCT_ENABLE_INSPECTOR 1
#else
#define RCT_ENABLE_INSPECTOR 0
#endif
#endif

#ifndef ENABLE_PACKAGER_CONNECTION
#if RCT_DEV && __has_include(<React/RCTPackagerConnection.h>)
#define ENABLE_PACKAGER_CONNECTION 1
#else
#define ENABLE_PACKAGER_CONNECTION 0
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
 * Add the default Metro packager port number
 */
#ifndef RCT_METRO_PORT
#define RCT_METRO_PORT 8081
#else
// test if RCT_METRO_PORT is empty
#define RCT_METRO_PORT_DO_EXPAND(VAL)  VAL ## 1
#define RCT_METRO_PORT_EXPAND(VAL)     RCT_METRO_PORT_DO_EXPAND(VAL)
#if !defined(RCT_METRO_PORT) || (RCT_METRO_PORT_EXPAND(RCT_METRO_PORT) == 1)
// Only here if RCT_METRO_PORT is not defined
// OR RCT_METRO_PORT is the empty string
#undef RCT_METRO_PORT
#define RCT_METRO_PORT 8081
#endif
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
  * This attribute is used for static analysis.
  */
#if !defined RCT_DYNAMIC
#if __has_attribute(objc_dynamic)
#define RCT_DYNAMIC __attribute__((objc_dynamic))
#else
#define RCT_DYNAMIC
#endif
#endif

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

/**
 * Check if WebKit iOS 10.0 APIs are available.
 */
#define WEBKIT_IOS_10_APIS_AVAILABLE __has_include(<WebKit/WKAudiovisualMediaTypes.h>)
