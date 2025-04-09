// (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

#pragma once

#include <folly/dynamic.h>
#include <functional>
#include <string>

namespace facebook::react {

using JavaScriptModuleCallback = std::function<void(
    const std::string& moduleName,
    const std::string& methodName,
    folly::dynamic&& args)>;

} // namespace facebook::react
