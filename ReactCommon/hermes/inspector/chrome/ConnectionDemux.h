/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <mutex>
#include <string>
#include <unordered_map>
#include <unordered_set>

#include <hermes/hermes.h>
#include <hermes/inspector/RuntimeAdapter.h>
#include <hermes/inspector/chrome/Connection.h>
#include <jsinspector/InspectorInterfaces.h>

namespace facebook {
namespace hermes {
namespace inspector {
namespace chrome {

/*
 * ConnectionDemux keeps track of all debuggable Hermes runtimes (called
 * "pages" in the higher-level React Native API) in this process. See
 * Registration.h for documentation of the public API.
 */
class ConnectionDemux {
 public:
  explicit ConnectionDemux(facebook::react::IInspector &inspector);
  ~ConnectionDemux();

  ConnectionDemux(const ConnectionDemux &) = delete;
  ConnectionDemux &operator=(const ConnectionDemux &) = delete;

  int enableDebugging(
      std::unique_ptr<RuntimeAdapter> adapter,
      const std::string &title);
  void disableDebugging(HermesRuntime &runtime);

 private:
  int addPage(std::shared_ptr<Connection> conn);
  void removePage(int pageId);

  facebook::react::IInspector &globalInspector_;

  std::mutex mutex_;
  std::unordered_map<int, std::shared_ptr<Connection>> conns_;
  std::shared_ptr<std::unordered_set<std::string>> inspectedContexts_;
};

} // namespace chrome
} // namespace inspector
} // namespace hermes
} // namespace facebook
