/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <react/core/ComponentDescriptor.h>
#include <react/events/EventDispatcher.h>
#include <react/uimanager/ContextContainer.h>

#include "ComponentDescriptorRegistry.h"

namespace facebook {
namespace react {

/**
 * A factory to provide hosting app specific set of ComponentDescriptor's.
 * Each app must provide an implementation of the static class method which
 * should register its specific set of supported components.
 */
using ComponentRegistryFactory =
    std::function<SharedComponentDescriptorRegistry(
        const SharedEventDispatcher &eventDispatcher,
        const SharedContextContainer &contextContainer)>;

ComponentRegistryFactory getDefaultComponentRegistryFactory();

} // namespace react
} // namespace facebook
