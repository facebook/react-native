/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule queryLayoutByID
 * @flow
 * @format
 */
'use strict';

var UIManager = require('UIManager');

type OnSuccessCallback = (
  left: number,
  top: number,
  width: number,
  height: number,
  pageX: number,
  pageY: number,
) => void;

// I don't know what type error is...
type OnErrorCallback = (error: any) => void;

/**
 * Queries the layout of a view. The layout does not reflect the element as
 * seen by the user, rather it reflects the position within the layout system,
 * before any transforms are applied.
 *
 * The only other requirement is that the `pageX, pageY` values be in the same
 * coordinate system that events' `pageX/Y` are reported. That means that for
 * the web, `pageXOffset/pageYOffset` should be added to to
 * getBoundingClientRect to make consistent with touches.
 *
 *  var pageXOffset = window.pageXOffset;
 *  var pageYOffset = window.pageYOffset;
 *
 * This is an IOS specific implementation.
 *
 * @param {number} tag ID of the platform specific node to be measured.
 * @param {function} onError `func(error)`
 * @param {function} onSuccess `func(left, top, width, height, pageX, pageY)`
 */
var queryLayoutByID = function(
  tag: ?number,
  onError: OnErrorCallback,
  onSuccess: OnSuccessCallback,
): void {
  if (tag == null) {
    return;
  }
  // Native bridge doesn't *yet* surface errors.
  UIManager.measure(tag, onSuccess);
};

module.exports = queryLayoutByID;
