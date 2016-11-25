// Copyright 2004-present Facebook. All Rights Reserved.

#include "Inspector.h"

#include "InspectorController.h"

#include <JavaScriptCore/config.h>

#include <JavaScriptCore/APICast.h>
#include <JavaScriptCore/JSGlobalObject.h>
#include <JavaScriptCore/JSLock.h>

#include <folly/Memory.h>

namespace facebook {
namespace react {

namespace {

JSC::JSGlobalObject& getGlobalObject(JSContextRef ctx) {
  JSC::ExecState* exec = toJS(ctx);
  JSC::JSLockHolder locker(exec);

  JSC::JSGlobalObject* globalObject = exec->vmEntryGlobalObject();
  return *globalObject;
}

}

Inspector::LocalConnection::LocalConnection(std::shared_ptr<Inspector::DuplexConnection> duplexConnection)
    : duplexConnection_(std::move(duplexConnection)) {}

void Inspector::LocalConnection::sendMessage(std::string message) {
  duplexConnection_->sendToLocal(std::move(message));
}

void Inspector::LocalConnection::disconnect() {
  duplexConnection_->terminate(false);
}

Inspector::PageHolder::PageHolder(std::string name, std::unique_ptr<InspectorController> controller)
: name(name)
, controller(std::move(controller)) {}

Inspector::PageHolder::~PageHolder() = default;

Inspector& Inspector::instance() {
  static Inspector inspector;
  return inspector;
}

std::vector<Inspector::Page> Inspector::getPages() const {
  std::lock_guard<std::mutex> lock(registrationMutex_);
  std::vector<Page> pages;
  pages.reserve(pages_.size());
  for (auto& entry : pages_) {
    pages.emplace_back(Page{entry.first, entry.second.name});
  }
  return pages;
}

void Inspector::registerGlobalContext(std::string title, JSGlobalContextRef ctx) {
  std::lock_guard<std::mutex> lock(registrationMutex_);
  auto controller = folly::make_unique<InspectorController>(getGlobalObject(ctx));
  auto pageId = numPages_++;
  pages_.emplace(
    std::piecewise_construct,
    std::forward_as_tuple(pageId),
    std::forward_as_tuple(std::move(title), std::move(controller)));
}

void Inspector::unregisterGlobalContext(JSGlobalContextRef ctx) {
  std::lock_guard<std::mutex> lock(registrationMutex_);
  auto& globalObject = getGlobalObject(ctx);
  for (auto it = pages_.begin(); it != pages_.end(); it++) {
    auto& page = it->second;
    if (page.controller->getGlobalObject().globalExec() == globalObject.globalExec()) {
      if (page.connection_) {
        page.connection_->terminate(true);
      }
      pages_.erase(it);
      return;
    }
  }
}

std::unique_ptr<Inspector::LocalConnection> Inspector::connect(int pageId, std::unique_ptr<RemoteConnection> remote) {
  std::lock_guard<std::mutex> lock(registrationMutex_);
  return folly::make_unique<LocalConnection>(pages_.at(pageId).connect(std::move(remote)));
}

void Inspector::disconnect(int pageId) {
  std::lock_guard<std::mutex> lock(registrationMutex_);
  pages_.at(pageId).controller->onDisconnect();
}

std::shared_ptr<Inspector::DuplexConnection> Inspector::PageHolder::connect(std::unique_ptr<RemoteConnection> remote) {
  if (connection_) {
    throw std::runtime_error("Already connected");
  }
  connection_ = std::make_shared<DuplexConnection>(*this, std::move(remote));
  controller->onConnect([connection = connection_](std::string message) {
    connection->sendToRemote(std::move(message));
  });
  return connection_;
}

Inspector::DuplexConnection::DuplexConnection(PageHolder& page, std::unique_ptr<RemoteConnection> remoteConnection)
    : page_(page)
    , remoteConnection_(std::move(remoteConnection)) {}

Inspector::DuplexConnection::~DuplexConnection() {
  if (remoteConnection_) {
    LOG(FATAL) << "DuplexConnection wasn't terminated before destruction";
  }
}

void Inspector::DuplexConnection::sendToRemote(std::string message) {
  std::lock_guard<std::mutex> lock(remoteMutex_);
  if (!remoteConnection_) {
    return;
  }

  remoteConnection_->onMessage(std::move(message));
}

void Inspector::DuplexConnection::sendToLocal(std::string message) {
  std::lock_guard<std::mutex> lock(localMutex_);
  if (!remoteConnection_) {
    return;
  }

  page_.controller->onMessage(std::move(message));
}

void Inspector::DuplexConnection::terminate(bool local) {
  std::lock_guard<std::mutex> lockLocal(localMutex_);
  {
    // Temp lock here so we can still send going away message
    std::lock_guard<std::mutex> lockRemote(remoteMutex_);
    if (!remoteConnection_) {
      // Already disconnected
      return;
    }
  }

  if (local) {
    page_.controller->onGoingAway();
  }
  std::lock_guard<std::mutex> lockRemote(remoteMutex_);

  auto remoteConnection = std::move(remoteConnection_);
  if (local) {
    remoteConnection->onDisconnect();
  }
  page_.controller->onDisconnect();
  // This kills us
  page_.connection_.reset();
}

}
}
