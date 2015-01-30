/**
 * @generated SignedSource<<1f058815818e10d01d2ee1f2f70d0fb1>>
 *
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !! This file is a check-in of a static_upstream project!      !!
 * !!                                                            !!
 * !! You should not modify this file directly. Instead:         !!
 * !! 1) Use `fjs use-upstream` to temporarily replace this with !!
 * !!    the latest version from upstream.                       !!
 * !! 2) Make your changes, test them, etc.                      !!
 * !! 3) Use `fjs push-upstream` to copy your changes back to    !!
 * !!    static_upstream.                                        !!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 *
 * @providesModule DocumentSelectionState
 * @typechecks
 */

var mixInEventEmitter = require('mixInEventEmitter');

/**
 * DocumentSelectionState is responsible for maintaining selection information
 * for a document.
 *
 * It is intended for use by AbstractTextEditor-based components for
 * identifying the appropriate start/end positions to modify the
 * DocumentContent, and for programatically setting browser selection when
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

