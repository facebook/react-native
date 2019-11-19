/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <hermes/inspector/detail/CallbackOStream.h>

#include <memory>
#include <ostream>
#include <type_traits>
#include <vector>

#include <gmock/gmock.h>

namespace {
using namespace ::testing;
using namespace facebook::hermes::inspector::detail;

TEST(CallbackOStreamTests, Chunking) {
  std::vector<std::string> recvd;
  CallbackOStream cos(/* sz */ 4, [&recvd](std::string s) {
    recvd.emplace_back(std::move(s));
    return true;
  });

  cos << "123412341234";

  EXPECT_THAT(recvd, ElementsAre("1234", "1234", "1234"));
}

TEST(CallbackOStreamTests, SyncOnDestruction) {
  std::vector<std::string> recvd;

  {
    CallbackOStream cos(/* sz */ 4, [&recvd](std::string s) {
      recvd.emplace_back(std::move(s));
      return true;
    });

    cos << "123412341234123";
    ASSERT_THAT(recvd, ElementsAre("1234", "1234", "1234"));
  }

  EXPECT_THAT(recvd, ElementsAre("1234", "1234", "1234", "123"));
}

TEST(CallbackOStreamTests, ExplicitFlush) {
  std::vector<std::string> recvd;
  CallbackOStream cos(/* sz */ 4, [&recvd](std::string s) {
    recvd.emplace_back(std::move(s));
    return true;
  });

  cos << "123412341234123";
  EXPECT_THAT(recvd, ElementsAre("1234", "1234", "1234"));

  cos << std::flush;
  EXPECT_THAT(recvd, ElementsAre("1234", "1234", "1234", "123"));
}

TEST(CallbackOStreamTests, FlushEmpty) {
  size_t i = 0;
  CallbackOStream cos(/* sz */ 4, [&i](std::string) { return ++i; });

  cos << "12341234";
  ASSERT_THAT(i, Eq(2));

  // If the put area is empty, we will not flush.
  cos << std::flush;
  EXPECT_THAT(i, Eq(2));
}

TEST(CallbackOStreamTests, FailingCallback) {
  size_t i = 0;
  std::vector<std::string> recvd;
  CallbackOStream cos(/* sz */ 4, [&i, &recvd](std::string s) {
    recvd.emplace_back(std::move(s));
    return ++i < 2;
  });

  cos << "123412341234";
  EXPECT_THAT(recvd, ElementsAre("1234", "1234"));
  EXPECT_THAT(!cos, Eq(true));
}

TEST(CallbackOStreamTests, ThrowingCallback) {
  size_t i = 0;
  std::vector<std::string> recvd;
  CallbackOStream cos(/* sz */ 4, [&i, &recvd](std::string s) {
    if (i++ >= 2) {
      throw "too big";
    }
    recvd.emplace_back(std::move(s));
    return true;
  });

  cos << "123412341234";
  EXPECT_THAT(recvd, ElementsAre("1234", "1234"));
  EXPECT_THAT(!cos, Eq(true));
}

} // namespace
