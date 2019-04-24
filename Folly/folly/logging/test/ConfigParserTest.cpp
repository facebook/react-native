/*
 * Copyright 2017-present Facebook, Inc.
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
#include <folly/String.h>
#include <folly/dynamic.h>
#include <folly/json.h>
#include <folly/logging/LogCategory.h>
#include <folly/logging/LogConfig.h>
#include <folly/logging/LogConfigParser.h>
#include <folly/logging/test/ConfigHelpers.h>
#include <folly/portability/GMock.h>
#include <folly/portability/GTest.h>
#include <folly/test/TestUtils.h>

using namespace folly;

using ::testing::Pair;
using ::testing::UnorderedElementsAre;

TEST(LogConfig, parseBasic) {
  auto config = parseLogConfig("");
  EXPECT_THAT(config.getCategoryConfigs(), UnorderedElementsAre());
  EXPECT_THAT(config.getHandlerConfigs(), UnorderedElementsAre());

  config = parseLogConfig("   ");
  EXPECT_THAT(config.getCategoryConfigs(), UnorderedElementsAre());
  EXPECT_THAT(config.getHandlerConfigs(), UnorderedElementsAre());

  config = parseLogConfig(".=ERROR,folly=DBG2");
  EXPECT_THAT(
      config.getCategoryConfigs(),
      UnorderedElementsAre(
          Pair("", LogCategoryConfig{LogLevel::ERR, true}),
          Pair("folly", LogCategoryConfig{LogLevel::DBG2, true})));
  EXPECT_THAT(config.getHandlerConfigs(), UnorderedElementsAre());

  config = parseLogConfig(" INFO , folly  := FATAL   ");
  EXPECT_THAT(
      config.getCategoryConfigs(),
      UnorderedElementsAre(
          Pair("", LogCategoryConfig{LogLevel::INFO, true}),
          Pair("folly", LogCategoryConfig{LogLevel::FATAL, false})));
  EXPECT_THAT(config.getHandlerConfigs(), UnorderedElementsAre());

  config =
      parseLogConfig("my.category:=INFO , my.other.stuff  := 19,foo.bar=DBG7");
  EXPECT_THAT(
      config.getCategoryConfigs(),
      UnorderedElementsAre(
          Pair("my.category", LogCategoryConfig{LogLevel::INFO, false}),
          Pair(
              "my.other.stuff",
              LogCategoryConfig{static_cast<LogLevel>(19), false}),
          Pair("foo.bar", LogCategoryConfig{LogLevel::DBG7, true})));
  EXPECT_THAT(config.getHandlerConfigs(), UnorderedElementsAre());

  config = parseLogConfig(" ERR ");
  EXPECT_THAT(
      config.getCategoryConfigs(),
      UnorderedElementsAre(Pair("", LogCategoryConfig{LogLevel::ERR, true})));
  EXPECT_THAT(config.getHandlerConfigs(), UnorderedElementsAre());

  config = parseLogConfig(" ERR: ");
  EXPECT_THAT(
      config.getCategoryConfigs(),
      UnorderedElementsAre(
          Pair("", LogCategoryConfig{LogLevel::ERR, true, {}})));
  EXPECT_THAT(config.getHandlerConfigs(), UnorderedElementsAre());

  config = parseLogConfig(" ERR:stderr; stderr=stream:stream=stderr ");
  EXPECT_THAT(
      config.getCategoryConfigs(),
      UnorderedElementsAre(
          Pair("", LogCategoryConfig{LogLevel::ERR, true, {"stderr"}})));
  EXPECT_THAT(
      config.getHandlerConfigs(),
      UnorderedElementsAre(
          Pair("stderr", LogHandlerConfig{"stream", {{"stream", "stderr"}}})));

  config = parseLogConfig(
      "ERR:myfile:custom, folly=DBG2, folly.io:=WARN:other;"
      "myfile=file:path=/tmp/x.log; "
      "custom=custom:foo=bar,hello=world,a = b = c; "
      "other=custom2");
  EXPECT_THAT(
      config.getCategoryConfigs(),
      UnorderedElementsAre(
          Pair(
              "", LogCategoryConfig{LogLevel::ERR, true, {"myfile", "custom"}}),
          Pair("folly", LogCategoryConfig{LogLevel::DBG2, true}),
          Pair(
              "folly.io",
              LogCategoryConfig{LogLevel::WARN, false, {"other"}})));
  EXPECT_THAT(
      config.getHandlerConfigs(),
      UnorderedElementsAre(
          Pair("myfile", LogHandlerConfig{"file", {{"path", "/tmp/x.log"}}}),
          Pair(
              "custom",
              LogHandlerConfig{
                  "custom",
                  {{"foo", "bar"}, {"hello", "world"}, {"a", "b = c"}}}),
          Pair("other", LogHandlerConfig{"custom2"})));

  // Test updating existing handler configs, with no handler type
  config = parseLogConfig("ERR;foo");
  EXPECT_THAT(
      config.getCategoryConfigs(),
      UnorderedElementsAre(Pair("", LogCategoryConfig{LogLevel::ERR, true})));
  EXPECT_THAT(
      config.getHandlerConfigs(),
      UnorderedElementsAre(Pair("foo", LogHandlerConfig{})));

  config = parseLogConfig("ERR;foo:a=b,c=d");
  EXPECT_THAT(
      config.getCategoryConfigs(),
      UnorderedElementsAre(Pair("", LogCategoryConfig{LogLevel::ERR, true})));
  EXPECT_THAT(
      config.getHandlerConfigs(),
      UnorderedElementsAre(Pair(
          "foo", LogHandlerConfig{folly::none, {{"a", "b"}, {"c", "d"}}})));

  config = parseLogConfig("ERR;test=file:path=/tmp/test.log;foo:a=b,c=d");
  EXPECT_THAT(
      config.getCategoryConfigs(),
      UnorderedElementsAre(Pair("", LogCategoryConfig{LogLevel::ERR, true})));
  EXPECT_THAT(
      config.getHandlerConfigs(),
      UnorderedElementsAre(
          Pair("foo", LogHandlerConfig{folly::none, {{"a", "b"}, {"c", "d"}}}),
          Pair("test", LogHandlerConfig{"file", {{"path", "/tmp/test.log"}}})));

  // Log handler changes with no category changes
  config = parseLogConfig("; myhandler=custom:foo=bar");
  EXPECT_THAT(config.getCategoryConfigs(), UnorderedElementsAre());
  EXPECT_THAT(
      config.getHandlerConfigs(),
      UnorderedElementsAre(
          Pair("myhandler", LogHandlerConfig{"custom", {{"foo", "bar"}}})));
}

TEST(LogConfig, parseBasicErrors) {
  // Errors in the log category settings
  EXPECT_THROW_RE(
      parseLogConfig("=="),
      LogConfigParseError,
      R"(invalid log level "=" for category "")");
  EXPECT_THROW_RE(
      parseLogConfig("bogus_level"),
      LogConfigParseError,
      R"(invalid log level "bogus_level" for category ".")");
  EXPECT_THROW_RE(
      parseLogConfig("foo=bogus_level"),
      LogConfigParseError,
      R"(invalid log level "bogus_level" for category "foo")");
  EXPECT_THROW_RE(
      parseLogConfig("foo=WARN,bar=invalid"),
      LogConfigParseError,
      R"(invalid log level "invalid" for category "bar")");
  EXPECT_THROW_RE(
      parseLogConfig("foo=WARN,bar="),
      LogConfigParseError,
      R"(invalid log level "" for category "bar")");
  EXPECT_THROW_RE(
      parseLogConfig("foo=WARN,bar:="),
      LogConfigParseError,
      R"(invalid log level "" for category "bar")");
  EXPECT_THROW_RE(
      parseLogConfig("foo:=,bar:=WARN"),
      LogConfigParseError,
      R"(invalid log level "" for category "foo")");
  EXPECT_THROW_RE(
      parseLogConfig("x"),
      LogConfigParseError,
      R"(invalid log level "x" for category ".")");
  EXPECT_THROW_RE(
      parseLogConfig("x,y,z"),
      LogConfigParseError,
      R"(invalid log level "x" for category ".")");
  EXPECT_THROW_RE(
      parseLogConfig("foo=WARN,"),
      LogConfigParseError,
      R"(invalid log level "" for category ".")");
  EXPECT_THROW_RE(
      parseLogConfig("="),
      LogConfigParseError,
      R"(invalid log level "" for category "")");
  EXPECT_THROW_RE(
      parseLogConfig(":="),
      LogConfigParseError,
      R"(invalid log level "" for category "")");
  EXPECT_THROW_RE(
      parseLogConfig("foo=bar=ERR"),
      LogConfigParseError,
      R"(invalid log level "bar=ERR" for category "foo")");
  EXPECT_THROW_RE(
      parseLogConfig("foo.bar=ERR,foo..bar=INFO"),
      LogConfigParseError,
      R"(category "foo\.bar" listed multiple times under different names: )"
      R"("foo\.+bar" and "foo\.+bar")");
  EXPECT_THROW_RE(
      parseLogConfig("=ERR,.=INFO"),
      LogConfigParseError,
      R"(category "" listed multiple times under different names: )"
      R"("\.?" and "\.?")");

  // Errors in the log handler settings
  EXPECT_THROW_RE(
      parseLogConfig("ERR;"),
      LogConfigParseError,
      "error parsing log handler configuration: empty log handler name");
  EXPECT_THROW_RE(
      parseLogConfig("ERR;foo="),
      LogConfigParseError,
      R"(error parsing configuration for log handler "foo": )"
      "empty log handler type");
  EXPECT_THROW_RE(
      parseLogConfig("ERR;=file"),
      LogConfigParseError,
      "error parsing log handler configuration: empty log handler name");
  EXPECT_THROW_RE(
      parseLogConfig("ERR;handler1=file;"),
      LogConfigParseError,
      "error parsing log handler configuration: empty log handler name");
  EXPECT_THROW_RE(
      parseLogConfig("ERR;test=file,path=/tmp/test.log;foo:a=b,c=d"),
      LogConfigParseError,
      R"(error parsing configuration for log handler "test": )"
      R"(invalid type "file,path=/tmp/test.log": type name cannot contain )"
      "a comma when using the basic config format");
  EXPECT_THROW_RE(
      parseLogConfig("ERR;test,path=/tmp/test.log;foo:a=b,c=d"),
      LogConfigParseError,
      R"(error parsing configuration for log handler "test,path": )"
      "name cannot contain a comma when using the basic config format");
}

TEST(LogConfig, parseJson) {
  auto config = parseLogConfig("{}");
  EXPECT_THAT(config.getCategoryConfigs(), UnorderedElementsAre());
  config = parseLogConfig("  {}   ");
  EXPECT_THAT(config.getCategoryConfigs(), UnorderedElementsAre());

  config = parseLogConfig(R"JSON({
    "categories": {
      ".": "ERROR",
      "folly": "DBG2",
    }
  })JSON");
  EXPECT_THAT(
      config.getCategoryConfigs(),
      UnorderedElementsAre(
          Pair("", LogCategoryConfig{LogLevel::ERR, true}),
          Pair("folly", LogCategoryConfig{LogLevel::DBG2, true})));
  EXPECT_THAT(config.getHandlerConfigs(), UnorderedElementsAre());

  config = parseLogConfig(R"JSON({
    "categories": {
      "": "ERROR",
      "folly": "DBG2",
    }
  })JSON");
  EXPECT_THAT(
      config.getCategoryConfigs(),
      UnorderedElementsAre(
          Pair("", LogCategoryConfig{LogLevel::ERR, true}),
          Pair("folly", LogCategoryConfig{LogLevel::DBG2, true})));
  EXPECT_THAT(config.getHandlerConfigs(), UnorderedElementsAre());

  config = parseLogConfig(R"JSON({
    "categories": {
      ".": { "level": "INFO" },
      "folly": { "level": "FATAL", "inherit": false },
    }
  })JSON");
  EXPECT_THAT(
      config.getCategoryConfigs(),
      UnorderedElementsAre(
          Pair("", LogCategoryConfig{LogLevel::INFO, true}),
          Pair("folly", LogCategoryConfig{LogLevel::FATAL, false})));
  EXPECT_THAT(config.getHandlerConfigs(), UnorderedElementsAre());

  config = parseLogConfig(R"JSON({
    "categories": {
      "my.category": { "level": "INFO", "inherit": true },
      // comments are allowed
      "my.other.stuff": { "level": 19, "inherit": false },
      "foo.bar": { "level": "DBG7" },
    },
    "handlers": {
      "h1": { "type": "custom", "options": {"foo": "bar", "a": "z"} }
    }
  })JSON");
  EXPECT_THAT(
      config.getCategoryConfigs(),
      UnorderedElementsAre(
          Pair("my.category", LogCategoryConfig{LogLevel::INFO, true}),
          Pair(
              "my.other.stuff",
              LogCategoryConfig{static_cast<LogLevel>(19), false}),
          Pair("foo.bar", LogCategoryConfig{LogLevel::DBG7, true})));
  EXPECT_THAT(
      config.getHandlerConfigs(),
      UnorderedElementsAre(Pair(
          "h1", LogHandlerConfig{"custom", {{"foo", "bar"}, {"a", "z"}}})));

  // The JSON config parsing should allow unusual log category names
  // containing whitespace, equal signs, and other characters not allowed in
  // the basic config style.
  config = parseLogConfig(R"JSON({
    "categories": {
      "  my.category  ": { "level": "INFO" },
      " foo; bar=asdf, test": { "level": "DBG1" },
    },
    "handlers": {
      "h1;h2,h3= ": { "type": " x;y " }
    }
  })JSON");
  EXPECT_THAT(
      config.getCategoryConfigs(),
      UnorderedElementsAre(
          Pair("  my.category  ", LogCategoryConfig{LogLevel::INFO, true}),
          Pair(
              " foo; bar=asdf, test",
              LogCategoryConfig{LogLevel::DBG1, true})));
  EXPECT_THAT(
      config.getHandlerConfigs(),
      UnorderedElementsAre(Pair("h1;h2,h3= ", LogHandlerConfig{" x;y "})));
}

TEST(LogConfig, parseJsonErrors) {
  EXPECT_THROW_RE(
      parseLogConfigJson("5"),
      LogConfigParseError,
      "JSON config input must be an object");
  EXPECT_THROW_RE(
      parseLogConfigJson("true"),
      LogConfigParseError,
      "JSON config input must be an object");
  EXPECT_THROW_RE(
      parseLogConfigJson(R"("hello")"),
      LogConfigParseError,
      "JSON config input must be an object");
  EXPECT_THROW_RE(
      parseLogConfigJson("[1, 2, 3]"),
      LogConfigParseError,
      "JSON config input must be an object");
  EXPECT_THROW_RE(
      parseLogConfigJson(""), std::runtime_error, "json parse error");
  EXPECT_THROW_RE(
      parseLogConfigJson("{"), std::runtime_error, "json parse error");
  EXPECT_THROW_RE(parseLogConfig("{"), std::runtime_error, "json parse error");
  EXPECT_THROW_RE(
      parseLogConfig("{}}"), std::runtime_error, "json parse error");

  StringPiece input = R"JSON({
    "categories": 5
  })JSON";
  EXPECT_THROW_RE(
      parseLogConfig(input),
      LogConfigParseError,
      "unexpected data type for log categories config: "
      "got integer, expected an object");
  input = R"JSON({
    "categories": {
      "foo": true,
    }
  })JSON";
  EXPECT_THROW_RE(
      parseLogConfig(input),
      LogConfigParseError,
      R"(unexpected data type for configuration of category "foo": )"
      "got boolean, expected an object, string, or integer");

  input = R"JSON({
    "categories": {
      "foo": [1, 2, 3],
    }
  })JSON";
  EXPECT_THROW_RE(
      parseLogConfig(input),
      LogConfigParseError,
      R"(unexpected data type for configuration of category "foo": )"
      "got array, expected an object, string, or integer");

  input = R"JSON({
    "categories": {
      ".": { "level": "INFO" },
      "folly": { "level": "FATAL", "inherit": 19 },
    }
  })JSON";
  EXPECT_THROW_RE(
      parseLogConfig(input),
      LogConfigParseError,
      R"(unexpected data type for inherit field of category "folly": )"
      "got integer, expected a boolean");
  input = R"JSON({
    "categories": {
      "folly": { "level": [], },
    }
  })JSON";
  EXPECT_THROW_RE(
      parseLogConfig(input),
      LogConfigParseError,
      R"(unexpected data type for level field of category "folly": )"
      "got array, expected a string or integer");
  input = R"JSON({
    "categories": {
      5: {}
    }
  })JSON";
  EXPECT_THROW_RE(
      parseLogConfig(input), std::runtime_error, "json parse error");

  input = R"JSON({
    "categories": {
      "foo...bar": { "level": "INFO", },
      "foo..bar": { "level": "INFO", },
    }
  })JSON";
  EXPECT_THROW_RE(
      parseLogConfig(input),
      LogConfigParseError,
      R"(category "foo\.bar" listed multiple times under different names: )"
      R"("foo\.\.+bar" and "foo\.+bar")");
  input = R"JSON({
    "categories": {
      "...": { "level": "ERR", },
      "": { "level": "INFO", },
    }
  })JSON";
  EXPECT_THROW_RE(
      parseLogConfig(input),
      LogConfigParseError,
      R"(category "" listed multiple times under different names: )"
      R"X("(\.\.\.|)" and "(\.\.\.|)")X");

  input = R"JSON({
    "categories": { "folly": { "level": "ERR" } },
    "handlers": 9.8
  })JSON";
  EXPECT_THROW_RE(
      parseLogConfig(input),
      LogConfigParseError,
      "unexpected data type for log handlers config: "
      "got double, expected an object");

  input = R"JSON({
    "categories": { "folly": { "level": "ERR" } },
    "handlers": {
      "foo": "test"
    }
  })JSON";
  EXPECT_THROW_RE(
      parseLogConfig(input),
      LogConfigParseError,
      R"(unexpected data type for configuration of handler "foo": )"
      "got string, expected an object");

  input = R"JSON({
    "categories": { "folly": { "level": "ERR" } },
    "handlers": {
      "foo": {}
    }
  })JSON";
  EXPECT_THROW_RE(
      parseLogConfig(input),
      LogConfigParseError,
      R"(no handler type specified for log handler "foo")");

  input = R"JSON({
    "categories": { "folly": { "level": "ERR" } },
    "handlers": {
      "foo": {
        "type": 19
      }
    }
  })JSON";
  EXPECT_THROW_RE(
      parseLogConfig(input),
      LogConfigParseError,
      R"(unexpected data type for "type" field of handler "foo": )"
      "got integer, expected a string");

  input = R"JSON({
    "categories": { "folly": { "level": "ERR" } },
    "handlers": {
      "foo": {
        "type": "custom",
        "options": true
      }
    }
  })JSON";
  EXPECT_THROW_RE(
      parseLogConfig(input),
      LogConfigParseError,
      R"(unexpected data type for "options" field of handler "foo": )"
      "got boolean, expected an object");

  input = R"JSON({
    "categories": { "folly": { "level": "ERR" } },
    "handlers": {
      "foo": {
        "type": "custom",
        "options": ["foo", "bar"]
      }
    }
  })JSON";
  EXPECT_THROW_RE(
      parseLogConfig(input),
      LogConfigParseError,
      R"(unexpected data type for "options" field of handler "foo": )"
      "got array, expected an object");

  input = R"JSON({
    "categories": { "folly": { "level": "ERR" } },
    "handlers": {
      "foo": {
        "type": "custom",
        "options": {"bar": 5}
      }
    }
  })JSON";
  EXPECT_THROW_RE(
      parseLogConfig(input),
      LogConfigParseError,
      R"(unexpected data type for option "bar" of handler "foo": )"
      "got integer, expected a string");
}

TEST(LogConfig, toJson) {
  auto config = parseLogConfig("");
  auto expectedJson = folly::parseJson(R"JSON({
  "categories": {},
  "handlers": {}
})JSON");
  EXPECT_EQ(expectedJson, logConfigToDynamic(config));

  config = parseLogConfig(
      "ERROR:h1,foo.bar:=FATAL,folly=INFO:; "
      "h1=custom:foo=bar");
  expectedJson = folly::parseJson(R"JSON({
  "categories" : {
    "" : {
      "inherit" : true,
      "level" : "ERR",
      "handlers" : ["h1"]
    },
    "folly" : {
      "inherit" : true,
      "level" : "INFO",
      "handlers" : []
    },
    "foo.bar" : {
      "inherit" : false,
      "level" : "FATAL"
    }
  },
  "handlers" : {
    "h1": {
      "type": "custom",
      "options": { "foo": "bar" }
    }
  }
})JSON");
  EXPECT_EQ(expectedJson, logConfigToDynamic(config));
}

TEST(LogConfig, mergeConfigs) {
  auto config = parseLogConfig("bar=ERR:");
  config.update(parseLogConfig("foo:=INFO"));
  EXPECT_THAT(
      config.getCategoryConfigs(),
      UnorderedElementsAre(
          Pair("foo", LogCategoryConfig{LogLevel::INFO, false}),
          Pair("bar", LogCategoryConfig{LogLevel::ERR, true, {}})));
  EXPECT_THAT(config.getHandlerConfigs(), UnorderedElementsAre());

  config =
      parseLogConfig("WARN:default; default=custom:opt1=value1,opt2=value2");
  config.update(parseLogConfig("folly.io=DBG2,foo=INFO"));
  EXPECT_THAT(
      config.getCategoryConfigs(),
      UnorderedElementsAre(
          Pair("", LogCategoryConfig{LogLevel::WARN, true, {"default"}}),
          Pair("foo", LogCategoryConfig{LogLevel::INFO, true}),
          Pair("folly.io", LogCategoryConfig{LogLevel::DBG2, true})));
  EXPECT_THAT(
      config.getHandlerConfigs(),
      UnorderedElementsAre(Pair(
          "default",
          LogHandlerConfig(
              "custom", {{"opt1", "value1"}, {"opt2", "value2"}}))));

  // Updating the root category's log level without specifying
  // handlers should leave its current handler list intact
  config =
      parseLogConfig("WARN:default; default=custom:opt1=value1,opt2=value2");
  config.update(parseLogConfig("ERR"));
  EXPECT_THAT(
      config.getCategoryConfigs(),
      UnorderedElementsAre(
          Pair("", LogCategoryConfig{LogLevel::ERR, true, {"default"}})));
  EXPECT_THAT(
      config.getHandlerConfigs(),
      UnorderedElementsAre(Pair(
          "default",
          LogHandlerConfig(
              "custom", {{"opt1", "value1"}, {"opt2", "value2"}}))));

  config =
      parseLogConfig("WARN:default; default=custom:opt1=value1,opt2=value2");
  config.update(parseLogConfig(".:=ERR"));
  EXPECT_THAT(
      config.getCategoryConfigs(),
      UnorderedElementsAre(
          Pair("", LogCategoryConfig{LogLevel::ERR, false, {"default"}})));
  EXPECT_THAT(
      config.getHandlerConfigs(),
      UnorderedElementsAre(Pair(
          "default",
          LogHandlerConfig(
              "custom", {{"opt1", "value1"}, {"opt2", "value2"}}))));

  // Test clearing the root category's log handlers
  config =
      parseLogConfig("WARN:default; default=custom:opt1=value1,opt2=value2");
  config.update(parseLogConfig("FATAL:"));
  EXPECT_THAT(
      config.getCategoryConfigs(),
      UnorderedElementsAre(
          Pair("", LogCategoryConfig{LogLevel::FATAL, true, {}})));
  EXPECT_THAT(
      config.getHandlerConfigs(),
      UnorderedElementsAre(Pair(
          "default",
          LogHandlerConfig(
              "custom", {{"opt1", "value1"}, {"opt2", "value2"}}))));

  // Test updating the settings on a log handler
  config =
      parseLogConfig("WARN:default; default=stream:stream=stderr,async=false");
  config.update(parseLogConfig("INFO; default:async=true"));
  EXPECT_THAT(
      config.getCategoryConfigs(),
      UnorderedElementsAre(
          Pair("", LogCategoryConfig{LogLevel::INFO, true, {"default"}})));
  EXPECT_THAT(
      config.getHandlerConfigs(),
      UnorderedElementsAre(Pair(
          "default",
          LogHandlerConfig(
              "stream", {{"stream", "stderr"}, {"async", "true"}}))));

  // Updating the settings for a non-existent log handler should fail
  config =
      parseLogConfig("WARN:default; default=stream:stream=stderr,async=false");
  EXPECT_THROW_RE(
      config.update(parseLogConfig("INFO; other:async=true")),
      std::invalid_argument,
      "cannot update configuration for "
      R"(unknown log handler "other")");
}
