/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// [macOS]

#import <React/RCTBridge.h>
#import <cxxreact/Instance.h>

@interface RCTBridge (Cxx)

- (std::weak_ptr<facebook::react::Instance>)reactInstance;

@end
