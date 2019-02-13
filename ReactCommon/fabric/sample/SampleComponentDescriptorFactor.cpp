/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/uimanager/ComponentDescriptorFactory.h>
#include <react/uimanager/ComponentDescriptorRegistry.h>
#include <react/uimanager/ContextContainer.h>

namespace facebook {
namespace react {

/**
 * This is a sample implementation. Each app should provide its own.
 */
ComponentRegistryFactory getDefaultComponentRegistryFactory() {
  return [](const SharedEventDispatcher &eventDispatcher,
            const SharedContextContainer &contextContainer) {
    auto registry = std::make_shared<ComponentDescriptorRegistry>();
    return registry;
  }
}

} // namespace react
} // namespace facebook
