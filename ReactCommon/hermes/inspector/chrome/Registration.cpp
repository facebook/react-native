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

void enableDebugging(RuntimeAdapter &adapter, const std::string &title) {
  demux().enableDebugging(adapter, title);
}

void disableDebugging(RuntimeAdapter &adapter) {
  demux().disableDebugging(adapter);
}

} // namespace chrome
} // namespace inspector
} // namespace hermes
} // namespace facebook
