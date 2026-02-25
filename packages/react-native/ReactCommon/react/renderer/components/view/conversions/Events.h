/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/view/primitives.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/core/propsConversions.h>

namespace facebook::react {

// This can be deleted when non-iterator ViewProp parsing is deleted
static inline ViewEvents convertRawProp(
    const PropsParserContext &context,
    const RawProps &rawProps,
    const ViewEvents &sourceValue,
    const ViewEvents &defaultValue)
{
  ViewEvents result{};
  using Offset = ViewEvents::Offset;

  result[Offset::PointerEnter] = convertRawProp(
      context, rawProps, "onPointerEnter", sourceValue[Offset::PointerEnter], defaultValue[Offset::PointerEnter]);
  result[Offset::PointerMove] = convertRawProp(
      context, rawProps, "onPointerMove", sourceValue[Offset::PointerMove], defaultValue[Offset::PointerMove]);
  result[Offset::PointerLeave] = convertRawProp(
      context, rawProps, "onPointerLeave", sourceValue[Offset::PointerLeave], defaultValue[Offset::PointerLeave]);

  // Experimental W3C Pointer callbacks
  result[Offset::PointerEnterCapture] = convertRawProp(
      context,
      rawProps,
      "onPointerEnterCapture",
      sourceValue[Offset::PointerEnterCapture],
      defaultValue[Offset::PointerEnterCapture]);
  result[Offset::PointerMoveCapture] = convertRawProp(
      context,
      rawProps,
      "onPointerMoveCapture",
      sourceValue[Offset::PointerMoveCapture],
      defaultValue[Offset::PointerMoveCapture]);
  result[Offset::PointerLeaveCapture] = convertRawProp(
      context,
      rawProps,
      "onPointerLeaveCapture",
      sourceValue[Offset::PointerLeaveCapture],
      defaultValue[Offset::PointerLeaveCapture]);
  result[Offset::PointerOver] = convertRawProp(
      context, rawProps, "onPointerOver", sourceValue[Offset::PointerOver], defaultValue[Offset::PointerOver]);
  result[Offset::PointerOverCapture] = convertRawProp(
      context,
      rawProps,
      "onPointerOverCapture",
      sourceValue[Offset::PointerOverCapture],
      defaultValue[Offset::PointerOverCapture]);
  result[Offset::PointerOut] = convertRawProp(
      context, rawProps, "onPointerOut", sourceValue[Offset::PointerOut], defaultValue[Offset::PointerOut]);
  result[Offset::PointerOutCapture] = convertRawProp(
      context,
      rawProps,
      "onPointerOutCapture",
      sourceValue[Offset::PointerOutCapture],
      defaultValue[Offset::PointerOutCapture]);
  result[Offset::Click] =
      convertRawProp(context, rawProps, "onClick", sourceValue[Offset::Click], defaultValue[Offset::Click]);
  result[Offset::ClickCapture] = convertRawProp(
      context, rawProps, "onClickCapture", sourceValue[Offset::ClickCapture], defaultValue[Offset::ClickCapture]);
  result[Offset::PointerDown] = convertRawProp(
      context, rawProps, "onPointerDown", sourceValue[Offset::PointerDown], defaultValue[Offset::PointerDown]);
  result[Offset::PointerDownCapture] = convertRawProp(
      context,
      rawProps,
      "onPointerDownCapture",
      sourceValue[Offset::PointerDownCapture],
      defaultValue[Offset::PointerDownCapture]);
  result[Offset::PointerUp] =
      convertRawProp(context, rawProps, "onPointerUp", sourceValue[Offset::PointerUp], defaultValue[Offset::PointerUp]);
  result[Offset::PointerUpCapture] = convertRawProp(
      context,
      rawProps,
      "onPointerUpCapture",
      sourceValue[Offset::PointerUpCapture],
      defaultValue[Offset::PointerUpCapture]);
  // TODO: gotPointerCapture & lostPointerCapture

  // PanResponder callbacks
  result[Offset::MoveShouldSetResponder] = convertRawProp(
      context,
      rawProps,
      "onMoveShouldSetResponder",
      sourceValue[Offset::MoveShouldSetResponder],
      defaultValue[Offset::MoveShouldSetResponder]);
  result[Offset::MoveShouldSetResponderCapture] = convertRawProp(
      context,
      rawProps,
      "onMoveShouldSetResponderCapture",
      sourceValue[Offset::MoveShouldSetResponderCapture],
      defaultValue[Offset::MoveShouldSetResponderCapture]);
  result[Offset::StartShouldSetResponder] = convertRawProp(
      context,
      rawProps,
      "onStartShouldSetResponder",
      sourceValue[Offset::StartShouldSetResponder],
      defaultValue[Offset::StartShouldSetResponder]);
  result[Offset::StartShouldSetResponderCapture] = convertRawProp(
      context,
      rawProps,
      "onStartShouldSetResponderCapture",
      sourceValue[Offset::StartShouldSetResponderCapture],
      defaultValue[Offset::StartShouldSetResponderCapture]);
  result[Offset::ResponderGrant] = convertRawProp(
      context, rawProps, "onResponderGrant", sourceValue[Offset::ResponderGrant], defaultValue[Offset::ResponderGrant]);
  result[Offset::ResponderReject] = convertRawProp(
      context,
      rawProps,
      "onResponderReject",
      sourceValue[Offset::ResponderReject],
      defaultValue[Offset::ResponderReject]);
  result[Offset::ResponderStart] = convertRawProp(
      context, rawProps, "onResponderStart", sourceValue[Offset::ResponderStart], defaultValue[Offset::ResponderStart]);
  result[Offset::ResponderEnd] = convertRawProp(
      context, rawProps, "onResponderEnd", sourceValue[Offset::ResponderEnd], defaultValue[Offset::ResponderEnd]);
  result[Offset::ResponderRelease] = convertRawProp(
      context,
      rawProps,
      "onResponderRelease",
      sourceValue[Offset::ResponderRelease],
      defaultValue[Offset::ResponderRelease]);
  result[Offset::ResponderMove] = convertRawProp(
      context, rawProps, "onResponderMove", sourceValue[Offset::ResponderMove], defaultValue[Offset::ResponderMove]);
  result[Offset::ResponderTerminate] = convertRawProp(
      context,
      rawProps,
      "onResponderTerminate",
      sourceValue[Offset::ResponderTerminate],
      defaultValue[Offset::ResponderTerminate]);
  result[Offset::ResponderTerminationRequest] = convertRawProp(
      context,
      rawProps,
      "onResponderTerminationRequest",
      sourceValue[Offset::ResponderTerminationRequest],
      defaultValue[Offset::ResponderTerminationRequest]);
  result[Offset::ShouldBlockNativeResponder] = convertRawProp(
      context,
      rawProps,
      "onShouldBlockNativeResponder",
      sourceValue[Offset::ShouldBlockNativeResponder],
      defaultValue[Offset::ShouldBlockNativeResponder]);

  // Touch events
  result[Offset::TouchStart] = convertRawProp(
      context, rawProps, "onTouchStart", sourceValue[Offset::TouchStart], defaultValue[Offset::TouchStart]);
  result[Offset::TouchMove] =
      convertRawProp(context, rawProps, "onTouchMove", sourceValue[Offset::TouchMove], defaultValue[Offset::TouchMove]);
  result[Offset::TouchEnd] =
      convertRawProp(context, rawProps, "onTouchEnd", sourceValue[Offset::TouchEnd], defaultValue[Offset::TouchEnd]);
  result[Offset::TouchCancel] = convertRawProp(
      context, rawProps, "onTouchCancel", sourceValue[Offset::TouchCancel], defaultValue[Offset::TouchCancel]);

  return result;
}

} // namespace facebook::react
