/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <Glog/logging.h>
#include <folly/dynamic.h>
#include <react/components/art/ARTSurfaceViewState.h>
#include <react/components/art/Group.h>
#include <react/components/art/Shape.h>
#include <react/components/art/Text.h>
#include <react/components/art/primitives.h>

namespace facebook {
namespace react {

#ifdef ANDROID

inline folly::dynamic toDynamic(Group const &group);
inline folly::dynamic toDynamic(Shape const &shape);
inline folly::dynamic toDynamic(Text const &text);
inline folly::dynamic toDynamic(Element const &element);

inline folly::dynamic toDynamic(std::vector<Float> const &elements) {
  folly::dynamic result = folly::dynamic::array();
  for (auto const &element : elements) {
    result.push_back(element);
  }
  return result;
}

inline folly::dynamic toDynamic(Element::ListOfShared const &elements) {
  folly::dynamic children = folly::dynamic::array();
  for (auto const &element : elements) {
    children.push_back(element->getDynamic());
  }
  return children;
}

inline folly::dynamic toDynamic(Group const &group) {
  folly::dynamic result = folly::dynamic::object();
  result["opacity"] = group.opacity;
  result["type"] = 1;
  if (group.elements.size() > 0) {
    result["elements"] = toDynamic(group.elements);
  }
  result["transform"] = toDynamic(group.transform);
  return result;
}

inline folly::dynamic toDynamic(Shape const &shape) {
  folly::dynamic result = folly::dynamic::object();
  result["type"] = 2;
  result["opacity"] = shape.opacity;
  result["transform"] = toDynamic(shape.transform);
  result["d"] = toDynamic(shape.d);
  result["stroke"] = toDynamic(shape.stroke);
  result["strokeDash"] = toDynamic(shape.strokeDash);
  result["fill"] = toDynamic(shape.fill);
  result["strokeWidth"] = shape.strokeWidth;
  result["strokeCap"] = shape.strokeCap;
  result["strokeJoin"] = shape.strokeJoin;
  return result;
}

inline folly::dynamic toDynamic(ARTTextAlignment const &aligment) {
  switch (aligment) {
    case ARTTextAlignment::Right:
      return 1;
      break;
    case ARTTextAlignment::Center:
      return 2;
      break;
    case ARTTextAlignment::Default:
    default:
      return 0;
      break;
  }
}

inline folly::dynamic toDynamic(ARTTextFrame const &frame) {
  folly::dynamic result = folly::dynamic::object();
  result["fontSize"] = frame.font.fontSize;
  result["fontStyle"] = frame.font.fontStyle;
  result["fontFamily"] = frame.font.fontFamily;
  result["fontWeight"] = frame.font.fontWeight;
  auto lines = frame.lines;
  if (lines.size() > 0) {
    folly::dynamic serializedLines = folly::dynamic::array();
    for (int i = 0; i < lines.size(); i++) {
      serializedLines.push_back(lines[i]);
    }
    result["lines"] = serializedLines;
  }
  return result;
}

inline folly::dynamic toDynamic(Text const &text) {
  folly::dynamic result = folly::dynamic::object();
  result["type"] = 3;
  result["opacity"] = text.opacity;
  result["transform"] = toDynamic(text.transform);
  result["d"] = toDynamic(text.d);
  result["stroke"] = toDynamic(text.stroke);
  result["strokeDash"] = toDynamic(text.strokeDash);
  result["fill"] = toDynamic(text.fill);
  result["strokeWidth"] = text.strokeWidth;
  result["strokeCap"] = text.strokeCap;
  result["strokeJoin"] = text.strokeJoin;
  result["alignment"] = toDynamic(text.alignment);
  result["frame"] = toDynamic(text.frame);
  return result;
}

inline folly::dynamic toDynamic(ARTSurfaceViewState const &surfaceViewState) {
  folly::dynamic result = folly::dynamic::object();
  result["elements"] = toDynamic(surfaceViewState.elements);
  return result;
}
#endif

} // namespace react
} // namespace facebook
