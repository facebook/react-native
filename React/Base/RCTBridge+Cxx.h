/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// TODO(OSS Candidate ISS#2710739)

#import <React/RCTBridge.h>
#import <cxxreact/Instance.h>

@interface RCTBridge (Cxx)

- (std::shared_ptr<facebook::react::Instance>)reactInstance;

@end
