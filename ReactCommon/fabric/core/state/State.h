/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <react/core/ShadowNodeFamily.h>

namespace facebook {
namespace react {

class ShadowNode;

/*
 * An abstract interface of State.
 * State is used to control and continuously advance a single vision of some
 * state (arbitrary data) associated with a family of shadow nodes.
 */
class State {
 public:
  using Shared = std::shared_ptr<const State>;

 protected:
  /*
   * Constructors are protected to make calling them directly with
   * type-erasured arguments impossible.
   */
  explicit State(StateData::Shared const &data, State const &state);
  explicit State(
      StateData::Shared const &data,
      ShadowNodeFamily::Shared const &family);

 public:
  virtual ~State() = default;

  /*
   * Returns a momentary value of the most recently committed state
   * associated with a family of nodes which this state belongs to.
   * Sequential calls might return different values.
   */
  State::Shared getMostRecentState() const;

  /*
   * Returns a revision number of the `State` object.
   * The number is being automatically assigned during the creation of `State`
   * objects.
   * Revision `0` represents a case when we don't have any info about state
   * object (actual State instances cannot have it).
   * Revision `1` represents a newly created initial state object.
   */
  size_t getRevision() const;

#ifdef ANDROID
  virtual folly::dynamic getDynamic() const = 0;
  virtual void updateState(folly::dynamic data) const = 0;
#endif

  void commit(std::shared_ptr<ShadowNode const> const &shadowNode) const;

 protected:
  friend class StateCoordinator;
  friend class ShadowNodeFamily;

  ShadowNodeFamily::Shared family_;

  /*
   * Type-erasured pointer to arbitrary component-specific data held by the
   * `State`.
   */
  StateData::Shared data_;

  /*
   * Indicates that the state was committed once and then was replaced by a
   * newer one.
   * To be used by `StateCoordinator` only.
   * Protected by mutex inside `StateCoordinator`.
   */
  mutable bool isObsolete_{false};

  /*
   * Revision of the State object.
   */
  size_t revision_;
};

} // namespace react
} // namespace facebook
