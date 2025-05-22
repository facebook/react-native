/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#include <folly/dynamic.h>
#include <react/bridging/Function.h>
#include <react/debug/flags.h>
#include <react/renderer/animated/EventEmitterListener.h>
#include <react/renderer/animated/event_drivers/EventAnimationDriver.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <memory>
#include <mutex>
#include <optional>
#include <string>
#include <unordered_map>
#include <vector>

namespace facebook::react {

class AnimatedNode;
class AnimationDriver;
class Scheduler;

using ValueListenerCallback = std::function<void(double)>;
using UiTask = std::function<void()>;

using EndResult = NativeAnimatedTurboModuleEndResult<
    bool,
    std::optional<double>,
    std::optional<double>>;

using AnimationEndCallback = AsyncCallback<EndResult>;

template <>
struct Bridging<EndResult>
    : NativeAnimatedTurboModuleEndResultBridging<EndResult> {};

class NativeAnimatedNodesManager
    : public std::enable_shared_from_this<NativeAnimatedNodesManager> {
 public:
  using DirectManipulationCallback =
      std::function<void(Tag, const folly::dynamic&)>;
  using FabricCommitCallback =
      std::function<void(std::unordered_map<Tag, folly::dynamic>&)>;
  using StartOnRenderCallback = std::function<void(std::function<void()>&&)>;
  using StopOnRenderCallback = std::function<void()>;

  explicit NativeAnimatedNodesManager(
      DirectManipulationCallback&& directManipulationCallback,
      FabricCommitCallback&& fabricCommitCallback = nullptr,
      StartOnRenderCallback&& startOnRenderCallback = nullptr,
      StopOnRenderCallback&& stopOnRenderCallback = nullptr) noexcept;

  ~NativeAnimatedNodesManager() = default;

  template <
      typename T,
      typename = std::enable_if_t<std::is_base_of_v<AnimatedNode, T>>>
  std::shared_ptr<T> getAnimatedNode(Tag tag) const
    requires(std::is_base_of_v<AnimatedNode, T>)
  {
    if (auto it = animatedNodes_.find(tag); it != animatedNodes_.end()) {
      return std::static_pointer_cast<T>(it->second);
    }
    return nullptr;
  }

  std::optional<double> getValue(Tag tag);

  // graph

  void createAnimatedNode(Tag tag, const folly::dynamic& config);

  void connectAnimatedNodes(Tag parentTag, Tag childTag);

  void connectAnimatedNodeToView(Tag propsNodeTag, Tag viewTag);

  void disconnectAnimatedNodes(Tag parentTag, Tag childTag);

  void disconnectAnimatedNodeFromView(Tag propsNodeTag, Tag viewTag);

  void restoreDefaultValues(Tag tag);

  void dropAnimatedNode(Tag tag);

  // mutations

  void setAnimatedNodeValue(Tag tag, double value);

  void setAnimatedNodeOffset(Tag tag, double offset);

  void flattenAnimatedNodeOffset(Tag tag);

  void extractAnimatedNodeOffset(Tag tag);

  void updateAnimatedNodeConfig(Tag tag, const folly::dynamic& config);

  // drivers

  void startAnimatingNode(
      int animationId,
      Tag animatedNodeTag,
      const folly::dynamic& config,
      const std::optional<AnimationEndCallback>& endCallback);

  void stopAnimation(int animationId, bool isTrackingAnimation = false);

  void addAnimatedEventToView(
      Tag viewTag,
      const std::string& eventName,
      const folly::dynamic& eventMapping);

  void removeAnimatedEventFromView(
      Tag viewTag,
      const std::string& eventName,
      Tag animatedValueTag);

  std::shared_ptr<EventEmitterListener> getEventEmitterListener() {
    return ensureEventEmitterListener();
  }
  // listeners

  void startListeningToAnimatedNodeValue(
      Tag tag,
      ValueListenerCallback&& callback);

  void stopListeningToAnimatedNodeValue(Tag tag);

  void schedulePropsCommit(
      Tag viewTag,
      const folly::dynamic& props,
      bool layoutStyleUpdated,
      bool forceFabricCommit);

  /**
   * Commits all pending animated property updates to their respective views.
   *
   * This method is the final step in the animation pipeline that applies
   * calculated property values to the actual UI components. It uses
   * Fabric-based updates if layout properties are affected, otherwise uses
   * direct manipulation.
   *
   * returns boolean indicating whether any changes were committed to views.
   *         Returns true if no changes were made, which helps the animation
   *         system determine if animations are still active.
   */
  bool commitProps();

  void scheduleOnUI(UiTask&& task) {
    std::lock_guard<std::mutex> lock(uiTasksMutex_);
    operations_.push_back(std::move(task));

    // Whenever a batch is flushed to the UI thread, start the onRender
    // callbacks to guarantee they run at least once. E.g., to execute
    // setValue calls.
    startRenderCallbackIfNeeded();
  }

  void onRender();

  void startRenderCallbackIfNeeded();

  void updateNodes(const std::set<int>& finishedAnimationValueNodes = {});

  std::optional<folly::dynamic> managedProps(Tag tag);

  bool isOnRenderThread() const;

 private:
  void stopRenderCallbackIfNeeded();

  bool onAnimationFrame(uint64_t timestamp);

  bool isAnimationUpdateNeeded() const;

  void stopAnimationsForNode(Tag nodeTag);

  std::shared_ptr<EventEmitterListener> ensureEventEmitterListener();

  void handleAnimatedEvent(
      Tag tag,
      const std::string& eventName,
      const EventPayload& payload);

  std::unique_ptr<AnimatedNode> animatedNode(
      Tag tag,
      const folly::dynamic& config);

  std::unordered_map<Tag, std::shared_ptr<AnimatedNode>> animatedNodes_;
  std::unordered_map<Tag, Tag> connectedAnimatedNodes_;
  std::unordered_map<int, std::shared_ptr<AnimationDriver>> activeAnimations_;
  std::unordered_map<
      EventAnimationDriverKey,
      std::vector<std::unique_ptr<EventAnimationDriver>>,
      std::hash<facebook::react::EventAnimationDriverKey>>
      eventDrivers_;
  std::unordered_set<Tag> updatedNodeTags_;

  std::mutex connectedAnimatedNodesMutex_;

  std::mutex uiTasksMutex_;
  std::vector<UiTask> operations_;

  bool isGestureAnimationInProgress_{false};

  // React context required to commit props onto Component View
  DirectManipulationCallback directManipulationCallback_;
  FabricCommitCallback fabricCommitCallback_;
  StartOnRenderCallback startOnRenderCallback_;
  StopOnRenderCallback stopOnRenderCallback_;

  std::shared_ptr<EventEmitterListener> eventEmitterListener_{nullptr};

  std::unordered_map<Tag, folly::dynamic> updateViewProps_{};
  std::unordered_map<Tag, folly::dynamic> updateViewPropsDirect_{};

  int animatedGraphBFSColor_ = 0;
#ifdef REACT_NATIVE_DEBUG
  bool warnedAboutGraphTraversal_ = false;
#endif

  friend class ColorAnimatedNode;
  friend class AnimationDriver;
  friend class AnimationTestsBase;
};
} // namespace facebook::react
