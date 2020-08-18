/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ComponentDescriptor.h"

namespace facebook {
namespace react {

ComponentDescriptor::ComponentDescriptor(
    EventDispatcher::Weak const &eventDispatcher,
    ContextContainer::Shared const &contextContainer,
    ComponentDescriptor::Flavor const &flavor)
    : eventDispatcher_(eventDispatcher),
      contextContainer_(contextContainer),
      flavor_(flavor) {}

ContextContainer::Shared const &ComponentDescriptor::getContextContainer()
    const {
  return contextContainer_;
}

} // namespace react
} // namespace facebook
