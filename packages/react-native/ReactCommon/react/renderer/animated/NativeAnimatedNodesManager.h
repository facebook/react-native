/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#if __has_include("FBReactNativeSpecJSI.h") // CocoaPod headers on Apple
#include "FBReactNativeSpecJSI.h"
#else
#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#endif
#include <folly/dynamic.h>
#include <react/bridging/Function.h>
#include <react/debug/flags.h>
#include <react/renderer/animated/EventEmitterListener.h>
#include <react/renderer/animated/event_drivers/EventAnimationDriver.h>
#ifdef RN_USE_ANIMATION_BACKEND
#include <react/renderer/animationbackend/AnimationBackend.h>
#endif
#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/uimanager/UIManagerAnimationBackend.h>
#include <chrono>
#include <memory>
#include <mutex>
#include <optional>
#include <string>
#include <unordered_map>
#include <vector>

namespace facebook::react {

using TimePointFunction = std::chrono::steady_clock::time_point (*)();
// A way to inject a custom time function for testing purposes.
// Default is `std::chrono::steady_clock::now`.
void g_setNativeAnimatedNowTimestampFunction(TimePointFunction nowFunction);

class AnimatedNode;
class AnimationDriver;
class Scheduler;

using ValueListenerCallback = std::function<void(double)>;
using UiTask = std::function<void()>;

using EndResult = NativeAnimatedTurboModuleEndResult<bool, std::optional<double>, std::optional<double>>;

using AnimationEndCallback = AsyncCallback<EndResult>;

template <>
struct Bridging<EndResult> : NativeAnimatedTurboModuleEndResultBridging<EndResult> {};

class NativeAnimatedNodesManager {
 public:
  using DirectManipulationCallback = std::function<void(Tag, const folly::dynamic &)>;
  using FabricCommitCallback = std::function<void(std::unordered_map<Tag, folly::dynamic> &)>;
  using StartOnRenderCallback = std::function<void(std::function<void()> &&, bool isAsync)>;
  using StopOnRenderCallback = std::function<void(bool isAsync)>;
  using FrameRateListenerCallback = std::function<void(bool /* shouldEnableListener */)>;

  explicit NativeAnimatedNodesManager(
      DirectManipulationCallback &&directManipulationCallback,
      FabricCommitCallback &&fabricCommitCallback,
      StartOnRenderCallback &&startOnRenderCallback = nullptr,
      StopOnRenderCallback &&stopOnRenderCallback = nullptr,
      FrameRateListenerCallback &&frameRateListenerCallback = nullptr) noexcept;

  explicit NativeAnimatedNodesManager(std::shared_ptr<UIManagerAnimationBackend> animationBackend) noexcept;

  ~NativeAnimatedNodesManager() noexcept;

  template <typename T, typename = std::enable_if_t<std::is_base_of_v<AnimatedNode, T>>>
  T *getAnimatedNode(Tag tag) const
    requires(std::is_base_of_v<AnimatedNode, T>)
  {
    if (auto it = animatedNodes_.find(tag); it != animatedNodes_.end()) {
      return static_cast<T *>(it->second.get());
    }
    return nullptr;
  }

  std::optional<double> getValue(Tag tag) noexcept;

#pragma mark - Graph

  // Called from JS thread
  void createAnimatedNodeAsync(Tag tag, const folly::dynamic &config) noexcept;

  void createAnimatedNode(Tag tag, const folly::dynamic &config) noexcept;

  void connectAnimatedNodes(Tag parentTag, Tag childTag) noexcept;

  void connectAnimatedNodeToView(Tag propsNodeTag, Tag viewTag) noexcept;

  void disconnectAnimatedNodes(Tag parentTag, Tag childTag) noexcept;

  void disconnectAnimatedNodeFromView(Tag propsNodeTag, Tag viewTag) noexcept;

  void restoreDefaultValues(Tag tag) noexcept;

  void dropAnimatedNode(Tag tag) noexcept;

  void setAnimatedNodeValue(Tag tag, double value);

  void flattenAnimatedNodeOffset(Tag tag);

  void extractAnimatedNodeOffsetOp(Tag tag);

  void setAnimatedNodeOffset(Tag tag, double offset);

#ifdef RN_USE_ANIMATION_BACKEND
  AnimationMutations pullAnimationMutations();
#endif

#pragma mark - Drivers

  void startAnimatingNode(
      int animationId,
      Tag animatedNodeTag,
      folly::dynamic config,
      std::optional<AnimationEndCallback> endCallback) noexcept;

  void stopAnimation(int animationId, bool isTrackingAnimation = false) noexcept;

  void addAnimatedEventToView(Tag viewTag, const std::string &eventName, const folly::dynamic &eventMapping) noexcept;

  void removeAnimatedEventFromView(Tag viewTag, const std::string &eventName, Tag animatedValueTag) noexcept;

  std::shared_ptr<EventEmitterListener> getEventEmitterListener() noexcept
  {
    return ensureEventEmitterListener();
  }

#pragma mark - Listeners

  void startListeningToAnimatedNodeValue(Tag tag, ValueListenerCallback &&callback) noexcept;

  void stopListeningToAnimatedNodeValue(Tag tag) noexcept;

  void schedulePropsCommit(
      Tag viewTag,
      const folly::dynamic &props,
      bool layoutStyleUpdated,
      bool forceFabricCommit) noexcept;

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

  void scheduleOnUI(UiTask &&task)
  {
    {
      std::lock_guard<std::mutex> lock(uiTasksMutex_);
      operations_.push_back(std::move(task));
    }

    // Whenever a batch is flushed to the UI thread, start the onRender
    // callbacks to guarantee they run at least once. E.g., to execute
    // setValue calls.
    startRenderCallbackIfNeeded(true);
  }

  void onRender();

  void startRenderCallbackIfNeeded(bool isAsync);

  void updateNodes(const std::set<int> &finishedAnimationValueNodes = {}) noexcept;

  folly::dynamic managedProps(Tag tag) const noexcept;

  bool hasManagedProps() const noexcept;

  void onManagedPropsRemoved(Tag tag) noexcept;

  bool isOnRenderThread() const noexcept;

 private:
  void stopRenderCallbackIfNeeded(bool isAsync) noexcept;

  bool onAnimationFrame(double timestamp);

  bool isAnimationUpdateNeeded() const noexcept;

  void stopAnimationsForNode(Tag nodeTag);

  std::shared_ptr<EventEmitterListener> ensureEventEmitterListener() noexcept;

  void handleAnimatedEvent(Tag tag, const std::string &eventName, const EventPayload &payload) noexcept;

  std::weak_ptr<UIManagerAnimationBackend> animationBackend_;

  std::unique_ptr<AnimatedNode> animatedNode(Tag tag, const folly::dynamic &config) noexcept;

  static thread_local bool isOnRenderThread_;

  std::mutex animatedNodesCreatedAsyncMutex_;
  std::unordered_map<Tag, std::unique_ptr<AnimatedNode>> animatedNodesCreatedAsync_;
  std::unordered_map<Tag, std::unique_ptr<AnimatedNode>> animatedNodes_;
  std::unordered_map<Tag, Tag> connectedAnimatedNodes_;
  std::unordered_map<int, std::unique_ptr<AnimationDriver>> activeAnimations_;
  std::unordered_map<
      EventAnimationDriverKey,
      std::vector<std::unique_ptr<EventAnimationDriver>>,
      std::hash<facebook::react::EventAnimationDriverKey>>
      eventDrivers_;
  std::unordered_set<Tag> updatedNodeTags_;

  mutable std::mutex connectedAnimatedNodesMutex_;

  std::mutex uiTasksMutex_;
  std::vector<UiTask> operations_;

  /*
   * Tracks whether a event-driven animation is currently in progress.
   * This is set to true when an event handler triggers an animation,
   * and reset to false when UI tick results in no changes to UI from
   * animations.
   */
  bool isEventAnimationInProgress_{false};

  // React context required to commit props onto Component View
  const DirectManipulationCallback directManipulationCallback_;
  const FabricCommitCallback fabricCommitCallback_;

  /*
   * Tracks whether the render callback loop for animations is currently active.
   */
  std::atomic_bool isRenderCallbackStarted_{false};
  const StartOnRenderCallback startOnRenderCallback_;
  const StopOnRenderCallback stopOnRenderCallback_;
  const FrameRateListenerCallback frameRateListenerCallback_;

  std::shared_ptr<EventEmitterListener> eventEmitterListener_{nullptr};

  std::unordered_map<Tag, folly::dynamic> updateViewProps_{};
  std::unordered_map<Tag, folly::dynamic> updateViewPropsDirect_{};

  /*
   * Sometimes a view is not longer connected to a PropsAnimatedNode, but
   * NativeAnimated has previously changed the view's props via direct
   * manipulation, we use unsyncedDirectViewProps_ to keep track of those
   * props, to make sure later Fabric commits will not override direct
   * manipulation result on this view.
   */
  mutable std::mutex unsyncedDirectViewPropsMutex_;
  std::unordered_map<Tag, folly::dynamic> unsyncedDirectViewProps_{};

  int animatedGraphBFSColor_ = 0;
#ifdef REACT_NATIVE_DEBUG
  bool warnedAboutGraphTraversal_ = false;
#endif

  friend class ColorAnimatedNode;
  friend class AnimationDriver;
  friend class AnimationTestsBase;
};
} // namespace facebook::react
