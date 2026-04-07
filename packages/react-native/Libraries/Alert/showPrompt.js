/**
 * @flow
 * @format
 */
import type {AlertButtons, AlertOptions, AlertType} from './Alert';

const showPrompt = (
  title: ?string,
  message?: ?string,
  callbackOrButtons?: ?(((text: string) => void) | AlertButtons),
  type?: ?AlertType = 'plain-text',
  defaultValue?: string,
  keyboardType?: string,
  options?: AlertOptions,
) => {}; // noop for non iOS platforms

export default showPrompt;
