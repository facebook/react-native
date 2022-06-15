/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Registration.h"
#include "ConnectionDemux.h"

namespace facebook {
namespace hermes {
namespace inspector {
namespace chrome {

namespace {

ConnectionDemux &demux() {
  static ConnectionDemux instance{facebook::react::getInspectorInstance()};
  return instance;
}

} // namespace

void enableDebugging(
    std::unique_ptr<RuntimeAdapter> adapter,
    const std::string &title) {
  demux().enableDebugging(std::move(adapter), title);
}

void disableDebugging(HermesRuntime &runtime) {
  demux().disableDebugging(runtime);
}

} // namespace chrome
} // namespace inspector
} // namespace hermes
} // namespace facebook
