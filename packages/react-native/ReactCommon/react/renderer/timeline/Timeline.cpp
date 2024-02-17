/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Timeline.h"

#include <react/renderer/uimanager/UIManager.h>

namespace facebook::react {

Timeline::Timeline(const ShadowTree& shadowTree) : shadowTree_(&shadowTree) {
  record(shadowTree.getCurrentRevision().rootShadowNode);
};

#pragma mark - Public

SurfaceId Timeline::getSurfaceId() const noexcept {
  return shadowTree_->getSurfaceId();
}

void Timeline::pause() const noexcept {
  std::scoped_lock lock(mutex_);
  assert(!paused_ && "");
  paused_ = true;
}

void Timeline::resume() const noexcept {
  std::scoped_lock lock(mutex_);

  if (!snapshots_.empty()) {
    rewind(snapshots_.at(snapshots_.size() - 1));
  }

  assert(paused_ && "");
  paused_ = false;
}

bool Timeline::isPaused() const noexcept {
  std::scoped_lock lock(mutex_);
  return paused_;
}

TimelineFrame::List Timeline::getFrames() const noexcept {
  std::scoped_lock lock(mutex_);

  auto frames = TimelineFrame::List{};
  frames.reserve(snapshots_.size());
  for (const auto& snapshot : snapshots_) {
    frames.push_back(snapshot.getFrame());
  }
  return frames;
}

TimelineFrame Timeline::getCurrentFrame() const noexcept {
  assert(snapshots_.size() > currentSnapshotIndex_);
  return snapshots_.at(currentSnapshotIndex_).getFrame();
}

void Timeline::rewind(const TimelineFrame& frame) const noexcept {
  std::scoped_lock lock(mutex_);
  rewind(snapshots_.at(frame.getIndex()));
}

RootShadowNode::Unshared Timeline::shadowTreeWillCommit(
    const ShadowTree& /*shadowTree*/,
    const RootShadowNode::Shared& /*oldRootShadowNode*/,
    const RootShadowNode::Unshared& newRootShadowNode) const noexcept {
  std::scoped_lock lock(mutex_);

  if (rewinding_) {
    return newRootShadowNode;
  }

  record(newRootShadowNode);

  if (paused_) {
    return nullptr;
  }

  return newRootShadowNode;
}

#pragma mark - Private & Internal

void Timeline::record(
    const RootShadowNode::Shared& rootShadowNode) const noexcept {
  auto index = (int)snapshots_.size();
  snapshots_.push_back(TimelineSnapshot{rootShadowNode, index});

  if (!paused_) {
    currentSnapshotIndex_ = index;
  }
}

void Timeline::rewind(const TimelineSnapshot& snapshot) const noexcept {
  std::scoped_lock lock(mutex_);

  currentSnapshotIndex_ = snapshot.getFrame().getIndex();

  assert(!rewinding_ && "");
  rewinding_ = true;

  auto rootShadowNode = snapshot.getRootShadowNode();

  shadowTree_->commit(
      [&](const RootShadowNode& /*oldRootShadowNode*/)
          -> RootShadowNode::Unshared {
        return std::static_pointer_cast<RootShadowNode>(
            rootShadowNode->ShadowNode::clone({}));
      },
      {});

  assert(rewinding_ && "");
  rewinding_ = false;
}

} // namespace facebook::react
