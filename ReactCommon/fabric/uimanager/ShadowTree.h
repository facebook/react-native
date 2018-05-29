// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <memory>
#include <mutex>

#include <react/components/root/RootShadowNode.h>
#include <react/core/LayoutConstraints.h>
#include <react/core/ReactPrimitives.h>
#include <react/core/ShadowNode.h>
#include <react/uimanager/ShadowTreeDelegate.h>
#include <react/uimanager/ShadowViewMutation.h>

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

  /*
   * Synchronously runs `function` when `commitMutex_` is acquired.
   * It is useful in cases when transactional consistency and/or successful
   * commit are required. E.g. you might want to run `measure` and
   * `constraintLayout` as part of a single congious transaction.
   * Use this only if it is necessary. All public methods of the class are
   * already thread-safe.
   */
  void synchronize(std::function<void(void)> function) const;

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
   * Create a new shadow tree with given `rootChildNodes` and commit.
   * Can be called from any thread.
   * Returns `true` if the operation finished successfully.
   */
  bool complete(const SharedShadowNodeUnsharedList &rootChildNodes) const;

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

  bool complete(
      const SharedRootShadowNode &oldRootShadowNode,
      const UnsharedRootShadowNode &newRootShadowNode) const;

  bool commit(
      const SharedRootShadowNode &oldRootShadowNode,
      const SharedRootShadowNode &newRootShadowNode,
      const ShadowViewMutationList &mutations) const;

  void toggleEventEmitters(const ShadowViewMutationList &mutations) const;
  void emitLayoutEvents(const ShadowViewMutationList &mutations) const;

  const SurfaceId surfaceId_;
  mutable SharedRootShadowNode rootShadowNode_; // Protected by `commitMutex_`.
  ShadowTreeDelegate const *delegate_;
  mutable std::recursive_mutex commitMutex_;
};

} // namespace react
} // namespace facebook
