/*
 * Copyright 2017-present Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include <folly/executors/GlobalThreadPoolList.h>

#include <memory>
#include <string>
#include <vector>

#include <folly/CppAttributes.h>
#include <folly/Indestructible.h>
#include <folly/Synchronized.h>
#include <folly/ThreadLocal.h>

namespace folly {

namespace {

class ThreadListHook {
 public:
  ThreadListHook(ThreadPoolListHook* poolId, std::thread::id threadId);
  ~ThreadListHook();

 private:
  ThreadListHook() {}
  ThreadPoolListHook* poolId_;
  std::thread::id threadId_;
};

class GlobalThreadPoolListImpl {
 public:
  GlobalThreadPoolListImpl() {}

  void registerThreadPool(ThreadPoolListHook* threadPoolId, std::string name);

  void unregisterThreadPool(ThreadPoolListHook* threadPoolId);

  void registerThreadPoolThread(
      ThreadPoolListHook* threadPoolId,
      std::thread::id threadId);

  void unregisterThreadPoolThread(
      ThreadPoolListHook* threadPoolId,
      std::thread::id threadId);

 private:
  struct PoolInfo {
    ThreadPoolListHook* addr;
    std::string name;
    std::vector<std::thread::id> threads;
  };

  struct Pools {
    // Just a vector since ease of access from gdb is the most important
    // property
    std::vector<PoolInfo> poolsInfo_;

    std::vector<std::thread::id>* FOLLY_NULLABLE
    getThreadVector(void* threadPoolId) {
      for (auto& elem : vector()) {
        if (elem.addr == threadPoolId) {
          return &elem.threads;
        }
      }

      return nullptr;
    }

    std::vector<PoolInfo>& vector() {
      return poolsInfo_;
    }
  };

  Pools pools_;
};

class GlobalThreadPoolList {
 public:
  GlobalThreadPoolList() {}

  static GlobalThreadPoolList& instance();

  void registerThreadPool(ThreadPoolListHook* threadPoolId, std::string name);

  void unregisterThreadPool(ThreadPoolListHook* threadPoolId);

  void registerThreadPoolThread(
      ThreadPoolListHook* threadPoolId,
      std::thread::id threadId);

  void unregisterThreadPoolThread(
      ThreadPoolListHook* threadPoolId,
      std::thread::id threadId);

  GlobalThreadPoolList(GlobalThreadPoolList const&) = delete;
  void operator=(GlobalThreadPoolList const&) = delete;

 private:
  folly::Synchronized<GlobalThreadPoolListImpl> globalListImpl_;
  folly::ThreadLocalPtr<ThreadListHook> threadHook_;
};

} // namespace

GlobalThreadPoolList& GlobalThreadPoolList::instance() {
  static folly::Indestructible<GlobalThreadPoolList> ret;
  return *ret;
}

void GlobalThreadPoolList::registerThreadPool(
    ThreadPoolListHook* threadPoolId,
    std::string name) {
  globalListImpl_->registerThreadPool(threadPoolId, name);
}

void GlobalThreadPoolList::unregisterThreadPool(
    ThreadPoolListHook* threadPoolId) {
  globalListImpl_->unregisterThreadPool(threadPoolId);
}

void GlobalThreadPoolList::registerThreadPoolThread(
    ThreadPoolListHook* threadPoolId,
    std::thread::id threadId) {
  DCHECK(!threadHook_);
  threadHook_.reset(make_unique<ThreadListHook>(threadPoolId, threadId));

  globalListImpl_->registerThreadPoolThread(threadPoolId, threadId);
}

void GlobalThreadPoolList::unregisterThreadPoolThread(
    ThreadPoolListHook* threadPoolId,
    std::thread::id threadId) {
  (void)threadPoolId;
  (void)threadId;
  globalListImpl_->unregisterThreadPoolThread(threadPoolId, threadId);
}

void GlobalThreadPoolListImpl::registerThreadPool(
    ThreadPoolListHook* threadPoolId,
    std::string name) {
  PoolInfo info;
  info.name = name;
  info.addr = threadPoolId;
  pools_.vector().push_back(info);
}

void GlobalThreadPoolListImpl::unregisterThreadPool(
    ThreadPoolListHook* threadPoolId) {
  auto& vector = pools_.vector();
  vector.erase(
      std::remove_if(
          vector.begin(),
          vector.end(),
          [=](PoolInfo& i) { return i.addr == threadPoolId; }),
      vector.end());
}

void GlobalThreadPoolListImpl::registerThreadPoolThread(
    ThreadPoolListHook* threadPoolId,
    std::thread::id threadId) {
  auto vec = pools_.getThreadVector(threadPoolId);
  if (vec == nullptr) {
    return;
  }

  vec->push_back(threadId);
}

void GlobalThreadPoolListImpl::unregisterThreadPoolThread(
    ThreadPoolListHook* threadPoolId,
    std::thread::id threadId) {
  auto vec = pools_.getThreadVector(threadPoolId);
  if (vec == nullptr) {
    return;
  }

  vec->erase(std::remove(vec->begin(), vec->end(), threadId), vec->end());
}

ThreadListHook::ThreadListHook(
    ThreadPoolListHook* poolId,
    std::thread::id threadId) {
  poolId_ = poolId;
  threadId_ = threadId;
}

ThreadListHook::~ThreadListHook() {
  GlobalThreadPoolList::instance().unregisterThreadPoolThread(
      poolId_, threadId_);
}

ThreadPoolListHook::ThreadPoolListHook(std::string name) {
  GlobalThreadPoolList::instance().registerThreadPool(this, name);
}

ThreadPoolListHook::~ThreadPoolListHook() {
  GlobalThreadPoolList::instance().unregisterThreadPool(this);
}

void ThreadPoolListHook::registerThread() {
  GlobalThreadPoolList::instance().registerThreadPoolThread(
      this, std::this_thread::get_id());
}

} // namespace folly
