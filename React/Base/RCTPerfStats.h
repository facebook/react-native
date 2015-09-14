/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTBridge.h"
#import "RCTFPSGraph.h"

@interface RCTPerfStats : NSObject

@property (nonatomic, strong) RCTFPSGraph *jsGraph;
@property (nonatomic, strong) RCTFPSGraph *uiGraph;

- (void)show;
- (void)hide;

@end

@interface RCTBridge (RCTPerfStats)

@property (nonatomic, strong, readonly) RCTPerfStats *perfStats;

@end
