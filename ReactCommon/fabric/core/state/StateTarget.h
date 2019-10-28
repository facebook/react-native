/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

namespace facebook {
namespace react {

class ShadowNode;

/*
 * Represents an entity that receives state update.
 * Practically, just a wrapper around shared a pointer to ShadowNode. We need
 * this mostly to avoid circular dependency problems.
 */
class StateTarget {
 public:
  /*
   * Creates an empty target.
   */
  explicit StateTarget();

  /*
   * Creates a target which points to a given `ShadowNode`.
   */
  explicit StateTarget(std::shared_ptr<ShadowNode const> shadowNode);

  /*
   * Copyable and moveable.
   */
  StateTarget(const StateTarget &other) = default;
  StateTarget &operator=(const StateTarget &other) = default;
  StateTarget(StateTarget &&other) noexcept = default;
  StateTarget &operator=(StateTarget &&other) = default;

  /*
   * Returns `true` is the target is not empty.
   */
  operator bool() const;

  /*
   * Returns a reference to a stored `ShadowNode`.
   */
  const ShadowNode &getShadowNode() const;

 private:
  std::shared_ptr<ShadowNode const> shadowNode_;
};

} // namespace react
} // namespace facebook
