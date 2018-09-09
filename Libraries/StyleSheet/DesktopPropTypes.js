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

const ReactPropTypes = require('prop-types');

const DesktopPropTypes = {
  /**
   * (Desktop platforms only) Allows a `View` to be used to create a draggable area for a window.
   * This is useful for frameless windows.
   *
   * This may conflict with clickable child components such as buttons - use `no-drag` on them to
   * disable this behavior.
   */
  appRegion: ReactPropTypes.oneOf(['drag', 'no-drag']),

  /**
   * (Desktop platforms only) Specifies what style of cursor is displayed when the mouse pointer is
   * over a `View`.
   */
  cursor: ReactPropTypes.oneOf([
    'auto',
    'default',
    'none',
    'context-menu',
    'help',
    'pointer',
    'progress',
    'wait',
    'cell',
    'crosshair',
    'text',
    'vertical-text',
    'alias',
    'copy',
    'move',
    'no-drop',
    'not-allowed',
    'e-resize',
    'n-resize',
    'ne-resize',
    'nw-resize',
    's-resize',
    'se-resize',
    'sw-resize',
    'w-resize',
    'ew-resize',
    'ns-resize',
    'nesw-resize',
    'nwse-resize',
    'col-resize',
    'row-resize',
    'all-scroll',
    'zoom-in',
    'zoom-out',
    'grab',
    'grabbing',
  ]),
};

module.exports = DesktopPropTypes;
