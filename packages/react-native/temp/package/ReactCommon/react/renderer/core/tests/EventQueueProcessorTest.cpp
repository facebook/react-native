/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <hermes/hermes.h>
#include <jsi/jsi.h>
#include <react/renderer/core/EventLogger.h>
#include <react/renderer/core/EventPipe.h>
#include <react/renderer/core/EventQueueProcessor.h>
#include <react/renderer/core/EventTarget.h>
#include <react/renderer/core/StatePipe.h>
#include <react/renderer/core/ValueFactoryEventPayload.h>

#include <memory>
#include <string_view>

namespace facebook::react {

class MockEventLogger : public EventLogger {
  EventTag onEventStart(std::string_view /*name*/, SharedEventTarget /*target*/)
      override {
    return EMPTY_EVENT_TAG;
  }
  void onEventProcessingStart(EventTag /*tag*/) override {}
  void onEventProcessingEnd(EventTag /*tag*/) override {}
};

class EventQueueProcessorTest : public testing::Test {
 protected:
  void SetUp() override {
    runtime_ = facebook::hermes::makeHermesRuntime();

    auto eventPipe = [this](
                         jsi::Runtime& /*runtime*/,
                         const EventTarget* /*eventTarget*/,
                         const std::string& type,
                         ReactEventPriority priority,
                         const EventPayload& /*payload*/) {
      eventTypes_.push_back(type);
      eventPriorities_.push_back(priority);
    };

    auto dummyEventPipeConclusion = [](jsi::Runtime& runtime) {};
    auto dummyStatePipe = [](const StateUpdate& stateUpdate) {};
    auto mockEventLogger = std::make_shared<MockEventLogger>();

    eventProcessor_ = std::make_unique<EventQueueProcessor>(
        eventPipe, dummyEventPipeConclusion, dummyStatePipe, mockEventLogger);
  }

  std::unique_ptr<facebook::hermes::HermesRuntime> runtime_;
  std::unique_ptr<EventQueueProcessor> eventProcessor_;
  std::vector<std::string> eventTypes_;
  std::vector<ReactEventPriority> eventPriorities_;
  ValueFactory dummyValueFactory_;
};

TEST_F(EventQueueProcessorTest, singleUnspecifiedEvent) {
  eventProcessor_->flushEvents(
      *runtime_,
      {RawEvent(
          "my type",
          std::make_shared<ValueFactoryEventPayload>(dummyValueFactory_),
          nullptr,
          RawEvent::Category::Unspecified)});

  EXPECT_EQ(eventPriorities_.size(), 1);
  EXPECT_EQ(eventTypes_[0], "my type");
  EXPECT_EQ(eventPriorities_[0], ReactEventPriority::Discrete);
}

TEST_F(EventQueueProcessorTest, continuousEvent) {
  eventProcessor_->flushEvents(
      *runtime_,
      {RawEvent(
           "touchStart",
           std::make_shared<ValueFactoryEventPayload>(dummyValueFactory_),
           nullptr,
           RawEvent::Category::ContinuousStart),
       RawEvent(
           "touchMove",
           std::make_shared<ValueFactoryEventPayload>(dummyValueFactory_),
           nullptr,
           RawEvent::Category::Unspecified),
       RawEvent(
           "touchEnd",
           std::make_shared<ValueFactoryEventPayload>(dummyValueFactory_),
           nullptr,
           RawEvent::Category::ContinuousEnd),
       RawEvent(
           "custom event",
           std::make_shared<ValueFactoryEventPayload>(dummyValueFactory_),
           nullptr,
           RawEvent::Category::Unspecified)});

  EXPECT_EQ(eventPriorities_.size(), 4);

  EXPECT_EQ(eventTypes_[0], "touchStart");
  EXPECT_EQ(eventPriorities_[0], ReactEventPriority::Discrete);

  EXPECT_EQ(eventTypes_[1], "touchMove");
  EXPECT_EQ(eventPriorities_[1], ReactEventPriority::Default);

  EXPECT_EQ(eventTypes_[2], "touchEnd");
  EXPECT_EQ(eventPriorities_[2], ReactEventPriority::Discrete);

  EXPECT_EQ(eventTypes_[3], "custom event");
  EXPECT_EQ(eventPriorities_[3], ReactEventPriority::Discrete);
}

TEST_F(EventQueueProcessorTest, alwaysContinuousEvent) {
  eventProcessor_->flushEvents(
      *runtime_,
      {
          RawEvent(
              "onScroll",
              std::make_shared<ValueFactoryEventPayload>(dummyValueFactory_),
              nullptr,
              RawEvent::Category::Continuous),
      });

  EXPECT_EQ(eventPriorities_.size(), 1);

  EXPECT_EQ(eventTypes_[0], "onScroll");
  EXPECT_EQ(eventPriorities_[0], ReactEventPriority::Default);
}

TEST_F(EventQueueProcessorTest, alwaysDiscreteEvent) {
  eventProcessor_->flushEvents(
      *runtime_,
      {
          RawEvent(
              "onChange",
              std::make_shared<ValueFactoryEventPayload>(dummyValueFactory_),
              nullptr,
              RawEvent::Category::Discrete),
      });

  EXPECT_EQ(eventPriorities_.size(), 1);

  EXPECT_EQ(eventTypes_[0], "onChange");
  EXPECT_EQ(eventPriorities_[0], ReactEventPriority::Discrete);
}

} // namespace facebook::react
