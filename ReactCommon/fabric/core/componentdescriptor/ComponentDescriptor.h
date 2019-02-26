/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/core/Props.h>
#include <react/core/ShadowNode.h>

namespace facebook {
namespace react {

class ComponentDescriptor;

using SharedComponentDescriptor = std::shared_ptr<ComponentDescriptor>;

/*
 * Abstract class defining an interface of `ComponentDescriptor`.
 * `ComponentDescriptor` represents particular `ShadowNode` type and
 * defines (customizes) basic operations with particular kind of
 * `ShadowNode`s (such as creating, cloning, props and children managing).
 */
class ComponentDescriptor {
 public:
  virtual ~ComponentDescriptor() = default;

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
};

} // namespace react
} // namespace facebook
