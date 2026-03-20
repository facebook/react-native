/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <unordered_set>

#include <react/renderer/core/LayoutMetrics.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/mounting/ShadowViewMutation.h>
#include <react/renderer/uimanager/UIManagerViewTransitionDelegate.h>

namespace facebook::react {

class UIManager;

class ViewTransitionModule : public UIManagerViewTransitionDelegate {
 public:
  ~ViewTransitionModule() override = default;

  void setUIManager(UIManager *uiManager);

  // will be called when a view will transition. if a view already has a view-transition-name, it may not be called
  // again until it's removed
  void applyViewTransitionName(const ShadowNode &shadowNode, const std::string &name, const std::string &className)
      override;

  // if a viewTransitionName is cancelled, the element doesn't have view-transition-name and browser won't be taking
  // snapshot
  void cancelViewTransitionName(const ShadowNode &shadowNode, const std::string &name) override;

  // restore cancellation
  void restoreViewTransitionName(const ShadowNode &shadowNode) override;

  void startViewTransition(
      std::function<void()> mutationCallback,
      std::function<void()> onReadyCallback,
      std::function<void()> onCompleteCallback) override;

  void startViewTransitionEnd() override;

  std::optional<ViewTransitionInstance> getViewTransitionInstance(const std::string &name, const std::string &pseudo)
      override;

  // Animation state structure for storing minimal view data
  struct AnimationKeyFrameViewLayoutMetrics {
    Point originFromRoot;
    Size size;
    Float pointScaleFactor{};
  };

  struct AnimationKeyFrameView {
    AnimationKeyFrameViewLayoutMetrics layoutMetrics;
    Tag tag{0};
    SurfaceId surfaceId{0};
  };

 private:
  // registry of layout of old/new views
  std::unordered_map<std::string, AnimationKeyFrameView> oldLayout_{};
  std::unordered_map<std::string, AnimationKeyFrameView> newLayout_{};
  // tag -> names registry, populated during applyViewTransitionName
  // Note that tag and name are not 1:1 mapping
  // - In some nested composition 2 names are mappped to the same tag
  // - tags of old and new views are mapped to the same name(s)
  std::unordered_map<Tag, std::unordered_set<std::string>> nameRegistry_{};

  // used for cancel/restore viewTransitionName
  std::unordered_map<Tag, std::unordered_set<std::string>> cancelledNameRegistry_{};

  LayoutMetrics captureLayoutMetricsFromRoot(const ShadowNode &shadowNode);

  UIManager *uiManager_{nullptr};

  bool transitionStarted_{false};
};

} // namespace facebook::react
