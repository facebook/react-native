/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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

/**
 * Should be used very early during app start up
 * Before the bridge is initialized
 * @return whether the app allows RTL layout, default is true
 */
@property(atomic, readwrite, setter=allowRTL:) bool isRTLAllowed;

/**
 * Could be used to test RTL layout with English
 * Used for development and testing purpose
 */
@property(atomic, readwrite, setter=forceRTL:) bool isRTLForced;

@property(atomic, readwrite, setter=swapLeftAndRightInRTL:) bool doLeftAndRightSwapInRTL;

@end
