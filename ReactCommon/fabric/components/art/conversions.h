/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <Glog/logging.h>
#include <folly/dynamic.h>
#include <react/components/art/ARTGroup.h>
#include <react/components/art/ARTShape.h>
#include <react/components/art/ARTSurfaceViewState.h>
#include <react/components/art/ARTText.h>
#include <react/components/art/primitives.h>

namespace facebook {
namespace react {

#ifdef ANDROID

inline folly::dynamic toDynamic(ARTGroup const &group);
inline folly::dynamic toDynamic(ARTShape const &shape);
inline folly::dynamic toDynamic(ARTText const &text);
inline folly::dynamic toDynamic(ARTElement const &element);

inline folly::dynamic toDynamic(std::vector<Float> const &elements) {
  folly::dynamic result = folly::dynamic::array();
  for (auto const &element : elements) {
    result.push_back(element);
  }
  return result;
}

inline void addOptionalKey(
    folly::dynamic &map,
    std::string const &key,
    std::vector<Float> const &values) {
  if (values.size() > 0) {
    map[key] = toDynamic(values);
  }
}

inline folly::dynamic toDynamic(ARTElement::ListOfShared const &elements) {
  folly::dynamic children = folly::dynamic::array();
  for (auto const &element : elements) {
    children.push_back(element->getDynamic());
  }
  return children;
}

inline folly::dynamic toDynamic(ARTGroup const &group) {
  folly::dynamic result = folly::dynamic::object();
  result["opacity"] = group.opacity;
  result["type"] = 1;
  if (group.elements.size() > 0) {
    result["elements"] = toDynamic(group.elements);
  }
  addOptionalKey(result, "clipping", group.clipping);
  result["transform"] = toDynamic(group.transform);
  return result;
}

inline folly::dynamic toDynamic(ARTShape const &shape) {
  folly::dynamic result = folly::dynamic::object();
  result["type"] = 2;
  result["opacity"] = shape.opacity;
  result["transform"] = toDynamic(shape.transform);
  addOptionalKey(result, "d", shape.d);
  addOptionalKey(result, "stroke", shape.stroke);
  addOptionalKey(result, "strokeDash", shape.strokeDash);
  addOptionalKey(result, "fill", shape.fill);
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
  folly::dynamic font = folly::dynamic::object();
  font["fontSize"] = frame.font.fontSize;
  font["fontStyle"] = frame.font.fontStyle;
  font["fontFamily"] = frame.font.fontFamily;
  font["fontWeight"] = frame.font.fontWeight;
  result["font"] = font;
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

inline folly::dynamic toDynamic(ARTText const &text) {
  folly::dynamic result = folly::dynamic::object();
  result["type"] = 3;
  result["opacity"] = text.opacity;
  result["transform"] = toDynamic(text.transform);
  addOptionalKey(result, "d", text.d);
  addOptionalKey(result, "stroke", text.stroke);
  addOptionalKey(result, "strokeDash", text.strokeDash);
  addOptionalKey(result, "fill", text.fill);
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
