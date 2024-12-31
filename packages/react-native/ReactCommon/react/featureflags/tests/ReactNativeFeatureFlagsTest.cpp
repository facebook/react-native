/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/featureflags/ReactNativeFeatureFlagsDefaults.h>
#include <stdexcept>

namespace facebook::react {

uint overrideAccessCount = 0;

class ReactNativeFeatureFlagsTestOverrides
    : public ReactNativeFeatureFlagsDefaults {
 public:
  bool commonTestFlag() override {
    overrideAccessCount++;
    return true;
  }
};

class ReactNativeFeatureFlagsTest : public testing::Test {
 protected:
  void SetUp() override {
    overrideAccessCount = 0;
  }

  void TearDown() override {
    ReactNativeFeatureFlags::dangerouslyReset();
  }
};

TEST_F(ReactNativeFeatureFlagsTest, providesDefaults) {
  EXPECT_EQ(ReactNativeFeatureFlags::commonTestFlag(), false);
}

TEST_F(ReactNativeFeatureFlagsTest, providesOverriddenValues) {
  ReactNativeFeatureFlags::override(
      std::make_unique<ReactNativeFeatureFlagsTestOverrides>());

  EXPECT_EQ(ReactNativeFeatureFlags::commonTestFlag(), true);
}

TEST_F(ReactNativeFeatureFlagsTest, preventsOverridingAfterAccess) {
  EXPECT_EQ(ReactNativeFeatureFlags::commonTestFlag(), false);

  try {
    ReactNativeFeatureFlags::override(
        std::make_unique<ReactNativeFeatureFlagsTestOverrides>());
    FAIL()
        << "Expected ReactNativeFeatureFlags::override() to throw an exception";
  } catch (const std::runtime_error& e) {
    EXPECT_STREQ(
        "Feature flags were accessed before being overridden: commonTestFlag",
        e.what());
  }

  // Overrides shouldn't be applied after they've been accessed
  EXPECT_EQ(ReactNativeFeatureFlags::commonTestFlag(), false);
}

TEST_F(ReactNativeFeatureFlagsTest, preventsOverridingAfterOverride) {
  ReactNativeFeatureFlags::override(
      std::make_unique<ReactNativeFeatureFlagsTestOverrides>());

  EXPECT_EQ(ReactNativeFeatureFlags::commonTestFlag(), true);

  try {
    ReactNativeFeatureFlags::override(
        std::make_unique<ReactNativeFeatureFlagsTestOverrides>());
    FAIL()
        << "Expected ReactNativeFeatureFlags::override() to throw an exception";
  } catch (const std::runtime_error& e) {
    EXPECT_STREQ("Feature flags cannot be overridden more than once", e.what());
  }

  // Original overrides should still work
  EXPECT_EQ(ReactNativeFeatureFlags::commonTestFlag(), true);
}

TEST_F(ReactNativeFeatureFlagsTest, cachesValuesFromOverride) {
  ReactNativeFeatureFlags::override(
      std::make_unique<ReactNativeFeatureFlagsTestOverrides>());

  EXPECT_EQ(overrideAccessCount, 0);
  EXPECT_EQ(ReactNativeFeatureFlags::commonTestFlag(), true);
  EXPECT_EQ(overrideAccessCount, 1);

  EXPECT_EQ(ReactNativeFeatureFlags::commonTestFlag(), true);
  EXPECT_EQ(overrideAccessCount, 1);
}

TEST_F(
    ReactNativeFeatureFlagsTest,
    providesDefaulValuesAgainWhenResettingAfterAnOverride) {
  ReactNativeFeatureFlags::override(
      std::make_unique<ReactNativeFeatureFlagsTestOverrides>());

  EXPECT_EQ(ReactNativeFeatureFlags::commonTestFlag(), true);

  ReactNativeFeatureFlags::dangerouslyReset();

  EXPECT_EQ(ReactNativeFeatureFlags::commonTestFlag(), false);
}

TEST_F(ReactNativeFeatureFlagsTest, allowsOverridingAgainAfterReset) {
  ReactNativeFeatureFlags::override(
      std::make_unique<ReactNativeFeatureFlagsTestOverrides>());

  EXPECT_EQ(ReactNativeFeatureFlags::commonTestFlag(), true);

  ReactNativeFeatureFlags::dangerouslyReset();

  ReactNativeFeatureFlags::override(
      std::make_unique<ReactNativeFeatureFlagsTestOverrides>());

  EXPECT_EQ(ReactNativeFeatureFlags::commonTestFlag(), true);
}

TEST_F(
    ReactNativeFeatureFlagsTest,
    allowsDangerouslyForcingOverridesWhenValuesHaveNotBeenAccessed) {
  auto accessedFlags = ReactNativeFeatureFlags::dangerouslyForceOverride(
      std::make_unique<ReactNativeFeatureFlagsTestOverrides>());

  EXPECT_EQ(ReactNativeFeatureFlags::commonTestFlag(), true);
  EXPECT_EQ(accessedFlags.has_value(), false);
}

TEST_F(
    ReactNativeFeatureFlagsTest,
    allowsDangerouslyForcingOverridesWhenValuesHaveBeenAccessed) {
  EXPECT_EQ(ReactNativeFeatureFlags::commonTestFlag(), false);

  auto accessedFlags = ReactNativeFeatureFlags::dangerouslyForceOverride(
      std::make_unique<ReactNativeFeatureFlagsTestOverrides>());

  EXPECT_EQ(ReactNativeFeatureFlags::commonTestFlag(), true);
  EXPECT_EQ(accessedFlags.has_value(), true);
  EXPECT_EQ(accessedFlags.value(), "commonTestFlag");
}

} // namespace facebook::react
