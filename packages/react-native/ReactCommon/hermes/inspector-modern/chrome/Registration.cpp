/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Registration.h"
#include "ConnectionDemux.h"

#if defined(HERMES_ENABLE_DEBUGGER)

namespace facebook::hermes::inspector_modern::chrome {

#if !defined(HERMES_V1_ENABLED)

namespace {

ConnectionDemux& demux() {
  static ConnectionDemux instance{
      facebook::react::jsinspector_modern::getInspectorInstance()};
  return instance;
}

} // namespace

DebugSessionToken enableDebugging(
    std::unique_ptr<RuntimeAdapter> adapter,
    const std::string& title) {
  return demux().enableDebugging(std::move(adapter), title);
}

void disableDebugging(DebugSessionToken session) {
  demux().disableDebugging(session);
}

#else

using DebugSessionToken = int;

DebugSessionToken enableDebugging(
    std::unique_ptr<RuntimeAdapter>,
    const std::string&) {
  // Backwards compatibility fallback for libraries that are compiled without
  // `HERMES_V1_ENABLED` but are linked against React Native with
  // `HERMES_V1_ENABLED` which doesn't provide this symbol.
  return -1;
};

void disableDebugging(DebugSessionToken) {
  // Backwards compatibility fallback for libraries that are compiled without
  // `HERMES_V1_ENABLED` but are linked against React Native with
  // `HERMES_V1_ENABLED` which doesn't provide this symbol.
}

#endif // !defined(HERMES_V1_ENABLED)

} // namespace facebook::hermes::inspector_modern::chrome

#endif // defined(HERMES_ENABLE_DEBUGGER)
