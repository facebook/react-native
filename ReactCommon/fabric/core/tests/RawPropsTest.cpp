/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <gtest/gtest.h>
#include <react/core/ConcreteShadowNode.h>
#include <react/core/ShadowNode.h>
#include <react/core/propsConversions.h>

#include "TestComponent.h"

using namespace facebook::react;

class PropsSingleFloat : public Props {
 public:
  PropsSingleFloat() = default;
  PropsSingleFloat(
      const PropsSingleFloat &sourceProps,
      const RawProps &rawProps)
      : floatValue(convertRawProp(
            rawProps,
            "floatValue",
            sourceProps.floatValue,
            17.5)) {}

 private:
  const float floatValue{17.5};
};

class PropsSingleDouble : public Props {
 public:
  PropsSingleDouble() = default;
  PropsSingleDouble(
      const PropsSingleDouble &sourceProps,
      const RawProps &rawProps)
      : doubleValue(convertRawProp(
            rawProps,
            "doubleValue",
            sourceProps.doubleValue,
            17.5)) {}

 private:
  const float doubleValue{17.5};
};

class PropsSingleInt : public Props {
 public:
  PropsSingleInt() = default;
  PropsSingleInt(const PropsSingleInt &sourceProps, const RawProps &rawProps)
      : intValue(
            convertRawProp(rawProps, "intValue", sourceProps.intValue, 17)) {}

 private:
  const int intValue{17};
};

class PropsPrimitiveTypes : public Props {
 public:
  PropsPrimitiveTypes() = default;
  PropsPrimitiveTypes(
      const PropsPrimitiveTypes &sourceProps,
      const RawProps &rawProps)
      : intValue(
            convertRawProp(rawProps, "intValue", sourceProps.intValue, 17)),
        doubleValue(convertRawProp(
            rawProps,
            "doubleValue",
            sourceProps.doubleValue,
            17.56)),
        floatValue(convertRawProp(
            rawProps,
            "floatValue",
            sourceProps.floatValue,
            56.75)),
        stringValue(convertRawProp(
            rawProps,
            "stringValue",
            sourceProps.stringValue,
            "")),
        boolValue(convertRawProp(
            rawProps,
            "boolValue",
            sourceProps.boolValue,
            false)) {}

 private:
  const int intValue{17};
  const double doubleValue{17.56};
  const float floatValue{56.75};
  const std::string stringValue{};
  const bool boolValue{false};
};

class PropsMultiLookup : public Props {
 public:
  PropsMultiLookup() = default;
  PropsMultiLookup(
      const PropsMultiLookup &sourceProps,
      const RawProps &rawProps)
      : floatValue(convertRawProp(
            rawProps,
            "floatValue",
            sourceProps.floatValue,
            17.5)),
        // While this specific pattern is uncommon, it's a simplication of a
        // pattern that does occur a lot: nested structs that access props we
        // have already accessed populating Props
        derivedFloatValue(
            convertRawProp(rawProps, "floatValue", sourceProps.floatValue, 40) *
            2) {}

  const float floatValue{17.5};
  const float derivedFloatValue{40};
};

TEST(ShadowNodeTest, handleProps) {
  const auto &raw = RawProps(folly::dynamic::object("nativeID", "abc"));
  auto parser = RawPropsParser();
  parser.prepare<Props>();
  raw.parse(parser);

  auto props = std::make_shared<Props>(Props(), raw);

  // Props are not sealed after applying raw props.
  ASSERT_FALSE(props->getSealed());

  ASSERT_STREQ(props->nativeId.c_str(), "abc");
}

TEST(ShadowNodeTest, handleRawPropsSingleString) {
  const auto &raw = RawProps(folly::dynamic::object("nativeID", "abc"));
  auto parser = RawPropsParser();
  parser.prepare<Props>();
  raw.parse(parser);

  std::string value = (std::string)*raw.at("nativeID", nullptr, nullptr);

  ASSERT_STREQ(value.c_str(), "abc");
}

TEST(ShadowNodeTest, handleRawPropsSingleFloat) {
  const auto &raw =
      RawProps(folly::dynamic::object("floatValue", (float)42.42));
  auto parser = RawPropsParser();
  parser.prepare<PropsSingleFloat>();
  raw.parse(parser);

  float value = (float)*raw.at("floatValue", nullptr, nullptr);

  ASSERT_NEAR(value, 42.42, 0.00001);
}

TEST(ShadowNodeTest, handleRawPropsSingleDouble) {
  const auto &raw =
      RawProps(folly::dynamic::object("doubleValue", (double)42.42));
  auto parser = RawPropsParser();
  parser.prepare<PropsSingleDouble>();
  raw.parse(parser);

  double value = (double)*raw.at("doubleValue", nullptr, nullptr);

  ASSERT_NEAR(value, 42.42, 0.00001);
}

TEST(ShadowNodeTest, handleRawPropsSingleInt) {
  const auto &raw = RawProps(folly::dynamic::object("intValue", (int)42.42));
  auto parser = RawPropsParser();
  parser.prepare<PropsSingleInt>();
  raw.parse(parser);

  int value = (int)*raw.at("intValue", nullptr, nullptr);

  ASSERT_EQ(value, 42);
}

TEST(ShadowNodeTest, handleRawPropsSingleIntGetManyTimes) {
  const auto &raw = RawProps(folly::dynamic::object("intValue", (int)42.42));
  auto parser = RawPropsParser();
  parser.prepare<PropsSingleInt>();
  raw.parse(parser);

  ASSERT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
  ASSERT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
  ASSERT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
}

TEST(ShadowNodeTest, handleRawPropsPrimitiveTypes) {
  const auto &raw = RawProps(folly::dynamic::object("intValue", (int)42)(
      "doubleValue", (double)17.42)("floatValue", (float)66.67)(
      "stringValue", "helloworld")("boolValue", true));

  auto parser = RawPropsParser();
  parser.prepare<PropsPrimitiveTypes>();
  raw.parse(parser);

  ASSERT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
  ASSERT_NEAR((double)*raw.at("doubleValue", nullptr, nullptr), 17.42, 0.0001);
  ASSERT_NEAR((float)*raw.at("floatValue", nullptr, nullptr), 66.67, 0.00001);
  ASSERT_STREQ(
      ((std::string)*raw.at("stringValue", nullptr, nullptr)).c_str(),
      "helloworld");
  ASSERT_EQ((bool)*raw.at("boolValue", nullptr, nullptr), true);
}

TEST(ShadowNodeTest, handleRawPropsPrimitiveTypesGetTwice) {
  const auto &raw = RawProps(folly::dynamic::object("intValue", (int)42)(
      "doubleValue", (double)17.42)("floatValue", (float)66.67)(
      "stringValue", "helloworld")("boolValue", true));

  auto parser = RawPropsParser();
  parser.prepare<PropsPrimitiveTypes>();
  raw.parse(parser);

  ASSERT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
  ASSERT_NEAR((double)*raw.at("doubleValue", nullptr, nullptr), 17.42, 0.0001);
  ASSERT_NEAR((float)*raw.at("floatValue", nullptr, nullptr), 66.67, 0.00001);
  ASSERT_STREQ(
      ((std::string)*raw.at("stringValue", nullptr, nullptr)).c_str(),
      "helloworld");
  ASSERT_EQ((bool)*raw.at("boolValue", nullptr, nullptr), true);

  ASSERT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
  ASSERT_NEAR((double)*raw.at("doubleValue", nullptr, nullptr), 17.42, 0.0001);
  ASSERT_NEAR((float)*raw.at("floatValue", nullptr, nullptr), 66.67, 0.00001);
  ASSERT_STREQ(
      ((std::string)*raw.at("stringValue", nullptr, nullptr)).c_str(),
      "helloworld");
  ASSERT_EQ((bool)*raw.at("boolValue", nullptr, nullptr), true);
}

TEST(ShadowNodeTest, handleRawPropsPrimitiveTypesGetOutOfOrder) {
  const auto &raw = RawProps(folly::dynamic::object("intValue", (int)42)(
      "doubleValue", (double)17.42)("floatValue", (float)66.67)(
      "stringValue", "helloworld")("boolValue", true));

  auto parser = RawPropsParser();
  parser.prepare<PropsPrimitiveTypes>();
  raw.parse(parser);

  ASSERT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
  ASSERT_NEAR((double)*raw.at("doubleValue", nullptr, nullptr), 17.42, 0.0001);
  ASSERT_NEAR((float)*raw.at("floatValue", nullptr, nullptr), 66.67, 0.00001);
  ASSERT_STREQ(
      ((std::string)*raw.at("stringValue", nullptr, nullptr)).c_str(),
      "helloworld");
  ASSERT_EQ((bool)*raw.at("boolValue", nullptr, nullptr), true);

  ASSERT_NEAR((double)*raw.at("doubleValue", nullptr, nullptr), 17.42, 0.0001);
  ASSERT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
  ASSERT_NEAR((float)*raw.at("floatValue", nullptr, nullptr), 66.67, 0.00001);
  ASSERT_STREQ(
      ((std::string)*raw.at("stringValue", nullptr, nullptr)).c_str(),
      "helloworld");
  ASSERT_EQ((bool)*raw.at("boolValue", nullptr, nullptr), true);
}

TEST(ShadowNodeTest, handleRawPropsPrimitiveTypesIncomplete) {
  const auto &raw = RawProps(folly::dynamic::object("intValue", (int)42));

  auto parser = RawPropsParser();
  parser.prepare<PropsPrimitiveTypes>();
  raw.parse(parser);

  ASSERT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
  ASSERT_EQ(raw.at("doubleValue", nullptr, nullptr), nullptr);
  ASSERT_EQ(raw.at("floatValue", nullptr, nullptr), nullptr);
  ASSERT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
  ASSERT_EQ(raw.at("stringValue", nullptr, nullptr), nullptr);
  ASSERT_EQ(raw.at("boolValue", nullptr, nullptr), nullptr);
  ASSERT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
}

#ifndef NDEBUG
TEST(ShadowNodeTest, handleRawPropsPrimitiveTypesIncorrectLookup) {
  const auto &raw = RawProps(folly::dynamic::object("intValue", (int)42));

  auto parser = RawPropsParser();
  parser.prepare<PropsPrimitiveTypes>();
  raw.parse(parser);

  // Before D18662135, looking up an invalid key would trigger
  // an infinite loop. This is out of contract, so we should only
  // test this in debug.
  ASSERT_EQ(raw.at("flurb", nullptr, nullptr), nullptr);
  ASSERT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
}
#endif

TEST(ShadowNodeTest, handlePropsMultiLookup) {
  const auto &raw = RawProps(folly::dynamic::object("floatValue", (float)10.0));
  auto parser = RawPropsParser();
  parser.prepare<PropsMultiLookup>();
  raw.parse(parser);

  auto props = std::make_shared<PropsMultiLookup>(PropsMultiLookup(), raw);

  // Props are not sealed after applying raw props.
  ASSERT_FALSE(props->getSealed());

  ASSERT_NEAR(props->floatValue, 10.0, 0.00001);
  ASSERT_NEAR(props->derivedFloatValue, 20.0, 0.00001);
}
