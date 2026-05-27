/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AppRegistryBinding.h"
#include <cxxreact/TraceSection.h>
#include <react/renderer/uimanager/primitives.h>

namespace facebook::react {

/* static */ void AppRegistryBinding::startSurface(
    jsi::Runtime& runtime,
    SurfaceId surfaceId,
    const std::string& moduleName,
    const folly::dynamic& initialProps,
    DisplayMode displayMode) {
  TraceSection s("AppRegistryBinding::startSurface");
  jsi::Object parameters(runtime);
  parameters.setProperty(runtime, "rootTag", surfaceId);
  parameters.setProperty(
      runtime, "initialProps", jsi::valueFromDynamic(runtime, initialProps));
  parameters.setProperty(runtime, "fabric", true);

  auto global = runtime.global();
  auto registry = global.getProperty(runtime, "RN$AppRegistry");
  if (!registry.isObject()) {
    throw std::runtime_error(
        "AppRegistryBinding::startSurface failed. Global was not installed.");
  }
  auto method = std::move(registry).asObject(runtime).getPropertyAsFunction(
      runtime, "runApplication");
  method.call(
      runtime,
      {jsi::String::createFromUtf8(runtime, moduleName),
       std::move(parameters),
       jsi::Value(runtime, displayModeToInt(displayMode))});
}

/* static */ void AppRegistryBinding::setSurfaceProps(
    jsi::Runtime& runtime,
    SurfaceId surfaceId,
    const std::string& moduleName,
    const folly::dynamic& initialProps,
    DisplayMode displayMode) {
  TraceSection s("UIManagerBinding::setSurfaceProps");
  jsi::Object parameters(runtime);
  parameters.setProperty(runtime, "rootTag", surfaceId);
  parameters.setProperty(
      runtime, "initialProps", jsi::valueFromDynamic(runtime, initialProps));
  parameters.setProperty(runtime, "fabric", true);

  auto global = runtime.global();
  auto registry = global.getProperty(runtime, "RN$AppRegistry");
  if (!registry.isObject()) {
    throw std::runtime_error(
        "AppRegistryBinding::setSurfaceProps failed. Global was not installed.");
  }

  auto method = std::move(registry).asObject(runtime).getPropertyAsFunction(
      runtime, "setSurfaceProps");
  method.call(
      runtime,
      {jsi::String::createFromUtf8(runtime, moduleName),
       std::move(parameters),
       jsi::Value(runtime, displayModeToInt(displayMode))});
}

/* static */ void AppRegistryBinding::stopSurface(
    jsi::Runtime& runtime,
    SurfaceId surfaceId) {
  auto global = runtime.global();
  auto stopFunction = global.getProperty(runtime, "RN$stopSurface");
  if (!stopFunction.isObject() ||
      !stopFunction.asObject(runtime).isFunction(runtime)) {
    throw std::runtime_error(
        "AppRegistryBinding::stopSurface failed. Global was not installed.");
  }

  std::move(stopFunction)
      .asObject(runtime)
      .asFunction(runtime)
      .call(runtime, {jsi::Value{surfaceId}});
}

} // namespace facebook::react
