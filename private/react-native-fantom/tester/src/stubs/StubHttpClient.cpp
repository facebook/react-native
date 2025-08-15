/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "StubHttpClient.h"
#include <react/http/IHttpClient.h>

namespace facebook::react {

HttpClientFactory getStubHttpClientFactory() {
  return []() { return std::make_unique<StubHttpClient>(); };
}

} // namespace facebook::react
