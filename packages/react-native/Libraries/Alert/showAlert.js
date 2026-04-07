/**
 * @flow
 * @format
 */
import type {AlertButtons, AlertOptions} from './Alert';

const showAlert = (
  title: ?string,
  message?: ?string,
  buttons?: AlertButtons,
  options?: AlertOptions,
) => {}; // noop for non Android & iOS platforms

export default showAlert;
