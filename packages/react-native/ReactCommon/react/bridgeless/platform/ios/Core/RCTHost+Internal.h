/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTHost.h"

typedef NSURL * (^RCTHostBundleURLProvider)(void);

@interface RCTHost (Internal)

- (void)registerSegmentWithId:(NSNumber *)segmentId path:(NSString *)path;
- (void)setBundleURLProvider:(RCTHostBundleURLProvider)bundleURLProvider;

@end
