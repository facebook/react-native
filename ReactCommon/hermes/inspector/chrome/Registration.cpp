// Copyright 2004-present Facebook. All Rights Reserved.

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
