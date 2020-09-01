/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/optional.h>

#include <react/renderer/mounting/MountingOverrideDelegate.h>
#include <react/renderer/mounting/MountingTransaction.h>
#include <react/renderer/mounting/ShadowViewMutation.h>
#include <react/renderer/mounting/TransactionTelemetry.h>

namespace facebook {
namespace react {

/*
 * Represent a particular committed state of a shadow tree. The object contains
 * a pointer to a root shadow node, a sequential number of commit and telemetry.
 */
class ShadowTreeRevision final {
 public:
  /*
   * Sequential number of the commit that created this revision of a shadow
   * tree.
   */
  using Number = int64_t;

  /*
   * Creates the object with given root shadow node, revision number and
   * telemetry.
   */
  ShadowTreeRevision(
      ShadowNode::Shared const &rootShadowNode,
      Number number,
      TransactionTelemetry telemetry);

  /*
   * Returns telemetry associated with this revision.
   */
  TransactionTelemetry const &getTelemetry() const;

  /*
   * Methods from this section are meant to be used by
   * `MountingOverrideDelegate` only.
   */
 public:
  ShadowNode const &getRootShadowNode();
  ShadowNode::Shared getSharedRootShadowNode();

  /*
   * Methods from this section are meant to be used by `MountingCoordinator`
   * only.
   */
 private:
  friend class MountingCoordinator;

  Number getNumber() const;

 private:
  ShadowNode::Shared rootShadowNode_;
  Number number_;
  TransactionTelemetry telemetry_;
};

} // namespace react
} // namespace facebook
