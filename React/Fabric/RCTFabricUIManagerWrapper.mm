/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTFabricUIManagerWrapper.h"

#include <React/RCTCxxExceptionManager.h>
#include <fabric/uimanager/ComponentDescriptorRegistry.h>
#include <fabric/uimanager/FabricUIManager.h>
#include <fabric/view/ViewComponentDescriptor.h>
#include <folly/dynamic.h>
#include <folly/json.h>

#import "RCTFabricPlatformUIOperationManager.h"

// This file contains experimental placeholders, nothing is finalized.
@implementation RCTFabricUIManagerWrapper
{
  std::shared_ptr<FabricUIManager> _manager;
  std::shared_ptr<ExceptionManager> _exceptionManager;
  std::shared_ptr<IFabricPlatformUIOperationManager> _platformUIOperationManager;
}

- (instancetype)init
{
  self = [super init];
  if (self) {
    _exceptionManager = std::make_shared<RCTCxxExceptionManager>();
    _platformUIOperationManager = std::make_shared<RCTFabricPlatformUIOperationManagerConnector>();

    auto componentDescriptorRegistry = std::make_shared<ComponentDescriptorRegistry>();
    SharedComponentDescriptor viewComponentDescriptor = std::make_shared<ViewComponentDescriptor>();
    componentDescriptorRegistry->registerComponentDescriptor(viewComponentDescriptor);

    _manager = std::make_shared<FabricUIManager>(componentDescriptorRegistry);
  }
  return self;
}

- (std::shared_ptr<FabricUIManager>)manager
{
  return _manager;
}

- (std::shared_ptr<ExceptionManager>)exceptionManager
{
  return _exceptionManager;
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
