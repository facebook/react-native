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

namespace facebook {
namespace xplat {
namespace module {
class CxxModule;
}
}
}

/**
 * Subclass RCTCxxModule to use cross-platform CxxModule on iOS.
 *
 * Subclasses must implement the createModule method to lazily produce the module. When running under the Cxx bridge
 * modules will be accessed directly, under the Objective-C bridge method access is wrapped through RCTCxxMethod.
 */
@interface RCTCxxModule : NSObject <RCTBridgeModule>

// To be implemented by subclasses
- (std::unique_ptr<facebook::xplat::module::CxxModule>)createModule;

@end
