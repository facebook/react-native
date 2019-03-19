/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <react/core/EventEmitter.h>
#include <react/core/ReactPrimitives.h>

namespace facebook {
namespace react {

class ComponentDescriptor;

/*
 * Represents all things that shadow nodes from the same family have in common.
 * To be used inside `ShadowNode` class *only*.
 */
class ShadowNodeFamily {
 public:
  using Shared = std::shared_ptr<ShadowNodeFamily const>;
  using Weak = std::weak_ptr<ShadowNodeFamily const>;

  ShadowNodeFamily(
      Tag tag,
      SurfaceId surfaceId,
      SharedEventEmitter const &eventEmitter,
      ComponentDescriptor const &componentDescriptor);

 private:
  friend ShadowNode;

  /*
   * Deprecated.
   */
  Tag const tag_;

  /*
   * Identifier of a running Surface instance.
   */
  SurfaceId const surfaceId_;

  /*
   * `EventEmitter` associated with all nodes of the family.
   */
  SharedEventEmitter const eventEmitter_;

  /*
   * Reference to a concrete `ComponentDescriptor` that manages nodes of this
   * type.
   */
  ComponentDescriptor const &componentDescriptor_;
};

} // namespace react
} // namespace facebook
