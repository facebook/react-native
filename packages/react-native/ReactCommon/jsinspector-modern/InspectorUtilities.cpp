/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "InspectorUtilities.h"

#include <cassert>

namespace facebook::react::jsinspector_modern {

CallbackLocalConnection::CallbackLocalConnection(
    std::function<void(std::string)> handler)
    : handler_(std::move(handler)) {}

void CallbackLocalConnection::sendMessage(std::string message) {
  assert(handler_ && "Handler has been disconnected");
  handler_(std::move(message));
}

void CallbackLocalConnection::disconnect() {
  handler_ = nullptr;
}

CallbackRemoteConnection::CallbackRemoteConnection(
    std::function<void(std::string)> handler)
    : handler_(std::move(handler)) {}

void CallbackRemoteConnection::onMessage(std::string message) {
  handler_(std::move(message));
}

RAIIRemoteConnection::RAIIRemoteConnection(
    std::unique_ptr<IRemoteConnection> remote)
    : remote_(std::move(remote)) {}

void RAIIRemoteConnection::onMessage(std::string message) {
  remote_->onMessage(std::move(message));
}

RAIIRemoteConnection::~RAIIRemoteConnection() {
  remote_->onDisconnect();
}

} // namespace facebook::react::jsinspector_modern
