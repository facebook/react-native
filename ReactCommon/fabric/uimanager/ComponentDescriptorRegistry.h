// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <memory>

#include <better/map.h>
#include <better/mutex.h>

#include <react/core/ComponentDescriptor.h>
#include <react/uimanager/ComponentDescriptorProvider.h>

namespace facebook {
namespace react {

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
   * Deprecated. Use custom constructor instead.
   */
  ComponentDescriptorRegistry() = default;

  /*
   * Creates an object with stored `ComponentDescriptorParameters`  which will
   * be used later to create `ComponentDescriptor`s.
   */
  ComponentDescriptorRegistry(ComponentDescriptorParameters const &parameters);

  /*
   * Deprecated. Use `add` instead.
   */
  void registerComponentDescriptor(
      SharedComponentDescriptor componentDescriptor) const;

  ComponentDescriptor const &at(ComponentName const &componentName) const;
  ComponentDescriptor const &at(ComponentHandle componentHandle) const;

  SharedShadowNode createNode(
      Tag tag,
      ComponentName const &viewName,
      SurfaceId surfaceId,
      folly::dynamic const &props,
      SharedEventTarget const &eventTarget) const;

  void setFallbackComponentDescriptor(SharedComponentDescriptor descriptor);
  ComponentDescriptor::Shared getFallbackComponentDescriptor() const;

 private:
  friend class ComponentDescriptorProviderRegistry;

  /*
   * Adds (or removes) a `ComponentDescriptor ` created using given
   * `ComponentDescriptorProvider` and stored `ComponentDescriptorParameters`.
   * To be used by `ComponentDescriptorProviderRegistry` only.
   * Thread safe.
   */
  void add(ComponentDescriptorProvider componentDescriptorProvider) const;
  void remove(ComponentDescriptorProvider componentDescriptorProvider) const;

  mutable better::shared_mutex mutex_;
  mutable better::map<ComponentHandle, SharedComponentDescriptor>
      _registryByHandle;
  mutable better::map<ComponentName, SharedComponentDescriptor> _registryByName;
  ComponentDescriptor::Shared _fallbackComponentDescriptor;
  ComponentDescriptorParameters parameters_{};
};

} // namespace react
} // namespace facebook
