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

#include <folly/executors/ThreadedExecutor.h>

#include <chrono>

#include <glog/logging.h>

#include <folly/executors/thread_factory/NamedThreadFactory.h>
#include <folly/system/ThreadName.h>

namespace folly {

template <typename F>
static auto with_unique_lock(std::mutex& m, F&& f) -> decltype(f()) {
  std::unique_lock<std::mutex> lock(m);
  return f();
}

ThreadedExecutor::ThreadedExecutor(std::shared_ptr<ThreadFactory> threadFactory)
    : threadFactory_(std::move(threadFactory)) {
  controlt_ = std::thread([this] { control(); });
}

ThreadedExecutor::~ThreadedExecutor() {
  stopping_.store(true, std::memory_order_release);
  notify();
  controlt_.join();
  CHECK(running_.empty());
  CHECK(finished_.empty());
}

void ThreadedExecutor::add(Func func) {
  CHECK(!stopping_.load(std::memory_order_acquire));
  with_unique_lock(enqueuedm_, [&] { enqueued_.push_back(std::move(func)); });
  notify();
}

std::shared_ptr<ThreadFactory> ThreadedExecutor::newDefaultThreadFactory() {
  return std::make_shared<NamedThreadFactory>("Threaded");
}

void ThreadedExecutor::notify() {
  with_unique_lock(controlm_, [&] { controls_ = true; });
  controlc_.notify_one();
}

void ThreadedExecutor::control() {
  folly::setThreadName("ThreadedCtrl");
  auto looping = true;
  while (looping) {
    controlWait();
    looping = controlPerformAll();
  }
}

void ThreadedExecutor::controlWait() {
  constexpr auto kMaxWait = std::chrono::seconds(10);
  std::unique_lock<std::mutex> lock(controlm_);
  controlc_.wait_for(lock, kMaxWait, [&] { return controls_; });
  controls_ = false;
}

void ThreadedExecutor::work(Func& func) {
  func();
  auto id = std::this_thread::get_id();
  with_unique_lock(finishedm_, [&] { finished_.push_back(id); });
  notify();
}

void ThreadedExecutor::controlJoinFinishedThreads() {
  std::deque<std::thread::id> finishedt;
  with_unique_lock(finishedm_, [&] { std::swap(finishedt, finished_); });
  for (auto id : finishedt) {
    running_[id].join();
    running_.erase(id);
  }
}

void ThreadedExecutor::controlLaunchEnqueuedTasks() {
  std::deque<Func> enqueuedt;
  with_unique_lock(enqueuedm_, [&] { std::swap(enqueuedt, enqueued_); });
  for (auto& f : enqueuedt) {
    auto th = threadFactory_->newThread(
        [this, f = std::move(f)]() mutable { work(f); });
    auto id = th.get_id();
    running_[id] = std::move(th);
  }
}

bool ThreadedExecutor::controlPerformAll() {
  auto stopping = stopping_.load(std::memory_order_acquire);
  controlJoinFinishedThreads();
  controlLaunchEnqueuedTasks();
  return !stopping || !running_.empty();
}
} // namespace folly
