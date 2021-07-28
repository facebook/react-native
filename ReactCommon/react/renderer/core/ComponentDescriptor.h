/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/EventDispatcher.h>
#include <react/renderer/core/Props.h>
#include <react/renderer/core/RawPropsParser.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/core/State.h>
#include <react/renderer/core/StateData.h>
#include <react/utils/ContextContainer.h>

namespace facebook {
namespace react {

class ComponentDescriptorParameters;
class ComponentDescriptor;

using SharedComponentDescriptor = std::shared_ptr<ComponentDescriptor const>;

/*
 * Abstract class defining an interface of `ComponentDescriptor`.
 * `ComponentDescriptor` represents particular `ShadowNode` type and
 * defines (customizes) basic operations with particular kind of
 * `ShadowNode`s (such as creating, cloning, props and children managing).
 */
class ComponentDescriptor {
 public:
  using Shared = std::shared_ptr<ComponentDescriptor const>;
  using Unique = std::unique_ptr<ComponentDescriptor const>;

  /*
   * `Flavor` is a special concept designed to allow registering instances of
   * the exact same `ComponentDescriptor` class with different `ComponentName`
   * and `ComponentHandle` (the particular custom implementation might use
   * stored `flavor` to return different values from those virtual methods).
   * Since it's a very niche requirement (e.g. we plan to use it for
   * an interoperability layer with Paper), we are thinking about removing this
   * feature completely after it's no longer needed.
   */
  using Flavor = std::shared_ptr<void const>;

  ComponentDescriptor(ComponentDescriptorParameters const &parameters);

  virtual ~ComponentDescriptor() = default;

  /*
   * Returns stored instance of `ContextContainer`.
   */
  ContextContainer::Shared const &getContextContainer() const;

  /*
   * Returns `componentHandle` associated with particular kind of components.
   * All `ShadowNode`s of this type must return same `componentHandle`.
   */
  virtual ComponentHandle getComponentHandle() const = 0;

  /*
   * Returns component's name.
   * React uses a `name` to refer to particular kind of components in
   * `create` requests.
   */
  virtual ComponentName getComponentName() const = 0;

  /*
   * Returns traits associated with a particular component type.
   */
  virtual ShadowNodeTraits getTraits() const = 0;

  /*
   * Creates a new `ShadowNode` of a particular component type.
   */
  virtual ShadowNode::Shared createShadowNode(
      const ShadowNodeFragment &fragment,
      ShadowNodeFamily::Shared const &family) const = 0;

  /*
   * Clones a `ShadowNode` with optionally new `props` and/or `children`.
   */
  virtual ShadowNode::Unshared cloneShadowNode(
      const ShadowNode &sourceShadowNode,
      const ShadowNodeFragment &fragment) const = 0;

  /*
   * Appends (by mutating) a given `childShadowNode` to `parentShadowNode`.
   */
  virtual void appendChild(
      const ShadowNode::Shared &parentShadowNode,
      const ShadowNode::Shared &childShadowNode) const = 0;

  /*
   * Creates a new `Props` of a particular type with all values copied from
   * `props` and `rawProps` applied on top of this.
   * If `props` is `nullptr`, a default `Props` object (with default values)
   * will be used.
   * Must return an object which is NOT pointer equal to `props`.
   */
  virtual SharedProps cloneProps(
      const SharedProps &props,
      const RawProps &rawProps) const = 0;

  /*
   * Creates a new `Props` of a particular type with all values interpolated
   * between `props` and `newProps`.
   */
  virtual SharedProps interpolateProps(
      float animationProgress,
      const SharedProps &props,
      const SharedProps &newProps) const = 0;

  /*
   * Create an initial State object that represents (and contains) an initial
   * State's data which can be constructed based on initial Props.
   */
  virtual State::Shared createInitialState(
      ShadowNodeFragment const &fragment,
      ShadowNodeFamily::Shared const &family) const = 0;

  /*
   * Creates a new State object that represents (and contains) a new version of
   * State's data.
   */
  virtual State::Shared createState(
      ShadowNodeFamily const &family,
      const StateData::Shared &data) const = 0;

  /*
   * Creates a shadow node family for particular node.
   */
  virtual ShadowNodeFamily::Shared createFamily(
      ShadowNodeFamilyFragment const &fragment,
      SharedEventTarget eventTarget) const = 0;

 protected:
  EventDispatcher::Weak eventDispatcher_;
  ContextContainer::Shared contextContainer_;
  RawPropsParser rawPropsParser_{};
  Flavor flavor_;
};

/*
 * Represents a collection of arguments that sufficient to construct a
 * `ComponentDescriptor`.
 */
class ComponentDescriptorParameters {
 public:
  EventDispatcher::Weak eventDispatcher;
  ContextContainer::Shared contextContainer;
  ComponentDescriptor::Flavor flavor;
};

} // namespace react
} // namespace facebook
