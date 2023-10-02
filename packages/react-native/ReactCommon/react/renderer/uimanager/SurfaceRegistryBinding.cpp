/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SurfaceRegistryBinding.h"
#include <react/renderer/debug/SystraceSection.h>
#include <react/renderer/uimanager/bindingUtils.h>
#include <react/renderer/uimanager/primitives.h>
#include "bindingUtils.h"

namespace facebook::react {

namespace {

void throwIfBridgeless(
    jsi::Runtime& runtime,
    jsi::Object& global,
    const char* methodName) {
  auto isBridgeless = global.getProperty(runtime, "RN$Bridgeless");
  if (isBridgeless.isBool() && isBridgeless.asBool()) {
    throw std::runtime_error(
        "SurfaceRegistryBinding::" + std::string(methodName) +
        " failed. Global was not installed.");
  }
}

} // namespace

void SurfaceRegistryBinding::startSurface(
    jsi::Runtime& runtime,
    SurfaceId surfaceId,
    const std::string& moduleName,
    const folly::dynamic& initialProps,
    DisplayMode displayMode) {
  SystraceSection s("SurfaceRegistryBinding::startSurface");
  jsi::Object parameters(runtime);
  parameters.setProperty(runtime, "rootTag", surfaceId);
  parameters.setProperty(
      runtime, "initialProps", jsi::valueFromDynamic(runtime, initialProps));
  parameters.setProperty(runtime, "fabric", true);

  auto global = runtime.global();
  auto registry = global.getProperty(runtime, "RN$AppRegistry");
  if (registry.isObject()) {
    auto method = std::move(registry).asObject(runtime).getPropertyAsFunction(
        runtime, "runApplication");
    method.call(
        runtime,
        {jsi::String::createFromUtf8(runtime, moduleName),
         std::move(parameters),
         jsi::Value(runtime, displayModeToInt(displayMode))});
  } else {
    throwIfBridgeless(runtime, global, "startSurface");
    callMethodOfModule(
        runtime,
        "AppRegistry",
        "runApplication",
        {jsi::String::createFromUtf8(runtime, moduleName),
         std::move(parameters),
         jsi::Value(runtime, displayModeToInt(displayMode))});
  }
}

void SurfaceRegistryBinding::setSurfaceProps(
    jsi::Runtime& runtime,
    SurfaceId surfaceId,
    const std::string& moduleName,
    const folly::dynamic& initialProps,
    DisplayMode displayMode) {
  SystraceSection s("UIManagerBinding::setSurfaceProps");
  jsi::Object parameters(runtime);
  parameters.setProperty(runtime, "rootTag", surfaceId);
  parameters.setProperty(
      runtime, "initialProps", jsi::valueFromDynamic(runtime, initialProps));
  parameters.setProperty(runtime, "fabric", true);

  auto global = runtime.global();
  auto registry = global.getProperty(runtime, "RN$AppRegistry");
  if (registry.isObject()) {
    auto method = std::move(registry).asObject(runtime).getPropertyAsFunction(
        runtime, "setSurfaceProps");
    method.call(
        runtime,
        {jsi::String::createFromUtf8(runtime, moduleName),
         std::move(parameters),
         jsi::Value(runtime, displayModeToInt(displayMode))});
  } else {
    throwIfBridgeless(runtime, global, "setSurfaceProps");
    callMethodOfModule(
        runtime,
        "AppRegistry",
        "setSurfaceProps",
        {jsi::String::createFromUtf8(runtime, moduleName),
         std::move(parameters),
         jsi::Value(runtime, displayModeToInt(displayMode))});
  }
}

void SurfaceRegistryBinding::stopSurface(
    jsi::Runtime& runtime,
    SurfaceId surfaceId) {
  auto global = runtime.global();
  auto stopFunction = global.getProperty(runtime, "RN$stopSurface");
  if (stopFunction.isObject() &&
      stopFunction.asObject(runtime).isFunction(runtime)) {
    std::move(stopFunction)
        .asObject(runtime)
        .asFunction(runtime)
        .call(runtime, {jsi::Value{surfaceId}});
  } else {
    throwIfBridgeless(runtime, global, "stopSurface");
    callMethodOfModule(
        runtime,
        "ReactFabric",
        "unmountComponentAtNode",
        {jsi::Value{surfaceId}});
  }
}

} // namespace facebook::react
