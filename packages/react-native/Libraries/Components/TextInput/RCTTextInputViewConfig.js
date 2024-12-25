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

import {ConditionallyIgnoredEventHandlers} from '../../NativeComponent/ViewConfigIgnore';

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
    topScroll: {
      registrationName: 'onScroll',
    },
    topSelectionChange: {
      registrationName: 'onSelectionChange',
    },
    topContentSizeChange: {
      registrationName: 'onContentSizeChange',
    },
    topChangeSync: {
      registrationName: 'onChangeSync',
    },
    topKeyPressSync: {
      registrationName: 'onKeyPressSync',
    },
  },
  validAttributes: {
    dynamicTypeRamp: true,
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
    textDecorationColor: {
      process: require('../../StyleSheet/processColor').default,
    },
    color: {process: require('../../StyleSheet/processColor').default},
    maxFontSizeMultiplier: true,
    textShadowColor: {
      process: require('../../StyleSheet/processColor').default,
    },
    editable: true,
    inputAccessoryViewID: true,
    inputAccessoryViewButtonLabel: true,
    caretHidden: true,
    enablesReturnKeyAutomatically: true,
    placeholderTextColor: {
      process: require('../../StyleSheet/processColor').default,
    },
    clearButtonMode: true,
    keyboardType: true,
    selection: true,
    returnKeyType: true,
    submitBehavior: true,
    mostRecentEventCount: true,
    scrollEnabled: true,
    selectionColor: {process: require('../../StyleSheet/processColor').default},
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
    lineBreakStrategyIOS: true,
    lineBreakModeIOS: true,
    smartInsertDelete: true,
    ...ConditionallyIgnoredEventHandlers({
      onChange: true,
      onSelectionChange: true,
      onContentSizeChange: true,
      onScroll: true,
      onChangeSync: true,
      onKeyPressSync: true,
    }),
  },
};

module.exports = (RCTTextInputViewConfig: PartialViewConfigWithoutName);
