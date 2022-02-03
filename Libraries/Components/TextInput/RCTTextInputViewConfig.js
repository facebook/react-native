/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {PartialViewConfig} from '../../Renderer/shims/ReactNativeTypes';

type PartialViewConfigWithoutName = $Rest<
  PartialViewConfig,
  {uiViewClassName: string},
>;

const RCTTextInputViewConfig = {
  bubblingEventTypes: {
    topBlur: {
      phasedRegistrationNames: {
        bubbled: 'onBlur',
        captured: 'onBlurCapture',
      },
    },
    topChange: {
      phasedRegistrationNames: {
        bubbled: 'onChange',
        captured: 'onChangeCapture',
      },
    },
    topContentSizeChange: {
      phasedRegistrationNames: {
        captured: 'onContentSizeChangeCapture',
        bubbled: 'onContentSizeChange',
      },
    },
    topEndEditing: {
      phasedRegistrationNames: {
        bubbled: 'onEndEditing',
        captured: 'onEndEditingCapture',
      },
    },
    topFocus: {
      phasedRegistrationNames: {
        bubbled: 'onFocus',
        captured: 'onFocusCapture',
      },
    },
    topKeyPress: {
      phasedRegistrationNames: {
        bubbled: 'onKeyPress',
        captured: 'onKeyPressCapture',
      },
    },
    topSubmitEditing: {
      phasedRegistrationNames: {
        bubbled: 'onSubmitEditing',
        captured: 'onSubmitEditingCapture',
      },
    },
    topTouchCancel: {
      phasedRegistrationNames: {
        bubbled: 'onTouchCancel',
        captured: 'onTouchCancelCapture',
      },
    },
    topTouchEnd: {
      phasedRegistrationNames: {
        bubbled: 'onTouchEnd',
        captured: 'onTouchEndCapture',
      },
    },

    topTouchMove: {
      phasedRegistrationNames: {
        bubbled: 'onTouchMove',
        captured: 'onTouchMoveCapture',
      },
    },
  },
  directEventTypes: {
    topTextInput: {
      registrationName: 'onTextInput',
    },
    topKeyPressSync: {
      registrationName: 'onKeyPressSync',
    },
    topScroll: {
      registrationName: 'onScroll',
    },
    topSelectionChange: {
      registrationName: 'onSelectionChange',
    },
    topChangeSync: {
      registrationName: 'onChangeSync',
    },
  },
  validAttributes: {
    fontSize: true,
    fontWeight: true,
    fontVariant: true,
    // flowlint-next-line untyped-import:off
    textShadowOffset: {diff: require('../../Utilities/differ/sizesDiffer')},
    allowFontScaling: true,
    fontStyle: true,
    textTransform: true,
    textAlign: true,
    fontFamily: true,
    lineHeight: true,
    isHighlighted: true,
    writingDirection: true,
    textDecorationLine: true,
    textShadowRadius: true,
    letterSpacing: true,
    textDecorationStyle: true,
    textDecorationColor: {process: require('../../StyleSheet/processColor')},
    color: {process: require('../../StyleSheet/processColor')},
    maxFontSizeMultiplier: true,
    textShadowColor: {process: require('../../StyleSheet/processColor')},
    editable: true,
    inputAccessoryViewID: true,
    caretHidden: true,
    enablesReturnKeyAutomatically: true,
    placeholderTextColor: {process: require('../../StyleSheet/processColor')},
    clearButtonMode: true,
    keyboardType: true,
    selection: true,
    returnKeyType: true,
    blurOnSubmit: true,
    mostRecentEventCount: true,
    scrollEnabled: true,
    selectionColor: {process: require('../../StyleSheet/processColor')},
    contextMenuHidden: true,
    secureTextEntry: true,
    placeholder: true,
    autoCorrect: true,
    multiline: true,
    textContentType: true,
    maxLength: true,
    autoCapitalize: true,
    keyboardAppearance: true,
    passwordRules: true,
    spellCheck: true,
    selectTextOnFocus: true,
    text: true,
    clearTextOnFocus: true,
    showSoftInputOnFocus: true,
    autoFocus: true,
  },
};

module.exports = (RCTTextInputViewConfig: PartialViewConfigWithoutName);
