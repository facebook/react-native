/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// [macOS]

#import "RCTBridge+Cxx.h"
#import "RCTBridge+Private.h"
#import <objc/runtime.h>

@implementation RCTBridge (Cxx)

- (std::weak_ptr<facebook::react::Instance>)reactInstance {
	std::weak_ptr<facebook::react::Instance> instance;
	RCTBridge *batchBridge = [self batchedBridge];
	if ([batchBridge isKindOfClass:[RCTCxxBridge class]]) {
		RCTCxxBridge *cxxBridge = (RCTCxxBridge *)batchBridge;
		instance = [cxxBridge reactInstance];
	}
	return instance;
}

@end
