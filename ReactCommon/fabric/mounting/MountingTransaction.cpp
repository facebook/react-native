/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "MountingTransaction.h"

namespace facebook {
namespace react {

using Telemetry = MountingTransaction::Telemetry;
using Revision = MountingTransaction::Revision;

MountingTransaction::MountingTransaction(
    SurfaceId surfaceId,
    Revision revision,
    ShadowViewMutationList &&mutations,
    Telemetry telemetry)
    : surfaceId_(surfaceId),
      revision_(revision),
      mutations_(std::move(mutations)),
      telemetry_(std::move(telemetry)) {}

ShadowViewMutationList const &MountingTransaction::getMutations() const & {
  return mutations_;
}

ShadowViewMutationList MountingTransaction::getMutations() && {
  return std::move(mutations_);
}

Telemetry const &MountingTransaction::getTelemetry() const {
  return telemetry_;
}

SurfaceId MountingTransaction::getSurfaceId() const {
  return surfaceId_;
}

Revision MountingTransaction::getRevision() const {
  return revision_;
}

} // namespace react
} // namespace facebook
