/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @no-flow
 * @format
 */
'use strict';

const PropTypes = require('prop-types');

const ImageURISourcePropType = PropTypes.shape({
  uri: PropTypes.string,
  bundle: PropTypes.string,
  method: PropTypes.string,
  headers: PropTypes.objectOf(PropTypes.string),
  body: PropTypes.string,
  cache: PropTypes.oneOf([
    'default',
    'reload',
    'force-cache',
    'only-if-cached',
  ]),
  width: PropTypes.number,
  height: PropTypes.number,
  scale: PropTypes.number,
});

const ImageSourcePropType = PropTypes.oneOfType([
  ImageURISourcePropType,
  // Opaque type returned by require('./image.jpg')
  PropTypes.number,
  // Multiple sources
  PropTypes.arrayOf(ImageURISourcePropType),
]);

module.exports = ImageSourcePropType;
