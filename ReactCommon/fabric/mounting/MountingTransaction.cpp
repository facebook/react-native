/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "MountingTransaction.h"

namespace facebook {
namespace react {

using Number = MountingTransaction::Number;

MountingTransaction::MountingTransaction(
    SurfaceId surfaceId,
    Number number,
    ShadowViewMutationList &&mutations,
    MountingTelemetry telemetry)
    : surfaceId_(surfaceId),
      number_(number),
      mutations_(std::move(mutations)),
      telemetry_(std::move(telemetry)) {}

ShadowViewMutationList const &MountingTransaction::getMutations() const & {
  return mutations_;
}

ShadowViewMutationList MountingTransaction::getMutations() && {
  return std::move(mutations_);
}

MountingTelemetry const &MountingTransaction::getTelemetry() const {
  return telemetry_;
}

SurfaceId MountingTransaction::getSurfaceId() const {
  return surfaceId_;
}

Number MountingTransaction::getNumber() const {
  return number_;
}

} // namespace react
} // namespace facebook
