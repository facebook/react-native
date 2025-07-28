/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <mutex>
#include <shared_mutex>

#include <react/renderer/components/root/RootShadowNode.h>
#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/mounting/MountingCoordinator.h>
#include <react/renderer/mounting/ShadowTreeDelegate.h>
#include <react/renderer/mounting/ShadowTreeRevision.h>
#include <react/utils/ContextContainer.h>
#include "MountingOverrideDelegate.h"

namespace facebook::react {

using ShadowTreeCommitTransaction = std::function<RootShadowNode::Unshared(
    const RootShadowNode& oldRootShadowNode)>;

/*
 * Represents a result of a `commit` operation.
 */
enum class ShadowTreeCommitStatus {
  Succeeded,
  Failed,
  Cancelled,
};

/*
 * Represents commits' side-effects propagation mode.
 */
enum class ShadowTreeCommitMode {
  // Commits' side-effects are observable via `MountingCoordinator`.
  // The rendering pipeline fully works end-to-end.
  Normal,

  // Commits' side-effects are *not* observable via `MountingCoordinator`.
  // The mounting phase is skipped in the rendering pipeline.
  Suspended,
};

enum class ShadowTreeCommitSource {
  Unknown,
  React,
};

struct ShadowTreeCommitOptions {
  // When set to true, Shadow Node state from current revision will be applied
  // to the new revision. For more details see
  // https://reactnative.dev/architecture/render-pipeline#react-native-renderer-state-updates
  bool enableStateReconciliation{false};

  // Indicates if mounting will be triggered synchronously and React will
  // not get a chance to interrupt painting.
  // This should be set to `false` when a commit is coming from React. It
  // will then let React run layout effects and apply updates before paint.
  // For all other commits, should be true.
  bool mountSynchronously{true};

  ShadowTreeCommitSource source{ShadowTreeCommitSource::Unknown};
};

/*
 * Represents the shadow tree and its lifecycle.
 */
class ShadowTree final {
 public:
  using Unique = std::unique_ptr<ShadowTree>;

  using CommitStatus = ShadowTreeCommitStatus;
  using CommitMode = ShadowTreeCommitMode;
  using CommitSource = ShadowTreeCommitSource;
  using CommitOptions = ShadowTreeCommitOptions;

  /*
   * Creates a new shadow tree instance.
   */
  ShadowTree(
      SurfaceId surfaceId,
      const LayoutConstraints& layoutConstraints,
      const LayoutContext& layoutContext,
      const ShadowTreeDelegate& delegate,
      const ContextContainer& contextContainer);

  ~ShadowTree();

  /*
   * Returns the `SurfaceId` associated with the shadow tree.
   */
  SurfaceId getSurfaceId() const;

  /*
   * Sets and gets the commit mode.
   * Changing commit mode from `Suspended` to `Normal` will flush all suspended
   * changes to `MountingCoordinator`.
   */
  void setCommitMode(CommitMode commitMode) const;
  CommitMode getCommitMode() const;

  /*
   * Performs commit calling `transaction` function with a `oldRootShadowNode`
   * and expecting a `newRootShadowNode` as a return value.
   * The `transaction` function can cancel commit returning `nullptr`.
   */
  CommitStatus tryCommit(
      const ShadowTreeCommitTransaction& transaction,
      const CommitOptions& commitOptions) const;

  /*
   * Calls `tryCommit` in a loop until it finishes successfully.
   */
  CommitStatus commit(
      const ShadowTreeCommitTransaction& transaction,
      const CommitOptions& commitOptions) const;

  /*
   * Returns a `ShadowTreeRevision` representing the momentary state of
   * the `ShadowTree`.
   */
  ShadowTreeRevision getCurrentRevision() const;

  /*
   * Commit an empty tree (a new `RootShadowNode` with no children).
   */
  void commitEmptyTree() const;

  /**
   * Forces the ShadowTree to ping its delegate that an update is available.
   * Useful for animations on Android.
   */
  void notifyDelegatesOfUpdates() const;

  std::shared_ptr<const MountingCoordinator> getMountingCoordinator() const;

 private:
  constexpr static ShadowTreeRevision::Number INITIAL_REVISION{0};

  void mount(ShadowTreeRevision revision, bool mountSynchronously) const;

  void emitLayoutEvents(
      std::vector<const LayoutableShadowNode*>& affectedLayoutableNodes) const;

  const SurfaceId surfaceId_;
  const ShadowTreeDelegate& delegate_;
  mutable std::shared_mutex commitMutex_;
  mutable std::recursive_mutex commitMutexRecursive_;
  mutable CommitMode commitMode_{
      CommitMode::Normal}; // Protected by `commitMutex_`.
  mutable ShadowTreeRevision currentRevision_; // Protected by `commitMutex_`.
  std::shared_ptr<const MountingCoordinator> mountingCoordinator_;

  using UniqueLock = std::variant<
      std::unique_lock<std::shared_mutex>,
      std::unique_lock<std::recursive_mutex>>;
  using SharedLock = std::variant<
      std::shared_lock<std::shared_mutex>,
      std::unique_lock<std::recursive_mutex>>;

  inline UniqueLock uniqueCommitLock() const;
  inline SharedLock sharedCommitLock() const;
};

} // namespace facebook::react
