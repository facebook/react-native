/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/http/IHttpClient.h>

namespace facebook::react::http {

class StubRequestToken : public IRequestToken {
 public:
  StubRequestToken() = default;
  ~StubRequestToken() override = default;
  StubRequestToken(StubRequestToken& other) = delete;
  StubRequestToken& operator=(StubRequestToken& other) = delete;
  StubRequestToken(StubRequestToken&& other) = delete;
  StubRequestToken& operator=(StubRequestToken&& other) = delete;

  void cancel() noexcept override {}
};

class StubHttpClient : public IHttpClient {
 public:
  StubHttpClient() = default;
  ~StubHttpClient() override = default;
  StubHttpClient(StubHttpClient& other) = delete;
  StubHttpClient& operator=(StubHttpClient& other) = delete;
  StubHttpClient(StubHttpClient&& other) = delete;
  StubHttpClient& operator=(StubHttpClient&& other) = delete;

  std::unique_ptr<http::IRequestToken> sendRequest(
      NetworkCallbacks&& /*callback*/,
      const std::string& /*method*/,
      const std::string& /*url*/,
      const Headers& /*headers*/ = {},
      const Body& /*body*/ = {},
      uint32_t /*timeout*/ = 0,
      std::optional<std::string> /*loggingId*/ = std::nullopt) override {
    return std::make_unique<http::StubRequestToken>();
  }
};

} // namespace facebook::react::http
