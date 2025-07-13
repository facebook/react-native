/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "StubWebSocketClient.h"

#include <react/http/IWebSocketClient.h>

namespace facebook::react {

WebSocketClientFactory getWebSocketClientFactory() {
  return []() { return std::make_unique<StubWebSocketClient>(); };
}

} // namespace facebook::react
