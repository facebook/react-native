/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <react/http/IHttpClient.h>
#include <react/nativemodule/JavaScriptModule.h>
#include <future>
#include <memory>
#include <string>

namespace facebook::react {

namespace {

constexpr std::string_view DEFAULT_DEV_SERVER_HOST = "localhost";
constexpr uint32_t DEFAULT_DEV_SERVER_PORT = 8081;

} // namespace

class DevServerHelper {
 public:
  enum class DownloadProgressStatus : short { STARTED, FAILED, FINISHED };
  using DownloadProgressCallback = std::function<void(DownloadProgressStatus)>;

  DevServerHelper(
      std::string appId,
      std::string deviceName,
      const HttpClientFactory& httpClientFactory,
      JavaScriptModuleCallback javaScriptModuleCallback) noexcept;
  ~DevServerHelper() noexcept = default;

  std::future<std::string> downloadBundleResourceSync(
      const std::string& jsBundleUrl,
      DownloadProgressCallback&& downloadProgressCallback = nullptr);

  std::string getInspectorUrl() const;

  std::string getBundleUrl() const;

  std::string getPackagerConnectionUrl() const;

  void openDebugger() const;

  void setSourcePath(const std::string& sourcePath) {
    sourcePath_ = sourcePath;
  }

  void setupHMRClient() const;

 private:
  std::string appId_;
  std::string deviceName_;
  std::unique_ptr<IHttpClient> httpClient_;
  JavaScriptModuleCallback javaScriptModuleCallback_;
  std::string deviceId_;
  std::string sourcePath_;
};

} // namespace facebook::react
