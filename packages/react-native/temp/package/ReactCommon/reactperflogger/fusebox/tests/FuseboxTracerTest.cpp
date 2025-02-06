/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <reactperflogger/fusebox/FuseboxTracer.h>

using namespace ::testing;

namespace facebook::react {

namespace {

class FuseboxTracerTest : public ::testing::Test {
 protected:
  FuseboxTracerTest() = default;

  ~FuseboxTracerTest() override = default;

  void SetUp() override {
    stopTracingAndCollect();
  }

  void TearDown() override {
    stopTracingAndCollect();
  }

  folly::dynamic stopTracingAndCollect() {
    folly::dynamic trace = folly::dynamic::array;
    FuseboxTracer::getFuseboxTracer().stopTracing(
        [&trace](const folly::dynamic& eventsChunk) {
          for (const auto& event : eventsChunk) {
            trace.push_back(event);
          }
        });
    return trace;
  }
};

} // namespace

TEST_F(FuseboxTracerTest, TracingOffByDefault) {
  EXPECT_FALSE(FuseboxTracer::getFuseboxTracer().isTracing());
}

TEST_F(FuseboxTracerTest, TracingOn) {
  FuseboxTracer::getFuseboxTracer().startTracing();
  EXPECT_TRUE(FuseboxTracer::getFuseboxTracer().isTracing());
  stopTracingAndCollect();
}

TEST_F(FuseboxTracerTest, DiscardEventWhenNotOn) {
  EXPECT_FALSE(FuseboxTracer::getFuseboxTracer().isTracing());
  EXPECT_EQ(stopTracingAndCollect().size(), 0);
  FuseboxTracer::getFuseboxTracer().addEvent("test", 0, 0, "default track");
  FuseboxTracer::getFuseboxTracer().addEvent("test", 0, 0, "default track");
  EXPECT_EQ(stopTracingAndCollect().size(), 0);
}

TEST_F(FuseboxTracerTest, NoDefaultEvents) {
  FuseboxTracer::getFuseboxTracer().startTracing();
  EXPECT_EQ(stopTracingAndCollect().size(), 0);
}

TEST_F(FuseboxTracerTest, SimpleEvent) {
  FuseboxTracer::getFuseboxTracer().startTracing();
  FuseboxTracer::getFuseboxTracer().addEvent("test", 0, 0, "default track");
  EXPECT_GE(stopTracingAndCollect().size(), 1);
}

TEST_F(FuseboxTracerTest, MultiEvents) {
  FuseboxTracer::getFuseboxTracer().startTracing();
  for (int i = 0; i < 10; i++) {
    FuseboxTracer::getFuseboxTracer().addEvent("test", 0, 0, "default track");
  }
  EXPECT_GE(stopTracingAndCollect().size(), 10);
  EXPECT_EQ(stopTracingAndCollect().size(), 0);
}

TEST_F(FuseboxTracerTest, ShouldEndTracingEvenIfThereIsNoEvents) {
  FuseboxTracer::getFuseboxTracer().startTracing();
  EXPECT_EQ(stopTracingAndCollect().size(), 0);
  EXPECT_FALSE(FuseboxTracer::getFuseboxTracer().isTracing());
}

} // namespace facebook::react
