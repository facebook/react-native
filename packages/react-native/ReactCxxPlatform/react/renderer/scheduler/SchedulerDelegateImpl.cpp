/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SchedulerDelegateImpl.h"

namespace facebook::react {

SchedulerDelegateImpl::SchedulerDelegateImpl(
    std::shared_ptr<IMountingManager> mountingManager) noexcept
    : mountingManager_(std::move(mountingManager)) {}

void SchedulerDelegateImpl::schedulerDidFinishTransaction(
    const std::shared_ptr<const MountingCoordinator>& /*mountingCoordinator*/) {
  // no-op, we will flush the transaction from schedulerShouldRenderTransactions
}

void SchedulerDelegateImpl::schedulerShouldRenderTransactions(
    const std::shared_ptr<const MountingCoordinator>& mountingCoordinator) {
  auto surfaceId = mountingCoordinator->getSurfaceId();
  if (auto transaction = mountingCoordinator->pullTransaction();
      transaction.has_value()) {
    if (auto& transactionValue = transaction.value();
        !transactionValue.getMutations().empty()) {
      mountingManager_->executeMount(surfaceId, std::move(transactionValue));
    }
  }
}

void SchedulerDelegateImpl::schedulerDidRequestPreliminaryViewAllocation(
    const ShadowNode& shadowNode) {}

void SchedulerDelegateImpl::schedulerDidDispatchCommand(
    const ShadowView& shadowView,
    const std::string& commandName,
    const folly::dynamic& args) {
  mountingManager_->dispatchCommand(shadowView, commandName, args);
}

void SchedulerDelegateImpl::schedulerDidSetIsJSResponder(
    const ShadowView& shadowView,
    bool isJSResponder,
    bool blockNativeResponder) {
  mountingManager_->setIsJSResponder(
      shadowView, isJSResponder, blockNativeResponder);
}

void SchedulerDelegateImpl::schedulerDidSendAccessibilityEvent(
    const ShadowView& shadowView,
    const std::string& eventType) {}

void SchedulerDelegateImpl::schedulerShouldSynchronouslyUpdateViewOnUIThread(
    Tag tag,
    const folly::dynamic& props) {
  mountingManager_->synchronouslyUpdateViewOnUIThread(tag, props);
}

} // namespace facebook::react
