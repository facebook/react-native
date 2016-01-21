/* eslint strict: 0 */

// TODO: Remove document polyfill now that chrome debugging is in a web worker.

// The browser defines Text and Image globals by default. If you forget to
// require them, then the error message is very confusing.
function getInvalidGlobalUseError(name) {
  return new Error(
    'You are trying to render the global ' + name + ' variable as a ' +
    'React element. You probably forgot to require ' + name + '.'
  );
}
global.Text = {
  get defaultProps() {
    throw getInvalidGlobalUseError('Text');
  }
};
global.Image = {
  get defaultProps() {
    throw getInvalidGlobalUseError('Image');
  }
};
// Force `ExecutionEnvironment.canUseDOM` to be false.
if (global.document) {
  global.document.createElement = null;
}

// There is no DOM so MutationObserver doesn't make sense. It is used
// as feature detection in Bluebird Promise implementation
global.MutationObserver = undefined;
