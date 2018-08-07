/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <fabric/core/ComponentDescriptor.h>
#include <fabric/events/EventDispatcher.h>
#include <fabric/uimanager/ContextContainer.h>

#include "ComponentDescriptorRegistry.h"

namespace facebook {
namespace react {

/**
 * A factory to provide hosting app specific set of ComponentDescriptor's.
 * Each app must provide an implementation of the static class method which
 * should register its specific set of supported components.
 */
class ComponentDescriptorFactory {

public:
  static SharedComponentDescriptorRegistry buildRegistry(const SharedEventDispatcher &eventDispatcher, const SharedContextContainer &contextContainer);
};

} // namespace react
} // namespace facebook
