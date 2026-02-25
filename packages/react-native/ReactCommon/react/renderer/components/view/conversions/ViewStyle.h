/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <glog/logging.h>
#include <react/debug/react_native_expect.h>
#include <react/renderer/components/view/primitives.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/core/propsConversions.h>
#include <react/renderer/graphics/BlendMode.h>
#include <react/renderer/graphics/Isolation.h>
#include <string>

namespace facebook::react {

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, PointerEventsMode &result)
{
  result = PointerEventsMode::Auto;
  react_native_expect(value.hasType<std::string>());
  if (!value.hasType<std::string>()) {
    return;
  }
  auto stringValue = (std::string)value;
  if (stringValue == "auto") {
    result = PointerEventsMode::Auto;
    return;
  }
  if (stringValue == "none") {
    result = PointerEventsMode::None;
    return;
  }
  if (stringValue == "box-none") {
    result = PointerEventsMode::BoxNone;
    return;
  }
  if (stringValue == "box-only") {
    result = PointerEventsMode::BoxOnly;
    return;
  }
  LOG(ERROR) << "Could not parse PointerEventsMode:" << stringValue;
  react_native_expect(false);
}

inline std::string toString(PointerEventsMode value)
{
  switch (value) {
    case PointerEventsMode::Auto:
      return "auto";
    case PointerEventsMode::None:
      return "none";
    case PointerEventsMode::BoxNone:
      return "box-none";
    case PointerEventsMode::BoxOnly:
      return "box-only";
  }
}

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, BackfaceVisibility &result)
{
  result = BackfaceVisibility::Auto;
  react_native_expect(value.hasType<std::string>());
  if (!value.hasType<std::string>()) {
    return;
  }
  auto stringValue = (std::string)value;
  if (stringValue == "auto") {
    result = BackfaceVisibility::Auto;
    return;
  }
  if (stringValue == "visible") {
    result = BackfaceVisibility::Visible;
    return;
  }
  if (stringValue == "hidden") {
    result = BackfaceVisibility::Hidden;
    return;
  }
  LOG(ERROR) << "Could not parse BackfaceVisibility:" << stringValue;
  react_native_expect(false);
}

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, BorderCurve &result)
{
  result = BorderCurve::Circular;
  react_native_expect(value.hasType<std::string>());
  if (!value.hasType<std::string>()) {
    return;
  }
  auto stringValue = (std::string)value;
  if (stringValue == "circular") {
    result = BorderCurve::Circular;
    return;
  }
  if (stringValue == "continuous") {
    result = BorderCurve::Continuous;
    return;
  }
  LOG(ERROR) << "Could not parse BorderCurve:" << stringValue;
  react_native_expect(false);
}

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, BorderStyle &result)
{
  result = BorderStyle::Solid;
  react_native_expect(value.hasType<std::string>());
  if (!value.hasType<std::string>()) {
    return;
  }
  auto stringValue = (std::string)value;
  if (stringValue == "solid") {
    result = BorderStyle::Solid;
    return;
  }
  if (stringValue == "dotted") {
    result = BorderStyle::Dotted;
    return;
  }
  if (stringValue == "dashed") {
    result = BorderStyle::Dashed;
    return;
  }
  LOG(ERROR) << "Could not parse BorderStyle:" << stringValue;
  react_native_expect(false);
}

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, OutlineStyle &result)
{
  result = OutlineStyle::Solid;
  react_native_expect(value.hasType<std::string>());
  if (!value.hasType<std::string>()) {
    return;
  }
  auto stringValue = (std::string)value;
  if (stringValue == "solid") {
    result = OutlineStyle::Solid;
    return;
  }
  if (stringValue == "dotted") {
    result = OutlineStyle::Dotted;
    return;
  }
  if (stringValue == "dashed") {
    result = OutlineStyle::Dashed;
    return;
  }
  LOG(ERROR) << "Could not parse OutlineStyle:" << stringValue;
  react_native_expect(false);
}

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, Cursor &result)
{
  result = Cursor::Auto;
  react_native_expect(value.hasType<std::string>());
  if (!value.hasType<std::string>()) {
    return;
  }
  auto stringValue = (std::string)value;
  if (stringValue == "alias") {
    result = Cursor::Alias;
    return;
  }
  if (stringValue == "all-scroll") {
    result = Cursor::AllScroll;
    return;
  }
  if (stringValue == "auto") {
    result = Cursor::Auto;
    return;
  }
  if (stringValue == "cell") {
    result = Cursor::Cell;
    return;
  }
  if (stringValue == "col-resize") {
    result = Cursor::ColResize;
    return;
  }
  if (stringValue == "context-menu") {
    result = Cursor::ContextMenu;
    return;
  }
  if (stringValue == "copy") {
    result = Cursor::Copy;
    return;
  }
  if (stringValue == "crosshair") {
    result = Cursor::Crosshair;
    return;
  }
  if (stringValue == "default") {
    result = Cursor::Default;
    return;
  }
  if (stringValue == "e-resize") {
    result = Cursor::EResize;
    return;
  }
  if (stringValue == "ew-resize") {
    result = Cursor::EWResize;
    return;
  }
  if (stringValue == "grab") {
    result = Cursor::Grab;
    return;
  }
  if (stringValue == "grabbing") {
    result = Cursor::Grabbing;
    return;
  }
  if (stringValue == "help") {
    result = Cursor::Help;
    return;
  }
  if (stringValue == "move") {
    result = Cursor::Move;
    return;
  }
  if (stringValue == "n-resize") {
    result = Cursor::NResize;
    return;
  }
  if (stringValue == "ne-resize") {
    result = Cursor::NEResize;
    return;
  }
  if (stringValue == "nesw-resize") {
    result = Cursor::NESWResize;
    return;
  }
  if (stringValue == "ns-resize") {
    result = Cursor::NSResize;
    return;
  }
  if (stringValue == "nw-resize") {
    result = Cursor::NWResize;
    return;
  }
  if (stringValue == "nwse-resize") {
    result = Cursor::NWSEResize;
    return;
  }
  if (stringValue == "no-drop") {
    result = Cursor::NoDrop;
    return;
  }
  if (stringValue == "none") {
    result = Cursor::None;
    return;
  }
  if (stringValue == "not-allowed") {
    result = Cursor::NotAllowed;
    return;
  }
  if (stringValue == "pointer") {
    result = Cursor::Pointer;
    return;
  }
  if (stringValue == "progress") {
    result = Cursor::Progress;
    return;
  }
  if (stringValue == "row-resize") {
    result = Cursor::RowResize;
    return;
  }
  if (stringValue == "s-resize") {
    result = Cursor::SResize;
    return;
  }
  if (stringValue == "se-resize") {
    result = Cursor::SEResize;
    return;
  }
  if (stringValue == "sw-resize") {
    result = Cursor::SWResize;
    return;
  }
  if (stringValue == "text") {
    result = Cursor::Text;
    return;
  }
  if (stringValue == "url") {
    result = Cursor::Url;
    return;
  }
  if (stringValue == "w-resize") {
    result = Cursor::WResize;
    return;
  }
  if (stringValue == "wait") {
    result = Cursor::Wait;
    return;
  }
  if (stringValue == "zoom-in") {
    result = Cursor::ZoomIn;
    return;
  }
  if (stringValue == "zoom-out") {
    result = Cursor::ZoomOut;
    return;
  }
  LOG(ERROR) << "Could not parse Cursor:" << stringValue;
  react_native_expect(false);
}

inline void fromRawValue(const PropsParserContext & /*context*/, const RawValue &value, LayoutConformance &result)
{
  react_native_expect(value.hasType<std::string>());
  result = LayoutConformance::Strict;
  if (!value.hasType<std::string>()) {
    return;
  }

  auto stringValue = (std::string)value;
  if (stringValue == "strict") {
    result = LayoutConformance::Strict;
  } else if (stringValue == "compatibility") {
    result = LayoutConformance::Compatibility;
  } else {
    LOG(ERROR) << "Unexpected LayoutConformance value:" << stringValue;
    react_native_expect(false);
  }
}

inline void fromRawValue(const PropsParserContext & /*context*/, const RawValue &value, BlendMode &result)
{
  react_native_expect(value.hasType<std::string>());
  result = BlendMode::Normal;
  if (!value.hasType<std::string>()) {
    return;
  }

  auto rawBlendMode = static_cast<std::string>(value);
  std::optional<BlendMode> blendMode = blendModeFromString(rawBlendMode);

  if (!blendMode) {
    LOG(ERROR) << "Could not parse blend mode: " << rawBlendMode;
    return;
  }

  result = blendMode.value();
}

inline void fromRawValue(const PropsParserContext & /*context*/, const RawValue &value, Isolation &result)
{
  react_native_expect(value.hasType<std::string>());
  result = Isolation::Auto;
  if (!value.hasType<std::string>()) {
    return;
  }

  auto rawIsolation = static_cast<std::string>(value);
  std::optional<Isolation> isolation = isolationFromString(rawIsolation);

  if (!isolation) {
    LOG(ERROR) << "Could not parse isolation: " << rawIsolation;
    return;
  }

  result = isolation.value();
}

// This can be deleted when non-iterator ViewProp parsing is deleted
template <typename T>
static inline CascadedRectangleCorners<T> convertRawProp(
    const PropsParserContext &context,
    const RawProps &rawProps,
    const char *prefix,
    const char *suffix,
    const CascadedRectangleCorners<T> &sourceValue,
    const CascadedRectangleCorners<T> &defaultValue)
{
  CascadedRectangleCorners<T> result;

  result.topLeft =
      convertRawProp(context, rawProps, "TopLeft", sourceValue.topLeft, defaultValue.topLeft, prefix, suffix);
  result.topRight =
      convertRawProp(context, rawProps, "TopRight", sourceValue.topRight, defaultValue.topRight, prefix, suffix);
  result.bottomLeft =
      convertRawProp(context, rawProps, "BottomLeft", sourceValue.bottomLeft, defaultValue.bottomLeft, prefix, suffix);
  result.bottomRight = convertRawProp(
      context, rawProps, "BottomRight", sourceValue.bottomRight, defaultValue.bottomRight, prefix, suffix);

  result.topStart =
      convertRawProp(context, rawProps, "TopStart", sourceValue.topStart, defaultValue.topStart, prefix, suffix);
  result.topEnd = convertRawProp(context, rawProps, "TopEnd", sourceValue.topEnd, defaultValue.topEnd, prefix, suffix);
  result.bottomStart = convertRawProp(
      context, rawProps, "BottomStart", sourceValue.bottomStart, defaultValue.bottomStart, prefix, suffix);
  result.bottomEnd =
      convertRawProp(context, rawProps, "BottomEnd", sourceValue.bottomEnd, defaultValue.bottomEnd, prefix, suffix);
  result.endEnd = convertRawProp(context, rawProps, "EndEnd", sourceValue.endEnd, defaultValue.endEnd, prefix, suffix);
  result.endStart =
      convertRawProp(context, rawProps, "EndStart", sourceValue.endStart, defaultValue.endStart, prefix, suffix);
  result.startEnd =
      convertRawProp(context, rawProps, "StartEnd", sourceValue.startEnd, defaultValue.startEnd, prefix, suffix);
  result.startStart =
      convertRawProp(context, rawProps, "StartStart", sourceValue.startStart, defaultValue.startStart, prefix, suffix);

  result.all = convertRawProp(context, rawProps, "", sourceValue.all, defaultValue.all, prefix, suffix);

  return result;
}

template <typename T>
static inline CascadedRectangleEdges<T> convertRawProp(
    const PropsParserContext &context,
    const RawProps &rawProps,
    const char *prefix,
    const char *suffix,
    const CascadedRectangleEdges<T> &sourceValue,
    const CascadedRectangleEdges<T> &defaultValue)
{
  CascadedRectangleEdges<T> result;

  result.left = convertRawProp(context, rawProps, "Left", sourceValue.left, defaultValue.left, prefix, suffix);
  result.right = convertRawProp(context, rawProps, "Right", sourceValue.right, defaultValue.right, prefix, suffix);
  result.top = convertRawProp(context, rawProps, "Top", sourceValue.top, defaultValue.top, prefix, suffix);
  result.bottom = convertRawProp(context, rawProps, "Bottom", sourceValue.bottom, defaultValue.bottom, prefix, suffix);

  result.start = convertRawProp(context, rawProps, "Start", sourceValue.start, defaultValue.start, prefix, suffix);
  result.end = convertRawProp(context, rawProps, "End", sourceValue.end, defaultValue.end, prefix, suffix);
  result.horizontal =
      convertRawProp(context, rawProps, "Horizontal", sourceValue.horizontal, defaultValue.horizontal, prefix, suffix);
  result.vertical =
      convertRawProp(context, rawProps, "Vertical", sourceValue.vertical, defaultValue.vertical, prefix, suffix);
  result.block = convertRawProp(context, rawProps, "Block", sourceValue.block, defaultValue.block, prefix, suffix);
  result.blockEnd =
      convertRawProp(context, rawProps, "BlockEnd", sourceValue.blockEnd, defaultValue.blockEnd, prefix, suffix);
  result.blockStart =
      convertRawProp(context, rawProps, "BlockStart", sourceValue.blockStart, defaultValue.blockStart, prefix, suffix);

  result.all = convertRawProp(context, rawProps, "", sourceValue.all, defaultValue.all, prefix, suffix);

  return result;
}

} // namespace facebook::react
