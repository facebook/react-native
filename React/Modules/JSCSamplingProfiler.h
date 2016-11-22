/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import "RCTBridgeModule.h"

@interface JSCSamplingProfiler : NSObject <RCTBridgeModule>

/**
 * Receives a JSON string containing the result of a JSC CPU Profiling run,
 *  and sends them to the packager to be symbolicated and saved to disk.
 * It is safe to call this method from any thread.
 */
- (void)operationCompletedWithResults:(NSString *)results;

@end
