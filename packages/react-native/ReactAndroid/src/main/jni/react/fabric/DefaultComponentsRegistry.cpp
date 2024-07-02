/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "DefaultComponentsRegistry.h"

namespace facebook::react::DefaultComponentsRegistry {

std::function<void(std::shared_ptr<const ComponentDescriptorProviderRegistry>)>
    registerComponentDescriptorsFromEntryPoint;

} // namespace facebook::react::DefaultComponentsRegistry
