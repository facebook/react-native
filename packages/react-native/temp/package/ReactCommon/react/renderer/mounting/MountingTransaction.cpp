/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "MountingTransaction.h"

namespace facebook::react {

using Number = MountingTransaction::Number;

MountingTransaction::MountingTransaction(
    SurfaceId surfaceId,
    Number number,
    ShadowViewMutationList&& mutations,
    TransactionTelemetry telemetry)
    : surfaceId_(surfaceId),
      number_(number),
      mutations_(std::move(mutations)),
      telemetry_(std::move(telemetry)) {}

const ShadowViewMutationList& MountingTransaction::getMutations() const& {
  return mutations_;
}

ShadowViewMutationList MountingTransaction::getMutations() && {
  return std::move(mutations_);
}

TransactionTelemetry& MountingTransaction::getTelemetry() const {
  return telemetry_;
}

SurfaceId MountingTransaction::getSurfaceId() const {
  return surfaceId_;
}

Number MountingTransaction::getNumber() const {
  return number_;
}

void MountingTransaction::mergeWith(MountingTransaction&& transaction) {
  react_native_assert(transaction.getSurfaceId() == surfaceId_);
  number_ = transaction.getNumber();
  mutations_.insert(
      mutations_.end(),
      std::make_move_iterator(transaction.mutations_.begin()),
      std::make_move_iterator(transaction.mutations_.end()));

  // TODO T186641819: Telemetry for merged transactions is not supported, use
  // the latest instance
  telemetry_ = std::move(transaction.telemetry_);
}

} // namespace facebook::react
