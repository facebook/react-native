/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <fabric/uimanager/ComponentDescriptorFactory.h>
#include <fabric/uimanager/ComponentDescriptorRegistry.h>

namespace facebook {
namespace react {

/**
 * This is a sample implementation. Each app should provide its own.
 */
SharedComponentDescriptorRegistry ComponentDescriptorFactory::buildRegistry(const SharedEventDispatcher &eventDispatcher) {
  auto registry = std::make_shared<ComponentDescriptorRegistry>();
  return registry;
}

} // namespace react
} // namespace facebook
