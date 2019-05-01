/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/core/ComponentDescriptor.h>
#include <react/core/EventDispatcher.h>
#include <react/utils/ContextContainer.h>

namespace facebook {
namespace react {

/*
 * Represents a collection of arguments that sufficient to construct a
 * `ComponentDescriptor`.
 */
class ComponentDescriptorParameters {
 public:
  EventDispatcher::Shared eventDispatcher;
  ContextContainer::Shared contextContainer;
};

/*
 * Callable signature that represents the signature of `ComponentDescriptor`
 * constructor. The callable returns a unique pointer conveniently represents an
 * abstract type and ownership of the newly created object.
 */
using ComponentDescriptorConstructor = ComponentDescriptor::Unique(
    EventDispatcher::Shared const &eventDispatcher,
    ContextContainer::Shared const &contextContainer);

/*
 * Represents a unified way to construct an instance of a particular stored
 * `ComponentDescriptor` class. C++ does not allow to create pointers to
 * constructors, so we have to have such data structure to manipulate a
 * collection of classes.
 */
class ComponentDescriptorProvider final {
 public:
  ComponentHandle handle;
  ComponentName name;
  ComponentDescriptorConstructor *constructor;
};

/*
 * Creates a `ComponentDescriptorConstructor` for given `ComponentDescriptor`
 * class.
 */
template <typename ComponentDescriptorT>
ComponentDescriptor::Unique concreteComponentDescriptorConstructor(
    EventDispatcher::Shared const &eventDispatcher,
    ContextContainer::Shared const &contextContainer) {
  static_assert(
      std::is_base_of<ComponentDescriptor, ComponentDescriptorT>::value,
      "ComponentDescriptorT must be a descendant of ComponentDescriptor");

  return std::make_unique<ComponentDescriptorT const>(
      eventDispatcher, contextContainer);
}

/*
 * Creates a `ComponentDescriptorProvider` for given `ComponentDescriptor`
 * class.
 */
template <typename ComponentDescriptorT>
ComponentDescriptorProvider concreteComponentDescriptorProvider() {
  static_assert(
      std::is_base_of<ComponentDescriptor, ComponentDescriptorT>::value,
      "ComponentDescriptorT must be a descendant of ComponentDescriptor");

  return {ComponentDescriptorT::ConcreteShadowNode::Handle(),
          ComponentDescriptorT::ConcreteShadowNode::Name(),
          &concreteComponentDescriptorConstructor<ComponentDescriptorT>};
}

} // namespace react
} // namespace facebook
