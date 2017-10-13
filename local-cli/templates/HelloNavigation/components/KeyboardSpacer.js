'use strict';

/* @flow */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Platform,
  View,
  Keyboard,
  LayoutAnimation,
} from 'react-native';

type Props = {
  offset?: number,
}

type State = {
  keyboardHeight: number
}

// Consider contributing this to the popular library:
// https://github.com/Andr3wHur5t/react-native-keyboard-spacer

/**
 * On iOS, the software keyboard covers the screen by default.
 * This is not desirable if there are TextInputs near the bottom of the screen -
 * they would be covered by the keyboard and the user cannot see what they
 * are typing.
 * To get around this problem, place a `<KeyboardSpacer />` at the bottom
 * of the screen, after your TextInputs. The keyboard spacer has size 0 and
 * when the keyboard is shown it will grow to the same size as the keyboard,
 * shifting all views above it and therefore making them visible.
 *
 * On Android, this component is not needed because resizing the UI when
 * the keyboard is shown is supported by the OS.
 * Simply set the `android:windowSoftInputMode="adjustResize"` attribute
 * on the <activity> element in your AndroidManifest.xml.
 *
 * How is this different from KeyboardAvoidingView?
 * The KeyboardAvoidingView doesn't work when used together with
 * a ScrollView/ListView.
 */
const KeyboardSpacer = () => (
  Platform.OS === 'ios' ? <KeyboardSpacerIOS /> : null
);

class KeyboardSpacerIOS extends Component<Props, State> {
  static propTypes = {
    offset: PropTypes.number,
  };

  static defaultProps = {
    offset: 0,
  };

  state: State = {
    keyboardHeight: 0,
  };

  componentWillMount() {
    this._registerEvents();
  }

  componentWillUnmount() {
    this._unRegisterEvents();
  }

  _keyboardWillShowSubscription: { +remove: Function };
  _keyboardWillHideSubscription: { +remove: Function };

  _registerEvents = () => {
    this._keyboardWillShowSubscription = Keyboard.addListener(
      'keyboardWillShow',
      this._keyboardWillShow
    );
    this._keyboardWillHideSubscription = Keyboard.addListener(
      'keyboardWillHide',
      this._keyboardWillHide
    );
  };

  _unRegisterEvents = () => {
    this._keyboardWillShowSubscription.remove();
    this._keyboardWillHideSubscription.remove();
  };

  _configureLayoutAnimation = () => {
    // Any duration is OK here. The `type: 'keyboard defines the animation.
    LayoutAnimation.configureNext({
      duration: 100,
      update: {
        type: 'keyboard',
      }
    });
  }

  _keyboardWillShow = (e: any) => {
    this._configureLayoutAnimation();
    this.setState({
      keyboardHeight: e.endCoordinates.height - (this.props.offset || 0),
    });
  };

  _keyboardWillHide = () => {
    this._configureLayoutAnimation();
    this.setState({
      keyboardHeight: 0,
    });
  };

  render() {
    return <View style={{ height: this.state.keyboardHeight }} />;
  }
}

export default KeyboardSpacer;
