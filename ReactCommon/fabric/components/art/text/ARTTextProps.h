/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/view/ViewProps.h>
#include <react/core/propsConversions.h>
#include <react/graphics/Color.h>
#include <vector>

namespace facebook {
namespace react {

struct ARTTextFrameFontStruct {
  Float fontSize;
  std::string fontStyle;
  std::string fontFamily;
  std::string fontWeight;
};

static inline void fromRawValue(
    const RawValue &value,
    ARTTextFrameFontStruct &result) {
  auto map = (better::map<std::string, RawValue>)value;

  auto fontSize = map.find("fontSize");
  if (fontSize != map.end()) {
    fromRawValue(fontSize->second, result.fontSize);
  }
  auto fontStyle = map.find("fontStyle");
  if (fontStyle != map.end()) {
    fromRawValue(fontStyle->second, result.fontStyle);
  }
  auto fontFamily = map.find("fontFamily");
  if (fontFamily != map.end()) {
    fromRawValue(fontFamily->second, result.fontFamily);
  }
  auto fontWeight = map.find("fontWeight");
  if (fontWeight != map.end()) {
    fromRawValue(fontWeight->second, result.fontWeight);
  }
}

static inline std::string toString(const ARTTextFrameFontStruct &value) {
  return "[Object ARTTextFrameFontStruct]";
}

struct ARTTextFrameStruct {
  std::vector<std::string> lines;
  ARTTextFrameFontStruct font;
};

static inline void fromRawValue(
    const RawValue &value,
    ARTTextFrameStruct &result) {
  auto map = (better::map<std::string, RawValue>)value;

  auto lines = map.find("lines");
  if (lines != map.end()) {
    fromRawValue(lines->second, result.lines);
  }
  auto font = map.find("font");
  if (font != map.end()) {
    fromRawValue(font->second, result.font);
  }
}

static inline std::string toString(const ARTTextFrameStruct &value) {
  return "[Object ARTTextFrameStruct]";
}

class ARTTextProps;

using SharedARTTextProps = std::shared_ptr<const ARTTextProps>;

class ARTTextProps : public Props {
 public:
  ARTTextProps() = default;
  ARTTextProps(const ARTTextProps &sourceProps, const RawProps &rawProps);

#pragma mark - Props

  Float opacity{1.0};
  std::vector<Float> transform{};
  std::vector<Float> d{};
  std::vector<Float> stroke{};
  std::vector<Float> strokeDash{};
  std::vector<Float> fill{};
  Float strokeWidth{1.0};
  int strokeCap{1};
  int strokeJoin{1};
  int aligment{0};
  ARTTextFrameStruct frame{};

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif
};

} // namespace react
} // namespace facebook
