/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FantomForcedCloneCommitHook.h"
#include <react/renderer/uimanager/UIManagerBinding.h>
#include <react/renderer/uimanager/primitives.h>

namespace {

using namespace facebook::react;

ShadowNode::Shared findAndClone(const ShadowNode::Shared& node) {
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
           std::make_shared<ShadowNode::ListOfShared>(children)});
    }
  }

  return node;
}

} // namespace

namespace facebook::react {

void FantomForcedCloneCommitHook::commitHookWasRegistered(
    const UIManager& /*uiManager*/) noexcept {}

void FantomForcedCloneCommitHook::commitHookWasUnregistered(
    const UIManager& /*uiManager*/) noexcept {}

RootShadowNode::Unshared FantomForcedCloneCommitHook::shadowTreeWillCommit(
    const ShadowTree& /*shadowTree*/,
    const RootShadowNode::Shared& /*oldRootShadowNode*/,
    const RootShadowNode::Unshared& newRootShadowNode) noexcept {
  auto result = findAndClone(newRootShadowNode);

  return std::static_pointer_cast<RootShadowNode>(
      std::const_pointer_cast<ShadowNode>(result));
}

} // namespace facebook::react
