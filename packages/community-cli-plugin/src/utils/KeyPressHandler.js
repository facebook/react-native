/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import {CLIError, logger} from '@react-native-community/cli-tools';

const CTRL_C = '\u0003';

/** An abstract key stroke interceptor. */
export class KeyPressHandler {
  _isInterceptingKeyStrokes = false;
  _isHandlingKeyPress = false;
  _onPress: (key: string) => Promise<void>;

  constructor(onPress: (key: string) => Promise<void>) {
    this._onPress = onPress;
  }

  /** Start observing interaction pause listeners. */
  createInteractionListener(): ({pause: boolean, ...}) => void {
    // Support observing prompts.
    let wasIntercepting = false;

    const listener = ({pause}: {pause: boolean, ...}) => {
      if (pause) {
        // Track if we were already intercepting key strokes before pausing, so we can
        // resume after pausing.
        wasIntercepting = this._isInterceptingKeyStrokes;
        this.stopInterceptingKeyStrokes();
      } else if (wasIntercepting) {
        // Only start if we were previously intercepting.
        this.startInterceptingKeyStrokes();
      }
    };

    return listener;
  }

  _handleKeypress = async (key: string): Promise<CLIError | void> => {
    // Prevent sending another event until the previous event has finished.
    if (this._isHandlingKeyPress && key !== CTRL_C) {
      return;
    }
    this._isHandlingKeyPress = true;
    try {
      logger.debug(`Key pressed: ${key}`);
      await this._onPress(key);
    } catch (error) {
      return new CLIError('There was an error with the key press handler.');
    } finally {
      this._isHandlingKeyPress = false;
      return;
    }
  };

  /** Start intercepting all key strokes and passing them to the input `onPress` method. */
  startInterceptingKeyStrokes() {
    if (this._isInterceptingKeyStrokes) {
      return;
    }
    this._isInterceptingKeyStrokes = true;
    const {stdin} = process;
    // $FlowFixMe[prop-missing]
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    stdin.on('data', this._handleKeypress);
  }

  /** Stop intercepting all key strokes. */
  stopInterceptingKeyStrokes() {
    if (!this._isInterceptingKeyStrokes) {
      return;
    }
    this._isInterceptingKeyStrokes = false;
    const {stdin} = process;
    stdin.removeListener('data', this._handleKeypress);
    // $FlowFixMe[prop-missing]
    stdin.setRawMode(false);
    stdin.resume();
  }
}
