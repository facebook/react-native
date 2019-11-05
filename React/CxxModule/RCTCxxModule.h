/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
