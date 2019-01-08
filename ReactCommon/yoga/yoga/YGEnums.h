/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include "YGMacros.h"

#define YG_ENUM_DECL(NAME, ...)                               \
  typedef YG_ENUM_BEGIN(NAME){__VA_ARGS__} YG_ENUM_END(NAME); \
  WIN_EXPORT const char* NAME##ToString(NAME);

YG_EXTERN_C_BEGIN

#define YGAlignCount 8
YG_ENUM_DECL(
    YGAlign,
    YGAlignAuto,
    YGAlignFlexStart,
    YGAlignCenter,
    YGAlignFlexEnd,
    YGAlignStretch,
    YGAlignBaseline,
    YGAlignSpaceBetween,
    YGAlignSpaceAround);

#define YGDimensionCount 2
YG_ENUM_DECL(YGDimension, YGDimensionWidth, YGDimensionHeight)

#define YGDirectionCount 3
YG_ENUM_DECL(YGDirection, YGDirectionInherit, YGDirectionLTR, YGDirectionRTL)

#define YGDisplayCount 2
YG_ENUM_DECL(YGDisplay, YGDisplayFlex, YGDisplayNone)

#define YGEdgeCount 9
YG_ENUM_DECL(
    YGEdge,
    YGEdgeLeft,
    YGEdgeTop,
    YGEdgeRight,
    YGEdgeBottom,
    YGEdgeStart,
    YGEdgeEnd,
    YGEdgeHorizontal,
    YGEdgeVertical,
    YGEdgeAll)

#define YGExperimentalFeatureCount 1
YG_ENUM_DECL(YGExperimentalFeature, YGExperimentalFeatureWebFlexBasis)

#define YGFlexDirectionCount 4
YG_ENUM_DECL(
    YGFlexDirection,
    YGFlexDirectionColumn,
    YGFlexDirectionColumnReverse,
    YGFlexDirectionRow,
    YGFlexDirectionRowReverse)

#define YGJustifyCount 6
YG_ENUM_DECL(
    YGJustify,
    YGJustifyFlexStart,
    YGJustifyCenter,
    YGJustifyFlexEnd,
    YGJustifySpaceBetween,
    YGJustifySpaceAround,
    YGJustifySpaceEvenly)

#define YGLogLevelCount 6
YG_ENUM_DECL(
    YGLogLevel,
    YGLogLevelError,
    YGLogLevelWarn,
    YGLogLevelInfo,
    YGLogLevelDebug,
    YGLogLevelVerbose,
    YGLogLevelFatal)

#define YGMeasureModeCount 3
YG_ENUM_DECL(
    YGMeasureMode,
    YGMeasureModeUndefined,
    YGMeasureModeExactly,
    YGMeasureModeAtMost)

#define YGNodeTypeCount 2
YG_ENUM_DECL(YGNodeType, YGNodeTypeDefault, YGNodeTypeText)

#define YGOverflowCount 3
YG_ENUM_DECL(YGOverflow, YGOverflowVisible, YGOverflowHidden, YGOverflowScroll)

#define YGPositionTypeCount 2
YG_ENUM_DECL(YGPositionType, YGPositionTypeRelative, YGPositionTypeAbsolute)

#define YGPrintOptionsCount 3
YG_ENUM_DECL(
    YGPrintOptions,
    YGPrintOptionsLayout = 1,
    YGPrintOptionsStyle = 2,
    YGPrintOptionsChildren = 4)

#define YGUnitCount 4
YG_ENUM_DECL(YGUnit, YGUnitUndefined, YGUnitPoint, YGUnitPercent, YGUnitAuto)

#define YGWrapCount 3
YG_ENUM_DECL(YGWrap, YGWrapNoWrap, YGWrapWrap, YGWrapWrapReverse)

YG_EXTERN_C_END

#undef YG_ENUM_DECL
