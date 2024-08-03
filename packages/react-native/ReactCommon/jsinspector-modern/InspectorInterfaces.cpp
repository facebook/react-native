/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "InspectorInterfaces.h"

#include <cassert>
#include <list>
#include <mutex>
#include <tuple>
#include <unordered_map>

namespace facebook::react::jsinspector_modern {

// pure destructors in C++ are odd. You would think they don't want an
// implementation, but in fact the linker requires one. Define them to be
// empty so that people don't count on them for any particular behaviour.
IDestructible::~IDestructible() {}
ILocalConnection::~ILocalConnection() {}
IRemoteConnection::~IRemoteConnection() {}
IInspector::~IInspector() {}
IPageStatusListener::~IPageStatusListener() {}

const folly::dynamic targetCapabilitiesToDynamic(
    const InspectorTargetCapabilities& capabilities) {
  return folly::dynamic::object(
      "nativePageReloads", capabilities.nativePageReloads)(
      "nativeSourceCodeFetching", capabilities.nativeSourceCodeFetching);
}

namespace {

class InspectorImpl : public IInspector {
 public:
  int addPage(
      const std::string& title,
      const std::string& vm,
      ConnectFunc connectFunc,
      InspectorTargetCapabilities capabilities) override;
  void removePage(int pageId) override;

  std::vector<InspectorPageDescription> getPages() const override;
  std::unique_ptr<ILocalConnection> connect(
      int pageId,
      std::unique_ptr<IRemoteConnection> remote) override;

  void registerPageStatusListener(
      std::weak_ptr<IPageStatusListener> listener) override;

 private:
  class Page {
   public:
    Page(
        int id,
        const std::string& title,
        const std::string& vm,
        ConnectFunc connectFunc,
        InspectorTargetCapabilities capabilities);
    operator InspectorPageDescription() const;

    ConnectFunc getConnectFunc() const;

   private:
    int id_;
    std::string title_;
    std::string vm_;
    ConnectFunc connectFunc_;
    InspectorTargetCapabilities capabilities_;
  };
  mutable std::mutex mutex_;
  int nextPageId_{1};
  std::unordered_map<int, Page> pages_;
  std::list<std::weak_ptr<IPageStatusListener>> listeners_;
};

InspectorImpl::Page::Page(
    int id,
    const std::string& title,
    const std::string& vm,
    ConnectFunc connectFunc,
    InspectorTargetCapabilities capabilities)
    : id_(id),
      title_(title),
      vm_(vm),
      connectFunc_(std::move(connectFunc)),
      capabilities_(std::move(capabilities)) {}

InspectorImpl::Page::operator InspectorPageDescription() const {
  return InspectorPageDescription{
      .id = id_,
      .title = title_,
      .vm = vm_,
      .capabilities = capabilities_,
  };
}

InspectorImpl::ConnectFunc InspectorImpl::Page::getConnectFunc() const {
  return connectFunc_;
}

int InspectorImpl::addPage(
    const std::string& title,
    const std::string& vm,
    ConnectFunc connectFunc,
    InspectorTargetCapabilities capabilities) {
  std::scoped_lock lock(mutex_);

  int pageId = nextPageId_++;
  assert(pages_.count(pageId) == 0 && "Unexpected duplicate page ID");
  pages_.emplace(
      pageId, Page{pageId, title, vm, std::move(connectFunc), capabilities});

  return pageId;
}

void InspectorImpl::removePage(int pageId) {
  std::scoped_lock lock(mutex_);

  if (pages_.erase(pageId) != 0) {
    for (auto listenerWeak : listeners_) {
      if (auto listener = listenerWeak.lock()) {
        listener->onPageRemoved(pageId);
      }
    }
  }
}

std::vector<InspectorPageDescription> InspectorImpl::getPages() const {
  std::scoped_lock lock(mutex_);

  std::vector<InspectorPageDescription> inspectorPages;
  for (auto& it : pages_) {
    inspectorPages.push_back(InspectorPageDescription(it.second));
  }

  return inspectorPages;
}

std::unique_ptr<ILocalConnection> InspectorImpl::connect(
    int pageId,
    std::unique_ptr<IRemoteConnection> remote) {
  IInspector::ConnectFunc connectFunc;

  {
    std::scoped_lock lock(mutex_);

    auto it = pages_.find(pageId);
    if (it != pages_.end()) {
      connectFunc = it->second.getConnectFunc();
    }
  }

  return connectFunc ? connectFunc(std::move(remote)) : nullptr;
}

void InspectorImpl::registerPageStatusListener(
    std::weak_ptr<IPageStatusListener> listener) {
  std::scoped_lock lock(mutex_);
  // Remove expired listeners
  for (auto it = listeners_.begin(); it != listeners_.end();) {
    if (it->expired()) {
      it = listeners_.erase(it);
    } else {
      ++it;
    }
  }
  listeners_.push_back(listener);
}
} // namespace

IInspector& getInspectorInstance() {
  static InspectorImpl instance;
  return instance;
}

std::unique_ptr<IInspector> makeTestInspectorInstance() {
  return std::make_unique<InspectorImpl>();
}

} // namespace facebook::react::jsinspector_modern
