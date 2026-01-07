/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AnimationBackend.h"
#include <react/debug/react_native_assert.h>
#include <react/renderer/animationbackend/AnimatedPropsSerializer.h>
#include <react/renderer/graphics/Color.h>
#include <chrono>
#include <set>
#include "AnimatedPropsRegistry.h"

namespace facebook::react {

static const auto layoutProps = std::set<PropName>{
    WIDTH,           HEIGHT,        FLEX,          MARGIN,      PADDING,
    POSITION,        BORDER_WIDTH,  ALIGN_CONTENT, ALIGN_ITEMS, ALIGN_SELF,
    ASPECT_RATIO,    BOX_SIZING,    DISPLAY,       FLEX_BASIS,  FLEX_DIRECTION,
    ROW_GAP,         COLUMN_GAP,    FLEX_GROW,     FLEX_SHRINK, FLEX_WRAP,
    JUSTIFY_CONTENT, MAX_HEIGHT,    MAX_WIDTH,     MIN_HEIGHT,  MIN_WIDTH,
    STYLE_OVERFLOW,  POSITION_TYPE, DIRECTION,     Z_INDEX,
};

UIManagerNativeAnimatedDelegateBackendImpl::
    UIManagerNativeAnimatedDelegateBackendImpl(
        std::weak_ptr<UIManagerAnimationBackend> animationBackend)
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
    cloneProp(*viewProps, *animatedProp);
  }
  return newProps;
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
      commitHook_(uiManager, animatedPropsRegistry_) {}

void AnimationBackend::onAnimationFrame(double timestamp) {
  std::unordered_map<SurfaceId, SurfaceUpdates> surfaceUpdates;

  for (auto& callback : callbacks) {
    auto muatations = callback(static_cast<float>(timestamp));
    for (auto& mutation : muatations.batch) {
      const auto family = mutation.family;
      react_native_assert(family != nullptr);

      auto& [families, updates, hasLayoutUpdates] =
          surfaceUpdates[family->getSurfaceId()];
      hasLayoutUpdates |= mutation.hasLayoutUpdates;
      families.insert(family.get());
      updates[mutation.tag] = std::move(mutation.props);
    }
  }

  animatedPropsRegistry_->update(surfaceUpdates);

  for (auto& [surfaceId, updates] : surfaceUpdates) {
    if (updates.hasLayoutUpdates) {
      commitUpdates(surfaceId, updates);
    } else {
      synchronouslyUpdateProps(updates.propsMap);
    }
  }
}

void AnimationBackend::start(const Callback& callback, bool isAsync) {
  callbacks.push_back(callback);
  // TODO: startOnRenderCallback_ should provide the timestamp from the
  // platform
  if (startOnRenderCallback_) {
    startOnRenderCallback_(
        [this]() {
          onAnimationFrame(
              std::chrono::steady_clock::now().time_since_epoch().count() /
              1000);
        },
        isAsync);
  }
}
void AnimationBackend::stop(bool isAsync) {
  if (stopOnRenderCallback_) {
    stopOnRenderCallback_(isAsync);
  }
  callbacks.clear();
}

void AnimationBackend::commitUpdates(
    SurfaceId surfaceId,
    SurfaceUpdates& surfaceUpdates) {
  auto& surfaceFamilies = surfaceUpdates.families;
  auto& updates = surfaceUpdates.propsMap;
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
                        auto newProps = ShadowNodeFragment::propsPlaceholder();
                        if (surfaceFamilies.contains(&shadowNode.getFamily())) {
                          auto& animatedProps = updates.at(shadowNode.getTag());
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

void AnimationBackend::synchronouslyUpdateProps(
    const std::unordered_map<Tag, AnimatedProps>& updates) {
  for (auto& [tag, animatedProps] : updates) {
    // TODO: We shouldn't repack it into dynamic, but for that a rewrite
    // of directManipulationCallback_ is needed
    auto dyn = animationbackend::packAnimatedProps(animatedProps);
    directManipulationCallback_(tag, std::move(dyn));
  }
}

void AnimationBackend::clearRegistry(SurfaceId surfaceId) {
  animatedPropsRegistry_->clear(surfaceId);
}

} // namespace facebook::react
