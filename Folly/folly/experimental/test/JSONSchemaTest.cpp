/*
 * Copyright 2015-present Facebook, Inc.
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
// Copyright 2004-present Facebook. All Rights Reserved.

#include <folly/experimental/JSONSchema.h>
#include <folly/json.h>
#include <folly/portability/GTest.h>

using folly::dynamic;
using folly::parseJson;
using namespace folly::jsonschema;
using namespace std;

bool check(const dynamic& schema, const dynamic& value, bool check = true) {
  if (check) {
    auto schemavalidator = makeSchemaValidator();
    auto ew = schemavalidator->try_validate(schema);
    if (ew) {
      return false;
    }
  }

  auto validator = makeValidator(schema);
  auto ew = validator->try_validate(value);
  if (validator->try_validate(value)) {
    return false;
  }
  return true;
}

TEST(JSONSchemaTest, TestMultipleOfInt) {
  dynamic schema = dynamic::object("multipleOf", 2);
  ASSERT_TRUE(check(schema, "invalid"));
  ASSERT_TRUE(check(schema, 30));
  ASSERT_TRUE(check(schema, 24.0));
  ASSERT_FALSE(check(schema, 5));
  ASSERT_FALSE(check(schema, 2.01));
}

TEST(JSONSchemaTest, TestMultipleOfDouble) {
  dynamic schema = dynamic::object("multipleOf", 1.5);
  ASSERT_TRUE(check(schema, "invalid"));
  ASSERT_TRUE(check(schema, 30));
  ASSERT_TRUE(check(schema, 24.0));
  ASSERT_FALSE(check(schema, 5));
  ASSERT_FALSE(check(schema, 2.01));

  schema = dynamic::object("multipleOf", 0.0001);
  ASSERT_TRUE(check(schema, 0.0075));
}

TEST(JSONSchemaTest, TestMinimumIntInclusive) {
  dynamic schema = dynamic::object("minimum", 2);
  ASSERT_TRUE(check(schema, "invalid"));
  ASSERT_TRUE(check(schema, 30));
  ASSERT_TRUE(check(schema, 24.0));
  ASSERT_TRUE(check(schema, 2));
  ASSERT_FALSE(check(schema, 1));
  ASSERT_FALSE(check(schema, 1.9999));
}

TEST(JSONSchemaTest, TestMinimumIntExclusive) {
  dynamic schema = dynamic::object("minimum", 2)("exclusiveMinimum", true);
  ASSERT_FALSE(check(schema, 2));
}

TEST(JSONSchemaTest, TestMaximumIntInclusive) {
  dynamic schema = dynamic::object("maximum", 12);
  ASSERT_TRUE(check(schema, "invalid"));
  ASSERT_TRUE(check(schema, 3));
  ASSERT_TRUE(check(schema, 3.1));
  ASSERT_TRUE(check(schema, 12));
  ASSERT_FALSE(check(schema, 13));
  ASSERT_FALSE(check(schema, 12.0001));
}

TEST(JSONSchemaTest, TestMaximumIntExclusive) {
  dynamic schema = dynamic::object("maximum", 2)("exclusiveMaximum", true);
  ASSERT_FALSE(check(schema, 2));
}

TEST(JSONSchemaTest, TestMinimumDoubleInclusive) {
  dynamic schema = dynamic::object("minimum", 1.75);
  ASSERT_TRUE(check(schema, "invalid"));
  ASSERT_TRUE(check(schema, 30));
  ASSERT_TRUE(check(schema, 24.0));
  ASSERT_TRUE(check(schema, 1.75));
  ASSERT_FALSE(check(schema, 1));
  ASSERT_FALSE(check(schema, 1.74));
}

TEST(JSONSchemaTest, TestMinimumDoubleExclusive) {
  dynamic schema = dynamic::object("minimum", 1.75)("exclusiveMinimum", true);
  ASSERT_FALSE(check(schema, 1.75));
}

TEST(JSONSchemaTest, TestMaximumDoubleInclusive) {
  dynamic schema = dynamic::object("maximum", 12.75);
  ASSERT_TRUE(check(schema, "invalid"));
  ASSERT_TRUE(check(schema, 3));
  ASSERT_TRUE(check(schema, 3.1));
  ASSERT_TRUE(check(schema, 12.75));
  ASSERT_FALSE(check(schema, 13));
  ASSERT_FALSE(check(schema, 12.76));
}

TEST(JSONSchemaTest, TestMaximumDoubleExclusive) {
  dynamic schema = dynamic::object("maximum", 12.75)("exclusiveMaximum", true);
  ASSERT_FALSE(check(schema, 12.75));
}

TEST(JSONSchemaTest, TestInvalidSchema) {
  dynamic schema = dynamic::object("multipleOf", "invalid");
  // don't check the schema since it's meant to be invalid
  ASSERT_TRUE(check(schema, 30, false));

  schema = dynamic::object("minimum", "invalid")("maximum", "invalid");
  ASSERT_TRUE(check(schema, 2, false));

  schema = dynamic::object("minLength", "invalid")("maxLength", "invalid");
  ASSERT_TRUE(check(schema, 2, false));
  ASSERT_TRUE(check(schema, "foo", false));
}

TEST(JSONSchemaTest, TestMinimumStringLength) {
  dynamic schema = dynamic::object("minLength", 3);
  ASSERT_TRUE(check(schema, "abcde"));
  ASSERT_TRUE(check(schema, "abc"));
  ASSERT_FALSE(check(schema, "a"));
}

TEST(JSONSchemaTest, TestMaximumStringLength) {
  dynamic schema = dynamic::object("maxLength", 3);
  ASSERT_FALSE(check(schema, "abcde"));
  ASSERT_TRUE(check(schema, "abc"));
  ASSERT_TRUE(check(schema, "a"));
}

TEST(JSONSchemaTest, TestStringPattern) {
  dynamic schema = dynamic::object("pattern", "[1-9]+");
  ASSERT_TRUE(check(schema, "123"));
  ASSERT_FALSE(check(schema, "abc"));
}

TEST(JSONSchemaTest, TestMinimumArrayItems) {
  dynamic schema = dynamic::object("minItems", 3);
  ASSERT_TRUE(check(schema, dynamic::array(1, 2, 3, 4, 5)));
  ASSERT_TRUE(check(schema, dynamic::array(1, 2, 3)));
  ASSERT_FALSE(check(schema, dynamic::array(1)));
}

TEST(JSONSchemaTest, TestMaximumArrayItems) {
  dynamic schema = dynamic::object("maxItems", 3);
  ASSERT_FALSE(check(schema, dynamic::array(1, 2, 3, 4, 5)));
  ASSERT_TRUE(check(schema, dynamic::array(1, 2, 3)));
  ASSERT_TRUE(check(schema, dynamic::array(1)));
  ASSERT_TRUE(check(schema, "foobar"));
}

TEST(JSONSchemaTest, TestArrayUniqueItems) {
  dynamic schema = dynamic::object("uniqueItems", true);
  ASSERT_TRUE(check(schema, dynamic::array(1, 2, 3)));
  ASSERT_FALSE(check(schema, dynamic::array(1, 2, 3, 1)));
  ASSERT_FALSE(check(schema, dynamic::array("cat", "dog", 1, 2, "cat")));
  ASSERT_TRUE(check(
      schema,
      dynamic::array(
          dynamic::object("foo", "bar"), dynamic::object("foo", "baz"))));

  schema = dynamic::object("uniqueItems", false);
  ASSERT_TRUE(check(schema, dynamic::array(1, 2, 3, 1)));
}

TEST(JSONSchemaTest, TestArrayItems) {
  dynamic schema = dynamic::object("items", dynamic::object("minimum", 2));
  ASSERT_TRUE(check(schema, dynamic::array(2, 3, 4)));
  ASSERT_FALSE(check(schema, dynamic::array(3, 4, 1)));
}

TEST(JSONSchemaTest, TestArrayAdditionalItems) {
  dynamic schema = dynamic::object(
      "items",
      dynamic::array(
          dynamic::object("minimum", 2), dynamic::object("minimum", 1)))(
      "additionalItems", dynamic::object("minimum", 3));
  ASSERT_TRUE(check(schema, dynamic::array(2, 1, 3, 3, 3, 3, 4)));
  ASSERT_FALSE(check(schema, dynamic::array(2, 1, 3, 3, 3, 3, 1)));
}

TEST(JSONSchemaTest, TestArrayNoAdditionalItems) {
  dynamic schema =
      dynamic::object("items", dynamic::array(dynamic::object("minimum", 2)))(
          "additionalItems", false);
  ASSERT_FALSE(check(schema, dynamic::array(3, 3, 3)));
}

TEST(JSONSchemaTest, TestArrayItemsNotPresent) {
  dynamic schema = dynamic::object("additionalItems", false);
  ASSERT_TRUE(check(schema, dynamic::array(3, 3, 3)));
}

TEST(JSONSchemaTest, TestRef) {
  dynamic schema = dynamic::object(
      "definitions",
      dynamic::object(
          "positiveInteger", dynamic::object("minimum", 1)("type", "integer")))(
      "items", dynamic::object("$ref", "#/definitions/positiveInteger"));
  ASSERT_TRUE(check(schema, dynamic::array(1, 2, 3, 4)));
  ASSERT_FALSE(check(schema, dynamic::array(4, -5)));
}

TEST(JSONSchemaTest, TestRecursiveRef) {
  dynamic schema = dynamic::object(
      "properties", dynamic::object("more", dynamic::object("$ref", "#")));
  dynamic d = dynamic::object;
  ASSERT_TRUE(check(schema, d));
  d["more"] = dynamic::object;
  ASSERT_TRUE(check(schema, d));
  d["more"]["more"] = dynamic::object;
  ASSERT_TRUE(check(schema, d));
  d["more"]["more"]["more"] = dynamic::object;
  ASSERT_TRUE(check(schema, d));
}

TEST(JSONSchemaTest, TestDoubleRecursiveRef) {
  dynamic schema = dynamic::object(
      "properties",
      dynamic::object("more", dynamic::object("$ref", "#"))(
          "less", dynamic::object("$ref", "#")));
  dynamic d = dynamic::object;
  ASSERT_TRUE(check(schema, d));
  d["more"] = dynamic::object;
  d["less"] = dynamic::object;
  ASSERT_TRUE(check(schema, d));
  d["more"]["less"] = dynamic::object;
  d["less"]["mode"] = dynamic::object;
  ASSERT_TRUE(check(schema, d));
}

TEST(JSONSchemaTest, TestInfinitelyRecursiveRef) {
  dynamic schema = dynamic::object("not", dynamic::object("$ref", "#"));
  auto validator = makeValidator(schema);
  ASSERT_THROW(validator->validate(dynamic::array(1, 2)), std::runtime_error);
}

TEST(JSONSchemaTest, TestRequired) {
  dynamic schema = dynamic::object("required", dynamic::array("foo", "bar"));
  ASSERT_FALSE(check(schema, dynamic::object("foo", 123)));
  ASSERT_FALSE(check(schema, dynamic::object("bar", 123)));
  ASSERT_TRUE(check(schema, dynamic::object("bar", 123)("foo", 456)));
}

TEST(JSONSchemaTest, TestMinMaxProperties) {
  dynamic schema = dynamic::object("minProperties", 1)("maxProperties", 3);
  dynamic d = dynamic::object;
  ASSERT_FALSE(check(schema, d));
  d["a"] = 1;
  ASSERT_TRUE(check(schema, d));
  d["b"] = 2;
  ASSERT_TRUE(check(schema, d));
  d["c"] = 3;
  ASSERT_TRUE(check(schema, d));
  d["d"] = 4;
  ASSERT_FALSE(check(schema, d));
}

TEST(JSONSchemaTest, TestProperties) {
  dynamic schema = dynamic::object(
      "properties", dynamic::object("p1", dynamic::object("minimum", 1)))(
      "patternProperties", dynamic::object("[0-9]+", dynamic::object))(
      "additionalProperties", dynamic::object("maximum", 5));
  ASSERT_TRUE(check(schema, dynamic::object("p1", 1)));
  ASSERT_FALSE(check(schema, dynamic::object("p1", 0)));
  ASSERT_TRUE(check(schema, dynamic::object("123", "anything")));
  ASSERT_TRUE(check(schema, dynamic::object("123", 500)));
  ASSERT_TRUE(check(schema, dynamic::object("other_property", 4)));
  ASSERT_FALSE(check(schema, dynamic::object("other_property", 6)));
}
TEST(JSONSchemaTest, TestPropertyAndPattern) {
  dynamic schema = dynamic::object(
      "properties", dynamic::object("p1", dynamic::object("minimum", 1)))(
      "patternProperties",
      dynamic::object("p.", dynamic::object("maximum", 5)));
  ASSERT_TRUE(check(schema, dynamic::object("p1", 3)));
  ASSERT_FALSE(check(schema, dynamic::object("p1", 0)));
  ASSERT_FALSE(check(schema, dynamic::object("p1", 6)));
}

TEST(JSONSchemaTest, TestPropertyDependency) {
  dynamic schema = dynamic::object(
      "dependencies", dynamic::object("p1", dynamic::array("p2")));
  ASSERT_TRUE(check(schema, dynamic::object));
  ASSERT_TRUE(check(schema, dynamic::object("p1", 1)("p2", 1)));
  ASSERT_FALSE(check(schema, dynamic::object("p1", 1)));
}

TEST(JSONSchemaTest, TestSchemaDependency) {
  dynamic schema = dynamic::object(
      "dependencies",
      dynamic::object("p1", dynamic::object("required", dynamic::array("p2"))));
  ASSERT_TRUE(check(schema, dynamic::object));
  ASSERT_TRUE(check(schema, dynamic::object("p1", 1)("p2", 1)));
  ASSERT_FALSE(check(schema, dynamic::object("p1", 1)));
}

TEST(JSONSchemaTest, TestEnum) {
  dynamic schema = dynamic::object("enum", dynamic::array("a", 1));
  ASSERT_TRUE(check(schema, "a"));
  ASSERT_TRUE(check(schema, 1));
  ASSERT_FALSE(check(schema, "b"));
}

TEST(JSONSchemaTest, TestType) {
  dynamic schema = dynamic::object("type", "object");
  ASSERT_TRUE(check(schema, dynamic::object));
  ASSERT_FALSE(check(schema, dynamic(5)));
}

TEST(JSONSchemaTest, TestTypeArray) {
  dynamic schema = dynamic::object("type", dynamic::array("array", "number"));
  ASSERT_TRUE(check(schema, dynamic(5)));
  ASSERT_TRUE(check(schema, dynamic(1.1)));
  ASSERT_FALSE(check(schema, dynamic::object));
}

TEST(JSONSchemaTest, TestAllOf) {
  dynamic schema = dynamic::object(
      "allOf",
      dynamic::array(
          dynamic::object("minimum", 1), dynamic::object("type", "integer")));
  ASSERT_TRUE(check(schema, 2));
  ASSERT_FALSE(check(schema, 0));
  ASSERT_FALSE(check(schema, 1.1));
}

TEST(JSONSchemaTest, TestAnyOf) {
  dynamic schema = dynamic::object(
      "anyOf",
      dynamic::array(
          dynamic::object("minimum", 1), dynamic::object("type", "integer")));
  ASSERT_TRUE(check(schema, 2)); // matches both
  ASSERT_FALSE(check(schema, 0.1)); // matches neither
  ASSERT_TRUE(check(schema, 1.1)); // matches first one
  ASSERT_TRUE(check(schema, 0)); // matches second one
}

TEST(JSONSchemaTest, TestOneOf) {
  dynamic schema = dynamic::object(
      "oneOf",
      dynamic::array(
          dynamic::object("minimum", 1), dynamic::object("type", "integer")));
  ASSERT_FALSE(check(schema, 2)); // matches both
  ASSERT_FALSE(check(schema, 0.1)); // matches neither
  ASSERT_TRUE(check(schema, 1.1)); // matches first one
  ASSERT_TRUE(check(schema, 0)); // matches second one
}

TEST(JSONSchemaTest, TestNot) {
  dynamic schema =
      dynamic::object("not", dynamic::object("minimum", 5)("maximum", 10));
  ASSERT_TRUE(check(schema, 4));
  ASSERT_FALSE(check(schema, 7));
  ASSERT_TRUE(check(schema, 11));
}

// The tests below use some sample schema from json-schema.org

TEST(JSONSchemaTest, TestMetaSchema) {
  const char* example1 =
      "\
    { \
      \"title\": \"Example Schema\", \
      \"type\": \"object\", \
      \"properties\": { \
        \"firstName\": { \
          \"type\": \"string\" \
        }, \
        \"lastName\": { \
          \"type\": \"string\" \
        }, \
        \"age\": { \
          \"description\": \"Age in years\", \
          \"type\": \"integer\", \
          \"minimum\": 0 \
        } \
      }, \
      \"required\": [\"firstName\", \"lastName\"] \
    }";

  auto val = makeSchemaValidator();
  val->validate(parseJson(example1)); // doesn't throw

  ASSERT_THROW(val->validate("123"), std::runtime_error);
}

TEST(JSONSchemaTest, TestProductSchema) {
  const char* productSchema =
      "\
  { \
    \"$schema\": \"http://json-schema.org/draft-04/schema#\", \
      \"title\": \"Product\", \
      \"description\": \"A product from Acme's catalog\", \
      \"type\": \"object\", \
      \"properties\": { \
        \"id\": { \
          \"description\": \"The unique identifier for a product\", \
          \"type\": \"integer\" \
        }, \
        \"name\": { \
          \"description\": \"Name of the product\", \
          \"type\": \"string\" \
        }, \
        \"price\": { \
          \"type\": \"number\", \
          \"minimum\": 0, \
          \"exclusiveMinimum\": true \
        }, \
        \"tags\": { \
          \"type\": \"array\", \
          \"items\": { \
            \"type\": \"string\" \
          }, \
          \"minItems\": 1, \
          \"uniqueItems\": true \
        } \
      }, \
      \"required\": [\"id\", \"name\", \"price\"] \
  }";
  const char* product =
      "\
  { \
    \"id\": 1, \
    \"name\": \"A green door\", \
    \"price\": 12.50, \
    \"tags\": [\"home\", \"green\"] \
  }";
  ASSERT_TRUE(check(parseJson(productSchema), parseJson(product)));
}
