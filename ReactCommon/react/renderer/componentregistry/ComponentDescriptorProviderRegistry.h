/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <butter/mutex.h>

#include <react/renderer/componentregistry/ComponentDescriptorProvider.h>
#include <react/renderer/componentregistry/ComponentDescriptorRegistry.h>
#include <react/renderer/core/ComponentDescriptor.h>
#include <react/utils/ContextContainer.h>

namespace facebook {
namespace react {

using ComponentDescriptorProviderRequest =
    std::function<void(ComponentName componentName)>;

/*
 * Registry of `ComponentDescriptorProvider`s (and managed
 * `ComponentDescriptorRegistry`s). The class maintains a list of
 * `ComponentDescriptorRegistry`s (retaining pointers weakly) and update them
 * accordingly to changes in the provider registry.
 */
class ComponentDescriptorProviderRegistry final {
 public:
  /*
   * Adds a `ComponentDescriptorProvider`s and update the managed
   * `ComponentDescriptorRegistry`s accordingly.
   * The methods can be called on any thread.
   */
  void add(const ComponentDescriptorProvider &provider) const;

  /*
   * ComponenDescriptorRegistry will call the `request` in case if a component
   * with given name wasn't registered yet.
   * The request handler must register a ComponentDescripor with requested name
   * synchronously during handling the request.
   * The request can be called on any thread.
   * The methods can be called on any thread.
   */
  void setComponentDescriptorProviderRequest(
      ComponentDescriptorProviderRequest request) const;

  /*
   * Creates managed `ComponentDescriptorRegistry` based on a stored list of
   * `ComponentDescriptorProvider`s and given `ComponentDescriptorParameters`.
   * The methods can be called on any thread.
   */
  ComponentDescriptorRegistry::Shared createComponentDescriptorRegistry(
      ComponentDescriptorParameters const &parameters) const;

 private:
  friend class ComponentDescriptorRegistry;

  void request(ComponentName componentName) const;

  mutable butter::shared_mutex mutex_;
  mutable std::vector<std::weak_ptr<ComponentDescriptorRegistry const>>
      componentDescriptorRegistries_;
  mutable butter::map<ComponentHandle, ComponentDescriptorProvider const>
      componentDescriptorProviders_;
  mutable ComponentDescriptorProviderRequest
      componentDescriptorProviderRequest_;
};

} // namespace react
} // namespace facebook
