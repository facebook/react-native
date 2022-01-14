/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/root/RootShadowNode.h>

namespace facebook::react {

class ShadowTree;
class UIManager;

/*
 * Implementing a commit hook allows to observe and alter Shadow Tree commits.
 */
class UIManagerCommitHook {
 public:
  /*
   * Called right after the commit hook is registered or unregistered.
   */
  virtual void commitHookWasRegistered(
      UIManager const &uiManager) const noexcept = 0;
  virtual void commitHookWasUnregistered(
      UIManager const &uiManager) const noexcept = 0;

  /*
   * Called right before a `ShadowTree` commits a new tree.
   * The semantic of the method corresponds to a method of the same name
   * from `ShadowTreeDelegate`.
   */
  virtual RootShadowNode::Unshared shadowTreeWillCommit(
      ShadowTree const &shadowTree,
      RootShadowNode::Shared const &oldRootShadowNode,
      RootShadowNode::Unshared const &newRootShadowNode) const noexcept = 0;

  virtual ~UIManagerCommitHook() noexcept = default;
};

} // namespace facebook::react
