/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TimelineHandler.h"

#include <algorithm>

#include <react/renderer/timeline/Timeline.h>

namespace facebook::react {

TimelineHandler::TimelineHandler(const Timeline& timeline) noexcept
    : timeline_(&timeline) {}

TimelineHandler::TimelineHandler(TimelineHandler&& other) noexcept {
  this->operator=(std::move(other));
}

TimelineHandler::~TimelineHandler() noexcept {
  if (timeline_ != nullptr) {
    // Improper deallocation indicates a severe error in application logic:
    abort();
  }
}

TimelineHandler& TimelineHandler::operator=(TimelineHandler&& other) noexcept {
  assert(other.timeline_ && "Moving from an empty `TimelineHandler`.");
  timeline_ = other.timeline_;
  other.timeline_ = nullptr;
  return *this;
}

#pragma mark - Public

void TimelineHandler::pause() const noexcept {
  ensureNotEmpty();
  timeline_->pause();
}

void TimelineHandler::resume() const noexcept {
  ensureNotEmpty();
  timeline_->resume();
}

bool TimelineHandler::isPaused() const noexcept {
  ensureNotEmpty();
  return timeline_->isPaused();
}

TimelineFrame TimelineHandler::getCurrentFrame() const noexcept {
  ensureNotEmpty();
  return timeline_->getCurrentFrame();
}

TimelineFrame::List TimelineHandler::getFrames() const noexcept {
  ensureNotEmpty();
  return timeline_->getFrames();
}

void TimelineHandler::rewind(const TimelineFrame& frame) const noexcept {
  ensureNotEmpty();
  return timeline_->rewind(frame);
}

void TimelineHandler::seek(int delta) const noexcept {
  ensureNotEmpty();
  auto frames = timeline_->getFrames();
  auto currentFrame = timeline_->getCurrentFrame();
  auto seekFrameIndex = currentFrame.getIndex() + delta;
  seekFrameIndex =
      std::min((int)frames.size() - 1, std::max(0, seekFrameIndex));
  timeline_->rewind(frames.at(seekFrameIndex));
}

#pragma mark - Private

SurfaceId TimelineHandler::getSurfaceId() const noexcept {
  return timeline_->getSurfaceId();
}

void TimelineHandler::release() noexcept {
  timeline_ = nullptr;
}

void TimelineHandler::ensureNotEmpty() const noexcept {
  if (timeline_ == nullptr) {
    abort();
  }
}

} // namespace facebook::react
