/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <memory>

#import <Foundation/Foundation.h>

#import <React/RCTBridgeModule.h>
#import <cxxreact/CxxModule.h>

@interface RCTCxxModule : NSObject <RCTBridgeModule>

- (instancetype)initWithCxxModule:(std::unique_ptr<facebook::xplat::module::CxxModule>)module;

- (NSArray *)methodsToExport;
- (NSDictionary *)constantsToExport;

// Extracts the module from its objc wrapper
- (std::unique_ptr<facebook::xplat::module::CxxModule>)move;

@end
