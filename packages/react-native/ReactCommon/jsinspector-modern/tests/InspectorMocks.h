/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <gmock/gmock.h>

#include <jsinspector-modern/InspectorInterfaces.h>
#include <jsinspector-modern/InspectorPackagerConnection.h>

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

class MockLocalConnection : public ILocalConnection {
 public:
  explicit MockLocalConnection(
      std::unique_ptr<IRemoteConnection> remoteConnection)
      : remoteConnection_{std::move(remoteConnection)} {}

  IRemoteConnection& getRemoteConnection() {
    return *remoteConnection_;
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
  MockInspectorPackagerConnectionDelegate() {
    using namespace testing;
    ON_CALL(*this, scheduleCallback(_, _)).WillByDefault(InvokeArgument<0>());
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
};

} // namespace facebook::react::jsinspector_modern
