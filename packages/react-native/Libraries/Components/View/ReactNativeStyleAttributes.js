/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format strict-local
 * @flow
 */

import type {AnyAttributeType} from '../../Renderer/shims/ReactNativeTypes';
import processColor from '../../StyleSheet/processColor';
import processTransform from '../../StyleSheet/processTransform';
import sizesDiffer from '../../Utilities/differ/sizesDiffer';

const colorAttributes = {process: processColor};

const ReactNativeStyleAttributes: {[string]: AnyAttributeType, ...} = {
  /**
   * Layout
   */
  alignContent: true,
  alignItems: true,
  alignSelf: true,
  aspectRatio: true,
  borderBottomWidth: true,
  borderEndWidth: true,
  borderLeftWidth: true,
  borderRightWidth: true,
  borderStartWidth: true,
  borderTopWidth: true,
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
  height: true,
  justifyContent: true,
  left: true,
  margin: true,
  marginBottom: true,
  marginEnd: true,
  marginHorizontal: true,
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
  paddingBottom: true,
  paddingEnd: true,
  paddingHorizontal: true,
  paddingLeft: true,
  paddingRight: true,
  paddingStart: true,
  paddingTop: true,
  paddingVertical: true,
  position: true,
  right: true,
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
  decomposedMatrix: true, // @deprecated
  rotation: true, // @deprecated
  scaleX: true, // @deprecated
  scaleY: true, // @deprecated
  transform: {process: processTransform},
  transformMatrix: true, // @deprecated
  translateX: true, // @deprecated
  translateY: true, // @deprecated

  /**
   * View
   */
  backfaceVisibility: true,
  backgroundColor: colorAttributes,
  borderBottomColor: colorAttributes,
  borderBottomEndRadius: true,
  borderBottomLeftRadius: true,
  borderBottomRightRadius: true,
  borderBottomStartRadius: true,
  borderColor: colorAttributes,
  borderEndColor: colorAttributes,
  borderLeftColor: colorAttributes,
  borderRadius: true,
  borderRightColor: colorAttributes,
  borderStartColor: colorAttributes,
  borderStyle: true,
  borderTopColor: colorAttributes,
  borderTopEndRadius: true,
  borderTopLeftRadius: true,
  borderTopRightRadius: true,
  borderTopStartRadius: true,
  opacity: true,

  /**
   * Text
   */
  color: colorAttributes,
  fontFamily: true,
  fontSize: true,
  fontStyle: true,
  fontVariant: true,
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
  writingDirection: true,

  /**
   * Image
   */
  overlayColor: colorAttributes,
  resizeMode: true,
  tintColor: colorAttributes,
};

module.exports = ReactNativeStyleAttributes;
