/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <jsireact/JSIExecutor.h>

@class NSBundleWrapper;

/**
 * Provides the interface needed to register a Bundle Provider module.
 */
@interface RCTBundleProvider : NSObject

- (std::shared_ptr<const facebook::react::BigStringBuffer>)getBundle;
- (NSString *)getSourceURL;

@end
