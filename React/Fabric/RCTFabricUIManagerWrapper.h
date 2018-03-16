/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <memory>

#import <React/RCTBridge.h>
#import <React/RCTInvalidating.h>
#import <React/RCTShadowView.h>

namespace facebook {
namespace react {

class FabricUIManager;

} // namespace react
} // namespace facebook

using namespace facebook::react;

/**
 * An ObjC++ wrapper around the C++ FabricUIManager instance, so that the RCTCxxBridge can access it as needed.
 */
@interface RCTFabricUIManagerWrapper : NSObject <RCTInvalidating>

- (std::shared_ptr<FabricUIManager>)manager;

@end

@interface RCTBridge (RCTFabricUIManagerWrapper)

/**
 * To access via the bridge:
 *
 *   std::shared_ptr<FabricUIManager> fabricUIManager = [_bridge fabricUIManager];
 */
- (std::shared_ptr<FabricUIManager>)fabricUIManager;

@end
