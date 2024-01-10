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

namespace facebook::react::jsinspector_modern {

static constexpr const std::chrono::duration RECONNECT_DELAY =
    std::chrono::milliseconds{2000};
static constexpr const char* INVALID = "<invalid>";

static folly::dynamic makePageIdPayload(std::string_view pageId) {
  return folly::dynamic::object("id", pageId);
}

// InspectorPackagerConnection::Impl method definitions

std::shared_ptr<InspectorPackagerConnection::Impl>
InspectorPackagerConnection::Impl::create(
    std::string url,
    std::string app,
    std::unique_ptr<InspectorPackagerConnectionDelegate> delegate) {
  // No make_shared because the constructor is private
  return std::shared_ptr<InspectorPackagerConnection::Impl>(
      new InspectorPackagerConnection::Impl(url, app, std::move(delegate)));
}

InspectorPackagerConnection::Impl::Impl(
    std::string url,
    std::string app,
    std::unique_ptr<InspectorPackagerConnectionDelegate> delegate)
    : url_(std::move(url)),
      app_(std::move(app)),
      delegate_(std::move(delegate)) {}

void InspectorPackagerConnection::Impl::handleProxyMessage(
    folly::const_dynamic_view message) {
  std::string event = message.descend("event").string_or(INVALID);
  if (event == "getPages") {
    sendEvent("getPages", pages());
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
  for (auto& connection : inspectorConnections_) {
    connection.second->sendMessage(event);
  }
}

void InspectorPackagerConnection::Impl::closeAllConnections() {
  for (auto& connection : inspectorConnections_) {
    connection.second->disconnect();
  }
  inspectorConnections_.clear();
}

void InspectorPackagerConnection::Impl::handleConnect(
    folly::const_dynamic_view payload) {
  std::string pageId = payload.descend("pageId").string_or(INVALID);
  auto existingConnectionIt = inspectorConnections_.find(pageId);
  if (existingConnectionIt != inspectorConnections_.end()) {
    auto existingConnection = std::move(existingConnectionIt->second);
    inspectorConnections_.erase(existingConnectionIt);
    existingConnection->disconnect();
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
  auto remoteConnection =
      std::make_unique<InspectorPackagerConnection::RemoteConnectionImpl>(
          weak_from_this(), pageId);
  auto& inspector = getInspectorInstance();
  auto inspectorConnection =
      inspector.connect(pageIdInt, std::move(remoteConnection));
  inspectorConnections_.emplace(pageId, std::move(inspectorConnection));
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
  auto it = inspectorConnections_.find(pageId);
  if (it != inspectorConnections_.end()) {
    auto connection = std::move(it->second);
    inspectorConnections_.erase(it);
    return connection;
  }
  return nullptr;
}

void InspectorPackagerConnection::Impl::handleWrappedEvent(
    folly::const_dynamic_view payload) {
  std::string pageId = payload.descend("pageId").string_or(INVALID);
  std::string wrappedEvent = payload.descend("wrappedEvent").string_or(INVALID);
  auto connectionIt = inspectorConnections_.find(pageId);
  if (connectionIt == inspectorConnections_.end()) {
    LOG(WARNING) << "Not connected to page: " << pageId
                 << " , failed trying to handle event: " << wrappedEvent;
    return;
  }
  connectionIt->second->sendMessage(wrappedEvent);
}

folly::dynamic InspectorPackagerConnection::Impl::pages() {
  auto& inspector = getInspectorInstance();
  auto pages = inspector.getPages();
  folly::dynamic array = folly::dynamic::array();

  for (const auto& page : pages) {
    array.push_back(folly::dynamic::object("id", std::to_string(page.id))(
        "title", page.title + " [C++ connection]")("app", app_)("vm", page.vm));
  }
  return array;
}

void InspectorPackagerConnection::Impl::sendWrappedEvent(
    std::string pageId,
    std::string message) {
  sendEvent(
      "wrappedEvent",
      folly::dynamic::object("pageId", pageId)("wrappedEvent", message));
}

void InspectorPackagerConnection::Impl::sendEvent(
    std::string event,
    folly::dynamic payload) {
  folly::dynamic message =
      folly::dynamic::object("event", event)("payload", payload);
  sendToPackager(message);
}

void InspectorPackagerConnection::Impl::didFailWithError(
    std::optional<int> posixCode,
    std::string error) {
  if (webSocket_) {
    abort(posixCode, "WebSocket exception", error);
  }
  if (!closed_ && posixCode != ECONNREFUSED) {
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

void InspectorPackagerConnection::Impl::didClose() {
  webSocket_.reset();
  closeAllConnections();
  if (!closed_) {
    reconnect();
  }
}

bool InspectorPackagerConnection::Impl::isConnected() const {
  return webSocket_ != nullptr;
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

  reconnectPending_ = true;

  delegate_->scheduleCallback(
      [weakSelf = weak_from_this()] {
        auto strongSelf = weakSelf.lock();
        if (strongSelf && !strongSelf->closed_) {
          strongSelf->reconnectPending_ = false;
          strongSelf->connect();
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

// InspectorPackagerConnection::RemoteConnectionImpl method definitions

InspectorPackagerConnection::RemoteConnectionImpl::RemoteConnectionImpl(
    std::weak_ptr<InspectorPackagerConnection::Impl> owningPackagerConnection,
    std::string pageId)
    : owningPackagerConnection_(owningPackagerConnection),
      pageId_(std::move(pageId)) {}

void InspectorPackagerConnection::RemoteConnectionImpl::onMessage(
    std::string message) {
  auto owningPackagerConnectionStrong = owningPackagerConnection_.lock();
  if (!owningPackagerConnectionStrong) {
    return;
  }
  owningPackagerConnectionStrong->sendWrappedEvent(pageId_, message);
}

void InspectorPackagerConnection::RemoteConnectionImpl::onDisconnect() {
  auto owningPackagerConnectionStrong = owningPackagerConnection_.lock();
  if (owningPackagerConnectionStrong) {
    owningPackagerConnectionStrong->sendEvent(
        "disconnect", makePageIdPayload(pageId_));
  }
}

// InspectorPackagerConnection method definitions

InspectorPackagerConnection::InspectorPackagerConnection(
    std::string url,
    std::string app,
    std::unique_ptr<InspectorPackagerConnectionDelegate> delegate)
    : impl_(Impl::create(url, app, std::move(delegate))) {}

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
