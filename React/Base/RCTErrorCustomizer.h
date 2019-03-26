/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@class RCTErrorInfo;

/**
 * Provides an interface to customize React Native error messages and stack
 * traces from exceptions.
 */
@protocol RCTErrorCustomizer <NSObject>

/**
 * Customizes the given error, returning the passed info argument if no
 * customization is required.
 */
- (nonnull RCTErrorInfo *)customizeErrorInfo:(nonnull RCTErrorInfo *)info;
@end
