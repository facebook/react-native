/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTFabricPlatformUIOperationManager.h"

namespace facebook {
namespace react {

RCTFabricPlatformUIOperationManagerConnector::RCTFabricPlatformUIOperationManagerConnector() {
  self_ = (__bridge_retained void *)[RCTFabricPlatformUIOperationManager new];
  manager_ = (__bridge RCTFabricPlatformUIOperationManager *)self_;
}

RCTFabricPlatformUIOperationManagerConnector::~RCTFabricPlatformUIOperationManagerConnector() {
  CFRelease(self_);
  self_ = NULL;
  manager_ = NULL;
}

void RCTFabricPlatformUIOperationManagerConnector::performUIOperation() {
  [manager_ performUIOperation];
}

} // namespace react
} // namespace facebook

// -----------------------------------------------------------------------------
// Start of ObjC++ impl
// Access UIKit here.
// -----------------------------------------------------------------------------
@implementation RCTFabricPlatformUIOperationManager

- (void)dealloc
{
  NSLog(@"RCTFabricPlatformUIOperationManager: dealloc()");
}

- (void)performUIOperation
{
  // TODO
  NSLog(@"RCTFabricPlatformUIOperationManager: performUIOperation()");
}

@end
