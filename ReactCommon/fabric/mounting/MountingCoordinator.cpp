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

#include <react/mounting/ShadowViewMutation.h>

namespace facebook {
namespace react {

MountingCoordinator::MountingCoordinator(
    ShadowTreeRevision baseRevision,
    std::weak_ptr<MountingOverrideDelegate const> delegate)
    : surfaceId_(baseRevision.getRootShadowNode().getSurfaceId()),
      baseRevision_(baseRevision),
      mountingOverrideDelegate_(delegate) {
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

    assert(revision.getNumber() > baseRevision_.getNumber());
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

#ifdef RN_SHADOW_TREE_INTROSPECTION
void MountingCoordinator::validateTransactionAgainstStubViewTree(
    ShadowViewMutationList const &mutations,
    bool assertEquality) const {
  std::string line;

  std::stringstream ssMutations(getDebugDescription(mutations, {}));
  while (std::getline(ssMutations, line, '\n')) {
    LOG(ERROR) << "Mutations:" << line;
  }

  stubViewTree_.mutate(mutations);
  auto stubViewTree =
      stubViewTreeFromShadowNode(lastRevision_->getRootShadowNode());

  std::stringstream ssOldTree(
      baseRevision_.getRootShadowNode().getDebugDescription());
  while (std::getline(ssOldTree, line, '\n')) {
    LOG(ERROR) << "Old tree:" << line;
  }

  std::stringstream ssNewTree(
      lastRevision_->getRootShadowNode().getDebugDescription());
  while (std::getline(ssNewTree, line, '\n')) {
    LOG(ERROR) << "New tree:" << line;
  }

  if (assertEquality) {
    assert(stubViewTree_ == stubViewTree);
  }
}
#endif

better::optional<MountingTransaction> MountingCoordinator::pullTransaction()
    const {
  std::lock_guard<std::mutex> lock(mutex_);

  auto mountingOverrideDelegate = mountingOverrideDelegate_.lock();

  bool shouldOverridePullTransaction = mountingOverrideDelegate &&
      mountingOverrideDelegate->shouldOverridePullTransaction();

  if (!shouldOverridePullTransaction && !lastRevision_.has_value()) {
    return {};
  }

  number_++;

  ShadowViewMutation::List diffMutations{};
  auto telemetry =
      (lastRevision_.hasValue() ? lastRevision_->getTelemetry()
                                : MountingTelemetry{});
  if (!lastRevision_.hasValue()) {
    telemetry.willLayout();
    telemetry.didLayout();
    telemetry.willCommit();
    telemetry.didCommit();
  }
  telemetry.willDiff();
  if (lastRevision_.hasValue()) {
    diffMutations = calculateShadowViewMutations(
        baseRevision_.getRootShadowNode(), lastRevision_->getRootShadowNode());
  }
  telemetry.didDiff();

  better::optional<MountingTransaction> transaction{};

  // The override delegate can provide custom mounting instructions,
  // even if there's no `lastRevision_`. Consider cases of animation frames
  // in between React tree updates.
  if (shouldOverridePullTransaction) {
    transaction = mountingOverrideDelegate->pullTransaction(
        surfaceId_, number_, telemetry, std::move(diffMutations));
  } else if (lastRevision_.hasValue()) {
    transaction = MountingTransaction{
        surfaceId_, number_, std::move(diffMutations), telemetry};
  }

  if (lastRevision_.hasValue()) {
#ifdef RN_SHADOW_TREE_INTROSPECTION
    // Only validate non-animated transactions - it's garbage to validate
    // animated transactions, since the stub view tree likely won't match
    // the committed tree during an animation.
    this->validateTransactionAgainstStubViewTree(
        transaction->getMutations(), !shouldOverridePullTransaction);
#endif

    baseRevision_ = std::move(*lastRevision_);
    lastRevision_.reset();
  }

  return transaction;
}

} // namespace react
} // namespace facebook
