/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <condition_variable>
#include <mutex>
#include <queue>
#include <string>

#include <hermes/inspector/detail/Thread.h>

#include <folly/Executor.h>

namespace facebook {
namespace hermes {
namespace inspector {
namespace detail {

/// SerialExecutor is a simple implementation of folly::Executor that processes
/// work items serially on a worker thread. It exists for two reasons:
///
///   1. Currently Hermes builds for the host as well as in fbandroid and
///      fbobjc, so we need an implementation of a serial executor that doesn't
///      use the SerialAsyncExecutorFactory from fbandroid or fbobjc.
///   2. None of folly's Executor factories are included in the stripped-down
///      version of folly in xplat.
///
/// TODO: create a factory that uses SerialAsyncExecutorFactory if we're
/// building for fbandroid or fbobjc, and otherwise creates an instance of this
/// class.
class SerialExecutor : public folly::Executor {
 public:
  SerialExecutor(const std::string &name);
  ~SerialExecutor();

  void add(folly::Func) override;

 private:
  void runLoop();

  std::mutex mutex_;
  std::queue<folly::Func> funcs_;
  std::condition_variable wakeup_;
  bool finish_;

  Thread thread_;
};

} // namespace detail
} // namespace inspector
} // namespace hermes
} // namespace facebook
