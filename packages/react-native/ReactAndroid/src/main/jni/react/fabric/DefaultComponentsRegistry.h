/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>

namespace facebook::react::DefaultComponentsRegistry {

extern std::function<void(
    std::shared_ptr<const ComponentDescriptorProviderRegistry>)>
    registerComponentDescriptorsFromEntryPoint;

} // namespace facebook::react::DefaultComponentsRegistry
