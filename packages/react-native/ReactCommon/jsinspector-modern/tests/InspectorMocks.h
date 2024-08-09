/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/executors/ScheduledExecutor.h>
#include <gmock/gmock.h>

#include <jsinspector-modern/InspectorInterfaces.h>
#include <jsinspector-modern/InspectorPackagerConnection.h>
#include <jsinspector-modern/ReactCdp.h>

#include <chrono>
#include <functional>
#include <memory>
#include <string>

// Configurable mocks of various interfaces required by the inspector API.

namespace facebook::react::jsinspector_modern {

class MockWebSocket : public IWebSocket {
 public:
  MockWebSocket(
      const std::string& url,
      std::weak_ptr<IWebSocketDelegate> delegate)
      : url{url}, delegate{delegate} {
    EXPECT_TRUE(this->delegate.lock())
        << "Delegate should exist when provided to createWebSocket";
  }

  const std::string url;
  std::weak_ptr<IWebSocketDelegate> delegate;

  /**
   * Convenience method to access the delegate from tests.
   * \pre The delegate has not been destroyed.
   */
  IWebSocketDelegate& getDelegate() {
    auto delegateStrong = this->delegate.lock();
    EXPECT_TRUE(delegateStrong);
    return *delegateStrong;
  }

  // IWebSocket methods
  MOCK_METHOD(void, send, (std::string_view message), (override));
};

class MockRemoteConnection : public IRemoteConnection {
 public:
  MockRemoteConnection() = default;

  // IRemoteConnection methods
  MOCK_METHOD(void, onMessage, (std::string message), (override));
  MOCK_METHOD(void, onDisconnect, (), (override));
};

class MockLocalConnection : public ILocalConnection {
 public:
  explicit MockLocalConnection(
      std::unique_ptr<IRemoteConnection> remoteConnection)
      : remoteConnection_{std::move(remoteConnection)} {}

  IRemoteConnection& getRemoteConnection() {
    return *remoteConnection_;
  }

  std::unique_ptr<IRemoteConnection> dangerouslyReleaseRemoteConnection() {
    return std::move(remoteConnection_);
  }

  // ILocalConnection methods
  MOCK_METHOD(void, sendMessage, (std::string message), (override));
  MOCK_METHOD(void, disconnect, (), (override));

 private:
  std::unique_ptr<IRemoteConnection> remoteConnection_;
};

class MockInspectorPackagerConnectionDelegate
    : public InspectorPackagerConnectionDelegate {
 public:
  explicit MockInspectorPackagerConnectionDelegate(folly::Executor& executor)
      : executor_(executor) {
    using namespace testing;
    ON_CALL(*this, scheduleCallback(_, _))
        .WillByDefault(Invoke<>([this](auto callback, auto delay) {
          if (auto scheduledExecutor =
                  dynamic_cast<folly::ScheduledExecutor*>(&executor_)) {
            scheduledExecutor->scheduleAt(
                callback, scheduledExecutor->now() + delay);
          } else {
            executor_.add(callback);
          }
        }));
  }

  // InspectorPackagerConnectionDelegate methods
  MOCK_METHOD(
      std::unique_ptr<IWebSocket>,
      connectWebSocket,
      (const std::string& url, std::weak_ptr<IWebSocketDelegate> delegate),
      (override));
  MOCK_METHOD(
      void,
      scheduleCallback,
      (std::function<void(void)> callback, std::chrono::milliseconds delayMs),
      (override));

 private:
  folly::Executor& executor_;
};

class MockPageTargetDelegate : public PageTargetDelegate {
 public:
  // PageTargetDelegate methods
  MOCK_METHOD(void, onReload, (const PageReloadRequest& request), (override));
};

class MockInstanceTargetDelegate : public InstanceTargetDelegate {};

class MockRuntimeTargetDelegate : public RuntimeTargetDelegate {
 public:
  // RuntimeTargetDelegate methods
  MOCK_METHOD(
      std::unique_ptr<RuntimeAgentDelegate>,
      createAgentDelegate,
      (FrontendChannel channel,
       SessionState& sessionState,
       std::unique_ptr<RuntimeAgentDelegate::ExportedState>
           previouslyExportedState,
       const ExecutionContextDescription&),
      (override));
};

class MockRuntimeAgentDelegate : public RuntimeAgentDelegate {
 public:
  inline MockRuntimeAgentDelegate(
      FrontendChannel frontendChannel,
      SessionState& sessionState,
      std::unique_ptr<RuntimeAgentDelegate::ExportedState>,
      const ExecutionContextDescription& executionContextDescription)
      : frontendChannel(std::move(frontendChannel)),
        sessionState(sessionState),
        executionContextDescription(executionContextDescription) {}

  // RuntimeAgentDelegate methods
  MOCK_METHOD(
      bool,
      handleRequest,
      (const cdp::PreparsedRequest& req),
      (override));

  const FrontendChannel frontendChannel;
  SessionState& sessionState;
  const ExecutionContextDescription executionContextDescription;
};

} // namespace facebook::react::jsinspector_modern
