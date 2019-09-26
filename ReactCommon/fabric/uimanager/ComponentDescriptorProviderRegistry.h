/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/mutex.h>

#include <react/core/ComponentDescriptor.h>
#include <react/uimanager/ComponentDescriptorProvider.h>
#include <react/uimanager/ComponentDescriptorRegistry.h>

namespace facebook {
namespace react {

/*
 * Registry of `ComponentDescriptorProvider`s (and managed
 * `ComponentDescriptorRegistry`s). The class maintains a list of
 * `ComponentDescriptorRegistry`s (retaining pointers weakly) and update them
 * accordingly to changes in the provider registry.
 */
class ComponentDescriptorProviderRegistry final {
 public:
  /*
   * Adds (or removes) a `ComponentDescriptorProvider`s and update the managed
   * `ComponentDescriptorRegistry`s accordingly.
   */
  void add(ComponentDescriptorProvider provider) const;
  void remove(ComponentDescriptorProvider provider) const;

  /*
   * Creates managed `ComponentDescriptorRegistry` based on a stored list of
   * `ComponentDescriptorProvider`s and given `ComponentDescriptorParameters`.
   */
  ComponentDescriptorRegistry::Shared createComponentDescriptorRegistry(
      ComponentDescriptorParameters const &parameters) const;

 private:
  mutable better::shared_mutex mutex_;
  mutable std::vector<std::weak_ptr<ComponentDescriptorRegistry const>>
      componentDescriptorRegistries_;
  mutable better::map<ComponentHandle, ComponentDescriptorProvider const>
      componentDescriptorProviders_;
};

} // namespace react
} // namespace facebook
