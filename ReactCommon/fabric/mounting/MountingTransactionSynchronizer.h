/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/optional.h>

#include <react/mounting/MountingTransaction.h>

namespace facebook {
namespace react {

/*
 * ShadowTree commits happen concurrently with limited synchronization that only
 * ensures the correctness of the commit from ShadowTree perspective. At the
 * same time artifacts of the commit () needs to be delivered (also
 * concurrently) to the proper thread and executed in order (not-concurrently).
 * To achieve this we need some synchronization mechanism on the receiving
 * (mounting) side. This class implements this process. This class is *not*
 * thread-safe (and must not be).
 */
class MountingTransactionSynchronizer final {
 public:
  /*
   * Pushes (adds) a new MountingTransaction to the internal queue.
   */
  void push(MountingTransaction &&transaction);

  /*
   * Pulls (returns and removes) a MountingTransaction from the internal queue
   * if it has something ready to be pulled. Return an empty optional otherwise.
   */
  better::optional<MountingTransaction> pull();

 private:
  MountingTransaction::Revision revision_{0};
  std::deque<MountingTransaction> queue_{};
};

} // namespace react
} // namespace facebook
