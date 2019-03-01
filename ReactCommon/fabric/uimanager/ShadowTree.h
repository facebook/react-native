// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <folly/SharedMutex.h>
#include <memory>
#include <shared_mutex>

#include <react/components/root/RootShadowNode.h>
#include <react/core/LayoutConstraints.h>
#include <react/core/ReactPrimitives.h>
#include <react/core/ShadowNode.h>
#include <react/mounting/ShadowViewMutation.h>
#include <react/uimanager/ShadowTreeDelegate.h>

namespace facebook {
namespace react {

using ShadowTreeCommitTransaction = std::function<UnsharedRootShadowNode(
    const SharedRootShadowNode &oldRootShadowNode)>;

/*
 * Represents the shadow tree and its lifecycle.
 */
class ShadowTree final {
 public:
  /*
   * Creates a new shadow tree instance.
   */
  ShadowTree(
      SurfaceId surfaceId,
      const LayoutConstraints &layoutConstraints,
      const LayoutContext &layoutContext);

  ~ShadowTree();

  /*
   * Returns the `SurfaceId` associated with the shadow tree.
   */
  SurfaceId getSurfaceId() const;

  /*
   * Performs commit calling `transaction` function with a `oldRootShadowNode`
   * and expecting a `newRootShadowNode` as a return value.
   * The `transaction` function can abort commit returning `nullptr`.
   * If a `revision` pointer is not null, the method will store there a
   * contiguous revision number of the successfully performed transaction.
   * Returns `true` if the operation finished successfully.
   */
  bool tryCommit(
      ShadowTreeCommitTransaction transaction,
      long commitStartTime,
      int *revision = nullptr) const;

  /*
   * Calls `tryCommit` in a loop until it finishes successfully.
   */
  void commit(
      ShadowTreeCommitTransaction transaction,
      long commitStartTime,
      int *revision = nullptr) const;

#pragma mark - Delegate

  /*
   * Sets and gets the delegate.
   * The delegate is stored as a raw pointer, so the owner must null
   * the pointer before being destroyed.
   */
  void setDelegate(ShadowTreeDelegate const *delegate);
  ShadowTreeDelegate const *getDelegate() const;

 private:
  UnsharedRootShadowNode cloneRootShadowNode(
      const SharedRootShadowNode &oldRootShadowNode,
      const LayoutConstraints &layoutConstraints,
      const LayoutContext &layoutContext) const;

  void emitLayoutEvents(const ShadowViewMutationList &mutations) const;

  const SurfaceId surfaceId_;
  mutable folly::SharedMutex commitMutex_;
  mutable SharedRootShadowNode rootShadowNode_; // Protected by `commitMutex_`.
  mutable int revision_{1}; // Protected by `commitMutex_`.
  ShadowTreeDelegate const *delegate_;
};

} // namespace react
} // namespace facebook
