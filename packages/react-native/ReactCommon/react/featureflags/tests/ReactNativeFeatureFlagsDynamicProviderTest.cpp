/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/featureflags/ReactNativeFeatureFlagsDynamicProvider.h>

namespace facebook::react {

class ReactNativeFeatureFlagsDynamicProviderTest : public testing::Test {
 protected:
  void TearDown() override {
    ReactNativeFeatureFlags::dangerouslyReset();
  }
};

TEST_F(ReactNativeFeatureFlagsDynamicProviderTest, providesDefaults) {
  auto values = folly::dynamic::object();

  ReactNativeFeatureFlags::override(
      std::make_unique<ReactNativeFeatureFlagsDynamicProvider>(
          std::move(values)));

  EXPECT_EQ(ReactNativeFeatureFlags::commonTestFlag(), false);
}

TEST_F(ReactNativeFeatureFlagsDynamicProviderTest, providesDynamicOverrides) {
  folly::dynamic values = folly::dynamic::object();

  values["commonTestFlag"] = true;

  ReactNativeFeatureFlags::override(
      std::make_unique<ReactNativeFeatureFlagsDynamicProvider>(values));

  EXPECT_EQ(ReactNativeFeatureFlags::commonTestFlag(), true);
}

TEST_F(
    ReactNativeFeatureFlagsDynamicProviderTest,
    throwsWithIncorrectFlagTypes) {
  folly::dynamic values = folly::dynamic::object();

  values["commonTestFlag"] = 12;

  ReactNativeFeatureFlags::override(
      std::make_unique<ReactNativeFeatureFlagsDynamicProvider>(values));

  try {
    ReactNativeFeatureFlags::commonTestFlag();
    FAIL()
        << "Expected ReactNativeFeatureFlags::commonTestFlag() to throw an exception";
  } catch (const std::runtime_error& e) {
    EXPECT_STREQ(
        "TypeError: expected dynamic type 'boolean', but had type 'int64'",
        e.what());
  }
}

TEST_F(ReactNativeFeatureFlagsDynamicProviderTest, throwsWithNonObjectValues) {
  folly::dynamic values = folly::dynamic("string");

  try {
    auto provider =
        std::make_unique<ReactNativeFeatureFlagsDynamicProvider>(values);
    FAIL()
        << "Expected ReactNativeFeatureFlagsDynamicProvider constructor to throw an exception";
  } catch (const std::invalid_argument& e) {
    EXPECT_STREQ(
        "ReactNativeFeatureFlagsDynamicProvider: values must be an object",
        e.what());
  }
}

} // namespace facebook::react
