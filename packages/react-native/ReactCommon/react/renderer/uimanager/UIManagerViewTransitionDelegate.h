/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/graphics/Float.h>
#include <functional>
#include <optional>

namespace facebook::react {

class UIManagerViewTransitionDelegate {
 public:
  virtual ~UIManagerViewTransitionDelegate() = default;

  virtual void
  applyViewTransitionName(const ShadowNode &shadowNode, const std::string &name, const std::string &className)
  {
  }

  virtual void createViewTransitionInstance(const std::string & /*name*/, Tag /*pseudoElementTag*/) {}

  virtual void cancelViewTransitionName(const ShadowNode &shadowNode, const std::string &name) {}

  virtual void restoreViewTransitionName(const ShadowNode &shadowNode) {}

  /*
   * Start a view transition. mutationCallback and onReadyCallback MUST be
   * called from a thread with access to the jsi::Runtime.
   * onCompleteCallback may be called from any thread.
   */
  virtual void startViewTransition(
      std::function<void()> mutationCallback,
      std::function<void()> onReadyCallback,
      std::function<void()> onCompleteCallback)
  {
  }

  virtual void startViewTransitionEnd() {}

  struct ViewTransitionInstance {
    Float x{0};
    Float y{0};
    Float width{0};
    Float height{0};
    Tag nativeTag{-1};
  };

  virtual std::optional<ViewTransitionInstance> getViewTransitionInstance(
      const std::string &name,
      const std::string &pseudo)
  {
    return std::nullopt;
  }
};

} // namespace facebook::react
