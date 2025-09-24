/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@class NSBigStringBuffer;

/**
 * Provides the interface needed to register a Bundle Provider module.
 */
@interface RCTBundleProvider : NSObject

- (NSBigStringBuffer *)getBundle;
- (void)setBundle:(NSBigStringBuffer *)bundle;
- (NSString *)getSourceURL;
- (void)setSourceURL:(NSString *)sourceURL;

@end
