/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#ifdef __cplusplus
#import <jsireact/JSIExecutor.h>
#endif // __cplusplus

@class NSBundleWrapper;

/**
 * Provides the interface needed to register a Bundle Provider module.
 */
@interface RCTBundleProvider : NSObject

#ifdef __cplusplus

- (std::shared_ptr<const facebook::react::JSBigString>)getBundle;
- (NSString *)getSourceURL;

#endif // __cplusplus

@end
