/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AnimationBackend.h"
#include <chrono>
#include "AnimatedPropsRegistry.h"

namespace facebook::react {

UIManagerNativeAnimatedDelegateBackendImpl::
    UIManagerNativeAnimatedDelegateBackendImpl(
        std::weak_ptr<AnimationBackend> animationBackend)
    : animationBackend_(std::move(animationBackend)) {}

void UIManagerNativeAnimatedDelegateBackendImpl::runAnimationFrame() {
  if (auto animationBackendStrong = animationBackend_.lock()) {
    animationBackendStrong->onAnimationFrame(
        std::chrono::steady_clock::now().time_since_epoch().count() / 1000);
  }
}

static inline Props::Shared cloneProps(
    AnimatedProps& animatedProps,
    const ShadowNode& shadowNode) {
  PropsParserContext propsParserContext{
      shadowNode.getSurfaceId(), *shadowNode.getContextContainer()};
  Props::Shared newProps;
  if (animatedProps.rawProps) {
    newProps = shadowNode.getComponentDescriptor().cloneProps(
        propsParserContext,
        shadowNode.getProps(),
        std::move(*animatedProps.rawProps));
  } else {
    newProps = shadowNode.getComponentDescriptor().cloneProps(
        propsParserContext, shadowNode.getProps(), {});
  }

  auto viewProps = std::const_pointer_cast<BaseViewProps>(
      std::static_pointer_cast<const BaseViewProps>(newProps));
  for (auto& animatedProp : animatedProps.props) {
    switch (animatedProp->propName) {
      case OPACITY:
        viewProps->opacity = get<Float>(animatedProp);
        break;

      case WIDTH:
        viewProps->yogaStyle.setDimension(
            yoga::Dimension::Width, get<yoga::Style::SizeLength>(animatedProp));
        break;

      case HEIGHT:
        viewProps->yogaStyle.setDimension(
            yoga::Dimension::Height,
            get<yoga::Style::SizeLength>(animatedProp));
        break;

      case BORDER_RADII:
        viewProps->borderRadii = get<CascadedBorderRadii>(animatedProp);
        break;

      case FLEX:
        viewProps->yogaStyle.setFlex(get<yoga::FloatOptional>(animatedProp));
        break;

      case TRANSFORM:
        viewProps->transform = get<Transform>(animatedProp);
        break;
    }
  }
  return newProps;
}

static inline bool mutationHasLayoutUpdates(
    facebook::react::AnimationMutation& mutation) {
  for (auto& animatedProp : mutation.props.props) {
    // TODO: there should also be a check for the dynamic part
    if (animatedProp->propName == WIDTH || animatedProp->propName == HEIGHT ||
        animatedProp->propName == FLEX) {
      return true;
    }
  }
  return false;
}

AnimationBackend::AnimationBackend(
    StartOnRenderCallback&& startOnRenderCallback,
    StopOnRenderCallback&& stopOnRenderCallback,
    DirectManipulationCallback&& directManipulationCallback,
    FabricCommitCallback&& fabricCommitCallback,
    UIManager* uiManager)
    : startOnRenderCallback_(std::move(startOnRenderCallback)),
      stopOnRenderCallback_(std::move(stopOnRenderCallback)),
      directManipulationCallback_(std::move(directManipulationCallback)),
      fabricCommitCallback_(std::move(fabricCommitCallback)),
      animatedPropsRegistry_(std::make_shared<AnimatedPropsRegistry>()),
      uiManager_(uiManager),
      commitHook_(std::make_unique<AnimationBackendCommitHook>(
          uiManager,
          animatedPropsRegistry_)) {}

void AnimationBackend::onAnimationFrame(double timestamp) {
  std::unordered_map<Tag, AnimatedProps> updates;
  std::unordered_set<const ShadowNodeFamily*> families;
  bool hasAnyLayoutUpdates = false;
  for (auto& callback : callbacks) {
    auto muatations = callback(static_cast<float>(timestamp));
    for (auto& mutation : muatations) {
      hasAnyLayoutUpdates |= mutationHasLayoutUpdates(mutation);
      families.insert(mutation.family);
      updates[mutation.tag] = std::move(mutation.props);
    }
  }

  animatedPropsRegistry_->update(updates, families);

  if (hasAnyLayoutUpdates) {
    commitUpdatesWithFamilies(families, updates);
  } else {
    synchronouslyUpdateProps(updates);
  }
}

void AnimationBackend::start(const Callback& callback) {
  callbacks.push_back(callback);
  // TODO: startOnRenderCallback_ should provide the timestamp from the platform
  if (startOnRenderCallback_) {
    startOnRenderCallback_([this]() {
      onAnimationFrame(
          std::chrono::steady_clock::now().time_since_epoch().count() / 1000);
    });
  }
}
void AnimationBackend::stop() {
  if (stopOnRenderCallback_) {
    stopOnRenderCallback_();
  }
  callbacks.clear();
}

void AnimationBackend::commitUpdatesWithFamilies(
    const std::unordered_set<const ShadowNodeFamily*>& families,
    std::unordered_map<Tag, AnimatedProps>& updates) {
  std::unordered_map<SurfaceId, std::unordered_set<const ShadowNodeFamily*>>
      surfaceToFamilies;
  for (auto& family : families) {
    surfaceToFamilies[family->getSurfaceId()].insert(family);
  }
  for (const auto& [surfaceId, surfaceFamilies] : surfaceToFamilies) {
    uiManager_->getShadowTreeRegistry().visit(
        surfaceId, [&surfaceFamilies, &updates](const ShadowTree& shadowTree) {
          shadowTree.commit(
              [&surfaceFamilies,
               &updates](const RootShadowNode& oldRootShadowNode) {
                return std::static_pointer_cast<RootShadowNode>(
                    oldRootShadowNode.cloneMultiple(
                        surfaceFamilies,
                        [&surfaceFamilies, &updates](
                            const ShadowNode& shadowNode,
                            const ShadowNodeFragment& fragment) {
                          auto newProps =
                              ShadowNodeFragment::propsPlaceholder();
                          if (surfaceFamilies.contains(
                                  &shadowNode.getFamily())) {
                            auto& animatedProps =
                                updates.at(shadowNode.getTag());
                            newProps = cloneProps(animatedProps, shadowNode);
                          }
                          return shadowNode.clone(
                              {.props = newProps,
                               .children = fragment.children,
                               .state = shadowNode.getState(),
                               .runtimeShadowNodeReference = false});
                        }));
              },
              {.mountSynchronously = true});
        });
  }
}

void AnimationBackend::synchronouslyUpdateProps(
    const std::unordered_map<Tag, AnimatedProps>& updates) {
  for (auto& [tag, animatedProps] : updates) {
    auto dyn = animatedProps.rawProps ? animatedProps.rawProps->toDynamic()
                                      : folly::dynamic::object();
    for (auto& animatedProp : animatedProps.props) {
      // TODO: We shouldn't repack it into dynamic, but for that a rewrite of
      // directManipulationCallback_ is needed
      switch (animatedProp->propName) {
        case OPACITY:
          dyn.insert("opacity", get<Float>(animatedProp));
          break;

        case BORDER_RADII:
        case TRANSFORM:
          // TODO: handle other things than opacity
          break;

        case WIDTH:
        case HEIGHT:
        case FLEX:
          throw "Tried to synchronously update layout props";
      }
    }
    directManipulationCallback_(tag, dyn);
  }
}

} // namespace facebook::react
