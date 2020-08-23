/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/mutex.h>
#include <memory>

#include <react/renderer/components/root/RootComponentDescriptor.h>
#include <react/renderer/components/root/RootShadowNode.h>
#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/mounting/MountingCoordinator.h>
#include <react/renderer/mounting/ShadowTreeDelegate.h>
#include <react/renderer/mounting/ShadowTreeRevision.h>
#include "MountingOverrideDelegate.h"

namespace facebook {
namespace react {

using ShadowTreeCommitTransaction = std::function<RootShadowNode::Unshared(
    RootShadowNode::Shared const &oldRootShadowNode)>;

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
      LayoutConstraints const &layoutConstraints,
      LayoutContext const &layoutContext,
      RootComponentDescriptor const &rootComponentDescriptor,
      ShadowTreeDelegate const &delegate,
      std::weak_ptr<MountingOverrideDelegate const> mountingOverrideDelegate,
      bool enableReparentingDetection = false);

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
  bool tryCommit(
      ShadowTreeCommitTransaction transaction,
      bool enableStateReconciliation = false) const;

  /*
   * Calls `tryCommit` in a loop until it finishes successfully.
   */
  void commit(
      ShadowTreeCommitTransaction transaction,
      bool enableStateReconciliation = false) const;

  /*
   * Commit an empty tree (a new `RootShadowNode` with no children).
   */
  void commitEmptyTree() const;

  /**
   * Forces the ShadowTree to ping its delegate that an update is available.
   * Useful for animations on Android.
   * @return
   */
  void notifyDelegatesOfUpdates() const;

  MountingCoordinator::Shared getMountingCoordinator() const;

  /*
   * Temporary.
   * Do not use.
   */
  void setEnableNewStateReconciliation(bool value) {
    enableNewStateReconciliation_ = value;
  }
  void setEnableReparentingDetection(bool value) {
    enableReparentingDetection_ = value;
  }

 private:
  RootShadowNode::Unshared cloneRootShadowNode(
      RootShadowNode::Shared const &oldRootShadowNode,
      LayoutConstraints const &layoutConstraints,
      LayoutContext const &layoutContext) const;

  void emitLayoutEvents(
      std::vector<LayoutableShadowNode const *> &affectedLayoutableNodes) const;

  SurfaceId const surfaceId_;
  ShadowTreeDelegate const &delegate_;
  mutable better::shared_mutex commitMutex_;
  mutable RootShadowNode::Shared
      rootShadowNode_; // Protected by `commitMutex_`.
  mutable ShadowTreeRevision::Number revisionNumber_{
      0}; // Protected by `commitMutex_`.
  MountingCoordinator::Shared mountingCoordinator_;
  bool enableNewStateReconciliation_{false};
  bool enableReparentingDetection_{false};
};

} // namespace react
} // namespace facebook
