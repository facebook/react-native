/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <memory>

#include <fabric/IFabricPlatformUIOperationManager.h>

@class RCTFabricPlatformUIOperationManager;

namespace facebook {
namespace react {

/**
 * Connector class (from C++ to ObjC++) to allow FabricUIManager to invoke native UI operations/updates.
 * UIKit-related impl doesn't live here, but this class gets passed to the FabricUIManager C++ impl directly.
 */
class RCTFabricPlatformUIOperationManagerConnector : public IFabricPlatformUIOperationManager {
public:
  RCTFabricPlatformUIOperationManagerConnector();
  ~RCTFabricPlatformUIOperationManagerConnector();

  void performUIOperation();

private:
  void *self_;
  RCTFabricPlatformUIOperationManager *manager_;
};

} // namespace react
} // namespace facebook

/**
 * Actual ObjC++ implementation of the UI operations.
 */
@interface RCTFabricPlatformUIOperationManager : NSObject

- (void)performUIOperation;

@end
