/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "MountingCoordinator.h"

#ifdef RN_SHADOW_TREE_INTROSPECTION
#include <glog/logging.h>
#include <sstream>
#endif

#include <condition_variable>

#include <react/renderer/mounting/ShadowViewMutation.h>

namespace facebook {
namespace react {

MountingCoordinator::MountingCoordinator(
    ShadowTreeRevision baseRevision,
    std::weak_ptr<MountingOverrideDelegate const> delegate,
    bool enableReparentingDetection)
    : surfaceId_(baseRevision.getRootShadowNode().getSurfaceId()),
      baseRevision_(baseRevision),
      mountingOverrideDelegate_(delegate),
      telemetryController_(*this),
      enableReparentingDetection_(enableReparentingDetection) {
#ifdef RN_SHADOW_TREE_INTROSPECTION
  stubViewTree_ = stubViewTreeFromShadowNode(baseRevision_.getRootShadowNode());
#endif
}

SurfaceId MountingCoordinator::getSurfaceId() const {
  return surfaceId_;
}

void MountingCoordinator::push(ShadowTreeRevision &&revision) const {
  {
    std::lock_guard<std::mutex> lock(mutex_);

    assert(
        !lastRevision_.has_value() ||
        revision.getNumber() != lastRevision_->getNumber());

    if (!lastRevision_.has_value() ||
        lastRevision_->getNumber() < revision.getNumber()) {
      lastRevision_ = std::move(revision);
    }
  }

  signal_.notify_all();
}

void MountingCoordinator::revoke() const {
  std::lock_guard<std::mutex> lock(mutex_);
  // We have two goals here.
  // 1. We need to stop retaining `ShadowNode`s to not prolong their lifetime
  // to prevent them from overliving `ComponentDescriptor`s.
  // 2. A possible call to `pullTransaction()` should return empty optional.
  baseRevision_.rootShadowNode_.reset();
  lastRevision_.reset();
}

bool MountingCoordinator::waitForTransaction(
    std::chrono::duration<double> timeout) const {
  std::unique_lock<std::mutex> lock(mutex_);
  return signal_.wait_for(
      lock, timeout, [this]() { return lastRevision_.has_value(); });
}

void MountingCoordinator::updateBaseRevision(
    ShadowTreeRevision const &baseRevision) const {
  baseRevision_ = std::move(baseRevision);
}

void MountingCoordinator::resetLatestRevision() const {
  lastRevision_.reset();
}

better::optional<MountingTransaction> MountingCoordinator::pullTransaction()
    const {
  std::lock_guard<std::mutex> lock(mutex_);

  auto transaction = better::optional<MountingTransaction>{};

  // Base case
  if (lastRevision_.has_value()) {
    number_++;

    auto telemetry = lastRevision_->getTelemetry();

    telemetry.willDiff();

    auto mutations = calculateShadowViewMutations(
        baseRevision_.getRootShadowNode(), lastRevision_->getRootShadowNode());

    telemetry.didDiff();

    baseRevision_ = std::move(*lastRevision_);
    lastRevision_.reset();

    transaction = MountingTransaction{
        surfaceId_, number_, std::move(mutations), telemetry};
  }

  // Override case
  auto mountingOverrideDelegate = mountingOverrideDelegate_.lock();
  auto shouldOverridePullTransaction = mountingOverrideDelegate &&
      mountingOverrideDelegate->shouldOverridePullTransaction();

  if (shouldOverridePullTransaction) {
    auto mutations = ShadowViewMutation::List{};
    auto telemetry = TransactionTelemetry{};

    if (transaction.has_value()) {
      mutations = transaction->getMutations();
      telemetry = transaction->getTelemetry();
    } else {
      telemetry.willLayout();
      telemetry.didLayout();
      telemetry.willCommit();
      telemetry.didCommit();
    }

    transaction = mountingOverrideDelegate->pullTransaction(
        surfaceId_, number_, telemetry, std::move(mutations));
  }

#ifdef RN_SHADOW_TREE_INTROSPECTION
  if (transaction.has_value()) {
    // We have something to validate.
    auto mutations = transaction->getMutations();

    // No matter what the source of the transaction is, it must be able to
    // mutate the existing stub view tree.
    stubViewTree_.mutate(mutations);

    // If the transaction was overridden, we don't have a model of the shadow
    // tree therefore we cannot validate the validity of the mutation
    // instructions.
    if (!shouldOverridePullTransaction) {
      auto line = std::string{};

      auto stubViewTree =
          stubViewTreeFromShadowNode(baseRevision_.getRootShadowNode());

      if (stubViewTree_ != stubViewTree) {
        std::stringstream ssOldTree(
            baseRevision_.getRootShadowNode().getDebugDescription());
        while (std::getline(ssOldTree, line, '\n')) {
          LOG(ERROR) << "Old tree:" << line;
        }

        std::stringstream ssMutations(getDebugDescription(mutations, {}));
        while (std::getline(ssMutations, line, '\n')) {
          LOG(ERROR) << "Mutations:" << line;
        }

        std::stringstream ssNewTree(
            lastRevision_->getRootShadowNode().getDebugDescription());
        while (std::getline(ssNewTree, line, '\n')) {
          LOG(ERROR) << "New tree:" << line;
        }
      }

      assert(
          (stubViewTree_ == stubViewTree) &&
          "Incorrect set of mutations detected.");
    }
  }
#endif

  return transaction;
}

TelemetryController const &MountingCoordinator::getTelemetryController() const {
  return telemetryController_;
}

} // namespace react
} // namespace facebook
