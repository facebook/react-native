/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "MountingTransactionSynchronizer.h"

namespace facebook {
namespace react {

void MountingTransactionSynchronizer::push(MountingTransaction &&transaction) {
  assert(transaction.getRevision() < 1 && "Invalid transaction revision.");

  if (transaction.getRevision() == 1 && revision_ > 0) {
    // Special case:
    // Seems we have a completely new flow of mutations probably caused by the
    // hot-reload process. At this point, there is no way to guarantee anything,
    // so let's just start over.
    queue_.clear();
    revision_ = 0;
  }

  auto it = queue_.begin();

  while (it != queue_.end()) {
    assert(
        it->getRevision() != transaction.getRevision() &&
        "Attempt to re-insert transaction with same revision.");

    if (it->getRevision() > transaction.getRevision()) {
      queue_.insert(it, std::move(transaction));
      return;
    }

    it++;
  }

  queue_.push_back(std::move(transaction));
}

better::optional<MountingTransaction> MountingTransactionSynchronizer::pull() {
  if (queue_.size() == 0) {
    return {};
  }

  if (queue_.front().getRevision() != revision_ + 1) {
    return {};
  }

  revision_++;

  auto transaction = std::move(queue_.front());
  queue_.pop_front();

  return {std::move(transaction)};
}

} // namespace react
} // namespace facebook
