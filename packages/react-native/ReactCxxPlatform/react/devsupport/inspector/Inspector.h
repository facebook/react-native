/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "InspectorThread.h"

#include <jsinspector-modern/HostTarget.h>
#include <jsinspector-modern/InspectorPackagerConnection.h>
#include <react/http/IHttpClient.h>
#include <react/http/IWebSocketClient.h>
#include <react/threading/TaskDispatchThread.h>
#include <atomic>
#include <functional>
#include <memory>
#include <optional>

namespace facebook::react {

using ToggleDebuggerOverlayFn = std::function<void(bool, std::function<void()> &&)>;

using LiveReloadCallbackFn = std::function<void()>;

class Inspector : public InspectorThread, public std::enable_shared_from_this<Inspector> {
 public:
  Inspector(
      std::string appName,
      std::string deviceName,
      WebSocketClientFactory webSocketClientFactory,
      HttpClientFactory httpClientFactory) noexcept;
  ~Inspector() noexcept override;
  Inspector(const Inspector &other) = delete;
  Inspector &operator=(Inspector &other) = delete;
  Inspector(Inspector &&other) = delete;
  Inspector &operator=(Inspector &&other) = delete;

  // Call from the owner thread before releasing the last owning reference.
  void shutdown() noexcept;

  void runOnInspectorThreadSync(TaskDispatchThread::TaskFn &&callback);

  void connectDebugger(const std::string &inspectorUrl) noexcept;

  void ensureHostTarget(
      LiveReloadCallbackFn &&liveReloadCallbackFn,
      ToggleDebuggerOverlayFn &&toggleDebuggerOverlayFn) noexcept;

  std::shared_ptr<jsinspector_modern::HostTarget> inspectorTarget() const;

 private:
  void invokeElsePost(
      TaskDispatchThread::TaskFn &&callback,
      std::chrono::milliseconds delayMs = std::chrono::milliseconds::zero()) override;

  std::atomic<bool> shuttingDown_{false};
  TaskDispatchThread taskDispatchThread_{"InspectorThread"};
  std::string appName_;
  std::string deviceName_;
  WebSocketClientFactory webSocketClientFactory_;
  HttpClientFactory httpClientFactory_;
  std::shared_ptr<jsinspector_modern::HostTargetDelegate> hostDelegate_;
  std::shared_ptr<jsinspector_modern::HostTarget> target_;
  std::optional<int32_t> pageId_;
  std::unique_ptr<jsinspector_modern::InspectorPackagerConnection> packagerConnection_;
};

} // namespace facebook::react
