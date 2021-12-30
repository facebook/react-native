/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <chrono>
#include <condition_variable>
#include <mutex>
#include <queue>

#include <folly/Function.h>
#include <folly/Optional.h>
#include <hermes/hermes.h>
#include <hermes/inspector/chrome/Connection.h>

namespace facebook {
namespace hermes {
namespace inspector {
namespace chrome {

/**
 * SyncConnection provides a synchronous interface over Connection that is
 * useful in tests.
 */
class SyncConnection {
 public:
  SyncConnection(
      std::shared_ptr<HermesRuntime> runtime,
      bool waitForDebugger = false);
  ~SyncConnection() = default;

  /// sends a message to the debugger
  void send(const std::string &str);

  /// waits for the next response from the debugger. handler is called with the
  /// response. throws on timeout.
  void waitForResponse(
      folly::Function<void(const std::string &)> handler,
      std::chrono::milliseconds timeout = std::chrono::milliseconds(2500));

  /// waits for the next notification from the debugger. handler is called with
  /// the notification. throws on timeout.
  void waitForNotification(
      folly::Function<void(const std::string &)> handler,
      std::chrono::milliseconds timeout = std::chrono::milliseconds(2500));

 private:
  class RemoteConnnection;
  friend class RemoteConnnection;

  void onReply(const std::string &message);

  Connection connection_;

  std::mutex mutex_;
  std::condition_variable hasReply_;
  std::queue<std::string> replies_;
  std::condition_variable hasNotification_;
  std::queue<std::string> notifications_;
};

} // namespace chrome
} // namespace inspector
} // namespace hermes
} // namespace facebook
