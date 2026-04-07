/**
 * @flow
 * @format
 */
import type {AlertButtons, AlertOptions} from './Alert';

import prompt from './showPrompt';

const showAlert = (
  title: ?string,
  message?: ?string,
  buttons?: AlertButtons,
  options?: AlertOptions,
) => {
  prompt(title, message, buttons, 'default', undefined, undefined, options);
};

export default showAlert;
