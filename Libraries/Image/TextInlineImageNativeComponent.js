/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const ReactNativeStyleAttributes = require('ReactNativeStyleAttributes');
const ReactNativeViewConfigRegistry = require('ReactNativeViewConfigRegistry');

const verifyComponentAttributeEquivalence = require('verifyComponentAttributeEquivalence');

const viewConfig = {
  NativeProps: {
    alignContent: 'String',
    alignItems: 'String',
    alignSelf: 'String',
    aspectRatio: 'number',
    borderBottomWidth: 'number',
    borderEndWidth: 'number',
    borderLeftWidth: 'number',
    borderRightWidth: 'number',
    borderStartWidth: 'number',
    borderTopWidth: 'number',
    borderWidth: 'number',
    bottom: 'Dynamic',
    display: 'String',
    end: 'Dynamic',
    flex: 'number',
    flexBasis: 'Dynamic',
    flexDirection: 'String',
    flexGrow: 'number',
    flexShrink: 'number',
    flexWrap: 'String',
    headers: 'Map',
    height: 'Dynamic',
    justifyContent: 'String',
    left: 'Dynamic',
    margin: 'Dynamic',
    marginBottom: 'Dynamic',
    marginEnd: 'Dynamic',
    marginHorizontal: 'Dynamic',
    marginLeft: 'Dynamic',
    marginRight: 'Dynamic',
    marginStart: 'Dynamic',
    marginTop: 'Dynamic',
    marginVertical: 'Dynamic',
    maxHeight: 'Dynamic',
    maxWidth: 'Dynamic',
    minHeight: 'Dynamic',
    minWidth: 'Dynamic',
    onLayout: 'boolean',
    overflow: 'String',
    padding: 'Dynamic',
    paddingBottom: 'Dynamic',
    paddingEnd: 'Dynamic',
    paddingHorizontal: 'Dynamic',
    paddingLeft: 'Dynamic',
    paddingRight: 'Dynamic',
    paddingStart: 'Dynamic',
    paddingTop: 'Dynamic',
    paddingVertical: 'Dynamic',
    position: 'String',
    right: 'Dynamic',
    src: 'Array',
    start: 'Dynamic',
    tintColor: 'number',
    top: 'Dynamic',
    width: 'Dynamic',
  },
  uiViewClassName: 'RCTTextInlineImage',
  validAttributes: {
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
    display: true,
    end: true,
    flex: true,
    flexBasis: true,
    flexDirection: true,
    flexGrow: true,
    flexShrink: true,
    flexWrap: true,
    headers: true,
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
    onLayout: true,
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
    src: true,
    start: true,
    tintColor: true,
    top: true,
    width: true,
    style: ReactNativeStyleAttributes,
  },
};

if (__DEV__) {
  verifyComponentAttributeEquivalence('RCTTextInlineImage', viewConfig);
}

const TextInlineImage = ReactNativeViewConfigRegistry.register(
  'RCTTextInlineImage',
  () => viewConfig,
);

module.exports = TextInlineImage;
