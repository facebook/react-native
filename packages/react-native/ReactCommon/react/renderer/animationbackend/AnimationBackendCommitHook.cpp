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
    : uiManager_(uiManager),
      animatedPropsRegistry_(std::move(animatedPropsRegistry)) {
  uiManager_->registerCommitHook(*this);
}

RootShadowNode::Unshared AnimationBackendCommitHook::shadowTreeWillCommit(
    const ShadowTree& shadowTree,
    const RootShadowNode::Shared& oldRootShadowNode,
    const RootShadowNode::Unshared& newRootShadowNode,
    const ShadowTreeCommitOptions& commitOptions) noexcept {
  if (commitOptions.source != ShadowTreeCommitSource::React) {
    return newRootShadowNode;
  }
  auto surfaceFamilies =
      animatedPropsRegistry_->surfaceToFamilies_[shadowTree.getSurfaceId()];
  auto& updates = animatedPropsRegistry_->map_;
  if (surfaceFamilies.empty()) {
    return newRootShadowNode;
  }
  return std::static_pointer_cast<
      RootShadowNode>(newRootShadowNode->cloneMultiple(
      surfaceFamilies,
      [&surfaceFamilies, &updates](
          const ShadowNode& shadowNode, const ShadowNodeFragment& fragment) {
        auto newProps = ShadowNodeFragment::propsPlaceholder();
        std::shared_ptr<BaseViewProps> viewProps = nullptr;
        if (surfaceFamilies.contains(&shadowNode.getFamily())) {
          auto& snapshot = updates.at(shadowNode.getTag());
          if (!snapshot.propNames.empty()) {
            PropsParserContext propsParserContext{
                shadowNode.getSurfaceId(), *shadowNode.getContextContainer()};

            newProps = shadowNode.getComponentDescriptor().cloneProps(
                propsParserContext, shadowNode.getProps(), {});
            viewProps = std::const_pointer_cast<BaseViewProps>(
                std::static_pointer_cast<const BaseViewProps>(newProps));
          }

          for (const auto& propName : snapshot.propNames) {
            switch (propName) {
              case OPACITY:
                viewProps->opacity = snapshot.props.opacity;
                break;

              case WIDTH:
                viewProps->yogaStyle.setDimension(
                    yoga::Dimension::Width,
                    snapshot.props.yogaStyle.dimension(yoga::Dimension::Width));
                break;

              case HEIGHT:
                viewProps->yogaStyle.setDimension(
                    yoga::Dimension::Height,
                    snapshot.props.yogaStyle.dimension(
                        yoga::Dimension::Height));
                break;

              case TRANSFORM:
                viewProps->transform = snapshot.props.transform;
                break;

              case BORDER_RADII:
                viewProps->borderRadii = snapshot.props.borderRadii;
                break;

              case FLEX:
                viewProps->yogaStyle.setFlex(snapshot.props.yogaStyle.flex());
                break;
            }
          }
        }
        return shadowNode.clone(
            {.props = newProps,
             .children = fragment.children,
             .state = shadowNode.getState(),
             .runtimeShadowNodeReference = false});
      }));
}

AnimationBackendCommitHook::~AnimationBackendCommitHook() {
  // TODO: fix
  // uiManager get's deallocated first, so we can't call unregisterCommitHook
  // here (or need to get a shared_ptr) uiManager_->unregisterCommitHook(*this);
}

} // namespace facebook::react
