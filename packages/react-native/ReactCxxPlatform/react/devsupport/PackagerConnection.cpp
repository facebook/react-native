/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PackagerConnection.h"

#include <glog/logging.h>
#include <nlohmann/json.hpp>
#include <utility>

namespace facebook::react {

PackagerConnection::PackagerConnection(
    const WebSocketClientFactory& webSocketClientFactory,
    const std::string& packagerConnectionUrl,
    LiveReloadCallback&& liveReloadCallback,
    ShowDevMenuCallback&& showDevMenuCallback)
    : liveReloadCallback_(std::move(liveReloadCallback)),
      showDevMenuCallback_(std::move(showDevMenuCallback)) {
  websocket_ = webSocketClientFactory();
  websocket_->setOnMessageCallback([this](const std::string& message) {
    LOG(INFO) << "Received message from packager: " << message;
    auto json = nlohmann::json::parse(message);
    if (json.is_null() || json["version"] != 2) {
      return;
    }
    auto method = json["method"];
    if (method == "reload") {
      liveReloadCallback_();
    } else if (method == "showDevMenu") {
      showDevMenuCallback_();
    }
  });
  websocket_->connect(packagerConnectionUrl);
}

PackagerConnection::~PackagerConnection() noexcept {
  websocket_->close("PackagerConnection destroyed");
}

} // namespace facebook::react
