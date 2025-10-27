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
class InspectorPackagerConnection::Impl : public IWebSocketDelegate,
                                          public IPageStatusListener,
                                          // Used to generate `weak_ptr`s we can pass around.
                                          public std::enable_shared_from_this<InspectorPackagerConnection::Impl> {
 public:
  using SessionId = uint32_t;

  /**
   * Implements InspectorPackagerConnection's constructor.
   */
  static std::shared_ptr<Impl> create(
      std::string url,
      std::string deviceName,
      std::string appName,
      std::unique_ptr<InspectorPackagerConnectionDelegate> delegate);

  // InspectorPackagerConnection's public API
  bool isConnected() const;
  void connect();
  void closeQuietly();
  void sendEventToAllConnections(const std::string &event);
  std::unique_ptr<ILocalConnection> removeConnectionForPage(const std::string &pageId);

  /**
   * Send a message to the packager as soon as possible. This method is safe
   * to call from any thread. The connection may be closed before the message
   * is sent, in which case the message will be dropped. The message is also
   * dropped if the session is no longer valid.
   */
  void scheduleSendToPackager(folly::dynamic message, SessionId sourceSessionId, const std::string &sourcePageId);

 private:
  struct Session {
    std::unique_ptr<ILocalConnection> localConnection;
    SessionId sessionId;
  };
  class RemoteConnection;

  Impl(
      std::string url,
      std::string deviceName,
      std::string appName,
      std::unique_ptr<InspectorPackagerConnectionDelegate> delegate);
  Impl(const Impl &) = delete;
  Impl &operator=(const Impl &) = delete;

  void handleDisconnect(const folly::const_dynamic_view &payload);
  void handleConnect(const folly::const_dynamic_view &payload);
  void handleWrappedEvent(const folly::const_dynamic_view &payload);
  void handleProxyMessage(const folly::const_dynamic_view &message);
  folly::dynamic pages();
  void reconnect();
  void closeAllConnections();
  void disposeWebSocket();
  void sendToPackager(const folly::dynamic &message);

  void abort(std::optional<int> posixCode, const std::string &message, const std::string &cause);

  // IWebSocketDelegate methods
  virtual void didFailWithError(std::optional<int> posixCode, std::string error) override;
  virtual void didReceiveMessage(std::string_view message) override;
  virtual void didOpen() override;
  virtual void didClose() override;

  // IPageStatusListener methods
  virtual void onPageRemoved(int pageId) override;

  const std::string url_;
  const std::string deviceName_;
  const std::string appName_;
  const std::unique_ptr<InspectorPackagerConnectionDelegate> delegate_;

  std::unordered_map<std::string, Session> inspectorSessions_;
  std::unique_ptr<IWebSocket> webSocket_;
  bool connected_{false};
  bool closed_{false};
  bool suppressConnectionErrors_{false};

  // Whether a reconnection is currently pending.
  bool reconnectPending_{false};

  SessionId nextSessionId_{1};
};

class InspectorPackagerConnection::Impl::RemoteConnection : public IRemoteConnection {
 public:
  RemoteConnection(
      std::weak_ptr<InspectorPackagerConnection::Impl> owningPackagerConnection,
      std::string pageId,
      SessionId sessionId);

  // IRemoteConnection methods
  void onMessage(std::string message) override;
  void onDisconnect() override;

 private:
  const std::weak_ptr<InspectorPackagerConnection::Impl> owningPackagerConnection_;
  const std::string pageId_;
  const SessionId sessionId_;
};

} // namespace facebook::react::jsinspector_modern
