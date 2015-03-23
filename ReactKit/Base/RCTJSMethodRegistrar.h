/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@class RCTBridge;

/**
 * Provides an interface to register JS methods to be called via the bridge.
 */
@protocol RCTJSMethodRegistrar <NSObject>
@optional

/**
 * An array of JavaScript methods that the class will call via the
 * -[RCTBridge enqueueJSCall:args:] method. Each method should be specified
 * as a string of the form "JSModuleName.jsMethodName". Attempting to call a
 * method that has not been registered will result in an error. If a method
 * has already been registered by another class, it is not necessary to
 * register it again, but it is good practice. Registering the same method
 * more than once is silently ignored and will not result in an error.
 */
+ (NSArray *)JSMethods;

@end
