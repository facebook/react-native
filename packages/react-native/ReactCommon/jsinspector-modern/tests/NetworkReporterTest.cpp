/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JsiIntegrationTest.h"
#include "engines/JsiIntegrationTestHermesEngineAdapter.h"

#include <folly/executors/QueuedImmediateExecutor.h>
#include <jsinspector-modern/InspectorFlags.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/networking/NetworkReporter.h>

using namespace ::testing;

namespace facebook::react::jsinspector_modern {

namespace {

struct Params {
  bool enableNetworkEventReporting;
};

} // namespace

/**
 * A test fixture for the way the internal NetworkReporter API interacts with
 * the CDP Network domain.
 */
class NetworkReporterTest : public JsiIntegrationPortableTestBase<
                                JsiIntegrationTestHermesEngineAdapter,
                                folly::QueuedImmediateExecutor>,
                            public WithParamInterface<Params> {
 protected:
  NetworkReporterTest()
      : JsiIntegrationPortableTestBase({
            .networkInspectionEnabled = true,
            .enableNetworkEventReporting =
                GetParam().enableNetworkEventReporting,
        }) {}

  void SetUp() override {
    JsiIntegrationPortableTestBase::SetUp();
    connect();
  }

 private:
};

TEST_P(NetworkReporterTest, testNetworkEnableDisable) {
  InSequence s;

  EXPECT_FALSE(NetworkReporter::getInstance().isDebuggingEnabled());
  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 1,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 1,
                                  "method": "Network.enable"
                                })");

  EXPECT_TRUE(NetworkReporter::getInstance().isDebuggingEnabled());

  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 2,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 2,
                                  "method": "Network.disable"
                                })");

  EXPECT_FALSE(NetworkReporter::getInstance().isDebuggingEnabled());
}

TEST_P(NetworkReporterTest, testGetMissingResponseBody) {
  InSequence s;
  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 1,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 1,
                                  "method": "Network.enable"
                                })");
  this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/error/code", (int)cdp::ErrorCode::InternalError),
      AtJsonPtr("/id", 2))));
  this->toPage_->sendMessage(R"({
                                  "id": 2,
                                  "method": "Network.getResponseBody",
                                  "params": {
                                    "requestId": "1234567890-no-such-request"
                                  }
                                })");
  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 3,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 3,
                                  "method": "Network.disable"
                                })");
}

TEST_P(NetworkReporterTest, testRequestWillBeSentWithRedirect) {
  InSequence s;
  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 1,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 1,
                                  "method": "Network.enable"
                                })");

  this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/method", "Network.requestWillBeSent"),
      AtJsonPtr("/params/requestId", "test-request-1"),
      AtJsonPtr("/params/loaderId", ""),
      AtJsonPtr("/params/documentURL", "mobile"),
      AtJsonPtr("/params/request/url", "https://example.com/redirected"),
      AtJsonPtr("/params/request/method", "POST"),
      AtJsonPtr("/params/request/headers/Content-Type", "application/json"),
      AtJsonPtr("/params/timestamp", Gt(0)),
      AtJsonPtr("/params/wallTime", Gt(0)),
      AtJsonPtr("/params/initiator/type", "script"),
      AtJsonPtr("/params/redirectHasExtraInfo", true),
      AtJsonPtr("/params/redirectResponse", Not(IsEmpty())),
      AtJsonPtr("/params/redirectResponse/url", "https://example.com/original"),
      AtJsonPtr("/params/redirectResponse/status", 302),
      AtJsonPtr(
          "/params/redirectResponse/headers/Location",
          "https://example.com/redirected"))));

  RequestInfo requestInfo;
  requestInfo.url = "https://example.com/redirected";
  requestInfo.httpMethod = "POST";
  requestInfo.headers = Headers{{"Content-Type", "application/json"}};

  ResponseInfo redirectResponse;
  redirectResponse.url = "https://example.com/original";
  redirectResponse.statusCode = 302;
  redirectResponse.headers =
      Headers{{"Location", "https://example.com/redirected"}};

  NetworkReporter::getInstance().reportRequestStart(
      "test-request-1", requestInfo, 1024, redirectResponse);

  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 2,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 2,
                                  "method": "Network.disable"
                                })");
}

TEST_P(NetworkReporterTest, testRequestWillBeSentExtraInfoParameters) {
  InSequence s;
  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 1,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 1,
                                  "method": "Network.enable"
                                })");

  this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/method", "Network.requestWillBeSentExtraInfo"),
      AtJsonPtr("/params/requestId", "test-extra-info"),
      AtJsonPtr("/params/headers/User-Agent", "TestAgent"),
      AtJsonPtr("/params/headers/Accept-Language", "en-US"),
      AtJsonPtr("/params/connectTiming/requestTime", Gt(0)))));

  Headers extraHeaders = {
      {"User-Agent", "TestAgent"}, {"Accept-Language", "en-US"}};

  NetworkReporter::getInstance().reportConnectionTiming(
      "test-extra-info", extraHeaders);

  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 2,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 2,
                                  "method": "Network.disable"
                                })");
}

TEST_P(NetworkReporterTest, testLoadingFailedCancelled) {
  InSequence s;
  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 1,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 1,
                                  "method": "Network.enable"
                                })");

  this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/method", "Network.loadingFailed"),
      AtJsonPtr("/params/requestId", "test-request-1"),
      AtJsonPtr("/params/timestamp", Gt(0)),
      AtJsonPtr("/params/type", "Other"),
      AtJsonPtr("/params/errorText", "net::ERR_ABORTED"),
      AtJsonPtr("/params/canceled", true))));

  NetworkReporter::getInstance().reportRequestFailed("test-request-1", true);

  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 2,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 2,
                                  "method": "Network.disable"
                                })");
}

TEST_P(NetworkReporterTest, testLoadingFailedError) {
  InSequence s;
  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 1,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 1,
                                  "method": "Network.enable"
                                })");

  this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/method", "Network.loadingFailed"),
      AtJsonPtr("/params/requestId", "test-request-1"),
      AtJsonPtr("/params/timestamp", Gt(0)),
      AtJsonPtr("/params/type", "Other"),
      AtJsonPtr("/params/errorText", "net::ERR_FAILED"),
      AtJsonPtr("/params/canceled", false))));

  NetworkReporter::getInstance().reportRequestFailed("test-request-1", false);

  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 2,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 2,
                                  "method": "Network.disable"
                                })");
}

TEST_P(NetworkReporterTest, testCompleteNetworkFlow) {
  InSequence s;
  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 1,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 1,
                                  "method": "Network.enable"
                                })");

  const std::string requestId = "complete-flow-request";

  // Step 1: Request will be sent
  this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/method", "Network.requestWillBeSent"),
      AtJsonPtr("/params/requestId", requestId),
      AtJsonPtr("/params/loaderId", ""),
      AtJsonPtr("/params/documentURL", "mobile"),
      AtJsonPtr("/params/request/url", "https://api.example.com/users"),
      AtJsonPtr("/params/request/method", "GET"),
      AtJsonPtr("/params/request/headers/Accept", "application/json"),
      AtJsonPtr("/params/timestamp", Gt(0)),
      AtJsonPtr("/params/wallTime", Gt(0)),
      AtJsonPtr("/params/initiator/type", "script"),
      AtJsonPtr("/params/redirectHasExtraInfo", false))));

  RequestInfo requestInfo;
  requestInfo.url = "https://api.example.com/users";
  requestInfo.httpMethod = "GET";
  requestInfo.headers = Headers{{"Accept", "application/json"}};

  NetworkReporter::getInstance().reportRequestStart(
      requestId, requestInfo, 0, std::nullopt);

  // Step 2: Connection timing
  this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/method", "Network.requestWillBeSentExtraInfo"),
      AtJsonPtr("/params/requestId", requestId),
      AtJsonPtr("/params/headers/Accept", "application/json"),
      AtJsonPtr("/params/connectTiming/requestTime", Gt(0)))));

  NetworkReporter::getInstance().reportConnectionTiming(
      requestId, requestInfo.headers);

  // Step 3: Response received
  this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/method", "Network.responseReceived"),
      AtJsonPtr("/params/requestId", requestId),
      AtJsonPtr("/params/loaderId", ""),
      AtJsonPtr("/params/timestamp", Gt(0)),
      AtJsonPtr("/params/type", "XHR"),
      AtJsonPtr("/params/response/url", "https://api.example.com/users"),
      AtJsonPtr("/params/response/status", 200),
      AtJsonPtr("/params/response/statusText", "OK"),
      AtJsonPtr("/params/response/headers/Content-Type", "application/json"),
      AtJsonPtr("/params/response/headers/Content-Length", "1024"),
      AtJsonPtr("/params/response/mimeType", "application/json"),
      AtJsonPtr("/params/response/encodedDataLength", 1024),
      AtJsonPtr("/params/hasExtraInfo", false))));

  ResponseInfo responseInfo;
  responseInfo.url = "https://api.example.com/users";
  responseInfo.statusCode = 200;
  responseInfo.headers =
      Headers{{"Content-Type", "application/json"}, {"Content-Length", "1024"}};

  NetworkReporter::getInstance().reportResponseStart(
      requestId, responseInfo, 1024);

  // Step 4: Data received (multiple chunks)
  this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/method", "Network.dataReceived"),
      AtJsonPtr("/params/requestId", requestId),
      AtJsonPtr("/params/timestamp", Gt(0)),
      AtJsonPtr("/params/dataLength", 512),
      AtJsonPtr("/params/encodedDataLength", 512))));

  NetworkReporter::getInstance().reportDataReceived(requestId, 512, 512);

  this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/method", "Network.dataReceived"),
      AtJsonPtr("/params/requestId", requestId),
      AtJsonPtr("/params/timestamp", Gt(0)),
      AtJsonPtr("/params/dataLength", 512),
      AtJsonPtr("/params/encodedDataLength", 512))));

  NetworkReporter::getInstance().reportDataReceived(requestId, 512, 512);

  // Step 5: Loading finished
  this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/method", "Network.loadingFinished"),
      AtJsonPtr("/params/requestId", requestId),
      AtJsonPtr("/params/timestamp", Gt(0)),
      AtJsonPtr("/params/encodedDataLength", 1024))));

  NetworkReporter::getInstance().reportResponseEnd(requestId, 1024);

  // Store and retrieve response body
  NetworkReporter::getInstance().storeResponseBody(
      requestId, R"({"users": [{"id": 1, "name": "John"}]})", false);

  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 2,
                                          "result": {
                                            "body": "{\"users\": [{\"id\": 1, \"name\": \"John\"}]}",
                                            "base64Encoded": false
                                          }
                                        })"));
  this->toPage_->sendMessage(fmt::format(
      R"({{
          "id": 2,
          "method": "Network.getResponseBody",
          "params": {{
            "requestId": {0}
          }}
        }})",
      folly::toJson(requestId)));

  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 3,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 3,
                                  "method": "Network.disable"
                                })");
}

TEST_P(NetworkReporterTest, testGetResponseBodyWithBase64) {
  InSequence s;
  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 1,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 1,
                                  "method": "Network.enable"
                                })");

  const std::string requestId = "base64-response-test";

  // Store base64-encoded response body
  NetworkReporter::getInstance().storeResponseBody(
      requestId, "SGVsbG8gV29ybGQ=", true);

  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 2,
                                          "result": {
                                            "body": "SGVsbG8gV29ybGQ=",
                                            "base64Encoded": true
                                          }
                                        })"));
  this->toPage_->sendMessage(fmt::format(
      R"({{
          "id": 2,
          "method": "Network.getResponseBody",
          "params": {{
            "requestId": {0}
          }}
        }})",
      folly::toJson(requestId)));

  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 3,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 3,
                                  "method": "Network.disable"
                                })");
}

TEST_P(NetworkReporterTest, testNetworkEventsWhenDisabled) {
  EXPECT_FALSE(NetworkReporter::getInstance().isDebuggingEnabled());

  // NOTE: The test will automatically fail if any unexpected CDP messages are
  // received as a result of the following calls.

  RequestInfo requestInfo;
  requestInfo.url = "https://example.com/disabled";
  requestInfo.httpMethod = "GET";

  NetworkReporter::getInstance().reportRequestStart(
      "disabled-request", requestInfo, 0, std::nullopt);

  ResponseInfo responseInfo;
  responseInfo.url = "https://example.com/disabled";
  responseInfo.statusCode = 200;

  NetworkReporter::getInstance().reportConnectionTiming("disabled-request", {});
  NetworkReporter::getInstance().reportResponseStart(
      "disabled-request", responseInfo, 1024);
  NetworkReporter::getInstance().reportDataReceived(
      "disabled-request", 512, 512);
  NetworkReporter::getInstance().reportResponseEnd("disabled-request", 1024);
  NetworkReporter::getInstance().reportRequestFailed("disabled-request", false);
}

static const auto paramValues = testing::Values(
    Params{.enableNetworkEventReporting = true},
    Params{
        .enableNetworkEventReporting = false,
    });

INSTANTIATE_TEST_SUITE_P(NetworkReporterTest, NetworkReporterTest, paramValues);

} // namespace facebook::react::jsinspector_modern
