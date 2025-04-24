/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativeFantomForcedCloneCommitHook.h"
#include <cxxreact/TraceSection.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/components/scrollview/ScrollViewShadowNode.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/uimanager/UIManagerBinding.h>
#include <react/renderer/uimanager/UIManagerCommitHook.h>
#include <react/renderer/uimanager/primitives.h>

#include "Plugins.h"

std::shared_ptr<facebook::react::TurboModule>
NativeFantomForcedCloneCommitHookModuleProvider(
    std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {
  return std::make_shared<facebook::react::NativeFantomForcedCloneCommitHook>(
      std::move(jsInvoker));
}

namespace facebook::react {

struct FantomForcedCloneCommitHook : public UIManagerCommitHook {
  void commitHookWasRegistered(
      const UIManager& /*uiManager*/) noexcept override {}
  void commitHookWasUnregistered(
      const UIManager& /*uiManager*/) noexcept override {}
  RootShadowNode::Unshared shadowTreeWillCommit(
      const ShadowTree& shadowTree,
      const RootShadowNode::Shared& oldRootShadowNode,
      const RootShadowNode::Unshared& newRootShadowNode) noexcept override;
};

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

RootShadowNode::Unshared FantomForcedCloneCommitHook::shadowTreeWillCommit(
    const ShadowTree& /*shadowTree*/,
    const RootShadowNode::Shared& /*oldRootShadowNode*/,
    const RootShadowNode::Unshared& newRootShadowNode) noexcept {
  auto result = findAndClone(newRootShadowNode);

  return std::static_pointer_cast<RootShadowNode>(
      std::const_pointer_cast<ShadowNode>(result));
}

static UIManager& getUIManagerFromRuntime(jsi::Runtime& runtime) {
  return UIManagerBinding::getBinding(runtime)->getUIManager();
}

NativeFantomForcedCloneCommitHook::NativeFantomForcedCloneCommitHook(
    std::shared_ptr<CallInvoker> jsInvoker)
    : NativeFantomForcedCloneCommitHookCxxSpec(std::move(jsInvoker)),
      fantomForcedCloneCommitHook_(
          std::make_shared<FantomForcedCloneCommitHook>()) {}

void NativeFantomForcedCloneCommitHook::setup(jsi::Runtime& runtime) {
  auto& uiManager = getUIManagerFromRuntime(runtime);
  uiManager.registerCommitHook(*fantomForcedCloneCommitHook_);
}

} // namespace facebook::react
