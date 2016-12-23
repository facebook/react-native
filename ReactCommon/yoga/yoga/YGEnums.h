/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#include "YGMacros.h"

YG_EXTERN_C_BEGIN

#define YGFlexDirectionCount 4
typedef enum YGFlexDirection {
  YGFlexDirectionColumn,
  YGFlexDirectionColumnReverse,
  YGFlexDirectionRow,
  YGFlexDirectionRowReverse,
} YGFlexDirection;

#define YGMeasureModeCount 3
typedef enum YGMeasureMode {
  YGMeasureModeUndefined,
  YGMeasureModeExactly,
  YGMeasureModeAtMost,
} YGMeasureMode;

#define YGPrintOptionsCount 3
typedef enum YGPrintOptions {
  YGPrintOptionsLayout = 1,
  YGPrintOptionsStyle = 2,
  YGPrintOptionsChildren = 4,
} YGPrintOptions;

#define YGEdgeCount 9
typedef enum YGEdge {
  YGEdgeLeft,
  YGEdgeTop,
  YGEdgeRight,
  YGEdgeBottom,
  YGEdgeStart,
  YGEdgeEnd,
  YGEdgeHorizontal,
  YGEdgeVertical,
  YGEdgeAll,
} YGEdge;

#define YGPositionTypeCount 2
typedef enum YGPositionType {
  YGPositionTypeRelative,
  YGPositionTypeAbsolute,
} YGPositionType;

#define YGDimensionCount 2
typedef enum YGDimension {
  YGDimensionWidth,
  YGDimensionHeight,
} YGDimension;

#define YGJustifyCount 5
typedef enum YGJustify {
  YGJustifyFlexStart,
  YGJustifyCenter,
  YGJustifyFlexEnd,
  YGJustifySpaceBetween,
  YGJustifySpaceAround,
} YGJustify;

#define YGDirectionCount 3
typedef enum YGDirection {
  YGDirectionInherit,
  YGDirectionLTR,
  YGDirectionRTL,
} YGDirection;

#define YGLogLevelCount 5
typedef enum YGLogLevel {
  YGLogLevelError,
  YGLogLevelWarn,
  YGLogLevelInfo,
  YGLogLevelDebug,
  YGLogLevelVerbose,
} YGLogLevel;

#define YGWrapCount 2
typedef enum YGWrap {
  YGWrapNoWrap,
  YGWrapWrap,
} YGWrap;

#define YGOverflowCount 3
typedef enum YGOverflow {
  YGOverflowVisible,
  YGOverflowHidden,
  YGOverflowScroll,
} YGOverflow;

#define YGExperimentalFeatureCount 2
typedef enum YGExperimentalFeature {
  YGExperimentalFeatureRounding,
  YGExperimentalFeatureWebFlexBasis,
} YGExperimentalFeature;

#define YGAlignCount 5
typedef enum YGAlign {
  YGAlignAuto,
  YGAlignFlexStart,
  YGAlignCenter,
  YGAlignFlexEnd,
  YGAlignStretch,
} YGAlign;

YG_EXTERN_C_END
