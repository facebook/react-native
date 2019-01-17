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

#pragma mark - Layout

  /*
   * Measures the shadow tree with given `layoutConstraints` and
   * `layoutContext`. Can be called from any thread, side-effect-less.
   */
  Size measure(
      const LayoutConstraints &layoutConstraints,
      const LayoutContext &layoutContext) const;

  /*
   * Applies given `layoutConstraints` and `layoutContext` and commit
   * the new shadow tree.
   * Returns `true` if the operation finished successfully.
   * Can be called from any thread.
   */
  bool constraintLayout(
      const LayoutConstraints &layoutConstraints,
      const LayoutContext &layoutContext) const;

#pragma mark - Application

  /*
   * Performs commit calling `transaction` function with a `oldRootShadowNode`
   * and expecting a `newRootShadowNode` as a return value.
   * The `transaction` function can abort commit returning `nullptr`.
   * If a `revision` pointer is not null, the method will store there a
   * contiguous revision number of the successfully performed transaction.
   * Specify `attempts` to allow performing multiple tries.
   * Returns `true` if the operation finished successfully.
   */
  bool commit(
      std::function<UnsharedRootShadowNode(
          const SharedRootShadowNode &oldRootShadowNode)> transaction,
      int attempts = 1,
      int *revision = nullptr) const;

  /*
   * Replaces a given old shadow node with a new one in the tree by cloning all
   * nodes on the path to the root node and then complete the tree.
   * Can be called from any thread.
   * Returns `true` if the operation finished successfully.
   */
  bool completeByReplacingShadowNode(
      const SharedShadowNode &oldShadowNode,
      const SharedShadowNode &newShadowNode) const;

  /*
   * Returns a root shadow node that represents the last committed three.
   */
  SharedRootShadowNode getRootShadowNode() const;

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

  void toggleEventEmitters(const ShadowViewMutationList &mutations) const;
  void emitLayoutEvents(const ShadowViewMutationList &mutations) const;

  const SurfaceId surfaceId_;
  mutable folly::SharedMutex commitMutex_;
  mutable SharedRootShadowNode rootShadowNode_; // Protected by `commitMutex_`.
  mutable int revision_{1}; // Protected by `commitMutex_`.
  ShadowTreeDelegate const *delegate_;
};

} // namespace react
} // namespace facebook
