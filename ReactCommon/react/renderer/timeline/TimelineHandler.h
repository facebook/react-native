/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/LayoutPrimitives.h>
#include <react/renderer/timeline/TimelineFrame.h>
#include <react/renderer/uimanager/UIManagerCommitHook.h>

namespace facebook {
namespace react {

class Timeline;

class TimelineHandler final {
 public:
  ~TimelineHandler() noexcept;

  /*
   * Movable, not copyable.
   */
  TimelineHandler(TimelineHandler &&other) noexcept;
  TimelineHandler(TimelineHandler const &timelineHandler) = delete;
  TimelineHandler &operator=(TimelineHandler &&other) noexcept;
  TimelineHandler &operator=(TimelineHandler const &other) = delete;

  /*
   * Stops (or resumes) mounting of new commits.
   * A surface has to be paused to allow rewinding the UI to some past commit.
   */
  void pause() const noexcept;
  void resume() const noexcept;
  bool isPaused() const noexcept;

  /*
   * Provides access to recorded frames.
   */
  TimelineFrame::List getFrames() const noexcept;
  TimelineFrame getCurrentFrame() const noexcept;

  /*
   * Rewinds the UI to a given frame.
   */
  void rewind(TimelineFrame const &frame) const noexcept;

  /*
   * Rewinds the UI for a given number of frames back or forward.
   */
  void seek(int delta) const noexcept;

 private:
  friend class TimelineController;

  /*
   * Can only be constructed by `TimelineController`.
   */
  TimelineHandler(Timeline const &timeline) noexcept;

  /*
   * Must be called before deallocation to make it not crash.
   * Must be only called by `TimelineController`.
   */
  void release() noexcept;

  /*
   * Returns a `SurfaceId` of the assigned Surface.
   */
  SurfaceId getSurfaceId() const noexcept;

  void ensureNotEmpty() const noexcept;

  Timeline const *timeline_{};
};

} // namespace react
} // namespace facebook
