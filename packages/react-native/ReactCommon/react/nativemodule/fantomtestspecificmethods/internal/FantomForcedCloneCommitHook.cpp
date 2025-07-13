/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FantomForcedCloneCommitHook.h"
#include <react/renderer/uimanager/UIManagerBinding.h>
#include <react/renderer/uimanager/primitives.h>

namespace facebook::react {

namespace {

std::shared_ptr<const ShadowNode> findAndClone(
    const std::shared_ptr<const ShadowNode>& node) {
  if (node->getProps()->nativeId == "to-be-cloned-in-the-commit-hook") {
    return node->clone({});
  }

  auto children = node->getChildren();
  for (int i = 0; i < children.size(); i++) {
    auto& child = children[i];
    auto maybeClone = findAndClone(child);
    if (maybeClone != child) {
      children[i] = maybeClone;
      return node->clone(
          {ShadowNodeFragment::propsPlaceholder(),
           std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>(
               children)});
    }
  }

  return node;
}

} // namespace

void FantomForcedCloneCommitHook::commitHookWasRegistered(
    const UIManager& /*uiManager*/) noexcept {}

void FantomForcedCloneCommitHook::commitHookWasUnregistered(
    const UIManager& /*uiManager*/) noexcept {}

RootShadowNode::Unshared FantomForcedCloneCommitHook::shadowTreeWillCommit(
    const ShadowTree& /*shadowTree*/,
    const std::shared_ptr<const RootShadowNode>& /*oldRootShadowNode*/,
    const RootShadowNode::Unshared& newRootShadowNode) noexcept {
  auto result = findAndClone(newRootShadowNode);

  return std::static_pointer_cast<RootShadowNode>(
      std::const_pointer_cast<ShadowNode>(result));
}

} // namespace facebook::react
