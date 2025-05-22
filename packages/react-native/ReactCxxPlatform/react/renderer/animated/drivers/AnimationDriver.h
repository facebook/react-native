/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Adapted from react-native-windows under the MIT license.
 */

#pragma once

#include <react/debug/flags.h>
#include <react/renderer/animated/NativeAnimatedNodesManager.h>

namespace facebook::react {

enum class AnimationDriverType {
  Frames,
  Spring,
  Decay,
};

class ValueAnimatedNode;
class AnimationDriver : public std::enable_shared_from_this<AnimationDriver> {
 public:
  AnimationDriver(
      int id,
      Tag animatedValueTag,
      std::optional<AnimationEndCallback> endCallback,
      folly::dynamic config,
      NativeAnimatedNodesManager* manager);
  virtual ~AnimationDriver() = default;
  void startAnimation();
  void stopAnimation(bool ignoreCompletedHandlers = false);

  inline constexpr int Id() {
    return id_;
  }

  inline constexpr Tag animatedValueTag() {
    return animatedValueTag_;
  }

  inline std::optional<AnimationEndCallback> endCallback() noexcept {
    return endCallback_;
  }

  virtual double toValue() {
    return 0;
  }

  bool isComplete() {
    return isComplete_;
  }

  virtual void runAnimationStep(double renderingTime);

  virtual void updateConfig(folly::dynamic config);

#ifdef REACT_NATIVE_DEBUG
  std::string debugID() const {
    return (config_.count("debugID") != 0u) ? config_["debugID"].asString()
                                            : "";
  }
#endif

  static std::optional<AnimationDriverType> getDriverTypeByName(
      const std::string& driverTypeName);

 protected:
  virtual bool update(double /*timeDeltaMs*/, bool /*restarting*/) {
    return true;
  }

  void markNodeUpdated(Tag tag) {
    manager_->updatedNodeTags_.insert(tag);
  }

  std::optional<AnimationEndCallback> endCallback_;
  int id_{0};
  Tag animatedValueTag_{}; // Tag of a ValueAnimatedNode
  int iterations_{0};
  NativeAnimatedNodesManager* manager_;

  bool isComplete_{false};
  int currentIteration_{0};
  double startFrameTimeMs_{-1};

  bool isStarted_{false};
  bool ignoreCompletedHandlers_{false};

  folly::dynamic config_{};

 private:
  void onConfigChanged();
};

} // namespace facebook::react
