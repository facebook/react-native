/*
 * Copyright 2018-present Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
#include <folly/experimental/settings/Settings.h>
#include <folly/Format.h>
#include <folly/portability/GTest.h>

#include <folly/experimental/settings/test/a.h>
#include <folly/experimental/settings/test/b.h>

namespace some_ns {
FOLLY_SETTING_DEFINE(
    follytest,
    some_flag,
    std::string,
    "default",
    "Description");
FOLLY_SETTING_DEFINE(
    follytest,
    unused,
    std::string,
    "unused_default",
    "Not used, but should still be in the list");
FOLLY_SETTING_DEFINE(
    follytest,
    multi_token_type,
    unsigned int,
    123,
    "Test that multi-token type names can be used");
// Enable to test runtime collision checking logic
#if 0
FOLLY_SETTING_DEFINE(follytest, internal_flag_to_a, std::string,
                     "collision_with_a",
                     "Collision_with_a");
#endif

/* Test user defined type support */
struct UserDefinedType {
  explicit UserDefinedType(folly::StringPiece value) {
    if (value == "a") {
      value_ = 0;
    } else if (value == "b") {
      value_ = 100;
    } else {
      throw std::runtime_error("Invalid value passed to UserDefinedType ctor");
    }
  }

  bool operator==(const UserDefinedType& other) const {
    return value_ == other.value_;
  }

  int value_;
};
/* Note: conversion intentionally to different strings to test that this
   function is called */
template <class String>
void toAppend(const UserDefinedType& t, String* out) {
  if (t.value_ == 0) {
    out->append("a_out");
  } else if (t.value_ == 100) {
    out->append("b_out");
  } else {
    throw std::runtime_error("Can't convert UserDefinedType to string");
  }
}

FOLLY_SETTING_DEFINE(
    follytest,
    user_defined,
    UserDefinedType,
    "b",
    "User defined type constructed from string");

} // namespace some_ns

TEST(Settings, user_defined) {
  EXPECT_EQ(some_ns::FOLLY_SETTING(follytest, user_defined)->value_, 100);
  {
    folly::settings::Snapshot sn;
    EXPECT_TRUE(sn.setFromString("follytest_user_defined", "a", "test"));
    sn.publish();
    EXPECT_EQ(some_ns::FOLLY_SETTING(follytest, user_defined)->value_, 0);
  }
  {
    folly::settings::Snapshot sn;
    auto info = sn.getAsString("follytest_user_defined");
    EXPECT_TRUE(info.hasValue());
    EXPECT_EQ(info->first, "a_out");
    EXPECT_EQ(info->second, "test");
  }
  {
    folly::settings::Snapshot sn;
    EXPECT_THROW(
        sn.setFromString("follytest_user_defined", "c", "test2"),
        std::runtime_error);
    sn.publish();
    EXPECT_EQ(some_ns::FOLLY_SETTING(follytest, user_defined)->value_, 0);
  }
  {
    folly::settings::Snapshot sn;
    auto info = sn.getAsString("follytest_user_defined");
    EXPECT_TRUE(info.hasValue());
    EXPECT_EQ(info->first, "a_out");
    EXPECT_EQ(info->second, "test");
  }
  {
    folly::settings::Snapshot sn;
    EXPECT_TRUE(sn.resetToDefault("follytest_user_defined"));
    sn.publish();
    EXPECT_EQ(some_ns::FOLLY_SETTING(follytest, user_defined)->value_, 100);
  }
  {
    folly::settings::Snapshot sn;
    auto info = sn.getAsString("follytest_user_defined");
    EXPECT_TRUE(info.hasValue());
    EXPECT_EQ(info->first, "b_out");
    EXPECT_EQ(info->second, "default");
  }
  /* Test that intentionally setting to something non-converteable fails */
  some_ns::UserDefinedType bad("a");
  bad.value_ = 50;
  EXPECT_THROW(
      some_ns::FOLLY_SETTING(follytest, user_defined).set(bad),
      std::runtime_error);
  EXPECT_EQ(some_ns::FOLLY_SETTING(follytest, user_defined)->value_, 100);
  {
    folly::settings::Snapshot sn;
    auto info = sn.getAsString("follytest_user_defined");
    EXPECT_TRUE(info.hasValue());
    EXPECT_EQ(info->first, "b_out");
    EXPECT_EQ(info->second, "default");
  }
}

TEST(Settings, basic) {
  EXPECT_EQ(a_ns::a_func(), 1245);
  EXPECT_EQ(b_ns::b_func(), "testbasdf");
  EXPECT_EQ(*some_ns::FOLLY_SETTING(follytest, some_flag), "default");
  // Test -> API
  EXPECT_EQ(some_ns::FOLLY_SETTING(follytest, some_flag)->size(), 7);
  a_ns::FOLLY_SETTING(follytest, public_flag_to_a).set(100);
  EXPECT_EQ(*a_ns::FOLLY_SETTING(follytest, public_flag_to_a), 100);
  EXPECT_EQ(a_ns::getRemote(), 100);
  a_ns::setRemote(200);
  EXPECT_EQ(*a_ns::FOLLY_SETTING(follytest, public_flag_to_a), 200);
  EXPECT_EQ(a_ns::getRemote(), 200);
  {
    folly::settings::Snapshot sn;
    auto res = sn.getAsString("follytest_public_flag_to_a");
    EXPECT_TRUE(res.hasValue());
    EXPECT_EQ(res->first, "200");
    EXPECT_EQ(res->second, "remote_set");
  }
  {
    auto meta = folly::settings::getSettingsMeta("follytest_public_flag_to_a");
    EXPECT_TRUE(meta.hasValue());
    const auto& md = meta.value();
    EXPECT_EQ(md.project, "follytest");
    EXPECT_EQ(md.name, "public_flag_to_a");
    EXPECT_EQ(md.typeStr, "int");
    EXPECT_EQ(md.typeId, typeid(int));
  }
  {
    auto meta = folly::settings::getSettingsMeta("follytest_some_flag");
    EXPECT_TRUE(meta.hasValue());
    const auto& md = meta.value();
    EXPECT_EQ(md.project, "follytest");
    EXPECT_EQ(md.name, "some_flag");
    EXPECT_EQ(md.typeStr, "std::string");
    EXPECT_EQ(md.typeId, typeid(std::string));
  }
  {
    folly::settings::Snapshot sn;
    auto res = sn.getAsString("follytest_nonexisting");
    EXPECT_FALSE(res.hasValue());
  }
  {
    folly::settings::Snapshot sn;
    EXPECT_TRUE(
        sn.setFromString("follytest_public_flag_to_a", "300", "from_string"));
    sn.publish();
    EXPECT_EQ(*a_ns::FOLLY_SETTING(follytest, public_flag_to_a), 300);
  }
  EXPECT_EQ(a_ns::getRemote(), 300);
  {
    folly::settings::Snapshot sn;
    auto res = sn.getAsString("follytest_public_flag_to_a");
    EXPECT_TRUE(res.hasValue());
    EXPECT_EQ(res->first, "300");
    EXPECT_EQ(res->second, "from_string");
  }
  {
    folly::settings::Snapshot sn;
    EXPECT_FALSE(
        sn.setFromString("follytest_nonexisting", "300", "from_string"));
  }
  EXPECT_EQ(
      some_ns::FOLLY_SETTING(follytest, multi_token_type).defaultValue(), 123);
  EXPECT_EQ(
      a_ns::FOLLY_SETTING(follytest, public_flag_to_a).defaultValue(), 456);
  EXPECT_EQ(
      b_ns::FOLLY_SETTING(follytest, public_flag_to_b).defaultValue(), "basdf");
  EXPECT_EQ(
      some_ns::FOLLY_SETTING(follytest, some_flag).defaultValue(), "default");
  EXPECT_EQ(
      some_ns::FOLLY_SETTING(follytest, user_defined).defaultValue(),
      some_ns::UserDefinedType("b"));
  {
    std::string allFlags;
    folly::settings::Snapshot sn;
    sn.forEachSetting([&allFlags](
                          const folly::settings::SettingMetadata& meta,
                          folly::StringPiece value,
                          folly::StringPiece reason) {
      if (meta.typeId == typeid(int)) {
        EXPECT_EQ(meta.typeStr, "int");
      } else if (meta.typeId == typeid(std::string)) {
        EXPECT_EQ(meta.typeStr, "std::string");
      } else if (meta.typeId == typeid(unsigned int)) {
        EXPECT_EQ(meta.typeStr, "unsigned int");
      } else if (meta.typeId == typeid(some_ns::UserDefinedType)) {
        EXPECT_EQ(meta.typeStr, "UserDefinedType");
      } else {
        ASSERT_FALSE(true);
      }
      allFlags += folly::sformat(
          "{}/{}/{}/{}/{}/{}/{}\n",
          meta.project,
          meta.name,
          meta.typeStr,
          meta.defaultStr,
          meta.description,
          value,
          reason);
    });
    EXPECT_EQ(
        allFlags,
        "follytest/internal_flag_to_a/int/789/Desc of int/789/default\n"
        "follytest/internal_flag_to_b/std::string/\"test\"/Desc of str/test/default\n"
        "follytest/multi_token_type/unsigned int/123/Test that multi-token type names can be used/123/default\n"
        "follytest/public_flag_to_a/int/456/Public flag to a/300/from_string\n"
        "follytest/public_flag_to_b/std::string/\"basdf\"/Public flag to b/basdf/default\n"
        "follytest/some_flag/std::string/\"default\"/Description/default/default\n"
        "follytest/unused/std::string/\"unused_default\"/Not used, but should still be in the list/unused_default/default\n"
        "follytest/user_defined/UserDefinedType/\"b\"/User defined type constructed from string/b_out/default\n");
  }
  {
    folly::settings::Snapshot sn;
    EXPECT_TRUE(sn.resetToDefault("follytest_public_flag_to_a"));
    sn.publish();
    EXPECT_EQ(*a_ns::FOLLY_SETTING(follytest, public_flag_to_a), 456);
    EXPECT_EQ(a_ns::getRemote(), 456);
  }
  {
    folly::settings::Snapshot sn;
    EXPECT_FALSE(sn.resetToDefault("follytest_nonexisting"));
  }
}

TEST(Settings, snapshot) {
  // Test discarding a snapshot
  {
    folly::settings::Snapshot snapshot;

    EXPECT_EQ(*some_ns::FOLLY_SETTING(follytest, some_flag), "default");
    EXPECT_EQ(
        *snapshot(some_ns::FOLLY_SETTING(follytest, some_flag)), "default");

    // Set the global value, snapshot doesn't see it
    some_ns::FOLLY_SETTING(follytest, some_flag).set("global_value");
    EXPECT_EQ(*some_ns::FOLLY_SETTING(follytest, some_flag), "global_value");
    EXPECT_EQ(
        *snapshot(some_ns::FOLLY_SETTING(follytest, some_flag)), "default");

    // Set the value in the snapshot only
    snapshot(some_ns::FOLLY_SETTING(follytest, some_flag))
        .set("snapshot_value");
    EXPECT_EQ(*some_ns::FOLLY_SETTING(follytest, some_flag), "global_value");
    EXPECT_EQ(
        *snapshot(some_ns::FOLLY_SETTING(follytest, some_flag)),
        "snapshot_value");
  }
  // Discard the snapshot
  EXPECT_EQ(*some_ns::FOLLY_SETTING(follytest, some_flag), "global_value");

  // Test publishing a snapshot
  {
    folly::settings::Snapshot snapshot;

    // Set the value in the snapshot only
    EXPECT_EQ(*some_ns::FOLLY_SETTING(follytest, some_flag), "global_value");
    EXPECT_EQ(
        *snapshot(some_ns::FOLLY_SETTING(follytest, some_flag)),
        "global_value");
    snapshot(some_ns::FOLLY_SETTING(follytest, some_flag))
        .set("snapshot_value2");
    EXPECT_EQ(*some_ns::FOLLY_SETTING(follytest, some_flag), "global_value");
    EXPECT_EQ(
        *snapshot(some_ns::FOLLY_SETTING(follytest, some_flag)),
        "snapshot_value2");

    // Set the global value, snapshot doesn't see it
    some_ns::FOLLY_SETTING(follytest, some_flag).set("global_value2");
    EXPECT_EQ(*some_ns::FOLLY_SETTING(follytest, some_flag), "global_value2");
    EXPECT_EQ(
        *snapshot(some_ns::FOLLY_SETTING(follytest, some_flag)),
        "snapshot_value2");
    snapshot.publish();
  }

  EXPECT_EQ(*some_ns::FOLLY_SETTING(follytest, some_flag), "snapshot_value2");

  // Snapshots at different points in time
  {
    some_ns::FOLLY_SETTING(follytest, some_flag).set("a");
    a_ns::FOLLY_SETTING(follytest, public_flag_to_a).set(123);

    folly::settings::Snapshot snapshot_1;

    EXPECT_EQ(*some_ns::FOLLY_SETTING(follytest, some_flag), "a");
    EXPECT_EQ(*snapshot_1(some_ns::FOLLY_SETTING(follytest, some_flag)), "a");
    EXPECT_EQ(*a_ns::FOLLY_SETTING(follytest, public_flag_to_a), 123);
    EXPECT_EQ(
        *snapshot_1(a_ns::FOLLY_SETTING(follytest, public_flag_to_a)), 123);

    some_ns::FOLLY_SETTING(follytest, some_flag).set("b");
    EXPECT_EQ(*some_ns::FOLLY_SETTING(follytest, some_flag), "b");
    EXPECT_EQ(*snapshot_1(some_ns::FOLLY_SETTING(follytest, some_flag)), "a");
    EXPECT_EQ(*a_ns::FOLLY_SETTING(follytest, public_flag_to_a), 123);
    EXPECT_EQ(
        *snapshot_1(a_ns::FOLLY_SETTING(follytest, public_flag_to_a)), 123);

    folly::settings::Snapshot snapshot_2;
    EXPECT_EQ(*some_ns::FOLLY_SETTING(follytest, some_flag), "b");
    EXPECT_EQ(*snapshot_1(some_ns::FOLLY_SETTING(follytest, some_flag)), "a");
    EXPECT_EQ(*snapshot_2(some_ns::FOLLY_SETTING(follytest, some_flag)), "b");
    EXPECT_EQ(*a_ns::FOLLY_SETTING(follytest, public_flag_to_a), 123);
    EXPECT_EQ(
        *snapshot_1(a_ns::FOLLY_SETTING(follytest, public_flag_to_a)), 123);
    EXPECT_EQ(
        *snapshot_2(a_ns::FOLLY_SETTING(follytest, public_flag_to_a)), 123);

    some_ns::FOLLY_SETTING(follytest, some_flag).set("c");
    EXPECT_EQ(*some_ns::FOLLY_SETTING(follytest, some_flag), "c");
    EXPECT_EQ(*snapshot_1(some_ns::FOLLY_SETTING(follytest, some_flag)), "a");
    EXPECT_EQ(*snapshot_2(some_ns::FOLLY_SETTING(follytest, some_flag)), "b");
    EXPECT_EQ(*a_ns::FOLLY_SETTING(follytest, public_flag_to_a), 123);
    EXPECT_EQ(
        *snapshot_1(a_ns::FOLLY_SETTING(follytest, public_flag_to_a)), 123);
    EXPECT_EQ(
        *snapshot_2(a_ns::FOLLY_SETTING(follytest, public_flag_to_a)), 123);

    a_ns::FOLLY_SETTING(follytest, public_flag_to_a).set(456);
    EXPECT_EQ(*some_ns::FOLLY_SETTING(follytest, some_flag), "c");
    EXPECT_EQ(*snapshot_1(some_ns::FOLLY_SETTING(follytest, some_flag)), "a");
    EXPECT_EQ(*snapshot_2(some_ns::FOLLY_SETTING(follytest, some_flag)), "b");
    EXPECT_EQ(*a_ns::FOLLY_SETTING(follytest, public_flag_to_a), 456);
    EXPECT_EQ(
        *snapshot_1(a_ns::FOLLY_SETTING(follytest, public_flag_to_a)), 123);
    EXPECT_EQ(
        *snapshot_2(a_ns::FOLLY_SETTING(follytest, public_flag_to_a)), 123);
  }
}
