/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#if defined(HERMES_ENABLE_DEBUGGER) && !defined(HERMES_V1_ENABLED)

#include <memory>
#include <mutex>
#include <string>
#include <unordered_map>
#include <unordered_set>

#include <hermes/hermes.h>
#include <hermes/inspector-modern/chrome/Registration.h>
#include <hermes/inspector/RuntimeAdapter.h>
#include <hermes/inspector/chrome/CDPHandler.h>
#include <jsinspector-modern/InspectorInterfaces.h>

namespace facebook::hermes::inspector_modern::chrome {

/*
 * ConnectionDemux keeps track of all debuggable Hermes runtimes (called
 * "pages" in the higher-level React Native API) in this process. See
 * Registration.h for documentation of the public API.
 */
class ConnectionDemux {
 public:
  explicit ConnectionDemux(
      facebook::react::jsinspector_modern::IInspector& inspector);
  ~ConnectionDemux();

  ConnectionDemux(const ConnectionDemux&) = delete;
  ConnectionDemux& operator=(const ConnectionDemux&) = delete;

  DebugSessionToken enableDebugging(
      std::unique_ptr<RuntimeAdapter> adapter,
      const std::string& title);
  void disableDebugging(DebugSessionToken session);

 private:
  int addPage(
      std::shared_ptr<hermes::inspector_modern::chrome::CDPHandler> conn);
  void removePage(int pageId);

  facebook::react::jsinspector_modern::IInspector& globalInspector_;

  std::mutex mutex_;
  std::unordered_map<
      int,
      std::shared_ptr<hermes::inspector_modern::chrome::CDPHandler>>
      conns_;
  std::shared_ptr<std::unordered_set<std::string>> inspectedContexts_;
};

} // namespace facebook::hermes::inspector_modern::chrome

#endif // defined(HERMES_ENABLE_DEBUGGER) && !defined(HERMES_V1_ENABLED)
