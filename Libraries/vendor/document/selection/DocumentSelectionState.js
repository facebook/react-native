/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule DocumentSelectionState
 * @typechecks
 */

'use strict';

var mixInEventEmitter = require('mixInEventEmitter');

/**
 * DocumentSelectionState is responsible for maintaining selection information
 * for a document.
 *
 * It is intended for use by AbstractTextEditor-based components for
 * identifying the appropriate start/end positions to modify the
 * DocumentContent, and for programmatically setting browser selection when
 * components re-render.
 */
class DocumentSelectionState {
  /**
   * @param {number} anchor
   * @param {number} focus
   */
  constructor(anchor, focus) {
    this._anchorOffset = anchor;
    this._focusOffset = focus;
    this._hasFocus = false;
  }

  /**
   * Apply an update to the state. If either offset value has changed,
   * set the values and emit the `change` event. Otherwise no-op.
   *
   * @param {number} anchor
   * @param {number} focus
   */
  update(anchor, focus) {
    if (this._anchorOffset !== anchor || this._focusOffset !== focus) {
      this._anchorOffset = anchor;
      this._focusOffset = focus;
      this.emit('update');
    }
  }

  /**
   * Given a max text length, constrain our selection offsets to ensure
   * that the selection remains strictly within the text range.
   *
   * @param {number} maxLength
   */
  constrainLength(maxLength) {
    this.update(
      Math.min(this._anchorOffset, maxLength),
      Math.min(this._focusOffset, maxLength)
    );
  }

  focus() {
    if (!this._hasFocus) {
      this._hasFocus = true;
      this.emit('focus');
    }
  }

  blur() {
    if (this._hasFocus) {
      this._hasFocus = false;
      this.emit('blur');
    }
  }

  /**
   * @return {boolean}
   */
  hasFocus() {
    return this._hasFocus;
  }

  /**
   * @return {boolean}
   */
  isCollapsed() {
    return this._anchorOffset === this._focusOffset;
  }

  /**
   * @return {boolean}
   */
  isBackward() {
    return this._anchorOffset > this._focusOffset;
  }

  /**
   * @return {?number}
   */
  getAnchorOffset() {
    return this._hasFocus ? this._anchorOffset : null;
  }

  /**
   * @return {?number}
   */
  getFocusOffset() {
    return this._hasFocus ? this._focusOffset : null;
  }

  /**
   * @return {?number}
   */
  getStartOffset() {
    return (
      this._hasFocus ? Math.min(this._anchorOffset, this._focusOffset) : null
    );
  }

  /**
   * @return {?number}
   */
  getEndOffset() {
    return (
      this._hasFocus ? Math.max(this._anchorOffset, this._focusOffset) : null
    );
  }

  /**
   * @param {number} start
   * @param {number} end
   * @return {boolean}
   */
  overlaps(start, end) {
    return (
      this.hasFocus() &&
      this.getStartOffset() <= end && start <= this.getEndOffset()
    );
  }
}

mixInEventEmitter(DocumentSelectionState, {
  'blur': true,
  'focus': true,
  'update': true
});

module.exports = DocumentSelectionState;
