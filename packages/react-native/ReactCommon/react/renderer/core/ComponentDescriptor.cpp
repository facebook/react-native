/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ComponentDescriptor.h"
#include <react/utils/ContextContainer.h>

namespace facebook::react {

ComponentDescriptor::ComponentDescriptor(
    const ComponentDescriptorParameters& parameters,
    RawPropsParser&& rawPropsParser)
    : eventDispatcher_(parameters.eventDispatcher),
      contextContainer_(parameters.contextContainer),
      flavor_(parameters.flavor),
      rawPropsParser_(std::move(rawPropsParser)) {}

const std::shared_ptr<const ContextContainer>&
ComponentDescriptor::getContextContainer() const {
  return contextContainer_;
}

} // namespace facebook::react
