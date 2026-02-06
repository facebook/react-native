/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jserrorhandler/JsErrorHandler.h>
#include <react/http/IHttpClient.h>
#include <react/http/IWebSocketClient.h>
#include <react/nativemodule/TurboModuleProvider.h>
#include <react/renderer/scheduler/SurfaceDelegate.h>

namespace facebook::react {

class CallInvoker;
class DevServerHelper;
class NativeAnimatedNodesManagerProvider;
class SurfaceDelegate;
struct IDevUIDelegate;

class TurboModuleManager final {
 public:
  TurboModuleManager(
      TurboModuleProviders turboModuleProviders,
      std::shared_ptr<CallInvoker> jsInvoker,
      JsErrorHandler::OnJsError onJsError,
      std::shared_ptr<NativeAnimatedNodesManagerProvider> animatedNodesManagerProvider = nullptr,
      std::shared_ptr<DevServerHelper> devServerHelper = nullptr,
      std::shared_ptr<IDevUIDelegate> devUIDelegate = nullptr,
      std::shared_ptr<SurfaceDelegate> logBoxSurfaceDelegate = nullptr,
      HttpClientFactory httpClientFactory = nullptr,
      WebSocketClientFactory webSocketClientFactory = nullptr,
      std::function<void()> liveReloadCallback = nullptr);

  std::shared_ptr<TurboModule> operator()(const std::string &name) const;

 private:
  TurboModuleProviders turboModuleProviders_;
  std::shared_ptr<CallInvoker> jsInvoker_;
  JsErrorHandler::OnJsError onJsError_;
  std::shared_ptr<NativeAnimatedNodesManagerProvider> animatedNodesManagerProvider_;
  std::shared_ptr<DevServerHelper> devServerHelper_;
  std::shared_ptr<IDevUIDelegate> devUIDelegate_;
  std::shared_ptr<SurfaceDelegate> logBoxSurfaceDelegate_;
  HttpClientFactory httpClientFactory_;
  WebSocketClientFactory webSocketClientFactory_;
  std::function<void()> liveReloadCallback_;
};

} // namespace facebook::react
