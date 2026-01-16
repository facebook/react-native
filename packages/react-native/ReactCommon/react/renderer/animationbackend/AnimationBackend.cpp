/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AnimationBackend.h"
#include "AnimatedPropsRegistry.h"

#include <react/debug/react_native_assert.h>
#include <react/renderer/animationbackend/AnimatedPropsSerializer.h>
#include <react/renderer/graphics/Color.h>
#include <chrono>
#include <utility>

namespace facebook::react {

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
    std::shared_ptr<AnimationChoreographer> animationChoreographer,
    std::shared_ptr<UIManager> uiManager)
    : animatedPropsRegistry_(std::make_shared<AnimatedPropsRegistry>()),
      animationChoreographer_(std::move(animationChoreographer)),
      commitHook_(*uiManager, animatedPropsRegistry_),
      uiManager_(std::move(uiManager)) {
  react_native_assert(uiManager_.expired() == false);
}

void AnimationBackend::onAnimationFrame(double timestamp) {
  std::unordered_map<SurfaceId, SurfaceUpdates> surfaceUpdates;
  std::set<SurfaceId> asyncFlushSurfaces;

  for (auto& callback : callbacks) {
    auto mutations = callback(static_cast<float>(timestamp));
    asyncFlushSurfaces.merge(mutations.asyncFlushSurfaces);
    for (auto& mutation : mutations.batch) {
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

  requestAsyncFlushForSurfaces(asyncFlushSurfaces);
}

void AnimationBackend::start(const Callback& callback, bool /*isAsync*/) {
  callbacks.push_back(callback);
  if (!isRenderCallbackStarted_) {
    animationChoreographer_->resume();
    isRenderCallbackStarted_ = true;
  }
}

void AnimationBackend::stop(bool /*isAsync*/) {
  if (isRenderCallbackStarted_) {
    animationChoreographer_->pause();
    isRenderCallbackStarted_ = false;
  }
  callbacks.clear();
}

void AnimationBackend::trigger() {
  onAnimationFrame(
      std::chrono::steady_clock::now().time_since_epoch().count() / 1000);
}

void AnimationBackend::commitUpdates(
    SurfaceId surfaceId,
    SurfaceUpdates& surfaceUpdates) {
  auto uiManager = uiManager_.lock();
  if (!uiManager) {
    return;
  }

  auto& surfaceFamilies = surfaceUpdates.families;
  auto& updates = surfaceUpdates.propsMap;

  uiManager->getShadowTreeRegistry().visit(
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
    // of synchronouslyUpdateViewOnUIThread is needed
    auto dyn = animationbackend::packAnimatedProps(animatedProps);
    if (auto uiManager = uiManager_.lock()) {
      uiManager->synchronouslyUpdateViewOnUIThread(tag, dyn);
    }
  }
}

void AnimationBackend::requestAsyncFlushForSurfaces(
    const std::set<SurfaceId>& surfaces) {
  react_native_assert(
      jsInvoker_ != nullptr ||
      surfaces.empty() && "jsInvoker_ was not provided");
  for (const auto& surfaceId : surfaces) {
    // perform an empty commit on the js thread, to force the commit hook to
    // push updated shadow nodes to react through RSNRU
    jsInvoker_->invokeAsync([weakUIManager = uiManager_, surfaceId]() {
      auto uiManager = weakUIManager.lock();
      if (!uiManager) {
        return;
      }
      uiManager->getShadowTreeRegistry().visit(
          surfaceId, [](const ShadowTree& shadowTree) {
            shadowTree.commit(
                [](const RootShadowNode& oldRootShadowNode) {
                  return std::static_pointer_cast<RootShadowNode>(
                      oldRootShadowNode.ShadowNode::clone({}));
                },
                {.source = ShadowTreeCommitSource::AnimationEndSync});
          });
    });
  }
}

void AnimationBackend::clearRegistry(SurfaceId surfaceId) {
  animatedPropsRegistry_->clear(surfaceId);
}

void AnimationBackend::registerJSInvoker(
    std::shared_ptr<CallInvoker> jsInvoker) {
  if (!jsInvoker_) {
    jsInvoker_ = jsInvoker;
  }
}

} // namespace facebook::react
