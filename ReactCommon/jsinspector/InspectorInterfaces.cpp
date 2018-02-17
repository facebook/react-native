/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "InspectorInterfaces.h"

#include <mutex>
#include <unordered_map>
#include <tuple>

namespace facebook {
namespace react {

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
  int addPage(const std::string& title, const std::string& vm, ConnectFunc connectFunc) override;
  void removePage(int pageId) override;

  std::vector<InspectorPage> getPages() const override;
  std::unique_ptr<ILocalConnection> connect(
      int pageId,
      std::unique_ptr<IRemoteConnection> remote) override;

 private:
  mutable std::mutex mutex_;
  int nextPageId_{1};
  std::unordered_map<int, std::tuple<std::string, std::string>> titles_;
  std::unordered_map<int, ConnectFunc> connectFuncs_;
};

int InspectorImpl::addPage(const std::string& title, const std::string& vm, ConnectFunc connectFunc) {
  std::lock_guard<std::mutex> lock(mutex_);

  int pageId = nextPageId_++;
  titles_[pageId] = std::make_tuple(title, vm);
  connectFuncs_[pageId] = std::move(connectFunc);

  return pageId;
}

void InspectorImpl::removePage(int pageId) {
  std::lock_guard<std::mutex> lock(mutex_);

  titles_.erase(pageId);
  connectFuncs_.erase(pageId);
}

std::vector<InspectorPage> InspectorImpl::getPages() const {
  std::lock_guard<std::mutex> lock(mutex_);

  std::vector<InspectorPage> inspectorPages;
  for (auto& it : titles_) {
    inspectorPages.push_back(InspectorPage{it.first, std::get<0>(it.second), std::get<1>(it.second)});
  }

  return inspectorPages;
}

std::unique_ptr<ILocalConnection> InspectorImpl::connect(
    int pageId,
    std::unique_ptr<IRemoteConnection> remote) {
  IInspector::ConnectFunc connectFunc;

  {
    std::lock_guard<std::mutex> lock(mutex_);

    auto it = connectFuncs_.find(pageId);
    if (it != connectFuncs_.end()) {
      connectFunc = it->second;
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

} // namespace react
} // namespace facebook
