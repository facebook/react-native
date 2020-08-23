/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

'use strict';

const ReactPropTypes = require('prop-types');

const LayoutPropTypes = {
  display: (ReactPropTypes.oneOf(['none', 'flex']): React$PropType$Primitive<
    'none' | 'flex',
  >),
  width: (ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]): React$PropType$Primitive<number | string>),
  height: (ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]): React$PropType$Primitive<number | string>),
  start: (ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]): React$PropType$Primitive<number | string>),
  end: (ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]): React$PropType$Primitive<number | string>),
  top: (ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]): React$PropType$Primitive<number | string>),
  left: (ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]): React$PropType$Primitive<number | string>),
  right: (ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]): React$PropType$Primitive<number | string>),
  bottom: (ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]): React$PropType$Primitive<number | string>),
  minWidth: (ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]): React$PropType$Primitive<number | string>),
  maxWidth: (ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]): React$PropType$Primitive<number | string>),
  minHeight: (ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]): React$PropType$Primitive<number | string>),
  maxHeight: (ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]): React$PropType$Primitive<number | string>),
  margin: (ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]): React$PropType$Primitive<number | string>),
  marginVertical: (ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]): React$PropType$Primitive<number | string>),
  marginHorizontal: (ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]): React$PropType$Primitive<number | string>),
  marginTop: (ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]): React$PropType$Primitive<number | string>),
  marginBottom: (ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]): React$PropType$Primitive<number | string>),
  marginLeft: (ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]): React$PropType$Primitive<number | string>),
  marginRight: (ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]): React$PropType$Primitive<number | string>),
  marginStart: (ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]): React$PropType$Primitive<number | string>),
  marginEnd: (ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]): React$PropType$Primitive<number | string>),
  padding: (ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]): React$PropType$Primitive<number | string>),
  paddingVertical: (ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]): React$PropType$Primitive<number | string>),
  paddingHorizontal: (ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]): React$PropType$Primitive<number | string>),
  paddingTop: (ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]): React$PropType$Primitive<number | string>),
  paddingBottom: (ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]): React$PropType$Primitive<number | string>),
  paddingLeft: (ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]): React$PropType$Primitive<number | string>),
  paddingRight: (ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]): React$PropType$Primitive<number | string>),
  paddingStart: (ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]): React$PropType$Primitive<number | string>),
  paddingEnd: (ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]): React$PropType$Primitive<number | string>),
  borderWidth: ReactPropTypes.number,
  borderTopWidth: ReactPropTypes.number,
  borderStartWidth: ReactPropTypes.number,
  borderEndWidth: ReactPropTypes.number,
  borderRightWidth: ReactPropTypes.number,
  borderBottomWidth: ReactPropTypes.number,
  borderLeftWidth: ReactPropTypes.number,
  position: (ReactPropTypes.oneOf([
    'absolute',
    'relative',
  ]): React$PropType$Primitive<'absolute' | 'relative'>),
  flexDirection: (ReactPropTypes.oneOf([
    'row',
    'row-reverse',
    'column',
    'column-reverse',
  ]): React$PropType$Primitive<
    'row' | 'row-reverse' | 'column' | 'column-reverse',
  >),
  flexWrap: (ReactPropTypes.oneOf([
    'wrap',
    'nowrap',
    'wrap-reverse',
  ]): React$PropType$Primitive<'wrap' | 'nowrap' | 'wrap-reverse'>),
  justifyContent: (ReactPropTypes.oneOf([
    'flex-start',
    'flex-end',
    'center',
    'space-between',
    'space-around',
    'space-evenly',
  ]): React$PropType$Primitive<
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly',
  >),
  alignItems: (ReactPropTypes.oneOf([
    'flex-start',
    'flex-end',
    'center',
    'stretch',
    'baseline',
  ]): React$PropType$Primitive<
    'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline',
  >),
  alignSelf: (ReactPropTypes.oneOf([
    'auto',
    'flex-start',
    'flex-end',
    'center',
    'stretch',
    'baseline',
  ]): React$PropType$Primitive<
    'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline',
  >),
  alignContent: (ReactPropTypes.oneOf([
    'flex-start',
    'flex-end',
    'center',
    'stretch',
    'space-between',
    'space-around',
  ]): React$PropType$Primitive<
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'stretch'
    | 'space-between'
    | 'space-around',
  >),
  overflow: (ReactPropTypes.oneOf([
    'visible',
    'hidden',
    'scroll',
  ]): React$PropType$Primitive<'visible' | 'hidden' | 'scroll'>),
  flex: ReactPropTypes.number,
  flexGrow: ReactPropTypes.number,
  flexShrink: ReactPropTypes.number,
  flexBasis: (ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]): React$PropType$Primitive<number | string>),
  aspectRatio: ReactPropTypes.number,
  zIndex: ReactPropTypes.number,
  direction: (ReactPropTypes.oneOf([
    'inherit',
    'ltr',
    'rtl',
  ]): React$PropType$Primitive<'inherit' | 'ltr' | 'rtl'>),
};

module.exports = LayoutPropTypes;
