/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "InspectorInterfaces.h"
#include "InspectorPackagerConnection.h"

#include <folly/dynamic.h>
#include <unordered_map>

namespace facebook::react::jsinspector_modern {

/**
 * Internals of InspectorPackagerConnection.
 */
class InspectorPackagerConnection::Impl
    : public IWebSocketDelegate,
      // Used to generate `weak_ptr`s we can pass around.
      public std::enable_shared_from_this<InspectorPackagerConnection::Impl> {
 public:
  /**
   * Implements InspectorPackagerConnection's constructor.
   */
  static std::shared_ptr<Impl> create(
      std::string url,
      std::string app,
      std::unique_ptr<InspectorPackagerConnectionDelegate> delegate);

  // InspectorPackagerConnection's public API
  bool isConnected() const;
  void connect();
  void closeQuietly();
  void sendEventToAllConnections(std::string event);
  std::unique_ptr<ILocalConnection> removeConnectionForPage(std::string pageId);

  // Exposed for RemoteConnectionImpl's use
  void sendEvent(std::string event, folly::dynamic payload);
  // Exposed for RemoteConnectionImpl's use
  void sendWrappedEvent(std::string pageId, std::string message);

 private:
  Impl(
      std::string url,
      std::string app,
      std::unique_ptr<InspectorPackagerConnectionDelegate> delegate);
  Impl(const Impl&) = delete;
  Impl& operator=(const Impl&) = delete;

  void handleDisconnect(folly::const_dynamic_view payload);
  void handleConnect(folly::const_dynamic_view payload);
  void handleWrappedEvent(folly::const_dynamic_view wrappedEvent);
  void handleProxyMessage(folly::const_dynamic_view message);
  folly::dynamic pages();
  void reconnect();
  void closeAllConnections();
  void disposeWebSocket();
  void sendToPackager(folly::dynamic message);

  void abort(
      std::optional<int> posixCode,
      const std::string& message,
      const std::string& cause);

  // IWebSocketDelegate methods
  virtual void didFailWithError(std::optional<int> posixCode, std::string error)
      override;
  virtual void didReceiveMessage(std::string_view message) override;
  virtual void didClose() override;

  std::string url_;
  std::string app_;
  std::unique_ptr<InspectorPackagerConnectionDelegate> delegate_;

  std::unordered_map<std::string, std::unique_ptr<ILocalConnection>>
      inspectorConnections_;
  std::unique_ptr<IWebSocket> webSocket_;
  bool closed_{false};
  bool suppressConnectionErrors_{false};

  // Whether a reconnection is currently pending.
  bool reconnectPending_{false};
};

class InspectorPackagerConnection::RemoteConnectionImpl
    : public IRemoteConnection {
 public:
  RemoteConnectionImpl(
      std::weak_ptr<InspectorPackagerConnection::Impl> owningPackagerConnection,
      std::string pageId);

  // IRemoteConnection methods
  void onMessage(std::string message) override;
  void onDisconnect() override;

 private:
  std::weak_ptr<InspectorPackagerConnection::Impl> owningPackagerConnection_;
  std::string pageId_;
};

} // namespace facebook::react::jsinspector_modern
