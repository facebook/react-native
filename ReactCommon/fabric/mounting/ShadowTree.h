// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once


#include <better/mutex.h>
#include <memory>

#include <react/components/root/RootComponentDescriptor.h>
#include <react/components/root/RootShadowNode.h>
#include <react/core/LayoutConstraints.h>
#include <react/core/ReactPrimitives.h>
#include <react/core/ShadowNode.h>
#include <react/mounting/MountingCoordinator.h>
#include <react/mounting/ShadowTreeDelegate.h>
#include <react/mounting/ShadowTreeRevision.h>

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
      const LayoutContext &layoutContext,
      const RootComponentDescriptor &rootComponentDescriptor);

  ~ShadowTree();

  /*
   * Returns the `SurfaceId` associated with the shadow tree.
   */
  SurfaceId getSurfaceId() const;

  /*
   * Performs commit calling `transaction` function with a `oldRootShadowNode`
   * and expecting a `newRootShadowNode` as a return value.
   * The `transaction` function can abort commit returning `nullptr`.
   * Returns `true` if the operation finished successfully.
   */
  bool tryCommit(ShadowTreeCommitTransaction transaction) const;

  /*
   * Calls `tryCommit` in a loop until it finishes successfully.
   */
  void commit(ShadowTreeCommitTransaction transaction) const;

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

  void emitLayoutEvents(
      std::vector<LayoutableShadowNode const *> &affectedLayoutableNodes) const;

  SurfaceId const surfaceId_;
  mutable better::shared_mutex commitMutex_;
  mutable SharedRootShadowNode rootShadowNode_; // Protected by `commitMutex_`.
  mutable ShadowTreeRevision::Number revisionNumber_{
      0}; // Protected by `commitMutex_`.
  ShadowTreeDelegate const *delegate_;
  MountingCoordinator::Shared mountingCoordinator_;
};

} // namespace react
} // namespace facebook
