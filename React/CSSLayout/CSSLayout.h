/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#ifndef __CSS_LAYOUT_H
#define __CSS_LAYOUT_H

#include <math.h>
#ifndef __cplusplus
#include <stdbool.h>
#endif

// Not defined in MSVC++
#ifndef NAN
static const unsigned long __nan[2] = {0xffffffff, 0x7fffffff};
#define NAN (*(const float *)__nan)
#endif

#define CSSUndefined NAN

#include <CSSLayout/CSSMacros.h>

CSS_EXTERN_C_BEGIN

typedef enum CSSDirection {
  CSSDirectionInherit,
  CSSDirectionLTR,
  CSSDirectionRTL,
} CSSDirection;

typedef enum CSSFlexDirection {
  CSSFlexDirectionColumn,
  CSSFlexDirectionColumnReverse,
  CSSFlexDirectionRow,
  CSSFlexDirectionRowReverse,
} CSSFlexDirection;

typedef enum CSSJustify {
  CSSJustifyFlexStart,
  CSSJustifyCenter,
  CSSJustifyFlexEnd,
  CSSJustifySpaceBetween,
  CSSJustifySpaceAround,
} CSSJustify;

typedef enum CSSOverflow {
  CSSOverflowVisible,
  CSSOverflowHidden,
} CSSOverflow;

// Note: auto is only a valid value for alignSelf. It is NOT a valid value for
// alignItems.
typedef enum CSSAlign {
  CSSAlignAuto,
  CSSAlignFlexStart,
  CSSAlignCenter,
  CSSAlignFlexEnd,
  CSSAlignStretch,
} CSSAlign;

typedef enum CSSPositionType {
  CSSPositionTypeRelative,
  CSSPositionTypeAbsolute,
} CSSPositionType;

typedef enum CSSWrapType {
  CSSWrapTypeNoWrap,
  CSSWrapTypeWrap,
} CSSWrapType;

// Note: left and top are shared between position[2] and position[4], so
// they have to be before right and bottom.
typedef enum CSSPosition {
  CSSPositionLeft,
  CSSPositionTop,
  CSSPositionRight,
  CSSPositionBottom,
  CSSPositionStart,
  CSSPositionEnd,
  CSSPositionCount,
} CSSPosition;

typedef enum CSSMeasureMode {
  CSSMeasureModeUndefined,
  CSSMeasureModeExactly,
  CSSMeasureModeAtMost,
  CSSMeasureModeCount,
} CSSMeasureMode;

typedef enum CSSDimension {
  CSSDimensionWidth,
  CSSDimensionHeight,
} CSSDimension;

typedef enum CSSPrintOptions {
  CSSPrintOptionsLayout = 1,
  CSSPrintOptionsStyle = 2,
  CSSPrintOptionsChildren = 4,
} CSSPrintOptions;

typedef struct CSSSize {
  float width;
  float height;
} CSSSize;

typedef struct CSSNode * CSSNodeRef;
typedef CSSSize (*CSSMeasureFunc)(void *context, float width, CSSMeasureMode widthMode, float height, CSSMeasureMode heightMode);
typedef bool (*CSSIsDirtyFunc)(void *context);
typedef void (*CSSPrintFunc)(void *context);

// CSSNode
CSSNodeRef CSSNodeNew();
void CSSNodeInit(CSSNodeRef node);
void CSSNodeFree(CSSNodeRef node);

void CSSNodeInsertChild(CSSNodeRef node, CSSNodeRef child, unsigned int index);
void CSSNodeRemoveChild(CSSNodeRef node, CSSNodeRef child);
CSSNodeRef CSSNodeGetChild(CSSNodeRef node, unsigned int index);
unsigned int CSSNodeChildCount(CSSNodeRef node);

void CSSNodeCalculateLayout(
  CSSNodeRef node,
  float availableWidth,
  float availableHeight,
  CSSDirection parentDirection);

void CSSNodePrint(CSSNodeRef node, CSSPrintOptions options);

bool isUndefined(float value);

#define CSS_NODE_PROPERTY(type, name, paramName) \
void CSSNodeSet##name(CSSNodeRef node, type paramName); \
type CSSNodeGet##name(CSSNodeRef node);

#define CSS_NODE_STYLE_PROPERTY(type, name, paramName) \
void CSSNodeStyleSet##name(CSSNodeRef node, type paramName); \
type CSSNodeStyleGet##name(CSSNodeRef node);

#define CSS_NODE_LAYOUT_PROPERTY(type, name) \
type CSSNodeLayoutGet##name(CSSNodeRef node);

CSS_NODE_PROPERTY(void*, Context, context);
CSS_NODE_PROPERTY(CSSMeasureFunc, MeasureFunc, measureFunc);
CSS_NODE_PROPERTY(CSSIsDirtyFunc, IsDirtyFunc, isDirtyFunc);
CSS_NODE_PROPERTY(CSSPrintFunc, PrintFunc, printFunc);
CSS_NODE_PROPERTY(bool, IsTextnode, isTextNode);
CSS_NODE_PROPERTY(bool, ShouldUpdate, shouldUpdate);

CSS_NODE_STYLE_PROPERTY(CSSDirection, Direction, direction);
CSS_NODE_STYLE_PROPERTY(CSSFlexDirection, FlexDirection, flexDirection);
CSS_NODE_STYLE_PROPERTY(CSSJustify, JustifyContent, justifyContent);
CSS_NODE_STYLE_PROPERTY(CSSAlign, AlignContent, alignContent);
CSS_NODE_STYLE_PROPERTY(CSSAlign, AlignItems, alignItems);
CSS_NODE_STYLE_PROPERTY(CSSAlign, AlignSelf, alignSelf);
CSS_NODE_STYLE_PROPERTY(CSSPositionType, PositionType, positionType);
CSS_NODE_STYLE_PROPERTY(CSSWrapType, FlexWrap, flexWrap);
CSS_NODE_STYLE_PROPERTY(CSSOverflow, Overflow, overflow);
CSS_NODE_STYLE_PROPERTY(float, Flex, flex);

CSS_NODE_STYLE_PROPERTY(float, PositionLeft, positionLeft);
CSS_NODE_STYLE_PROPERTY(float, PositionTop, positionTop);
CSS_NODE_STYLE_PROPERTY(float, PositionRight, positionRight);
CSS_NODE_STYLE_PROPERTY(float, PositionBottom, positionBottom);

CSS_NODE_STYLE_PROPERTY(float, MarginLeft, marginLeft);
CSS_NODE_STYLE_PROPERTY(float, MarginTop, marginTop);
CSS_NODE_STYLE_PROPERTY(float, MarginRight, marginRight);
CSS_NODE_STYLE_PROPERTY(float, MarginBottom, marginBottom);
CSS_NODE_STYLE_PROPERTY(float, MarginStart, marginStart);
CSS_NODE_STYLE_PROPERTY(float, MarginEnd, marginEnd);

CSS_NODE_STYLE_PROPERTY(float, PaddingLeft, paddingLeft);
CSS_NODE_STYLE_PROPERTY(float, PaddingTop, paddingTop);
CSS_NODE_STYLE_PROPERTY(float, PaddingRight, paddingRight);
CSS_NODE_STYLE_PROPERTY(float, PaddingBottom, paddingBottom);
CSS_NODE_STYLE_PROPERTY(float, PaddingStart, paddingStart);
CSS_NODE_STYLE_PROPERTY(float, PaddingEnd, paddingEnd);

CSS_NODE_STYLE_PROPERTY(float, BorderLeft, borderLeft);
CSS_NODE_STYLE_PROPERTY(float, BorderTop, borderTop);
CSS_NODE_STYLE_PROPERTY(float, BorderRight, borderRight);
CSS_NODE_STYLE_PROPERTY(float, BorderBottom, borderBottom);
CSS_NODE_STYLE_PROPERTY(float, BorderStart, borderStart);
CSS_NODE_STYLE_PROPERTY(float, BorderEnd, borderEnd);

CSS_NODE_STYLE_PROPERTY(float, Width, width);
CSS_NODE_STYLE_PROPERTY(float, Height, height);
CSS_NODE_STYLE_PROPERTY(float, MinWidth, minWidth);
CSS_NODE_STYLE_PROPERTY(float, MinHeight, minHeight);
CSS_NODE_STYLE_PROPERTY(float, MaxWidth, maxWidth);
CSS_NODE_STYLE_PROPERTY(float, MaxHeight, maxHeight);

CSS_NODE_LAYOUT_PROPERTY(float, Left);
CSS_NODE_LAYOUT_PROPERTY(float, Top);
CSS_NODE_LAYOUT_PROPERTY(float, Right);
CSS_NODE_LAYOUT_PROPERTY(float, Bottom);
CSS_NODE_LAYOUT_PROPERTY(float, Width);
CSS_NODE_LAYOUT_PROPERTY(float, Height);

CSS_EXTERN_C_END

#endif
