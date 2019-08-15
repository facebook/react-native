/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/core/EventDispatcher.h>
#include <react/core/Props.h>
#include <react/core/ShadowNode.h>
#include <react/core/State.h>
#include <react/core/StateData.h>
#include <react/utils/ContextContainer.h>

namespace facebook {
namespace react {

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

  ComponentDescriptor(
      EventDispatcher::Shared const &eventDispatcher,
      ContextContainer::Shared const &contextContainer = {});

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
   * Creates a new `ShadowNode` of a particular type.
   */
  virtual SharedShadowNode createShadowNode(
      const ShadowNodeFragment &fragment) const = 0;

  /*
   * Clones a `ShadowNode` with optionally new `props` and/or `children`.
   */
  virtual UnsharedShadowNode cloneShadowNode(
      const ShadowNode &sourceShadowNode,
      const ShadowNodeFragment &fragment) const = 0;

  /*
   * Appends (by mutating) a given `childShadowNode` to `parentShadowNode`.
   */
  virtual void appendChild(
      const SharedShadowNode &parentShadowNode,
      const SharedShadowNode &childShadowNode) const = 0;

  /*
   * Creates a new `Props` of a particular type with all values copied from
   * `props` and `rawProps` applied on top of this.
   * If `props` is `nullptr`, a default `Props` object (with default values)
   * will be used.
   */
  virtual SharedProps cloneProps(
      const SharedProps &props,
      const RawProps &rawProps) const = 0;

  /*
   * Creates a new `EventEmitter` object compatible with particular type of
   * shadow nodes.
   */
  virtual SharedEventEmitter createEventEmitter(
      SharedEventTarget eventTarget,
      const Tag &tag) const = 0;

  /*
   * Create an initial State object that represents (and contains) an initial
   * State's data which can be constructed based on initial Props.
   */
  virtual State::Shared createInitialState(
      ShadowNodeFragment const &fragment) const = 0;

  /*
   * Creates a new State object that represents (and contains) a new version of
   * State's data.
   */
  virtual State::Shared createState(
      const State::Shared &previousState,
      const StateData::Shared &data) const = 0;

 protected:
  EventDispatcher::Shared eventDispatcher_;
  ContextContainer::Shared contextContainer_;
};

} // namespace react
} // namespace facebook
