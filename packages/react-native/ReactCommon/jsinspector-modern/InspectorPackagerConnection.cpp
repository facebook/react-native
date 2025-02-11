/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "InspectorPackagerConnection.h"
#include "InspectorInterfaces.h"
#include "InspectorPackagerConnectionImpl.h"

#include <folly/dynamic.h>
#include <folly/json.h>
#include <glog/logging.h>
#include <cerrno>
#include <chrono>

using namespace std::literals;

namespace facebook::react::jsinspector_modern {

static constexpr const std::chrono::duration RECONNECT_DELAY =
    std::chrono::milliseconds{2000};
static constexpr const char* INVALID = "<invalid>";

// InspectorPackagerConnection::Impl method definitions

std::shared_ptr<InspectorPackagerConnection::Impl>
InspectorPackagerConnection::Impl::create(
    std::string url,
    std::string deviceName,
    std::string appName,
    std::unique_ptr<InspectorPackagerConnectionDelegate> delegate) {
  // No make_shared because the constructor is private
  std::shared_ptr<InspectorPackagerConnection::Impl> impl(
      new InspectorPackagerConnection::Impl(
          url, deviceName, appName, std::move(delegate)));
  getInspectorInstance().registerPageStatusListener(impl);
  return impl;
}

InspectorPackagerConnection::Impl::Impl(
    std::string url,
    std::string deviceName,
    std::string appName,
    std::unique_ptr<InspectorPackagerConnectionDelegate> delegate)
    : url_(std::move(url)),
      deviceName_(std::move(deviceName)),
      appName_(std::move(appName)),
      delegate_(std::move(delegate)) {}

void InspectorPackagerConnection::Impl::handleProxyMessage(
    folly::const_dynamic_view message) {
  std::string event = message.descend("event").string_or(INVALID);
  if (event == "getPages") {
    sendToPackager(
        folly::dynamic::object("event", "getPages")("payload", pages()));
  } else if (event == "wrappedEvent") {
    handleWrappedEvent(message.descend("payload"));
  } else if (event == "connect") {
    handleConnect(message.descend("payload"));
  } else if (event == "disconnect") {
    handleDisconnect(message.descend("payload"));
  } else {
    LOG(ERROR) << "Unknown event: " << event;
  }
}

void InspectorPackagerConnection::Impl::sendEventToAllConnections(
    std::string event) {
  for (auto& connection : inspectorSessions_) {
    connection.second.localConnection->sendMessage(event);
  }
}

void InspectorPackagerConnection::Impl::closeAllConnections() {
  for (auto& connection : inspectorSessions_) {
    connection.second.localConnection->disconnect();
  }
  inspectorSessions_.clear();
}

void InspectorPackagerConnection::Impl::handleConnect(
    folly::const_dynamic_view payload) {
  std::string pageId = payload.descend("pageId").string_or(INVALID);
  auto existingConnectionIt = inspectorSessions_.find(pageId);
  if (existingConnectionIt != inspectorSessions_.end()) {
    auto existingConnection = std::move(existingConnectionIt->second);
    inspectorSessions_.erase(existingConnectionIt);
    existingConnection.localConnection->disconnect();
    LOG(WARNING) << "Already connected: " << pageId;
    return;
  }
  int pageIdInt;
  try {
    pageIdInt = std::stoi(pageId);
  } catch (...) {
    LOG(ERROR) << "Invalid page id: " << pageId;
    return;
  }
  auto sessionId = nextSessionId_++;
  auto remoteConnection =
      std::make_unique<InspectorPackagerConnection::Impl::RemoteConnection>(
          weak_from_this(), pageId, sessionId);
  auto& inspector = getInspectorInstance();
  auto inspectorConnection =
      inspector.connect(pageIdInt, std::move(remoteConnection));
  if (!inspectorConnection) {
    LOG(INFO) << "Connection to page " << pageId << " rejected";

    // RemoteConnection::onDisconnect(), if the connection even calls it,  will
    // be a no op (because the session is not added to `inspectorSessions_`), so
    // let's always notify the remote client of the disconnection ourselves.
    sendToPackager(folly::dynamic::object("event", "disconnect")(
        "payload", folly::dynamic::object("pageId", pageId)));
    return;
  }
  inspectorSessions_.emplace(
      pageId,
      Session{
          .localConnection = std::move(inspectorConnection),
          .sessionId = sessionId});
}

void InspectorPackagerConnection::Impl::handleDisconnect(
    folly::const_dynamic_view payload) {
  std::string pageId = payload.descend("pageId").string_or(INVALID);
  auto inspectorConnection = removeConnectionForPage(pageId);
  if (inspectorConnection) {
    inspectorConnection->disconnect();
  }
}

std::unique_ptr<ILocalConnection>
InspectorPackagerConnection::Impl::removeConnectionForPage(std::string pageId) {
  auto it = inspectorSessions_.find(pageId);
  if (it != inspectorSessions_.end()) {
    auto connection = std::move(it->second);
    inspectorSessions_.erase(it);
    return std::move(connection.localConnection);
  }
  return nullptr;
}

void InspectorPackagerConnection::Impl::handleWrappedEvent(
    folly::const_dynamic_view payload) {
  std::string pageId = payload.descend("pageId").string_or(INVALID);
  std::string wrappedEvent = payload.descend("wrappedEvent").string_or(INVALID);
  auto connectionIt = inspectorSessions_.find(pageId);
  if (connectionIt == inspectorSessions_.end()) {
    LOG(WARNING) << "Not connected to page: " << pageId
                 << " , failed trying to handle event: " << wrappedEvent;
    return;
  }
  connectionIt->second.localConnection->sendMessage(wrappedEvent);
}

folly::dynamic InspectorPackagerConnection::Impl::pages() {
  auto& inspector = getInspectorInstance();
  auto pages = inspector.getPages();
  folly::dynamic array = folly::dynamic::array();

  for (const auto& page : pages) {
    folly::dynamic pageDescription = folly::dynamic::object;
    pageDescription["id"] = std::to_string(page.id);
    pageDescription["title"] = appName_ + " (" + deviceName_ + ")";
    pageDescription["description"] = page.description + " [C++ connection]";
    pageDescription["app"] = appName_;
    pageDescription["capabilities"] =
        targetCapabilitiesToDynamic(page.capabilities);

    array.push_back(pageDescription);
  }
  return array;
}

void InspectorPackagerConnection::Impl::didFailWithError(
    std::optional<int> posixCode,
    std::string error) {
  if (webSocket_) {
    abort(posixCode, "WebSocket exception", error);
  }
  if (!closed_) {
    reconnect();
  }
}

void InspectorPackagerConnection::Impl::didReceiveMessage(
    std::string_view message) {
  folly::dynamic parsedJSON;
  try {
    parsedJSON = folly::parseJson(message);
  } catch (const folly::json::parse_error& e) {
    LOG(ERROR) << "Unrecognized inspector message, string was not valid JSON: "
               << e.what();
    return;
  }
  handleProxyMessage(std::move(parsedJSON));
}

void InspectorPackagerConnection::Impl::didOpen() {
  connected_ = true;
}

void InspectorPackagerConnection::Impl::didClose() {
  connected_ = false;
  webSocket_.reset();
  closeAllConnections();
  if (!closed_) {
    reconnect();
  }
}

void InspectorPackagerConnection::Impl::onPageRemoved(int pageId) {
  auto connection = removeConnectionForPage(std::to_string(pageId));
  if (connection) {
    connection->disconnect();
  }
}

bool InspectorPackagerConnection::Impl::isConnected() const {
  return webSocket_ != nullptr && connected_;
}

void InspectorPackagerConnection::Impl::connect() {
  if (closed_) {
    LOG(ERROR)
        << "Illegal state: Can't connect after having previously been closed.";
    return;
  }
  webSocket_ = delegate_->connectWebSocket(url_, weak_from_this());
}

void InspectorPackagerConnection::Impl::reconnect() {
  if (reconnectPending_) {
    return;
  }
  if (closed_) {
    LOG(ERROR)
        << "Illegal state: Can't reconnect after having previously been closed.";
    return;
  }

  if (!suppressConnectionErrors_) {
    LOG(WARNING) << "Couldn't connect to packager, will silently retry";
    suppressConnectionErrors_ = true;
  }

  if (isConnected()) {
    return;
  }

  reconnectPending_ = true;

  delegate_->scheduleCallback(
      [weakSelf = weak_from_this()] {
        auto strongSelf = weakSelf.lock();
        if (strongSelf && !strongSelf->closed_) {
          strongSelf->reconnectPending_ = false;

          if (strongSelf->isConnected()) {
            return;
          }

          strongSelf->connect();

          if (!strongSelf->isConnected()) {
            strongSelf->reconnect();
          }
        }
      },
      RECONNECT_DELAY);
}

void InspectorPackagerConnection::Impl::closeQuietly() {
  closed_ = true;
  disposeWebSocket();
}

void InspectorPackagerConnection::Impl::sendToPackager(folly::dynamic message) {
  if (!webSocket_) {
    return;
  }

  webSocket_->send(folly::toJson(message));
}

void InspectorPackagerConnection::Impl::scheduleSendToPackager(
    folly::dynamic message,
    SessionId sourceSessionId,
    std::string sourcePageId) {
  delegate_->scheduleCallback(
      [weakSelf = weak_from_this(),
       message = std::move(message),
       sourceSessionId,
       sourcePageId]() mutable {
        auto strongSelf = weakSelf.lock();
        if (!strongSelf) {
          return;
        }
        auto sessionIt = strongSelf->inspectorSessions_.find(sourcePageId);
        if (sessionIt != strongSelf->inspectorSessions_.end() &&
            sessionIt->second.sessionId == sourceSessionId) {
          strongSelf->sendToPackager(std::move(message));
        }
      },
      0ms);
}

void InspectorPackagerConnection::Impl::abort(
    std::optional<int> posixCode,
    const std::string& message,
    const std::string& cause) {
  // Don't log ECONNREFUSED at all; it's expected in cases where the server
  // isn't listening.
  if (posixCode != ECONNREFUSED) {
    LOG(INFO) << "Error occurred, shutting down websocket connection: "
              << message << " " << cause;
  }
  closeAllConnections();
  disposeWebSocket();
}

void InspectorPackagerConnection::Impl::disposeWebSocket() {
  webSocket_.reset();
}

// InspectorPackagerConnection::Impl::RemoteConnection method definitions

InspectorPackagerConnection::Impl::RemoteConnection::RemoteConnection(
    std::weak_ptr<InspectorPackagerConnection::Impl> owningPackagerConnection,
    std::string pageId,
    SessionId sessionId)
    : owningPackagerConnection_(owningPackagerConnection),
      pageId_(std::move(pageId)),
      sessionId_(sessionId) {}

void InspectorPackagerConnection::Impl::RemoteConnection::onMessage(
    std::string message) {
  auto owningPackagerConnectionStrong = owningPackagerConnection_.lock();
  if (!owningPackagerConnectionStrong) {
    return;
  }
  owningPackagerConnectionStrong->scheduleSendToPackager(
      folly::dynamic::object("event", "wrappedEvent")(
          "payload",
          folly::dynamic::object("pageId", pageId_)("wrappedEvent", message)),
      sessionId_,
      pageId_);
}

void InspectorPackagerConnection::Impl::RemoteConnection::onDisconnect() {
  auto owningPackagerConnectionStrong = owningPackagerConnection_.lock();
  if (owningPackagerConnectionStrong) {
    owningPackagerConnectionStrong->scheduleSendToPackager(
        folly::dynamic::object("event", "disconnect")(
            "payload", folly::dynamic::object("pageId", pageId_)),
        sessionId_,
        pageId_);
  }
}

// InspectorPackagerConnection method definitions

InspectorPackagerConnection::InspectorPackagerConnection(
    std::string url,
    std::string deviceName,
    std::string appName,
    std::unique_ptr<InspectorPackagerConnectionDelegate> delegate)
    : impl_(Impl::create(url, deviceName, appName, std::move(delegate))) {}

bool InspectorPackagerConnection::isConnected() const {
  return impl_->isConnected();
}

void InspectorPackagerConnection::connect() {
  impl_->connect();
}

void InspectorPackagerConnection::closeQuietly() {
  impl_->closeQuietly();
}

void InspectorPackagerConnection::sendEventToAllConnections(std::string event) {
  impl_->sendEventToAllConnections(event);
}

} // namespace facebook::react::jsinspector_modern
