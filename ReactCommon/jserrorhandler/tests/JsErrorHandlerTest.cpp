/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>
#include <vector>

#include <gtest/gtest.h>
#include <hermes/API/hermes/hermes.h>
#include <jserrorhandler/JsErrorHandler.h>
#include <jsi/jsi.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>

namespace facebook::react {

class JsErrorHandlerTest : public testing::Test {
  void SetUp() override {
    runtime_ = facebook::hermes::makeHermesRuntime();
  }

 protected:
  MapBuffer parseErrorWithStackString(std::string stack, bool isFatal) {
    std::optional<MapBuffer> result;
    JsErrorHandler handler{
        [&](MapBuffer errorMap) -> void { result = std::move(errorMap); }};
    jsi::JSError error{*runtime_, "test message", stack};
    handler.handleJsError(error, isFatal);
    EXPECT_TRUE(result.has_value());
    return std::move(*result);
  }

 private:
  std::unique_ptr<facebook::hermes::HermesRuntime> runtime_;
};

TEST_F(JsErrorHandlerTest, testSimpleJscSourceStack) {
  auto errorMap = parseErrorWithStackString(
      "http://path/to/file.js:47:22\n"
      "foo@http://path/to/file.js:52:15\n"
      "bar@http://path/to/file.js:108:23",
      /* isFatal */ false);

  EXPECT_FALSE(errorMap.getBool(JSErrorHandlerKey::kIsFatal));

  auto frames = errorMap.getMapBufferList(JSErrorHandlerKey::kAllStackFrames);
  EXPECT_EQ(frames.size(), 3);

  EXPECT_EQ(
      frames[0].getString(JSErrorHandlerKey::kFrameFileName),
      "http://path/to/file.js");
  EXPECT_EQ(frames[0].getInt(JSErrorHandlerKey::kFrameLineNumber), 47);
  // TODO: This is the wrong column number. JSC's columns are 1-based while ours
  // are 0-based.
  EXPECT_EQ(frames[0].getInt(JSErrorHandlerKey::kFrameColumnNumber), 22);
  EXPECT_EQ(frames[0].getString(JSErrorHandlerKey::kFrameMethodName), "");

  EXPECT_EQ(
      frames[1].getString(JSErrorHandlerKey::kFrameFileName),
      "http://path/to/file.js");
  EXPECT_EQ(frames[1].getInt(JSErrorHandlerKey::kFrameLineNumber), 52);
  // TODO: This is the wrong column number. JSC's columns are 1-based while ours
  // are 0-based.
  EXPECT_EQ(frames[1].getInt(JSErrorHandlerKey::kFrameColumnNumber), 15);
  EXPECT_EQ(frames[1].getString(JSErrorHandlerKey::kFrameMethodName), "foo");

  EXPECT_EQ(
      frames[2].getString(JSErrorHandlerKey::kFrameFileName),
      "http://path/to/file.js");
  EXPECT_EQ(frames[2].getInt(JSErrorHandlerKey::kFrameLineNumber), 108);
  // TODO: This is the wrong column number. JSC's columns are 1-based while ours
  // are 0-based.
  EXPECT_EQ(frames[2].getInt(JSErrorHandlerKey::kFrameColumnNumber), 23);
  EXPECT_EQ(frames[2].getString(JSErrorHandlerKey::kFrameMethodName), "bar");
}

TEST_F(JsErrorHandlerTest, testSimpleHermesBytecodeStack) {
  auto errorMap = parseErrorWithStackString(
      "    at global (address at unknown:1:9)\n"
      "    at foo$bar (address at /js/foo.hbc:10:1234)",
      /* isFatal */ false);

  EXPECT_FALSE(errorMap.getBool(JSErrorHandlerKey::kIsFatal));

  auto frames = errorMap.getMapBufferList(JSErrorHandlerKey::kAllStackFrames);
  EXPECT_EQ(frames.size(), 2);

  // TODO: This is the wrong source URL.
  EXPECT_EQ(
      frames[0].getString(JSErrorHandlerKey::kFrameFileName),
      "address at unknown");
  EXPECT_EQ(frames[0].getInt(JSErrorHandlerKey::kFrameLineNumber), 1);
  EXPECT_EQ(frames[0].getInt(JSErrorHandlerKey::kFrameColumnNumber), 9);
  EXPECT_EQ(frames[0].getString(JSErrorHandlerKey::kFrameMethodName), "global");

  // TODO: This is the wrong source URL.
  EXPECT_EQ(
      frames[1].getString(JSErrorHandlerKey::kFrameFileName),
      "address at /js/foo.hbc");
  EXPECT_EQ(frames[1].getInt(JSErrorHandlerKey::kFrameLineNumber), 10);
  EXPECT_EQ(frames[1].getInt(JSErrorHandlerKey::kFrameColumnNumber), 1234);
  EXPECT_EQ(
      frames[1].getString(JSErrorHandlerKey::kFrameMethodName), "foo$bar");
}

TEST_F(JsErrorHandlerTest, testSimpleHermesSourceStack) {
  auto errorMap = parseErrorWithStackString(
      "    at global (unknown:1:9)\n"
      "    at foo$bar (/js/foo.js:10:1234)",
      /* isFatal */ false);

  EXPECT_FALSE(errorMap.getBool(JSErrorHandlerKey::kIsFatal));

  auto frames = errorMap.getMapBufferList(JSErrorHandlerKey::kAllStackFrames);
  EXPECT_EQ(frames.size(), 2);

  EXPECT_EQ(frames[0].getString(JSErrorHandlerKey::kFrameFileName), "unknown");
  EXPECT_EQ(frames[0].getInt(JSErrorHandlerKey::kFrameLineNumber), 1);
  // TODO: This is the wrong column number. Hermes's columns are 1-based (for
  // non-bytecode locations) while ours are 0-based.
  EXPECT_EQ(frames[0].getInt(JSErrorHandlerKey::kFrameColumnNumber), 9);
  EXPECT_EQ(frames[0].getString(JSErrorHandlerKey::kFrameMethodName), "global");

  EXPECT_EQ(
      frames[1].getString(JSErrorHandlerKey::kFrameFileName), "/js/foo.js");
  EXPECT_EQ(frames[1].getInt(JSErrorHandlerKey::kFrameLineNumber), 10);
  // TODO: This is the wrong column number. Hermes's columns are 1-based (for
  // non-bytecode locations) while ours are 0-based.
  EXPECT_EQ(frames[1].getInt(JSErrorHandlerKey::kFrameColumnNumber), 1234);
  EXPECT_EQ(
      frames[1].getString(JSErrorHandlerKey::kFrameMethodName), "foo$bar");
}

TEST_F(JsErrorHandlerTest, testHermesSourceStackWithSkippedFrames) {
  auto errorMap = parseErrorWithStackString(
      "    at global (unknown:1:9)\n"
      "    ... skipping 50 frames\n"
      "    at foo$bar (/js/foo.js:10:1234)",
      /* isFatal */ false);

  EXPECT_FALSE(errorMap.getBool(JSErrorHandlerKey::kIsFatal));

  auto frames = errorMap.getMapBufferList(JSErrorHandlerKey::kAllStackFrames);
  EXPECT_EQ(frames.size(), 2);

  EXPECT_EQ(frames[0].getString(JSErrorHandlerKey::kFrameFileName), "unknown");
  EXPECT_EQ(frames[0].getInt(JSErrorHandlerKey::kFrameLineNumber), 1);
  // TODO: This is the wrong column number. Hermes's columns are 1-based (for
  // non-bytecode locations) while ours are 0-based.
  EXPECT_EQ(frames[0].getInt(JSErrorHandlerKey::kFrameColumnNumber), 9);
  EXPECT_EQ(frames[0].getString(JSErrorHandlerKey::kFrameMethodName), "global");

  EXPECT_EQ(
      frames[1].getString(JSErrorHandlerKey::kFrameFileName), "/js/foo.js");
  EXPECT_EQ(frames[1].getInt(JSErrorHandlerKey::kFrameLineNumber), 10);
  // TODO: This is the wrong column number. Hermes's columns are 1-based (for
  // non-bytecode locations) while ours are 0-based.
  EXPECT_EQ(frames[1].getInt(JSErrorHandlerKey::kFrameColumnNumber), 1234);
  EXPECT_EQ(
      frames[1].getString(JSErrorHandlerKey::kFrameMethodName), "foo$bar");
}

TEST_F(JsErrorHandlerTest, testHermesSourceStackWithNativeFrame) {
  auto errorMap = parseErrorWithStackString(
      "    at global (unknown:1:9)\n"
      "    at apply (native)\n"
      "    at foo$bar (/js/foo.js:10:1234)",
      /* isFatal */ false);

  EXPECT_FALSE(errorMap.getBool(JSErrorHandlerKey::kIsFatal));

  auto frames = errorMap.getMapBufferList(JSErrorHandlerKey::kAllStackFrames);
  EXPECT_EQ(frames.size(), 2);

  EXPECT_EQ(frames[0].getString(JSErrorHandlerKey::kFrameFileName), "unknown");
  EXPECT_EQ(frames[0].getInt(JSErrorHandlerKey::kFrameLineNumber), 1);
  // TODO: This is the wrong column number. Hermes's columns are 1-based (for
  // non-bytecode locations) while ours are 0-based.
  EXPECT_EQ(frames[0].getInt(JSErrorHandlerKey::kFrameColumnNumber), 9);
  EXPECT_EQ(frames[0].getString(JSErrorHandlerKey::kFrameMethodName), "global");

  EXPECT_EQ(
      frames[1].getString(JSErrorHandlerKey::kFrameFileName), "/js/foo.js");
  EXPECT_EQ(frames[1].getInt(JSErrorHandlerKey::kFrameLineNumber), 10);
  // TODO: This is the wrong column number. Hermes's columns are 1-based (for
  // non-bytecode locations) while ours are 0-based.
  EXPECT_EQ(frames[1].getInt(JSErrorHandlerKey::kFrameColumnNumber), 1234);
  EXPECT_EQ(
      frames[1].getString(JSErrorHandlerKey::kFrameMethodName), "foo$bar");
}

TEST_F(JsErrorHandlerTest, testJsxSourceStackWithEval) {
  auto errorMap = parseErrorWithStackString(
      "eval code\n"
      "eval@[native code]\n"
      "foo@http://path/to/file.js:58:21\n"
      "bar@http://path/to/file.js:109:91",
      /* isFatal */ false);

  EXPECT_FALSE(errorMap.getBool(JSErrorHandlerKey::kIsFatal));

  auto frames = errorMap.getMapBufferList(JSErrorHandlerKey::kAllStackFrames);
  EXPECT_EQ(frames.size(), 2);

  EXPECT_EQ(
      frames[0].getString(JSErrorHandlerKey::kFrameFileName),
      "http://path/to/file.js");
  EXPECT_EQ(frames[0].getInt(JSErrorHandlerKey::kFrameLineNumber), 58);
  // TODO: This is the wrong column number. JSC's columns are 1-based while ours
  // are 0-based.
  EXPECT_EQ(frames[0].getInt(JSErrorHandlerKey::kFrameColumnNumber), 21);
  EXPECT_EQ(frames[0].getString(JSErrorHandlerKey::kFrameMethodName), "foo");

  EXPECT_EQ(
      frames[1].getString(JSErrorHandlerKey::kFrameFileName),
      "http://path/to/file.js");
  EXPECT_EQ(frames[1].getInt(JSErrorHandlerKey::kFrameLineNumber), 109);
  // TODO: This is the wrong column number. JSC's columns are 1-based while ours
  // are 0-based.
  EXPECT_EQ(frames[1].getInt(JSErrorHandlerKey::kFrameColumnNumber), 91);
  EXPECT_EQ(frames[1].getString(JSErrorHandlerKey::kFrameMethodName), "bar");
}
} // namespace facebook::react
