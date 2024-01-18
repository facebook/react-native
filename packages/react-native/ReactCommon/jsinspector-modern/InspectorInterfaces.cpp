/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "InspectorInterfaces.h"

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

namespace {

class InspectorImpl : public IInspector {
 public:
  int addPage(
      const std::string& title,
      const std::string& vm,
      ConnectFunc connectFunc) override;
  void removePage(int pageId) override;

  std::vector<InspectorPageDescription> getPages() const override;
  std::unique_ptr<ILocalConnection> connect(
      int pageId,
      std::unique_ptr<IRemoteConnection> remote) override;

 private:
  class Page {
   public:
    Page(
        int id,
        const std::string& title,
        const std::string& vm,
        ConnectFunc connectFunc);
    operator InspectorPageDescription() const;

    ConnectFunc getConnectFunc() const;

   private:
    int id_;
    std::string title_;
    std::string vm_;
    ConnectFunc connectFunc_;
  };
  mutable std::mutex mutex_;
  int nextPageId_{1};
  std::unordered_map<int, Page> pages_;
};

InspectorImpl::Page::Page(
    int id,
    const std::string& title,
    const std::string& vm,
    ConnectFunc connectFunc)
    : id_(id), title_(title), vm_(vm), connectFunc_(std::move(connectFunc)) {}

InspectorImpl::Page::operator InspectorPageDescription() const {
  return InspectorPageDescription{
      .id = id_,
      .title = title_,
      .vm = vm_,
  };
}

InspectorImpl::ConnectFunc InspectorImpl::Page::getConnectFunc() const {
  return connectFunc_;
}

int InspectorImpl::addPage(
    const std::string& title,
    const std::string& vm,
    ConnectFunc connectFunc) {
  std::scoped_lock lock(mutex_);

  int pageId = nextPageId_++;
  pages_.emplace(pageId, Page{pageId, title, vm, std::move(connectFunc)});

  return pageId;
}

void InspectorImpl::removePage(int pageId) {
  std::scoped_lock lock(mutex_);

  pages_.erase(pageId);
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

} // namespace

IInspector& getInspectorInstance() {
  static InspectorImpl instance;
  return instance;
}

std::unique_ptr<IInspector> makeTestInspectorInstance() {
  return std::make_unique<InspectorImpl>();
}

} // namespace facebook::react::jsinspector_modern
