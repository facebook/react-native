/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/components/text/HostPlatformParagraphProps.h>

#include <gtest/gtest.h>

// HostPlatformParagraphProps in this .cpp file is the Android-specific
// implementation. On non-Android platforms `HostPlatformParagraphProps` is a
// type alias to `BaseParagraphProps`, the Android-only fields
// (`disabled`, `selectionColor`, `dataDetectorType`) do not exist, and
// `getDiffProps` / `getDiffPropsImplementationTarget` are not defined. Guard
// the tests with `RN_SERIALIZABLE_STATE`, which is only defined for the
// Android build, so they compile and run only where the code under test
// actually exists.
#ifdef RN_SERIALIZABLE_STATE

#include <react/renderer/components/text/primitives.h>
#include <react/renderer/graphics/Color.h>

namespace facebook::react {

namespace {

folly::dynamic diffAgainstDefault(const HostPlatformParagraphProps& props) {
  const HostPlatformParagraphProps defaultProps{};
  return props.getDiffProps(&defaultProps);
}

} // namespace

TEST(HostPlatformParagraphPropsTest, getDiffPropsEmitsDisabledWhenChanged) {
  HostPlatformParagraphProps props;
  props.disabled = true;

  auto diff = diffAgainstDefault(props);

  ASSERT_TRUE(diff.isObject());
  ASSERT_NE(diff.find("disabled"), diff.items().end());
  EXPECT_TRUE(diff["disabled"].asBool());
}

TEST(
    HostPlatformParagraphPropsTest,
    getDiffPropsOmitsDisabledWhenUnchangedBetweenIdenticalProps) {
  HostPlatformParagraphProps oldProps;
  oldProps.disabled = true;
  HostPlatformParagraphProps newProps;
  newProps.disabled = true;

  auto diff = newProps.getDiffProps(&oldProps);

  EXPECT_EQ(diff.find("disabled"), diff.items().end());
}

TEST(
    HostPlatformParagraphPropsTest,
    getDiffPropsSerializesSelectionColorValueWhenSet) {
  HostPlatformParagraphProps props;
  // Use a non-default color so the diff branch is taken and we can assert
  // on the serialized integer representation.
  auto color = colorFromRGBA(/*r=*/10, /*g=*/20, /*b=*/30, /*a=*/255);
  props.selectionColor = color;

  auto diff = diffAgainstDefault(props);

  ASSERT_NE(diff.find("selectionColor"), diff.items().end());
  // `selectionColor` is serialized via the `toDynamic(SharedColor)` helper,
  // which dereferences the underlying `Color`. The result must equal the
  // dynamic representation of the same `Color`.
  EXPECT_EQ(diff["selectionColor"], folly::dynamic(*color));
}

TEST(
    HostPlatformParagraphPropsTest,
    getDiffPropsSerializesSelectionColorAsNullWhenClearedFromPrevious) {
  HostPlatformParagraphProps oldProps;
  oldProps.selectionColor = colorFromRGBA(255, 0, 0, 255);
  HostPlatformParagraphProps newProps;
  // newProps.selectionColor is std::nullopt by default — simulates the user
  // clearing the prop.

  auto diff = newProps.getDiffProps(&oldProps);

  ASSERT_NE(diff.find("selectionColor"), diff.items().end());
  EXPECT_TRUE(diff["selectionColor"].isNull());
}

TEST(
    HostPlatformParagraphPropsTest,
    getDiffPropsSerializesDataDetectorTypeAsString) {
  HostPlatformParagraphProps props;
  props.dataDetectorType = DataDetectorType::PhoneNumber;

  auto diff = diffAgainstDefault(props);

  ASSERT_NE(diff.find("dataDetectorType"), diff.items().end());
  // The diff stores the stringified enum (see `toString(DataDetectorType)`),
  // not the raw integer — a regression that drops the conversion would fail
  // this assertion.
  EXPECT_EQ(diff["dataDetectorType"].asString(), "phoneNumber");
}

TEST(
    HostPlatformParagraphPropsTest,
    getDiffPropsForwardsParagraphAttributeChanges) {
  HostPlatformParagraphProps props;
  props.paragraphAttributes.maximumNumberOfLines = 3;
  props.paragraphAttributes.ellipsizeMode = EllipsizeMode::Middle;
  props.isSelectable = true;

  auto diff = diffAgainstDefault(props);

  // The diff bundles paragraph-level attribute changes alongside the
  // host-platform-specific fields. These keys must be present with the
  // values we set.
  ASSERT_NE(diff.find("numberOfLines"), diff.items().end());
  EXPECT_EQ(diff["numberOfLines"].asInt(), 3);

  ASSERT_NE(diff.find("ellipsizeMode"), diff.items().end());
  EXPECT_EQ(diff["ellipsizeMode"].asString(), "middle");

  ASSERT_NE(diff.find("selectable"), diff.items().end());
  EXPECT_TRUE(diff["selectable"].asBool());
}

TEST(
    HostPlatformParagraphPropsTest,
    getDiffPropsUsesDefaultsWhenPrevPropsIsNull) {
  HostPlatformParagraphProps props;
  props.disabled = true;
  props.dataDetectorType = DataDetectorType::Email;

  // Passing nullptr must fall back to a default-constructed instance for
  // comparison, so non-default fields still appear in the diff.
  auto diff = props.getDiffProps(/*prevProps=*/nullptr);

  ASSERT_NE(diff.find("disabled"), diff.items().end());
  EXPECT_TRUE(diff["disabled"].asBool());

  ASSERT_NE(diff.find("dataDetectorType"), diff.items().end());
  EXPECT_EQ(diff["dataDetectorType"].asString(), "email");
}

} // namespace facebook::react

#endif // RN_SERIALIZABLE_STATE
