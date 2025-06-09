/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef _WIN32
#include <folly/portability/Unistd.h>
#include <folly/portability/Windows.h>
#endif

#include <ReactCommon/CallInvoker.h>
#include <folly/json.h>
#include <gtest/gtest.h>
#include <hermes/hermes.h>
#include <jsi/JSIDynamic.h>
#include <react/bridging/Base.h>
#include <react/io/NetworkingModule.h>
#include <memory>

namespace facebook::react {

class TestCallInvoker : public CallInvoker {
 public:
  void invokeAsync(CallFunc&& fn) noexcept override {
    queue_.push_back(std::move(fn));
  }

  void invokeSync(CallFunc&& /*func*/) override {
    FAIL() << "JSCallInvoker does not support invokeSync()";
  }

 private:
  std::list<CallFunc> queue_;
};

class NetworkingModuleTests : public testing::Test {
 protected:
  void SetUp() override {
    rt_ = facebook::hermes::makeHermesRuntime();
    jsInvoker_ = std::make_shared<TestCallInvoker>();
  }

  static void verifyFormData(
      const http::FormDataField& formData,
      const std::string& fieldName,
      const std::string& string,
      std::vector<std::string> headerValues) {
    EXPECT_EQ(formData.fieldName, fieldName);
    EXPECT_EQ(formData.string, string);
    for (int i = 0; i * 2 < headerValues.size(); ++i) {
      EXPECT_EQ(formData.headers[i].first, headerValues[i * 2]);
      EXPECT_EQ(formData.headers[i].second, headerValues[i * 2 + 1]);
    }
  };

  std::unique_ptr<facebook::hermes::HermesRuntime> rt_;
  std::shared_ptr<CallInvoker> jsInvoker_;
};

// Test parsing a body with form data
TEST_F(NetworkingModuleTests, formDataTest) {
  auto dynamic = folly::parseJson(
      R"({
          "formData":[
            {
              "fieldName":"field1",
              "headers":[["header1","form-data; name=\"header1\""]],
              "string":"string1"
            },
            {
              "fieldName":"field2",
              "headers":[
                ["header1","form-data; name=\"header1\""],
                ["header2","form-data; name=\"header2\""]
              ],
              "string":"string2"
            }
          ]})");
  auto jsiValue = jsi::valueFromDynamic(*rt_, dynamic);
  auto body = bridging::fromJs<http::Body>(*rt_, jsiValue, jsInvoker_);

  EXPECT_TRUE(body.formData.has_value());

  EXPECT_FALSE(body.base64.has_value());
  EXPECT_FALSE(body.blob.has_value());
  EXPECT_FALSE(body.string.has_value());

  auto formData = body.formData.value();
  EXPECT_EQ(formData.size(), 2);
  verifyFormData(
      formData[0],
      "field1",
      "string1",
      {"header1", "form-data; name=\"header1\""});
  verifyFormData(
      formData[1],
      "field2",
      "string2",
      {"header1",
       "form-data; name=\"header1\"",
       "header2",
       "form-data; name=\"header2\""});
}

// Test parsing a body with string data
TEST_F(NetworkingModuleTests, stringDataTest) {
  auto dynamic = folly::parseJson(
      R"({
          "string": "testString"
        })");
  auto jsiValue = jsi::valueFromDynamic(*rt_, dynamic);
  auto body = bridging::fromJs<http::Body>(*rt_, jsiValue, jsInvoker_);

  EXPECT_TRUE(body.string.has_value());

  EXPECT_FALSE(body.base64.has_value());
  EXPECT_FALSE(body.blob.has_value());
  EXPECT_FALSE(body.formData.has_value());

  auto stringData = body.string.value();
  EXPECT_EQ(stringData, "testString");
}

} // namespace facebook::react
