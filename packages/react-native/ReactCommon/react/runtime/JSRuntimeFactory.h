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
 * Interface for a class that creates instances of a JS VM
 */
class JSRuntimeFactory {
 public:
  virtual std::unique_ptr<jsi::Runtime> createJSRuntime(
      std::shared_ptr<MessageQueueThread> msgQueueThread) noexcept = 0;

  virtual ~JSRuntimeFactory() = default;
};

} // namespace facebook::react
