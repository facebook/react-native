/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ComponentDescriptor.h"

namespace facebook::react {

ComponentDescriptor::ComponentDescriptor(
    const ComponentDescriptorParameters& parameters)
    : eventDispatcher_(parameters.eventDispatcher),
      contextContainer_(parameters.contextContainer),
      flavor_(parameters.flavor) {}

const ContextContainer::Shared& ComponentDescriptor::getContextContainer()
    const {
  return contextContainer_;
}

} // namespace facebook::react
