/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Timeline.h"

#include <react/renderer/uimanager/UIManager.h>

namespace facebook {
namespace react {

Timeline::Timeline(ShadowTree const &shadowTree) : shadowTree_(&shadowTree) {
  record(shadowTree.getCurrentRevision().rootShadowNode);
};

#pragma mark - Public

SurfaceId Timeline::getSurfaceId() const noexcept {
  return shadowTree_->getSurfaceId();
}

void Timeline::pause() const noexcept {
  std::lock_guard<std::recursive_mutex> lock(mutex_);
  assert(!paused_ && "");
  paused_ = true;
}

void Timeline::resume() const noexcept {
  std::lock_guard<std::recursive_mutex> lock(mutex_);

  if (snapshots_.size() > 0) {
    rewind(snapshots_.at(snapshots_.size() - 1));
  }

  assert(paused_ && "");
  paused_ = false;
}

bool Timeline::isPaused() const noexcept {
  std::lock_guard<std::recursive_mutex> lock(mutex_);
  return paused_;
}

TimelineFrame::List Timeline::getFrames() const noexcept {
  std::lock_guard<std::recursive_mutex> lock(mutex_);

  auto frames = TimelineFrame::List{};
  frames.reserve(snapshots_.size());
  for (auto const &snapshot : snapshots_) {
    frames.push_back(snapshot.getFrame());
  }
  return frames;
}

TimelineFrame Timeline::getCurrentFrame() const noexcept {
  assert(snapshots_.size() > currentSnapshotIndex_);
  return snapshots_.at(currentSnapshotIndex_).getFrame();
}

void Timeline::rewind(TimelineFrame const &frame) const noexcept {
  std::lock_guard<std::recursive_mutex> lock(mutex_);
  rewind(snapshots_.at(frame.getIndex()));
}

RootShadowNode::Unshared Timeline::shadowTreeWillCommit(
    ShadowTree const &shadowTree,
    RootShadowNode::Shared const &oldRootShadowNode,
    RootShadowNode::Unshared const &newRootShadowNode) const noexcept {
  std::lock_guard<std::recursive_mutex> lock(mutex_);

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
    RootShadowNode::Shared const &rootShadowNode) const noexcept {
  auto index = (int)snapshots_.size();
  snapshots_.push_back(TimelineSnapshot{rootShadowNode, index});

  if (!paused_) {
    currentSnapshotIndex_ = index;
  }
}

void Timeline::rewind(TimelineSnapshot const &snapshot) const noexcept {
  std::lock_guard<std::recursive_mutex> lock(mutex_);

  currentSnapshotIndex_ = snapshot.getFrame().getIndex();

  assert(!rewinding_ && "");
  rewinding_ = true;

  auto rootShadowNode = snapshot.getRootShadowNode();

  shadowTree_->commit(
      [&](RootShadowNode const &oldRootShadowNode) -> RootShadowNode::Unshared {
        return std::static_pointer_cast<RootShadowNode>(
            rootShadowNode->ShadowNode::clone({}));
      });

  assert(rewinding_ && "");
  rewinding_ = false;
}

} // namespace react
} // namespace facebook
