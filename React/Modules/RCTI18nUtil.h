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
 * @experimental
 * This is a experimental module for to expose constance IsRTL to js about the RTL status.
 * And it allows js to force RLT status for development propose.
 * This will also provide other i18n related utilities in the future.
 */
@interface RCTI18nUtil : NSObject

+ (instancetype)sharedInstance;

- (BOOL)isRTL;
- (BOOL)isRTLAllowed;
- (void)allowRTL:(BOOL)value;
- (BOOL)isRTLForced;
- (void)forceRTL:(BOOL)value;
- (BOOL)doLeftAndRightSwapInRTL;
- (void)swapLeftAndRightInRTL:(BOOL)value;

@end
