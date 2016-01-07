/* eslint global-strict: 0 */
(function(GLOBAL) {
  /**
   * The document must be shimmed before anything else that might define the
   * `ExecutionEnvironment` module (which checks for `document.createElement`).
   */

  // The browser defines Text and Image globals by default. If you forget to
  // require them, then the error message is very confusing.
  function getInvalidGlobalUseError(name) {
    return new Error(
      'You are trying to render the global ' + name + ' variable as a ' +
      'React element. You probably forgot to require ' + name + '.'
    );
  }
  GLOBAL.Text = {
    get defaultProps() {
      throw getInvalidGlobalUseError('Text');
    }
  };
  GLOBAL.Image = {
    get defaultProps() {
      throw getInvalidGlobalUseError('Image');
    }
  };
  // Force `ExecutionEnvironment.canUseDOM` to be false.
  if (GLOBAL.document) {
    GLOBAL.document.createElement = null;
  }

  // There is no DOM so MutationObserver doesn't make sense. It is used
  // as feature detection in Bluebird Promise implementation
  GLOBAL.MutationObserver = undefined;
})(this);
