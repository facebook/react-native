/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// using include guards instead of #pragma once due to compile issues
// with MSVC and BUCK
#ifndef HERMES_INSPECTOR_CONNECTION_H
#define HERMES_INSPECTOR_CONNECTION_H

#include <functional>
#include <memory>
#include <string>

#include <hermes/hermes.h>
#include <hermes/inspector/RuntimeAdapter.h>
#include <jsinspector/InspectorInterfaces.h>

namespace facebook {
namespace hermes {
namespace inspector {
namespace chrome {

/// Connection is a duplex connection between the client and the debugger.
class INSPECTOR_EXPORT Connection {
 public:
  /// Connection constructor enables the debugger on the provided runtime. This
  /// should generally called before you start running any JS in the runtime.
  Connection(
      std::unique_ptr<RuntimeAdapter> adapter,
      const std::string &title,
      bool waitForDebugger = false);
  ~Connection();

  /// getRuntime returns the underlying runtime being debugged.
  jsi::Runtime &getRuntime();

  /// getTitle returns the name of the friendly name of the runtime that's shown
  /// to users in Nuclide.
  std::string getTitle() const;

  /// connect attaches this connection to the runtime's debugger. Requests to
  /// the debugger sent via send(). Replies and notifications from the debugger
  /// are sent back to the client via IRemoteConnection::onMessage.
  bool connect(
      std::unique_ptr<::facebook::react::IRemoteConnection> remoteConn);

  /// disconnect disconnects this connection from the runtime's debugger
  bool disconnect();

  /// sendMessage delivers a JSON-encoded Chrome DevTools Protocol request to
  /// the debugger.
  void sendMessage(std::string str);

 private:
  class Impl;
  std::unique_ptr<Impl> impl_;
};

} // namespace chrome
} // namespace inspector
} // namespace hermes
} // namespace facebook

#endif // HERMES_INSPECTOR_CONNECTION_H
