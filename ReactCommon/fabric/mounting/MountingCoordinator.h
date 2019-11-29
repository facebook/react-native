/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/optional.h>
#include <chrono>

#include <react/mounting/MountingTransaction.h>
#include <react/mounting/ShadowTreeRevision.h>

#ifdef RN_SHADOW_TREE_INTROSPECTION
#include <react/mounting/stubs.h>
#endif

namespace facebook {
namespace react {

/*
 * Stores inside all non-mounted yet revisions of a shadow tree and coordinates
 * mounting. The object stores the most recent mounted revision and the most
 * recent committed one. Then when a new mounting transaction is requested the
 * object generates mutation instructions and returns it as a
 * `MountingTransaction`.
 */
class MountingCoordinator final {
 public:
  using Shared = std::shared_ptr<MountingCoordinator const>;

  /*
   * The constructor is ment to be used only inside `ShadowTree`, and it's
   * `public` only to enable using with `std::make_shared<>`.
   */
  MountingCoordinator(ShadowTreeRevision baseRevision);

  /*
   * Returns the id of the surface that the coordinator belongs to.
   */
  SurfaceId getSurfaceId() const;

  /*
   * Computes a consequent mounting transaction and returns it.
   * The returning transaction can accumulate multiple recent revisions of a
   * shadow tree. Returns empty optional if there no new shadow tree revision to
   * mount.
   * The method is thread-safe and can be called from any thread.
   * However, a consumer should always call it on the same thread (e.g. on the
   * main thread) or ensure sequentiality of mount transactions separately.
   */
  better::optional<MountingTransaction> pullTransaction() const;

  /*
   * Blocks the current thread until a new mounting transaction is available or
   * after the specified `timeout` duration.
   * Returns `false` if a timeout occurred before a new transaction available.
   * Call `pullTransaction` right after the method to retrieve the transaction.
   * Similarly to `pullTransaction` this method is thread-safe but the consumer
   * should call it on the same thread (e.g. on the main thread) or ensure
   * sequentiality of mount transactions separately.
   */
  bool waitForTransaction(std::chrono::duration<double> timeout) const;

 private:
  friend class ShadowTree;

  /*
   * Methods from this section are meant to be used by `ShadowTree` only.
   */
  void push(ShadowTreeRevision &&revision) const;

  /*
   * Revokes the last pushed `ShadowTreeRevision`.
   * Generating a `MountingTransaction` requires some resources which the
   * `MountingCoordinator` does not own (e.g. `ComponentDescriptor`s). Revoking
   * committed revisions allows the owner (a Shadow Tree) to make sure that
   * those resources will not be accessed (e.g. by the Mouting Layer).
   */
  void revoke() const;

 private:
  SurfaceId const surfaceId_;

  mutable std::mutex mutex_;
  mutable ShadowTreeRevision baseRevision_;
  mutable better::optional<ShadowTreeRevision> lastRevision_{};
  mutable MountingTransaction::Number number_{0};
  mutable std::condition_variable signal_;

#ifdef RN_SHADOW_TREE_INTROSPECTION
  mutable StubViewTree stubViewTree_; // Protected by `mutex_`.
#endif
};

} // namespace react
} // namespace facebook
