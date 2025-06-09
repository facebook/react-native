/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "WebSocketModule.h"

#include <glog/logging.h>

namespace facebook::react {

WebSocketModule::WebSocketModule(
    std::shared_ptr<CallInvoker> jsInvoker,
    WebSocketClientFactory webSocketClientFactory)
    : NativeWebSocketModuleCxxSpec(jsInvoker),
      webSocketClientFactory_(std::move(webSocketClientFactory)) {}

WebSocketModule::~WebSocketModule() {
  connections_.clear();
}

void WebSocketModule::connect(
    jsi::Runtime& /*rt*/,
    const std::string& url,
    const std::optional<std::vector<std::string>>& /*protocols*/,
    jsi::Object /*options*/,
    int32_t socketID) {
  auto webSocket = webSocketClientFactory_();
  connections_.emplace(socketID, std::move(webSocket));
  connections_[socketID]->setOnMessageCallback([weakThis = weak_from_this(),
                                                socketID](
                                                   const std::string& message) {
    auto strongThis = weakThis.lock();
    if (!strongThis) {
      return;
    }
    strongThis->emitDeviceEvent(
        "websocketMessage",
        [socketID, message = std::string(message)](
            jsi::Runtime& rt, std::vector<jsi::Value>& args) {
          auto arg = jsi::Object(rt);
          arg.setProperty(rt, "id", jsi::Value(socketID));
          arg.setProperty(
              rt, "type", facebook::jsi::String::createFromAscii(rt, "string"));
          arg.setProperty(
              rt, "data", facebook::jsi::String::createFromUtf8(rt, message));
          args.emplace_back(rt, arg);
        });
  });
  connections_[socketID]->setOnClosedCallback(
      [weakThis = weak_from_this(), socketID](const std::string& /*reason*/) {
        auto strongThis = weakThis.lock();
        if (!strongThis) {
          return;
        }
        strongThis->emitDeviceEvent(
            "websocketClosed",
            [socketID](jsi::Runtime& rt, std::vector<jsi::Value>& args) {
              auto arg = jsi::Object(rt);
              arg.setProperty(rt, "id", jsi::Value(socketID));
              arg.setProperty(rt, "code", jsi::Value(0));
              arg.setProperty(
                  rt,
                  "reason",
                  facebook::jsi::String::createFromAscii(rt, "closed"));
              args.emplace_back(rt, arg);
            });
      });

  connections_[socketID]->connect(
      url,
      [weakThis = weak_from_this(), socketID](
          bool success, const std::optional<std::string>& /*message*/) {
        auto strongThis = weakThis.lock();
        if (!strongThis) {
          return;
        }
        if (success) {
          strongThis->emitDeviceEvent(
              "websocketOpen",
              [socketID](jsi::Runtime& rt, std::vector<jsi::Value>& args) {
                auto arg = jsi::Object(rt);
                arg.setProperty(rt, "id", jsi::Value(socketID));
                args.emplace_back(rt, arg);
              });
        } else {
          strongThis->emitDeviceEvent(
              "websocketFailed",
              [socketID](jsi::Runtime& rt, std::vector<jsi::Value>& args) {
                auto arg = jsi::Object(rt);
                arg.setProperty(rt, "id", jsi::Value(socketID));
                arg.setProperty(
                    rt,
                    "message",
                    facebook::jsi::String::createFromAscii(
                        rt, "Could not connect to websocket."));
                args.emplace_back(rt, arg);
              });
        }
      });
}

void WebSocketModule::send(
    jsi::Runtime& /*rt*/,
    const std::string& message,
    int32_t socketID) {
  auto it = connections_.find(static_cast<int>(socketID));
  if (it == connections_.end()) {
    LOG(ERROR) << "Failed to send data to a socket (" << socketID
               << "), the socket is not open.";
    return;
  }
  it->second->send(message);
}

void WebSocketModule::sendBinary(
    jsi::Runtime& rt,
    const std::string& base64String,
    int32_t forSocketID) {
  send(rt, base64String, forSocketID);
}

void WebSocketModule::ping(jsi::Runtime& /*rt*/, int32_t socketID) {
  auto it = connections_.find(static_cast<int>(socketID));
  if (it == connections_.end()) {
    LOG(ERROR) << "Failed to ping a socket (" << socketID
               << "), the socket is not open.";
    return;
  }
  it->second->ping();
}

void WebSocketModule::close(
    jsi::Runtime& /*rt*/,
    int32_t /*code*/,
    const std::string& reason,
    int32_t socketID) {
  auto it = connections_.find(static_cast<int>(socketID));
  if (it == connections_.end()) {
    LOG(ERROR) << "Failed to close a socket (" << socketID
               << "), the socket is not open.";
    return;
  }
  it->second->close(reason);
  connections_.erase(it);
}

void WebSocketModule::addListener(
    jsi::Runtime& rt,
    const std::string& eventName) {}

void WebSocketModule::removeListeners(jsi::Runtime& rt, int32_t count) {}

} // namespace facebook::react
