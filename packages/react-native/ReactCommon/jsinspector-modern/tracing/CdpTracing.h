/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>

namespace facebook::react::jsinspector_modern {

/**
 * https://developer.chrome.com/docs/devtools/performance/extension?utm_source=devtools#devtools_object
 */
struct DevToolsTrackEntryPayload {
  std::string track;
};

} // namespace facebook::react::jsinspector_modern
