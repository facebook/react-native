/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTFabricUIManagerWrapper.h"

#include <fabric/FabricUIManager.h>

// This file contains experimental placeholders, nothing is finalized.
@implementation RCTFabricUIManagerWrapper
{
  std::shared_ptr<FabricUIManager> _manager;
}

- (instancetype)initWithManager:(std::shared_ptr<FabricUIManager>)manager
{
  self = [super init];
  if (self) {
    _manager = manager;
  }
  return self;
}

- (std::shared_ptr<FabricUIManager>)manager
{
  return _manager;
}

- (void)invalidate
{
}

@end

@implementation RCTBridge (RCTFabricUIManagerWrapper)

- (std::shared_ptr<FabricUIManager>)fabricUIManager
{
  RCTFabricUIManagerWrapper *wrapper = [self jsBoundExtraModuleForClass:[RCTFabricUIManagerWrapper class]];
  if (wrapper) {
    return [wrapper manager];
  }
  return nullptr;
}

@end
