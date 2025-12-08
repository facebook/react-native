/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <react/renderer/components/view/BaseViewProps.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/UIManagerCommitHook.h>
#include "AnimatedProps.h"

namespace facebook::react {

struct PropsSnapshot {
  BaseViewProps props;
  std::unordered_set<PropName> propNames;
};

struct SurfaceContext {
  std::unordered_map<Tag, std::unique_ptr<PropsSnapshot>> pendingMap, map;
  std::unordered_set<const ShadowNodeFamily *> pendingFamilies, families;
};

struct SurfaceUpdates {
  std::unordered_set<const ShadowNodeFamily *> families;
  std::unordered_map<Tag, AnimatedProps> propsMap;
};

using SnapshotMap = std::unordered_map<Tag, std::unique_ptr<PropsSnapshot>>;

class AnimatedPropsRegistry {
 public:
  void update(const std::unordered_map<SurfaceId, SurfaceUpdates> &surfaceUpdates);
  void clear(SurfaceId surfaceId);
  std::pair<std::unordered_set<const ShadowNodeFamily *> &, SnapshotMap &> getMap(SurfaceId surfaceId);

 private:
  std::unordered_map<SurfaceId, SurfaceContext> surfaceContexts_;
  std::mutex mutex_;
};

inline void updateProp(const PropName propName, BaseViewProps &viewProps, const PropsSnapshot &snapshot)
{
  switch (propName) {
    case OPACITY:
      viewProps.opacity = snapshot.props.opacity;
      break;

    case WIDTH:
      viewProps.yogaStyle.setDimension(
          yoga::Dimension::Width, snapshot.props.yogaStyle.dimension(yoga::Dimension::Width));
      break;

    case HEIGHT: {
      auto d = snapshot.props.yogaStyle.dimension(yoga::Dimension::Height);
      viewProps.yogaStyle.setDimension(yoga::Dimension::Height, d);
      break;
    }

    case TRANSFORM:
      viewProps.transform = snapshot.props.transform;
      break;

    case BORDER_RADII:
      viewProps.borderRadii = snapshot.props.borderRadii;
      break;

    case FLEX:
      viewProps.yogaStyle.setFlex(snapshot.props.yogaStyle.flex());
      break;

    case BACKGROUND_COLOR:
      viewProps.backgroundColor = snapshot.props.backgroundColor;
      break;
  }
}

} // namespace facebook::react
