// (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

#pragma once

#include "JavaScriptModule.h"

#include <ReactCommon/CallInvoker.h>
#include <ReactCommon/TurboModule.h>
#include <functional>
#include <string>

namespace facebook::react {

class RuntimeScheduler;

using TurboModuleManagerDelegate = std::function<std::shared_ptr<TurboModule>(
    const std::string& name,
    const std::shared_ptr<CallInvoker>& jsInvoker)>;

using LegacyModuleProviderDelegate =
    std::function<TurboModuleProviderFunctionType(
        const std::shared_ptr<CallInvoker>& jsInvoker,
        const std::shared_ptr<RuntimeScheduler>& runtimeScheduler,
        const JavaScriptModuleCallback& javaScriptModuleCallback)>;

} // namespace facebook::react
