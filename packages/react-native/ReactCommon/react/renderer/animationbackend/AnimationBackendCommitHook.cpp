/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/animationbackend/AnimationBackendCommitHook.h>

namespace facebook::react {

AnimationBackendCommitHook::AnimationBackendCommitHook(
    UIManager* uiManager,
    std::shared_ptr<AnimatedPropsRegistry> animatedPropsRegistry)
    : animatedPropsRegistry_(std::move(animatedPropsRegistry)) {
  uiManager->registerCommitHook(*this);
}

RootShadowNode::Unshared AnimationBackendCommitHook::shadowTreeWillCommit(
    const ShadowTree& shadowTree,
    const RootShadowNode::Shared& oldRootShadowNode,
    const RootShadowNode::Unshared& newRootShadowNode,
    const ShadowTreeCommitOptions& commitOptions) noexcept {
  if (commitOptions.source != ShadowTreeCommitSource::React) {
    return newRootShadowNode;
  }

  const auto& res = animatedPropsRegistry_->getMap(shadowTree.getSurfaceId());
  auto& surfaceFamilies = res.first;
  auto& updates = res.second;

  if (surfaceFamilies.empty()) {
    return newRootShadowNode;
  }
  return std::static_pointer_cast<RootShadowNode>(
      newRootShadowNode->cloneMultiple(
          surfaceFamilies,
          [&surfaceFamilies, &updates](
              const ShadowNode& shadowNode,
              const ShadowNodeFragment& fragment) {
            auto newProps = ShadowNodeFragment::propsPlaceholder();
            std::shared_ptr<BaseViewProps> viewProps = nullptr;
            if (surfaceFamilies.contains(&shadowNode.getFamily()) &&
                updates.contains(shadowNode.getTag())) {
              auto& snapshot = updates.at(shadowNode.getTag());
              if (!snapshot->propNames.empty() || snapshot->rawProps) {
                PropsParserContext propsParserContext{
                    shadowNode.getSurfaceId(),
                    *shadowNode.getContextContainer()};
                if (snapshot->rawProps) {
                  newProps = shadowNode.getComponentDescriptor().cloneProps(
                      propsParserContext,
                      shadowNode.getProps(),
                      RawProps(*snapshot->rawProps));
                } else {
                  newProps = shadowNode.getComponentDescriptor().cloneProps(
                      propsParserContext, shadowNode.getProps(), {});
                }
                viewProps = std::const_pointer_cast<BaseViewProps>(
                    std::static_pointer_cast<const BaseViewProps>(newProps));
              }

              for (const auto& propName : snapshot->propNames) {
                updateProp(propName, *viewProps, *snapshot);
              }
            }
            return shadowNode.clone(
                {.props = newProps,
                 .children = fragment.children,
                 .state = shadowNode.getState(),
                 .runtimeShadowNodeReference = true});
          }));
}

} // namespace facebook::react
