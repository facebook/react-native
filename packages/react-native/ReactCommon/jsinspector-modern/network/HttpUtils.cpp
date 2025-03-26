/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HttpUtils.h"

namespace facebook::react::jsinspector_modern {

std::string mimeTypeFromHeaders(const Headers& headers) {
  std::string mimeType = "application/octet-stream";

  if (headers.find("Content-Type") != headers.end()) {
    mimeType = headers.at("Content-Type");
  }

  return mimeType;
}

} // namespace facebook::react::jsinspector_modern
