/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule requireFabricView
 * @flow
 * @format
 */
'use strict';

/**
 * This is a switch on the correct view to use for Fabric
 */
module.exports = (name: string, fabric: boolean) => {
  switch (name) {
    case 'View':
      return fabric ? require('FabricView') : require('View');
    case 'Text':
      return fabric ? require('FabricText') : require('Text');
    default:
      throw new Error(name + ' is not supported by Fabric yet');
  }
};
