/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <better/map.h>
#include <better/mutex.h>

#include <react/renderer/componentregistry/ComponentDescriptorProvider.h>
#include <react/renderer/core/ComponentDescriptor.h>
#include <react/utils/ContextContainer.h>

namespace facebook {
namespace react {

class ComponentDescriptorProviderRegistry;
class ComponentDescriptorRegistry;

using SharedComponentDescriptorRegistry =
    std::shared_ptr<const ComponentDescriptorRegistry>;

/*
 * Registry of particular `ComponentDescriptor`s.
 */
class ComponentDescriptorRegistry {
 public:
  using Shared = std::shared_ptr<const ComponentDescriptorRegistry>;

  /*
   * Creates an object with stored `ComponentDescriptorParameters`  which will
   * be used later to create `ComponentDescriptor`s.
   */
  ComponentDescriptorRegistry(
      ComponentDescriptorParameters const &parameters,
      ComponentDescriptorProviderRegistry const &providerRegistry,
      ContextContainer::Shared contextContainer);

  /*
   * This is broken. Please do not use.
   * If you requesting a ComponentDescriptor and unsure that it's there, you are
   * doing something wrong.
   */
  ComponentDescriptor const *
  findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN(
      ComponentHandle componentHandle) const;

  ComponentDescriptor const &at(std::string const &componentName) const;
  ComponentDescriptor const &at(ComponentHandle componentHandle) const;

  bool hasComponentDescriptorAt(ComponentHandle componentHandle) const;

  ShadowNode::Shared createNode(
      Tag tag,
      std::string const &viewName,
      SurfaceId surfaceId,
      folly::dynamic const &props,
      SharedEventTarget const &eventTarget) const;

  void setFallbackComponentDescriptor(SharedComponentDescriptor descriptor);
  ComponentDescriptor::Shared getFallbackComponentDescriptor() const;

 private:
  friend class ComponentDescriptorProviderRegistry;

  void registerComponentDescriptor(
      SharedComponentDescriptor componentDescriptor) const;

  /*
   * Creates a `ComponentDescriptor` using specified
   * `ComponentDescriptorProvider` and stored `ComponentDescriptorParameters`,
   * and then adds that to the registry.
   * To be used by `ComponentDescriptorProviderRegistry` only.
   * Thread safe.
   */
  void add(ComponentDescriptorProvider componentDescriptorProvider) const;

  mutable better::shared_mutex mutex_;
  mutable better::map<ComponentHandle, SharedComponentDescriptor>
      _registryByHandle;
  mutable better::map<std::string, SharedComponentDescriptor> _registryByName;
  ComponentDescriptor::Shared _fallbackComponentDescriptor;
  ComponentDescriptorParameters parameters_{};
  ComponentDescriptorProviderRegistry const &providerRegistry_;
  ContextContainer::Shared contextContainer_;
};

} // namespace react
} // namespace facebook
