/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "YGMacros.h"

YG_EXTERN_C_BEGIN

#define YGAlignCount 8
typedef YG_ENUM_BEGIN(YGAlign) {
  YGAlignAuto,
  YGAlignFlexStart,
  YGAlignCenter,
  YGAlignFlexEnd,
  YGAlignStretch,
  YGAlignBaseline,
  YGAlignSpaceBetween,
  YGAlignSpaceAround,
} YG_ENUM_END(YGAlign);
WIN_EXPORT const char *YGAlignToString(const YGAlign value);

#define YGDimensionCount 2
typedef YG_ENUM_BEGIN(YGDimension) {
  YGDimensionWidth,
  YGDimensionHeight,
} YG_ENUM_END(YGDimension);
WIN_EXPORT const char *YGDimensionToString(const YGDimension value);

#define YGDirectionCount 3
typedef YG_ENUM_BEGIN(YGDirection) {
  YGDirectionInherit,
  YGDirectionLTR,
  YGDirectionRTL,
} YG_ENUM_END(YGDirection);
WIN_EXPORT const char *YGDirectionToString(const YGDirection value);

#define YGDisplayCount 2
typedef YG_ENUM_BEGIN(YGDisplay) {
  YGDisplayFlex,
  YGDisplayNone,
} YG_ENUM_END(YGDisplay);
WIN_EXPORT const char *YGDisplayToString(const YGDisplay value);

#define YGEdgeCount 9
typedef YG_ENUM_BEGIN(YGEdge) {
  YGEdgeLeft,
  YGEdgeTop,
  YGEdgeRight,
  YGEdgeBottom,
  YGEdgeStart,
  YGEdgeEnd,
  YGEdgeHorizontal,
  YGEdgeVertical,
  YGEdgeAll,
} YG_ENUM_END(YGEdge);
WIN_EXPORT const char *YGEdgeToString(const YGEdge value);

#define YGExperimentalFeatureCount 1
typedef YG_ENUM_BEGIN(YGExperimentalFeature) {
  YGExperimentalFeatureWebFlexBasis,
} YG_ENUM_END(YGExperimentalFeature);
WIN_EXPORT const char *YGExperimentalFeatureToString(const YGExperimentalFeature value);

#define YGFlexDirectionCount 4
typedef YG_ENUM_BEGIN(YGFlexDirection) {
  YGFlexDirectionColumn,
  YGFlexDirectionColumnReverse,
  YGFlexDirectionRow,
  YGFlexDirectionRowReverse,
} YG_ENUM_END(YGFlexDirection);
WIN_EXPORT const char *YGFlexDirectionToString(const YGFlexDirection value);

#define YGJustifyCount 6
typedef YG_ENUM_BEGIN(YGJustify){
    YGJustifyFlexStart,
    YGJustifyCenter,
    YGJustifyFlexEnd,
    YGJustifySpaceBetween,
    YGJustifySpaceAround,
    YGJustifySpaceEvenly,
} YG_ENUM_END(YGJustify);
WIN_EXPORT const char *YGJustifyToString(const YGJustify value);

#define YGLogLevelCount 6
typedef YG_ENUM_BEGIN(YGLogLevel) {
  YGLogLevelError,
  YGLogLevelWarn,
  YGLogLevelInfo,
  YGLogLevelDebug,
  YGLogLevelVerbose,
  YGLogLevelFatal,
} YG_ENUM_END(YGLogLevel);
WIN_EXPORT const char *YGLogLevelToString(const YGLogLevel value);

#define YGMeasureModeCount 3
typedef YG_ENUM_BEGIN(YGMeasureMode) {
  YGMeasureModeUndefined,
  YGMeasureModeExactly,
  YGMeasureModeAtMost,
} YG_ENUM_END(YGMeasureMode);
WIN_EXPORT const char *YGMeasureModeToString(const YGMeasureMode value);

#define YGNodeTypeCount 2
typedef YG_ENUM_BEGIN(YGNodeType) {
  YGNodeTypeDefault,
  YGNodeTypeText,
} YG_ENUM_END(YGNodeType);
WIN_EXPORT const char *YGNodeTypeToString(const YGNodeType value);

#define YGOverflowCount 3
typedef YG_ENUM_BEGIN(YGOverflow) {
  YGOverflowVisible,
  YGOverflowHidden,
  YGOverflowScroll,
} YG_ENUM_END(YGOverflow);
WIN_EXPORT const char *YGOverflowToString(const YGOverflow value);

#define YGPositionTypeCount 2
typedef YG_ENUM_BEGIN(YGPositionType) {
  YGPositionTypeRelative,
  YGPositionTypeAbsolute,
} YG_ENUM_END(YGPositionType);
WIN_EXPORT const char *YGPositionTypeToString(const YGPositionType value);

#define YGPrintOptionsCount 3
typedef YG_ENUM_BEGIN(YGPrintOptions) {
  YGPrintOptionsLayout = 1,
  YGPrintOptionsStyle = 2,
  YGPrintOptionsChildren = 4,
} YG_ENUM_END(YGPrintOptions);
WIN_EXPORT const char *YGPrintOptionsToString(const YGPrintOptions value);

#define YGUnitCount 4
typedef YG_ENUM_BEGIN(YGUnit) {
  YGUnitUndefined,
  YGUnitPoint,
  YGUnitPercent,
  YGUnitAuto,
} YG_ENUM_END(YGUnit);
WIN_EXPORT const char *YGUnitToString(const YGUnit value);

#define YGWrapCount 3
typedef YG_ENUM_BEGIN(YGWrap) {
  YGWrapNoWrap,
  YGWrapWrap,
  YGWrapWrapReverse,
} YG_ENUM_END(YGWrap);
WIN_EXPORT const char *YGWrapToString(const YGWrap value);

YG_EXTERN_C_END
