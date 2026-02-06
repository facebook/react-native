/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "../../stubs/StubHttpClient.h"

namespace facebook::react {

HttpClientFactory getHttpClientFactory() {
  return getStubHttpClientFactory();
}

} // namespace facebook::react
