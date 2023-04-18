// (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

#pragma once

#include <ReactCommon/RuntimeExecutor.h>
#include <jsi/jsi.h>

namespace facebook {
namespace react {

/**
 * Interface for a class that creates and owns an instance of a JS VM
 */
class JSEngineInstance {
 public:
  virtual std::unique_ptr<jsi::Runtime> createJSRuntime() noexcept = 0;

  virtual ~JSEngineInstance() = default;
};

} // namespace react
} // namespace facebook
