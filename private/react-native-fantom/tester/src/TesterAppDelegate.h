/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/ReactPrimitives.h>
#include <react/runtime/ReactInstanceConfig.h>
#include <memory>
#include <string>
#include <vector>

#include "TesterMountingManager.h"

namespace facebook::jsi {
class Runtime;
}

namespace facebook::react {

class ReactHost;
class StubQueue;
class RunLoopObserverManager;

class TesterAppDelegate {
 public:
  TesterAppDelegate(const ReactInstanceConfig& reactInstanceConfig);
  ~TesterAppDelegate();

  // TesterAppDelegate is not copyable or movable.
  TesterAppDelegate(const TesterAppDelegate&) = delete;
  TesterAppDelegate& operator=(const TesterAppDelegate&) = delete;
  TesterAppDelegate(TesterAppDelegate&&) = delete;
  TesterAppDelegate& operator=(TesterAppDelegate&&) = delete;

  void loadScript(const std::string& bundlePath, const std::string& sourcePath);

  void startSurface(
      jsi::Runtime& runtime,
      float widthDp,
      float heightDp,
      SurfaceId surfaceId,
      float pointScaleFactor = 1.0f,
      float viewportOffsetX = 0.0f,
      float viewportOffsetY = 0.0f);

  void updateSurfaceConstraints(
      SurfaceId surfaceId,
      float widthDp,
      float heightDp,
      float pointScaleFactor);

  void stopSurface(SurfaceId surfaceId);

  void onRender();

  void produceFramesForDuration(double milliseconds);

  void flushMessageQueue();

  bool hasPendingTasksInMessageQueue();

  std::vector<std::string> getConsoleLogs();

  std::unique_ptr<ReactHost> reactHost_;
  std::weak_ptr<StubQueue> queue_;

  std::shared_ptr<RunLoopObserverManager> runLoopObserverManager_;

  std::vector<std::string> consoleLogs_{};

  std::shared_ptr<TesterMountingManager> mountingManager_;

 private:
  void runUITick();

  std::function<void()> onAnimationRender_{nullptr};
};

} // namespace facebook::react
