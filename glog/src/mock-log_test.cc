// Copyright (c) 2007, Google Inc.
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//     * Neither the name of Google Inc. nor the names of its
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
// Author: Zhanyong Wan

// Tests the ScopedMockLog class.

#include "mock-log.h"

#include <string>

#include <gmock/gmock.h>
#include <gtest/gtest.h>

namespace {

using GOOGLE_NAMESPACE::INFO;
using GOOGLE_NAMESPACE::WARNING;
using GOOGLE_NAMESPACE::ERROR;
using GOOGLE_NAMESPACE::glog_testing::ScopedMockLog;
using std::string;
using testing::_;
using testing::HasSubstr;
using testing::InSequence;
using testing::InvokeWithoutArgs;

// Tests that ScopedMockLog intercepts LOG()s when it's alive.
TEST(ScopedMockLogTest, InterceptsLog) {
  ScopedMockLog log;

  InSequence s;
  EXPECT_CALL(log, Log(WARNING, HasSubstr("/mock-log_test.cc"), "Fishy."));
  EXPECT_CALL(log, Log(INFO, _, "Working..."))
      .Times(2);
  EXPECT_CALL(log, Log(ERROR, _, "Bad!!"));

  LOG(WARNING) << "Fishy.";
  LOG(INFO) << "Working...";
  LOG(INFO) << "Working...";
  LOG(ERROR) << "Bad!!";
}

void LogBranch() {
  LOG(INFO) << "Logging a branch...";
}

void LogTree() {
  LOG(INFO) << "Logging the whole tree...";
}

void LogForest() {
  LOG(INFO) << "Logging the entire forest.";
  LOG(INFO) << "Logging the entire forest..";
  LOG(INFO) << "Logging the entire forest...";
}

// The purpose of the following test is to verify that intercepting logging
// continues to work properly if a LOG statement is executed within the scope
// of a mocked call.
TEST(ScopedMockLogTest, LogDuringIntercept) {
  ScopedMockLog log;
  InSequence s;
  EXPECT_CALL(log, Log(INFO, __FILE__, "Logging a branch..."))
      .WillOnce(InvokeWithoutArgs(LogTree));
  EXPECT_CALL(log, Log(INFO, __FILE__, "Logging the whole tree..."))
      .WillOnce(InvokeWithoutArgs(LogForest));
  EXPECT_CALL(log, Log(INFO, __FILE__, "Logging the entire forest."));
  EXPECT_CALL(log, Log(INFO, __FILE__, "Logging the entire forest.."));
  EXPECT_CALL(log, Log(INFO, __FILE__, "Logging the entire forest..."));
  LogBranch();
}

}  // namespace

int main(int argc, char **argv) {
  GOOGLE_NAMESPACE::InitGoogleLogging(argv[0]);
  testing::InitGoogleMock(&argc, argv);

  return RUN_ALL_TESTS();
}
