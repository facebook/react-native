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
#include <folly/dynamic.h>
#include <folly/json.h>
#include <folly/logging/LogCategory.h>
#include <folly/logging/LogConfig.h>
#include <folly/logging/LogConfigParser.h>
#include <folly/logging/LogHandlerFactory.h>
#include <folly/logging/LoggerDB.h>
#include <folly/logging/test/ConfigHelpers.h>
#include <folly/logging/test/TestLogHandler.h>
#include <folly/portability/GMock.h>
#include <folly/portability/GTest.h>
#include <folly/test/TestUtils.h>

using namespace folly;
using ::testing::Pair;
using ::testing::UnorderedElementsAre;

namespace {

MATCHER_P(LogHandlerMatcherImpl, config, "") {
  return arg->getConfig() == config;
}

/**
 * A helper function to use in EXPECT_THAT() for matching a TestLogHandler
 * with the specified type and options.
 */
auto MatchLogHandler(
    StringPiece type,
    std::unordered_map<std::string, std::string> options) {
  return LogHandlerMatcherImpl(LogHandlerConfig{type, std::move(options)});
}
auto MatchLogHandler(const LogHandlerConfig& config) {
  return LogHandlerMatcherImpl(config);
}

} // namespace

TEST(ConfigUpdate, updateLogLevels) {
  LoggerDB db{LoggerDB::TESTING};
  db.updateConfig(parseLogConfig("foo.bar=dbg5"));
  EXPECT_EQ(LogLevel::DBG5, db.getCategory("foo.bar")->getLevel());
  EXPECT_EQ(LogLevel::DBG5, db.getCategory("foo.bar")->getEffectiveLevel());
  EXPECT_EQ(LogLevel::MAX_LEVEL, db.getCategory("foo")->getLevel());
  EXPECT_EQ(kDefaultLogLevel, db.getCategory("foo")->getEffectiveLevel());
  EXPECT_EQ(kDefaultLogLevel, db.getCategory("")->getLevel());
  EXPECT_EQ(kDefaultLogLevel, db.getCategory("")->getEffectiveLevel());

  EXPECT_EQ(LogLevel::MAX_LEVEL, db.getCategory("foo.bar.test")->getLevel());
  EXPECT_EQ(
      LogLevel::DBG5, db.getCategory("foo.bar.test")->getEffectiveLevel());

  db.updateConfig(
      parseLogConfig("sys=warn,foo.test=debug,foo.test.stuff=warn"));
  EXPECT_EQ(LogLevel::WARN, db.getCategory("sys")->getLevel());
  EXPECT_EQ(kDefaultLogLevel, db.getCategory("sys")->getEffectiveLevel());
  EXPECT_EQ(LogLevel::DBG, db.getCategory("foo.test")->getLevel());
  EXPECT_EQ(LogLevel::DBG, db.getCategory("foo.test")->getEffectiveLevel());
  EXPECT_EQ(LogLevel::WARN, db.getCategory("foo.test.stuff")->getLevel());
  EXPECT_EQ(
      LogLevel::DBG, db.getCategory("foo.test.stuff")->getEffectiveLevel());
  EXPECT_EQ(LogLevel::DBG5, db.getCategory("foo.bar")->getEffectiveLevel());
}

TEST(ConfigUpdate, updateConfig) {
  LoggerDB db{LoggerDB::TESTING};
  db.registerHandlerFactory(
      std::make_unique<TestLogHandlerFactory>("handlerA"));
  db.registerHandlerFactory(
      std::make_unique<TestLogHandlerFactory>("handlerB"));
  EXPECT_EQ(parseLogConfig(".:=INFO:"), db.getConfig());

  // Create some categories that aren't affected by our config updates below,
  // just to ensure that they don't show up in getConfig() results since they
  // have the default config settings.
  db.getCategory("test.category1");
  db.getCategory("test.category2");
  EXPECT_EQ(parseLogConfig(".:=INFO:"), db.getConfig());

  // Apply an update
  db.updateConfig(parseLogConfig("INFO:stderr; stderr=handlerA:stream=stderr"));
  EXPECT_EQ(LogLevel::INFO, db.getCategory("")->getLevel());
  EXPECT_THAT(
      db.getCategory("")->getHandlers(),
      UnorderedElementsAre(
          MatchLogHandler("handlerA", {{"stream", "stderr"}})));
  EXPECT_EQ(
      parseLogConfig(".:=INFO:stderr; stderr=handlerA:stream=stderr"),
      db.getConfig());

  // Update the log level for category "foo"
  // This should not affect the existing settings for the root category
  EXPECT_EQ(LogLevel::MAX_LEVEL, db.getCategory("foo")->getLevel());
  EXPECT_TRUE(db.getCategory("foo")->getLevelInfo().second);
  db.updateConfig(parseLogConfig("foo:=DBG2"));
  EXPECT_EQ(LogLevel::DBG2, db.getCategory("foo")->getLevel());
  EXPECT_FALSE(db.getCategory("foo")->getLevelInfo().second);
  EXPECT_EQ(LogLevel::INFO, db.getCategory("")->getLevel());
  EXPECT_EQ(1, db.getCategory("")->getHandlers().size());
  EXPECT_EQ(
      parseLogConfig(
          ".:=INFO:stderr, foo:=DBG2:; stderr=handlerA:stream=stderr"),
      db.getConfig());

  // Add 2 log handlers to the "bar" log category.
  db.updateConfig(
      parseLogConfig("bar=ERROR:new:h2; "
                     "new=handlerB:key=value; "
                     "h2=handlerA:foo=bar"));
  EXPECT_EQ(LogLevel::INFO, db.getCategory("")->getLevel());
  EXPECT_THAT(
      db.getCategory("")->getHandlers(),
      UnorderedElementsAre(
          MatchLogHandler("handlerA", {{"stream", "stderr"}})));
  EXPECT_EQ(LogLevel::ERR, db.getCategory("bar")->getLevel());
  EXPECT_THAT(
      db.getCategory("bar")->getHandlers(),
      UnorderedElementsAre(
          MatchLogHandler("handlerB", {{"key", "value"}}),
          MatchLogHandler("handlerA", {{"foo", "bar"}})));
  EXPECT_EQ(
      parseLogConfig(".:=INFO:stderr, foo:=DBG2:, bar=ERROR:new:h2; "
                     "stderr=handlerA: stream=stderr; "
                     "new=handlerB: key=value; "
                     "h2=handlerA: foo=bar"),
      db.getConfig());

  // Updating the "new" log handler settings should automatically update
  // the settings we see on the "bar" category, even if we don't explicitly
  // list "bar" in the config update
  db.updateConfig(parseLogConfig("; new=handlerB:newkey=newvalue"));
  EXPECT_EQ(LogLevel::INFO, db.getCategory("")->getLevel());
  EXPECT_THAT(
      db.getCategory("")->getHandlers(),
      UnorderedElementsAre(
          MatchLogHandler("handlerA", {{"stream", "stderr"}})));
  EXPECT_EQ(LogLevel::ERR, db.getCategory("bar")->getLevel());
  EXPECT_THAT(
      db.getCategory("bar")->getHandlers(),
      UnorderedElementsAre(
          MatchLogHandler("handlerB", {{"newkey", "newvalue"}}),
          MatchLogHandler("handlerA", {{"foo", "bar"}})));
  EXPECT_EQ(
      parseLogConfig(".:=INFO:stderr, foo:=DBG2:, bar=ERROR:new:h2; "
                     "stderr=handlerA: stream=stderr; "
                     "new=handlerB: newkey=newvalue; "
                     "h2=handlerA: foo=bar"),
      db.getConfig());

  // Updating the level settings for the "bar" handler should leave its
  // handlers unchanged.
  db.updateConfig(parseLogConfig("bar=WARN"));
  EXPECT_EQ(LogLevel::INFO, db.getCategory("")->getLevel());
  EXPECT_THAT(
      db.getCategory("")->getHandlers(),
      UnorderedElementsAre(
          MatchLogHandler("handlerA", {{"stream", "stderr"}})));
  EXPECT_EQ(LogLevel::WARN, db.getCategory("bar")->getLevel());
  EXPECT_THAT(
      db.getCategory("bar")->getHandlers(),
      UnorderedElementsAre(
          MatchLogHandler("handlerB", {{"newkey", "newvalue"}}),
          MatchLogHandler("handlerA", {{"foo", "bar"}})));
  EXPECT_EQ(
      parseLogConfig(".:=INFO:stderr, foo:=DBG2:, bar=WARN:new:h2; "
                     "stderr=handlerA: stream=stderr; "
                     "new=handlerB: newkey=newvalue; "
                     "h2=handlerA: foo=bar"),
      db.getConfig());

  // Update the options for the h2 handler in place, and also add it to the
  // "test.foo" category.  The changes should also be reflected on the "bar"
  // category.
  db.updateConfig(
      parseLogConfig("test.foo=INFO:h2; h2=handlerA:reuse_handler=1,foo=xyz"));
  EXPECT_EQ(LogLevel::INFO, db.getCategory("")->getLevel());
  EXPECT_THAT(
      db.getCategory("")->getHandlers(),
      UnorderedElementsAre(
          MatchLogHandler("handlerA", {{"stream", "stderr"}})));
  EXPECT_EQ(LogLevel::WARN, db.getCategory("bar")->getLevel());
  EXPECT_THAT(
      db.getCategory("bar")->getHandlers(),
      UnorderedElementsAre(
          MatchLogHandler("handlerB", {{"newkey", "newvalue"}}),
          MatchLogHandler(
              "handlerA", {{"foo", "xyz"}, {"reuse_handler", "1"}})));
  EXPECT_EQ(LogLevel::INFO, db.getCategory("test.foo")->getLevel());
  EXPECT_THAT(
      db.getCategory("test.foo")->getHandlers(),
      UnorderedElementsAre(MatchLogHandler(
          "handlerA", {{"foo", "xyz"}, {"reuse_handler", "1"}})));
  EXPECT_EQ(
      parseLogConfig(".:=INFO:stderr, foo:=DBG2:, bar=WARN:new:h2, "
                     "test.foo=INFO:h2; "
                     "stderr=handlerA: stream=stderr; "
                     "new=handlerB: newkey=newvalue; "
                     "h2=handlerA: reuse_handler=1,foo=xyz"),
      db.getConfig());

  // Update the options for the h2 handler using partial options
  db.updateConfig(parseLogConfig("; h2:abc=def"));
  EXPECT_EQ(LogLevel::INFO, db.getCategory("")->getLevel());
  EXPECT_THAT(
      db.getCategory("")->getHandlers(),
      UnorderedElementsAre(
          MatchLogHandler("handlerA", {{"stream", "stderr"}})));
  EXPECT_EQ(LogLevel::WARN, db.getCategory("bar")->getLevel());
  EXPECT_THAT(
      db.getCategory("bar")->getHandlers(),
      UnorderedElementsAre(
          MatchLogHandler("handlerB", {{"newkey", "newvalue"}}),
          MatchLogHandler(
              "handlerA",
              {{"abc", "def"}, {"foo", "xyz"}, {"reuse_handler", "1"}})));
  EXPECT_EQ(LogLevel::INFO, db.getCategory("test.foo")->getLevel());
  EXPECT_THAT(
      db.getCategory("test.foo")->getHandlers(),
      UnorderedElementsAre(MatchLogHandler(
          "handlerA",
          {{"abc", "def"}, {"foo", "xyz"}, {"reuse_handler", "1"}})));
  EXPECT_EQ(
      parseLogConfig(".:=INFO:stderr, foo:=DBG2:, bar=WARN:new:h2, "
                     "test.foo=INFO:h2; "
                     "stderr=handlerA: stream=stderr; "
                     "new=handlerB: newkey=newvalue; "
                     "h2=handlerA: reuse_handler=1,abc=def,foo=xyz"),
      db.getConfig());

  // Update the options for the "new" handler using partial options
  db.updateConfig(parseLogConfig("; new:opt1=value1"));
  EXPECT_EQ(LogLevel::WARN, db.getCategory("bar")->getLevel());
  EXPECT_THAT(
      db.getCategory("bar")->getHandlers(),
      UnorderedElementsAre(
          MatchLogHandler(
              "handlerB", {{"opt1", "value1"}, {"newkey", "newvalue"}}),
          MatchLogHandler(
              "handlerA",
              {{"abc", "def"}, {"foo", "xyz"}, {"reuse_handler", "1"}})));
  EXPECT_EQ(LogLevel::INFO, db.getCategory("test.foo")->getLevel());
  EXPECT_THAT(
      db.getCategory("test.foo")->getHandlers(),
      UnorderedElementsAre(MatchLogHandler(
          "handlerA",
          {{"abc", "def"}, {"foo", "xyz"}, {"reuse_handler", "1"}})));
  EXPECT_EQ(
      parseLogConfig(".:=INFO:stderr, foo:=DBG2:, bar=WARN:new:h2, "
                     "test.foo=INFO:h2; "
                     "stderr=handlerA: stream=stderr; "
                     "new=handlerB: newkey=newvalue,opt1=value1; "
                     "h2=handlerA: reuse_handler=1,abc=def,foo=xyz"),
      db.getConfig());

  // Supplying partial options for a non-existent log handler should fail
  EXPECT_THROW_RE(
      db.updateConfig(parseLogConfig("; no_such_handler:foo=bar")),
      std::invalid_argument,
      R"(cannot update unknown log handler "no_such_handler")");

  // Explicitly clear the handlers for the "bar" category
  // This should remove the "new" handler from the LoggerDB since bar was the
  // only category referring to it.
  db.updateConfig(parseLogConfig("bar=WARN:"));
  EXPECT_EQ(LogLevel::INFO, db.getCategory("")->getLevel());
  EXPECT_THAT(
      db.getCategory("")->getHandlers(),
      UnorderedElementsAre(
          MatchLogHandler("handlerA", {{"stream", "stderr"}})));
  EXPECT_EQ(LogLevel::WARN, db.getCategory("bar")->getLevel());
  EXPECT_THAT(db.getCategory("bar")->getHandlers(), UnorderedElementsAre());
  EXPECT_EQ(
      parseLogConfig(".:=INFO:stderr, foo:=DBG2:, bar=WARN:, "
                     "test.foo=INFO:h2; "
                     "stderr=handlerA: stream=stderr; "
                     "h2=handlerA: reuse_handler=1,abc=def,foo=xyz"),
      db.getConfig());

  // Now test resetConfig()
  db.resetConfig(
      parseLogConfig("bar=INFO:h2, test.abc=DBG3; "
                     "h2=handlerB: abc=xyz"));
  EXPECT_EQ(
      parseLogConfig(".:=INFO:, bar=INFO:h2, test.abc=DBG3:; "
                     "h2=handlerB: abc=xyz"),
      db.getConfig());
}

TEST(ConfigUpdate, getConfigAnonymousHandlers) {
  LoggerDB db{LoggerDB::TESTING};
  db.registerHandlerFactory(
      std::make_unique<TestLogHandlerFactory>("handlerA"));
  db.registerHandlerFactory(
      std::make_unique<TestLogHandlerFactory>("handlerB"));
  EXPECT_EQ(parseLogConfig(".:=INFO:"), db.getConfig());

  // Manually attach a handler to a category.
  // It should be reported as "anonymousHandler1"
  auto handlerFoo = std::make_shared<TestLogHandler>(
      LogHandlerConfig{"foo", {{"abc", "xyz"}}});
  db.setLevel("x.y.z", LogLevel::DBG2);
  db.getCategory("x.y.z")->addHandler(handlerFoo);
  EXPECT_EQ(
      parseLogConfig(".:=INFO:, x.y.z=DBG2:anonymousHandler1; "
                     "anonymousHandler1=foo:abc=xyz"),
      db.getConfig());

  // If we attach the same handler to another category it should still only be
  // reported once.
  db.setLevel("test.category", LogLevel::DBG1);
  db.getCategory("test.category")->addHandler(handlerFoo);
  EXPECT_EQ(
      parseLogConfig(".:=INFO:, "
                     "x.y.z=DBG2:anonymousHandler1, "
                     "test.category=DBG1:anonymousHandler1; "
                     "anonymousHandler1=foo:abc=xyz"),
      db.getConfig());

  // If we use updateConfig() to explicitly define a handler named
  // "anonymousHandler1", the unnamed handler will be reported as
  // "anonymousHandler2" instead now.
  db.updateConfig(parseLogConfig(
      "a.b.c=INFO:anonymousHandler1; anonymousHandler1=handlerA:key=value"));
  EXPECT_EQ(
      parseLogConfig(".:=INFO:, "
                     "a.b.c=INFO:anonymousHandler1, "
                     "x.y.z=DBG2:anonymousHandler2, "
                     "test.category=DBG1:anonymousHandler2; "
                     "anonymousHandler1=handlerA: key=value; "
                     "anonymousHandler2=foo: abc=xyz"),
      db.getConfig());
}

TEST(ConfigUpdate, getFullConfig) {
  LoggerDB db{LoggerDB::TESTING};
  db.registerHandlerFactory(
      std::make_unique<TestLogHandlerFactory>("handlerA"));
  db.registerHandlerFactory(
      std::make_unique<TestLogHandlerFactory>("handlerB"));
  EXPECT_EQ(parseLogConfig(".:=INFO:"), db.getConfig());

  db.getCategory("src.libfoo.foo.c");
  db.getCategory("src.libfoo.foo.h");
  db.getCategory("src.libfoo.bar.h");
  db.getCategory("src.libfoo.bar.c");
  db.getCategory("test.foo.test.c");

  db.updateConfig(
      parseLogConfig(".=INFO:stdout,"
                     "src.libfoo=dbg5; "
                     "stdout=handlerA:stream=stdout"));
  EXPECT_EQ(
      parseLogConfig(".:=INFO:stdout,"
                     "src.libfoo=dbg5:; "
                     "stdout=handlerA:stream=stdout"),
      db.getConfig());
  EXPECT_EQ(
      parseLogConfig(".:=INFO:stdout,"
                     "src=FATAL:, "
                     "src.libfoo=dbg5:, "
                     "src.libfoo.foo=FATAL:, "
                     "src.libfoo.foo.c=FATAL:, "
                     "src.libfoo.foo.h=FATAL:, "
                     "src.libfoo.bar=FATAL:, "
                     "src.libfoo.bar.c=FATAL:, "
                     "src.libfoo.bar.h=FATAL:, "
                     "test=FATAL:, "
                     "test.foo=FATAL:, "
                     "test.foo.test=FATAL:, "
                     "test.foo.test.c=FATAL:; "
                     "stdout=handlerA:stream=stdout"),
      db.getFullConfig());
}
