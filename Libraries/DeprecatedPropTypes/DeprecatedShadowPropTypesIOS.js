/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
'use strict';

const ColorPropType = require('ColorPropType');
const ReactPropTypes = require('prop-types');

const DeprecatedShadowPropTypesIOS = {
  shadowColor: ColorPropType,
  shadowOffset: ReactPropTypes.shape({
    width: ReactPropTypes.number,
    height: ReactPropTypes.number,
  }),
  shadowOpacity: ReactPropTypes.number,
  shadowRadius: ReactPropTypes.number,
};

module.exports = DeprecatedShadowPropTypesIOS;
