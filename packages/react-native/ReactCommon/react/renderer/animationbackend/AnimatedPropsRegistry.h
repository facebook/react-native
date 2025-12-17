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

    case SHADOW_COLOR:
      viewProps.shadowColor = snapshot.props.shadowColor;
      break;

    case SHADOW_OFFSET:
      viewProps.shadowOffset = snapshot.props.shadowOffset;
      break;

    case SHADOW_OPACITY:
      viewProps.shadowOpacity = snapshot.props.shadowOpacity;
      break;

    case SHADOW_RADIUS:
      viewProps.shadowRadius = snapshot.props.shadowRadius;
      break;

    case MARGIN:
      viewProps.yogaStyle.setMargin(yoga::Edge::Left, snapshot.props.yogaStyle.margin(yoga::Edge::Left));
      viewProps.yogaStyle.setMargin(yoga::Edge::Right, snapshot.props.yogaStyle.margin(yoga::Edge::Right));
      viewProps.yogaStyle.setMargin(yoga::Edge::Top, snapshot.props.yogaStyle.margin(yoga::Edge::Top));
      viewProps.yogaStyle.setMargin(yoga::Edge::Bottom, snapshot.props.yogaStyle.margin(yoga::Edge::Bottom));
      viewProps.yogaStyle.setMargin(yoga::Edge::Start, snapshot.props.yogaStyle.margin(yoga::Edge::Start));
      viewProps.yogaStyle.setMargin(yoga::Edge::End, snapshot.props.yogaStyle.margin(yoga::Edge::End));
      viewProps.yogaStyle.setMargin(yoga::Edge::Horizontal, snapshot.props.yogaStyle.margin(yoga::Edge::Horizontal));
      viewProps.yogaStyle.setMargin(yoga::Edge::Vertical, snapshot.props.yogaStyle.margin(yoga::Edge::Vertical));
      break;

    case PADDING:
      viewProps.yogaStyle.setPadding(yoga::Edge::Left, snapshot.props.yogaStyle.padding(yoga::Edge::Left));
      viewProps.yogaStyle.setPadding(yoga::Edge::Right, snapshot.props.yogaStyle.padding(yoga::Edge::Right));
      viewProps.yogaStyle.setPadding(yoga::Edge::Top, snapshot.props.yogaStyle.padding(yoga::Edge::Top));
      viewProps.yogaStyle.setPadding(yoga::Edge::Bottom, snapshot.props.yogaStyle.padding(yoga::Edge::Bottom));
      viewProps.yogaStyle.setPadding(yoga::Edge::Start, snapshot.props.yogaStyle.padding(yoga::Edge::Start));
      viewProps.yogaStyle.setPadding(yoga::Edge::End, snapshot.props.yogaStyle.padding(yoga::Edge::End));
      viewProps.yogaStyle.setPadding(yoga::Edge::Horizontal, snapshot.props.yogaStyle.padding(yoga::Edge::Horizontal));
      viewProps.yogaStyle.setPadding(yoga::Edge::Vertical, snapshot.props.yogaStyle.padding(yoga::Edge::Vertical));
      break;

    case POSITION:
      viewProps.yogaStyle.setPosition(yoga::Edge::Left, snapshot.props.yogaStyle.position(yoga::Edge::Left));
      viewProps.yogaStyle.setPosition(yoga::Edge::Right, snapshot.props.yogaStyle.position(yoga::Edge::Right));
      viewProps.yogaStyle.setPosition(yoga::Edge::Top, snapshot.props.yogaStyle.position(yoga::Edge::Top));
      viewProps.yogaStyle.setPosition(yoga::Edge::Bottom, snapshot.props.yogaStyle.position(yoga::Edge::Bottom));
      viewProps.yogaStyle.setPosition(yoga::Edge::Start, snapshot.props.yogaStyle.position(yoga::Edge::Start));
      viewProps.yogaStyle.setPosition(yoga::Edge::End, snapshot.props.yogaStyle.position(yoga::Edge::End));
      viewProps.yogaStyle.setPosition(
          yoga::Edge::Horizontal, snapshot.props.yogaStyle.position(yoga::Edge::Horizontal));
      viewProps.yogaStyle.setPosition(yoga::Edge::Vertical, snapshot.props.yogaStyle.position(yoga::Edge::Vertical));
      break;

    case BORDER_WIDTH:
      viewProps.yogaStyle.setBorder(yoga::Edge::Left, snapshot.props.yogaStyle.border(yoga::Edge::Left));
      viewProps.yogaStyle.setBorder(yoga::Edge::Right, snapshot.props.yogaStyle.border(yoga::Edge::Right));
      viewProps.yogaStyle.setBorder(yoga::Edge::Top, snapshot.props.yogaStyle.border(yoga::Edge::Top));
      viewProps.yogaStyle.setBorder(yoga::Edge::Bottom, snapshot.props.yogaStyle.border(yoga::Edge::Bottom));
      viewProps.yogaStyle.setBorder(yoga::Edge::Start, snapshot.props.yogaStyle.border(yoga::Edge::Start));
      viewProps.yogaStyle.setBorder(yoga::Edge::End, snapshot.props.yogaStyle.border(yoga::Edge::End));
      viewProps.yogaStyle.setBorder(yoga::Edge::Horizontal, snapshot.props.yogaStyle.border(yoga::Edge::Horizontal));
      viewProps.yogaStyle.setBorder(yoga::Edge::Vertical, snapshot.props.yogaStyle.border(yoga::Edge::Vertical));
      break;

    case BORDER_COLOR:
      viewProps.borderColors = snapshot.props.borderColors;
      break;

    case FILTER:
      viewProps.filter = snapshot.props.filter;
      break;
  }
}

} // namespace facebook::react
