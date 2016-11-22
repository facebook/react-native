/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

typedef enum CSSOverflow {
  CSSOverflowVisible,
  CSSOverflowHidden,
  CSSOverflowScroll,
  CSSOverflowCount,
} CSSOverflow;

typedef enum CSSJustify {
  CSSJustifyFlexStart,
  CSSJustifyCenter,
  CSSJustifyFlexEnd,
  CSSJustifySpaceBetween,
  CSSJustifySpaceAround,
  CSSJustifyCount,
} CSSJustify;

typedef enum CSSFlexDirection {
  CSSFlexDirectionColumn,
  CSSFlexDirectionColumnReverse,
  CSSFlexDirectionRow,
  CSSFlexDirectionRowReverse,
  CSSFlexDirectionCount,
} CSSFlexDirection;

typedef enum CSSAlign {
  CSSAlignAuto,
  CSSAlignFlexStart,
  CSSAlignCenter,
  CSSAlignFlexEnd,
  CSSAlignStretch,
  CSSAlignCount,
} CSSAlign;

typedef enum CSSEdge {
  CSSEdgeLeft,
  CSSEdgeTop,
  CSSEdgeRight,
  CSSEdgeBottom,
  CSSEdgeStart,
  CSSEdgeEnd,
  CSSEdgeHorizontal,
  CSSEdgeVertical,
  CSSEdgeAll,
  CSSEdgeCount,
} CSSEdge;

typedef enum CSSWrap {
  CSSWrapNoWrap,
  CSSWrapWrap,
  CSSWrapCount,
} CSSWrap;

typedef enum CSSDirection {
  CSSDirectionInherit,
  CSSDirectionLTR,
  CSSDirectionRTL,
  CSSDirectionCount,
} CSSDirection;

typedef enum CSSExperimentalFeature {
  CSSExperimentalFeatureRounding,
  CSSExperimentalFeatureCount,
} CSSExperimentalFeature;

typedef enum CSSLogLevel {
  CSSLogLevelError,
  CSSLogLevelWarn,
  CSSLogLevelInfo,
  CSSLogLevelDebug,
  CSSLogLevelVerbose,
  CSSLogLevelCount,
} CSSLogLevel;

typedef enum CSSDimension {
  CSSDimensionWidth,
  CSSDimensionHeight,
  CSSDimensionCount,
} CSSDimension;

typedef enum CSSMeasureMode {
  CSSMeasureModeUndefined,
  CSSMeasureModeExactly,
  CSSMeasureModeAtMost,
  CSSMeasureModeCount,
} CSSMeasureMode;

typedef enum CSSPositionType {
  CSSPositionTypeRelative,
  CSSPositionTypeAbsolute,
  CSSPositionTypeCount,
} CSSPositionType;

typedef enum CSSPrintOptions {
  CSSPrintOptionsLayout = 1,
  CSSPrintOptionsStyle = 2,
  CSSPrintOptionsChildren = 4,
  CSSPrintOptionsCount,
} CSSPrintOptions;
