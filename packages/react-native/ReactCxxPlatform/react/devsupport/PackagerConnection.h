/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/http/IWebSocketClient.h>
#include <functional>
#include <memory>
#include <string>

namespace facebook::react {

class PackagerConnection {
  using LiveReloadCallback = std::function<void()>;
  using ShowDevMenuCallback = std::function<void()>;

 public:
  PackagerConnection(
      const WebSocketClientFactory& webSocketClientFactory,
      const std::string& packagerConnectionUrl,
      LiveReloadCallback&& liveReloadCallback,
      ShowDevMenuCallback&& showDevMenuCallback);
  ~PackagerConnection() noexcept;
  PackagerConnection(const PackagerConnection& other) = delete;
  PackagerConnection& operator=(PackagerConnection& other) = delete;
  PackagerConnection(PackagerConnection&& other) = delete;
  PackagerConnection& operator=(PackagerConnection&& other) = delete;

 private:
  const LiveReloadCallback liveReloadCallback_;
  const ShowDevMenuCallback showDevMenuCallback_;
  std::unique_ptr<IWebSocketClient> websocket_;
};

} // namespace facebook::react
