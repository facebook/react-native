/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ConnectionDemux.h"

#ifdef HERMES_ENABLE_DEBUGGER

#include <hermes/inspector/RuntimeAdapter.h>
#include <hermes/inspector/chrome/CDPHandler.h>

#include <jsinspector-modern/InspectorInterfaces.h>

namespace facebook {
namespace hermes {
namespace inspector_modern {
namespace chrome {

using ::facebook::react::jsinspector_modern::IInspector;
using ::facebook::react::jsinspector_modern::ILocalConnection;
using ::facebook::react::jsinspector_modern::IRemoteConnection;

namespace {

class LocalConnection : public ILocalConnection {
 public:
  LocalConnection(
      std::shared_ptr<hermes::inspector_modern::chrome::CDPHandler> conn,
      const std::string& title,
      std::shared_ptr<std::unordered_set<std::string>> inspectedContexts);
  ~LocalConnection();

  void sendMessage(std::string message) override;
  void disconnect() override;

 private:
  std::shared_ptr<hermes::inspector_modern::chrome::CDPHandler> conn_;
  std::string title_;
  std::shared_ptr<std::unordered_set<std::string>> inspectedContexts_;
};

LocalConnection::LocalConnection(
    std::shared_ptr<hermes::inspector_modern::chrome::CDPHandler> conn,
    const std::string& title,
    std::shared_ptr<std::unordered_set<std::string>> inspectedContexts)
    : conn_(conn), title_(title), inspectedContexts_(inspectedContexts) {
  inspectedContexts_->insert(title_);
}

LocalConnection::~LocalConnection() = default;

void LocalConnection::sendMessage(std::string str) {
  conn_->handle(std::move(str));
}

void LocalConnection::disconnect() {
  inspectedContexts_->erase(title_);
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
  for (auto it = conns_.begin(); it != conns_.end(); ++it) {
    auto entry = it->second;
    if (entry.title == title) {
      pagesToDelete.push_back(it->first);
    }
  }

  for (auto pageId : pagesToDelete) {
    removePage(pageId);
  }

  auto waitForDebugger =
      (inspectedContexts_->find(title) != inspectedContexts_->end());
  return addPage(
      hermes::inspector_modern::chrome::CDPHandler::create(
          std::move(adapter), waitForDebugger),
      title);
}

void ConnectionDemux::disableDebugging(DebugSessionToken session) {
  std::scoped_lock lock(mutex_);
  if (conns_.find(session) == conns_.end()) {
    return;
  }
  removePage(session);
}

int ConnectionDemux::addPage(
    std::shared_ptr<hermes::inspector_modern::chrome::CDPHandler> conn,
    const std::string& title) {
  auto connectFunc =
      [conn, title, this](std::unique_ptr<IRemoteConnection> remoteConn)
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

    return std::make_unique<LocalConnection>(conn, title, inspectedContexts_);
  };

  int pageId =
      globalInspector_.addPage(title, "Hermes", std::move(connectFunc));
  conns_[pageId] = PageEntry(title, conn);

  return pageId;
}

void ConnectionDemux::removePage(int pageId) {
  globalInspector_.removePage(pageId);

  auto entry = conns_.at(pageId);
  inspectedContexts_->erase(entry.title);
  entry.cdpInterface->unregisterCallbacks();
  conns_.erase(pageId);
}

} // namespace chrome
} // namespace inspector_modern
} // namespace hermes
} // namespace facebook

#endif // HERMES_ENABLE_DEBUGGER
