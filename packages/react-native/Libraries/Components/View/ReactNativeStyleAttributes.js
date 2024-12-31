/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format strict-local
 * @flow strict-local
 */

import type {AnyAttributeType} from '../../Renderer/shims/ReactNativeTypes';

import processAspectRatio from '../../StyleSheet/processAspectRatio';
import processBackgroundImage from '../../StyleSheet/processBackgroundImage';
import processBoxShadow from '../../StyleSheet/processBoxShadow';
import processColor from '../../StyleSheet/processColor';
import processFilter from '../../StyleSheet/processFilter';
import processFontVariant from '../../StyleSheet/processFontVariant';
import processTransform from '../../StyleSheet/processTransform';
import processTransformOrigin from '../../StyleSheet/processTransformOrigin';
import sizesDiffer from '../../Utilities/differ/sizesDiffer';

const colorAttributes = {process: processColor};

const ReactNativeStyleAttributes: {[string]: AnyAttributeType, ...} = {
  /**
   * Layout
   */
  alignContent: true,
  alignItems: true,
  alignSelf: true,
  aspectRatio: {process: processAspectRatio},
  borderBottomWidth: true,
  borderEndWidth: true,
  borderLeftWidth: true,
  borderRightWidth: true,
  borderStartWidth: true,
  borderTopWidth: true,
  boxSizing: true,
  columnGap: true,
  borderWidth: true,
  bottom: true,
  direction: true,
  display: true,
  end: true,
  flex: true,
  flexBasis: true,
  flexDirection: true,
  flexGrow: true,
  flexShrink: true,
  flexWrap: true,
  gap: true,
  height: true,
  inset: true,
  insetBlock: true,
  insetBlockEnd: true,
  insetBlockStart: true,
  insetInline: true,
  insetInlineEnd: true,
  insetInlineStart: true,
  justifyContent: true,
  left: true,
  margin: true,
  marginBlock: true,
  marginBlockEnd: true,
  marginBlockStart: true,
  marginBottom: true,
  marginEnd: true,
  marginHorizontal: true,
  marginInline: true,
  marginInlineEnd: true,
  marginInlineStart: true,
  marginLeft: true,
  marginRight: true,
  marginStart: true,
  marginTop: true,
  marginVertical: true,
  maxHeight: true,
  maxWidth: true,
  minHeight: true,
  minWidth: true,
  overflow: true,
  padding: true,
  paddingBlock: true,
  paddingBlockEnd: true,
  paddingBlockStart: true,
  paddingBottom: true,
  paddingEnd: true,
  paddingHorizontal: true,
  paddingInline: true,
  paddingInlineEnd: true,
  paddingInlineStart: true,
  paddingLeft: true,
  paddingRight: true,
  paddingStart: true,
  paddingTop: true,
  paddingVertical: true,
  position: true,
  right: true,
  rowGap: true,
  start: true,
  top: true,
  width: true,
  zIndex: true,

  /**
   * Shadow
   */
  elevation: true,
  shadowColor: colorAttributes,
  shadowOffset: {diff: sizesDiffer},
  shadowOpacity: true,
  shadowRadius: true,

  /**
   * Transform
   */
  transform: {process: processTransform},
  transformOrigin: {process: processTransformOrigin},

  /**
   * Filter
   */
  filter: {process: processFilter},

  /**
   * MixBlendMode
   */
  mixBlendMode: true,

  /**
   * Isolation
   */
  isolation: true,

  /*
   * BoxShadow
   */
  boxShadow: {process: processBoxShadow},

  /**
   * Linear Gradient
   */
  experimental_backgroundImage: {process: processBackgroundImage},

  /**
   * View
   */
  backfaceVisibility: true,
  backgroundColor: colorAttributes,
  borderBlockColor: colorAttributes,
  borderBlockEndColor: colorAttributes,
  borderBlockStartColor: colorAttributes,
  borderBottomColor: colorAttributes,
  borderBottomEndRadius: true,
  borderBottomLeftRadius: true,
  borderBottomRightRadius: true,
  borderBottomStartRadius: true,
  borderColor: colorAttributes,
  borderCurve: true,
  borderEndColor: colorAttributes,
  borderEndEndRadius: true,
  borderEndStartRadius: true,
  borderLeftColor: colorAttributes,
  borderRadius: true,
  borderRightColor: colorAttributes,
  borderStartColor: colorAttributes,
  borderStartEndRadius: true,
  borderStartStartRadius: true,
  borderStyle: true,
  borderTopColor: colorAttributes,
  borderTopEndRadius: true,
  borderTopLeftRadius: true,
  borderTopRightRadius: true,
  borderTopStartRadius: true,
  cursor: true,
  opacity: true,
  outlineColor: colorAttributes,
  outlineOffset: true,
  outlineStyle: true,
  outlineWidth: true,
  pointerEvents: true,

  /**
   * Text
   */
  color: colorAttributes,
  fontFamily: true,
  fontSize: true,
  fontStyle: true,
  fontVariant: {process: processFontVariant},
  fontWeight: true,
  includeFontPadding: true,
  letterSpacing: true,
  lineHeight: true,
  textAlign: true,
  textAlignVertical: true,
  textDecorationColor: colorAttributes,
  textDecorationLine: true,
  textDecorationStyle: true,
  textShadowColor: colorAttributes,
  textShadowOffset: true,
  textShadowRadius: true,
  textTransform: true,
  userSelect: true,
  verticalAlign: true,
  writingDirection: true,

  /**
   * Image
   */
  overlayColor: colorAttributes,
  resizeMode: true,
  tintColor: colorAttributes,
  objectFit: true,
};

module.exports = ReactNativeStyleAttributes;
