/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/mounting/ShadowViewMutation.h>

namespace facebook {
namespace react {

/*
 * Encapsulates all artifacts of `ShadowTree` commit, particularly list of
 * mutations and meta-data.
 * Movable and copyable, but moving is strongly preferred.
 * A moved-from object of this type has unspecified value and accessing that is
 * UB.
 */
class MountingTransaction final {
 public:
  /*
   * Revision grows continuously starting from `1`. Value `0` represents the
   * state before the very first transaction happens.
   */
  using Revision = int64_t;

  /*
   * Represent arbitrary telementry data that can be associated with the
   * particular transaction.
   */
  struct Telemetry final {
    long commitStartTime{};
    long layoutTime{};
  };

  /*
   * Copying a list of `ShadowViewMutation` is expensive, so the constructor
   * accepts it as rvalue reference to discourage copying.
   */
  MountingTransaction(
      SurfaceId surfaceId,
      Revision revision,
      ShadowViewMutationList &&mutations,
      Telemetry telemetry);

  /*
   * Copy semantic.
   * Copying of MountingTransaction is expensive, so copy-constructor is
   * explicit and copy-assignment is deleted to prevent accidental copying.
   */
  explicit MountingTransaction(const MountingTransaction &mountingTransaction) =
      default;
  MountingTransaction &operator=(const MountingTransaction &other) = delete;

  /*
   * Move semantic.
   */
  MountingTransaction(MountingTransaction &&mountingTransaction) noexcept =
      default;
  MountingTransaction &operator=(MountingTransaction &&other) = default;

  /*
   * Returns a list of mutations that represent the transaction. The list can be
   * empty (theoretically).
   */
  ShadowViewMutationList const &getMutations() const &;
  ShadowViewMutationList getMutations() &&;

  /*
   * Returns telemetry associated with this transaction.
   */
  Telemetry const &getTelemetry() const;

  /*
   * Returns the id of the surface that the transaction belongs to.
   */
  SurfaceId getSurfaceId() const;

  /*
   * Returns the revision of the ShadowTree that this transaction represents.
   */
  Revision getRevision() const;

 private:
  SurfaceId surfaceId_;
  Revision revision_;
  ShadowViewMutationList mutations_;
  Telemetry telemetry_;
};

} // namespace react
} // namespace facebook
