/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ConnectionDemux.h"

#if defined(HERMES_ENABLE_DEBUGGER) && !defined(HERMES_V1_ENABLED)

#include <hermes/inspector/RuntimeAdapter.h>
#include <hermes/inspector/chrome/CDPHandler.h>

#include <jsinspector-modern/InspectorInterfaces.h>

#include <utility>

namespace facebook::hermes::inspector_modern::chrome {

using ::facebook::react::jsinspector_modern::ILocalConnection;
using ::facebook::react::jsinspector_modern::IRemoteConnection;

namespace {

class LocalConnection : public ILocalConnection {
 public:
  LocalConnection(
      std::shared_ptr<hermes::inspector_modern::chrome::CDPHandler> conn,
      std::shared_ptr<std::unordered_set<std::string>> inspectedContexts);
  ~LocalConnection() override;

  void sendMessage(std::string message) override;
  void disconnect() override;

 private:
  std::shared_ptr<hermes::inspector_modern::chrome::CDPHandler> conn_;
  std::shared_ptr<std::unordered_set<std::string>> inspectedContexts_;
};

LocalConnection::LocalConnection(
    std::shared_ptr<hermes::inspector_modern::chrome::CDPHandler> conn,
    std::shared_ptr<std::unordered_set<std::string>> inspectedContexts)
    : conn_(conn), inspectedContexts_(std::move(inspectedContexts)) {
  inspectedContexts_->insert(conn->getTitle());
}

LocalConnection::~LocalConnection() = default;

void LocalConnection::sendMessage(std::string message) {
  conn_->handle(std::move(message));
}

void LocalConnection::disconnect() {
  inspectedContexts_->erase(conn_->getTitle());
  conn_->unregisterCallbacks();
}

} // namespace

ConnectionDemux::ConnectionDemux(
    facebook::react::jsinspector_modern::IInspector& inspector)
    : globalInspector_(inspector),
      inspectedContexts_(std::make_shared<std::unordered_set<std::string>>()) {}

ConnectionDemux::~ConnectionDemux() = default;

DebugSessionToken ConnectionDemux::enableDebugging(
    std::unique_ptr<RuntimeAdapter> adapter,
    const std::string& title) {
  std::scoped_lock lock(mutex_);

  // TODO(#22976087): workaround for ComponentScript contexts never being
  // destroyed.
  //
  // After a reload, the old ComponentScript VM instance stays alive. When we
  // register the new CS VM instance, check for any previous CS VM (via strcmp
  // of title) and remove them.
  std::vector<int> pagesToDelete;
  for (auto& conn : conns_) {
    if (conn.second->getTitle() == title) {
      pagesToDelete.push_back(conn.first);
    }
  }

  for (auto pageId : pagesToDelete) {
    removePage(pageId);
  }

  auto waitForDebugger =
      (inspectedContexts_->find(title) != inspectedContexts_->end());
  return addPage(
      hermes::inspector_modern::chrome::CDPHandler::create(
          std::move(adapter), title, waitForDebugger));
}

void ConnectionDemux::disableDebugging(DebugSessionToken session) {
  std::scoped_lock lock(mutex_);
  if (conns_.find(session) == conns_.end()) {
    return;
  }
  removePage(session);
}

int ConnectionDemux::addPage(
    std::shared_ptr<hermes::inspector_modern::chrome::CDPHandler> conn) {
  auto connectFunc = [conn, this](std::unique_ptr<IRemoteConnection> remoteConn)
      -> std::unique_ptr<ILocalConnection> {
    // This cannot be unique_ptr as std::function is copyable but unique_ptr
    // isn't. TODO: Change the CDPHandler API to accommodate this and not
    // require a copyable callback?
    std::shared_ptr<IRemoteConnection> sharedConn = std::move(remoteConn);
    if (!conn->registerCallbacks(
            [sharedConn](const std::string& message) {
              sharedConn->onMessage(message);
            },
            [sharedConn]() { sharedConn->onDisconnect(); })) {
      return nullptr;
    }

    return std::make_unique<LocalConnection>(conn, inspectedContexts_);
  };

  int pageId = globalInspector_.addPage(
      conn->getTitle(), "Hermes", std::move(connectFunc));
  conns_[pageId] = std::move(conn);

  return pageId;
}

void ConnectionDemux::removePage(int pageId) {
  globalInspector_.removePage(pageId);

  auto conn = conns_.at(pageId);
  std::string title = conn->getTitle();
  inspectedContexts_->erase(title);
  conn->unregisterCallbacks();
  conns_.erase(pageId);
}

} // namespace facebook::hermes::inspector_modern::chrome

#endif // defined(HERMES_ENABLE_DEBUGGER) && !defined(HERMES_V1_ENABLED)
