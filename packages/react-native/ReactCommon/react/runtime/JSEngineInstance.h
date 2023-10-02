/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/RuntimeExecutor.h>
#include <cxxreact/MessageQueueThread.h>
#include <jsi/jsi.h>

namespace facebook::react {

/**
 * Interface for a class that creates and owns an instance of a JS VM
 */
class JSEngineInstance {
 public:
  virtual std::unique_ptr<jsi::Runtime> createJSRuntime(
      std::shared_ptr<MessageQueueThread> msgQueueThread) noexcept = 0;

  virtual ~JSEngineInstance() = default;
};

} // namespace facebook::react
