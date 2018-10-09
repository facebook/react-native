// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <memory>
#include <mutex>

#include <fabric/components/root/RootShadowNode.h>
#include <fabric/core/LayoutConstraints.h>
#include <fabric/core/ReactPrimitives.h>
#include <fabric/core/ShadowNode.h>
#include <fabric/uimanager/ShadowTreeDelegate.h>
#include <fabric/uimanager/ShadowViewMutation.h>

namespace facebook {
namespace react {

/*
 * Represents the shadow tree and its lifecycle.
 */
class ShadowTree final {

public:

  /*
   * Creates a new shadow tree instance with given `rootTag`.
   */
  ShadowTree(Tag rootTag);

  ~ShadowTree();

  /*
   * Returns the rootTag associated with the shadow tree (the tag of the
   * root shadow node).
   */
  Tag getRootTag() const;

#pragma mark - Layout

  /*
   * Measures the shadow tree with given `layoutConstraints` and `layoutContext`.
   * Can be called from any thread, side-effect-less.
   */
  Size measure(const LayoutConstraints &layoutConstraints, const LayoutContext &layoutContext) const;

  /*
   * Applies given `layoutConstraints` and `layoutContext` and commit
   * the new shadow tree.
   * Returns `true` if the operation finished successfully.
   * Can be called from any thread.
   */
  bool constraintLayout(const LayoutConstraints &layoutConstraints, const LayoutContext &layoutContext) const;

#pragma mark - Application

  /*
   * Create a new shadow tree with given `rootChildNodes` and commit.
   * Can be called from any thread.
   * Returns `true` if the operation finished successfully.
   */
  bool complete(const SharedShadowNodeUnsharedList &rootChildNodes) const;

#pragma mark - Delegate

  /*
   * Sets and gets the delegate.
   * The delegate is stored as a raw pointer, so the owner must null
   * the pointer before being destroyed.
   */
  void setDelegate(ShadowTreeDelegate const *delegate);
  ShadowTreeDelegate const *getDelegate() const;

private:

  UnsharedRootShadowNode cloneRootShadowNode(const LayoutConstraints &layoutConstraints, const LayoutContext &layoutContext) const;
  bool complete(UnsharedRootShadowNode newRootShadowNode) const;
  bool commit(
    const SharedRootShadowNode &oldRootShadowNode,
    const SharedRootShadowNode &newRootShadowNode,
    const ShadowViewMutationList &mutations
  ) const;
  void toggleEventEmitters(const ShadowViewMutationList &mutations) const;
  void emitLayoutEvents(const ShadowViewMutationList &mutations) const;

  /*
   * Return `rootShadowNodeMutex_` protected by `commitMutex_`.
   */
  SharedRootShadowNode getRootShadowNode() const;

  const Tag rootTag_;
  mutable SharedRootShadowNode rootShadowNode_; // Protected by `commitMutex_`.
  ShadowTreeDelegate const *delegate_;
  mutable std::mutex commitMutex_;
};

} // namespace react
} // namespace facebook
