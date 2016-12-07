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

typedef enum YGFlexDirection {
  YGFlexDirectionColumn,
  YGFlexDirectionColumnReverse,
  YGFlexDirectionRow,
  YGFlexDirectionRowReverse,
  YGFlexDirectionCount,
} YGFlexDirection;

typedef enum YGMeasureMode {
  YGMeasureModeUndefined,
  YGMeasureModeExactly,
  YGMeasureModeAtMost,
  YGMeasureModeCount,
} YGMeasureMode;

typedef enum YGPrintOptions {
  YGPrintOptionsLayout = 1,
  YGPrintOptionsStyle = 2,
  YGPrintOptionsChildren = 4,
  YGPrintOptionsCount,
} YGPrintOptions;

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
  YGEdgeCount,
} YGEdge;

typedef enum YGPositionType {
  YGPositionTypeRelative,
  YGPositionTypeAbsolute,
  YGPositionTypeCount,
} YGPositionType;

typedef enum YGDimension {
  YGDimensionWidth,
  YGDimensionHeight,
  YGDimensionCount,
} YGDimension;

typedef enum YGJustify {
  YGJustifyFlexStart,
  YGJustifyCenter,
  YGJustifyFlexEnd,
  YGJustifySpaceBetween,
  YGJustifySpaceAround,
  YGJustifyCount,
} YGJustify;

typedef enum YGDirection {
  YGDirectionInherit,
  YGDirectionLTR,
  YGDirectionRTL,
  YGDirectionCount,
} YGDirection;

typedef enum YGLogLevel {
  YGLogLevelError,
  YGLogLevelWarn,
  YGLogLevelInfo,
  YGLogLevelDebug,
  YGLogLevelVerbose,
  YGLogLevelCount,
} YGLogLevel;

typedef enum YGWrap {
  YGWrapNoWrap,
  YGWrapWrap,
  YGWrapCount,
} YGWrap;

typedef enum YGOverflow {
  YGOverflowVisible,
  YGOverflowHidden,
  YGOverflowScroll,
  YGOverflowCount,
} YGOverflow;

typedef enum YGExperimentalFeature {
  YGExperimentalFeatureRounding,
  YGExperimentalFeatureWebFlexBasis,
  YGExperimentalFeatureCount,
} YGExperimentalFeature;

typedef enum YGAlign {
  YGAlignAuto,
  YGAlignFlexStart,
  YGAlignCenter,
  YGAlignFlexEnd,
  YGAlignStretch,
  YGAlignCount,
} YGAlign;

YG_EXTERN_C_END
