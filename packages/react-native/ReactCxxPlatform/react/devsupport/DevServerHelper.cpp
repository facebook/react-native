/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "DevServerHelper.h"

#include <fmt/format.h>
#include <glog/logging.h>
#include <jsinspector-modern/InspectorFlags.h>
#include <openssl/sha.h>
#include <react/devsupport/inspector/Inspector.h>
#include <react/devsupport/inspector/InspectorPackagerConnectionDelegate.h>
#include <iomanip>
#include <regex>

namespace {

constexpr std::string_view DEFAULT_PLATFORM = "android";

std::string SHA256(const std::string& input) {
  std::array<unsigned char, SHA256_DIGEST_LENGTH> hash{};
  SHA256_CTX sha256;
  SHA256_Init(&sha256);
  SHA256_Update(&sha256, input.c_str(), input.size());
  SHA256_Final(hash.data(), &sha256);
  std::stringstream ss;
  for (unsigned char i : hash) {
    ss << std::hex << std::setw(2) << std::setfill('0') << (int)i;
  }
  return ss.str();
}

std::string urlEscape(const std::string& str) {
  std::regex pattern("[^a-zA-Z0-9._~-]");
  return std::regex_replace(str, pattern, "");
}

} // namespace

namespace facebook::react {

DevServerHelper::DevServerHelper(
    std::string appId,
    std::string deviceName,
    std::string devServerHost,
    uint32_t devServerPort,
    const HttpClientFactory& httpClientFactory,
    JavaScriptModuleCallback javaScriptModuleCallback) noexcept
    : appId_(std::move(appId)),
      deviceName_(std::move(deviceName)),
      devServerHost_(std::move(devServerHost)),
      devServerPort_(devServerPort),
      httpClient_(httpClientFactory()),
      javaScriptModuleCallback_(std::move(javaScriptModuleCallback)) {
  deviceId_ = SHA256(fmt::format("{}-{}", deviceName_, appId_));
}

std::future<std::string> DevServerHelper::downloadBundleResourceSync(
    const std::string& jsBundleUrl,
    DownloadProgressCallback&& downloadProgressCallback) {
  auto promise = std::make_shared<std::promise<std::string>>();
  http::NetworkCallbacks callbacks{
      .onBody =
          [jsBundleUrl, promise, downloadProgressCallback](
              std::unique_ptr<folly::IOBuf> ioBuf) {
            std::string responseStr = ioBuf->moveToFbString().toStdString();
            promise->set_value(responseStr);
          },
      .onResponseComplete =
          [jsBundleUrl, promise, downloadProgressCallback](
              const std::string& error, bool timeoutError) {
            if (!error.empty() || timeoutError) {
              if (downloadProgressCallback) {
                downloadProgressCallback(DownloadProgressStatus::FAILED);
              }
              std::string errorMessage =
                  "Failed to download JS bundle from Url: " + jsBundleUrl +
                  ". Error: " + (error.empty() ? "Timeout" : error);
              LOG(WARNING) << errorMessage;
              try {
                throw std::runtime_error(errorMessage);
              } catch (...) {
                try {
                  promise->set_exception(std::current_exception());
                } catch (...) {
                }
              }
            } else if (downloadProgressCallback) {
              downloadProgressCallback(DownloadProgressStatus::FINISHED);
            }
          }};
  httpClient_->sendRequest(std::move(callbacks), "GET", jsBundleUrl);
  if (downloadProgressCallback) {
    downloadProgressCallback(DownloadProgressStatus::STARTED);
  }
  return promise->get_future();
}

std::string DevServerHelper::getInspectorUrl() const {
  bool isProfilingBuild =
      jsinspector_modern::InspectorFlags::getInstance().getIsProfilingBuild();

  return fmt::format(
      "ws://{}:{}/inspector/device?name={}&app={}&device={}&profiling={}",
      devServerHost_,
      devServerPort_,
      urlEscape(deviceName_),
      appId_,
      deviceId_,
      isProfilingBuild);
}

std::string DevServerHelper::getBundleUrl() const {
  if (sourcePath_.empty()) {
    return "";
  }

  bool dev = true;
  bool lazy = dev;
  bool minify = false;
  bool splitBundle = false;
  bool modulesOnly = splitBundle;
  bool runModule = !splitBundle;
  return fmt::format(
      "http://{}:{}/{}.bundle?platform={}&dev={}&lazy={}&minify={}&app={}&modulesOnly={}&runModule={}&inlineSourceMap=false&excludeSource=true&sourcePaths=url-server",
      devServerHost_,
      devServerPort_,
      sourcePath_,
      DEFAULT_PLATFORM,
      dev,
      lazy,
      minify,
      appId_,
      modulesOnly,
      runModule);
};

std::string DevServerHelper::getPackagerConnectionUrl() const {
  return fmt::format("ws://{}:{}/message", devServerHost_, devServerPort_);
}

void DevServerHelper::openDebugger() const {
  auto requestUrl = fmt::format(
      "http://{}:{}/open-debugger?device={}",
      devServerHost_,
      devServerPort_,
      deviceId_);
  httpClient_->sendRequest({}, "POST", requestUrl);
}

void DevServerHelper::setupHMRClient() const {
  folly::dynamic params = folly::dynamic::array(
      DEFAULT_PLATFORM,
      sourcePath_,
      devServerHost_,
      devServerPort_,
      true /*enable*/);
  javaScriptModuleCallback_("HMRClient", "setup", std::move(params));
}

} // namespace facebook::react
