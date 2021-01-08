/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {ViewProps} from './ViewPropTypes';
import type {BlurEvent, FocusEvent} from '../../Types/CoreEventTypes';
const React = require('react');
import ViewNativeComponent from './ViewNativeComponent';
const TextAncestor = require('../../Text/TextAncestor');
const TextInputState = require('../TextInput/TextInputState');
import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
const setAndForwardRef = require('../../Utilities/setAndForwardRef');
const {useRef} = React;

export type Props = ViewProps;

/**
 * The most fundamental component for building a UI, View is a container that
 * supports layout with flexbox, style, some touch handling, and accessibility
 * controls.
 *
 * @see https://reactnative.dev/docs/view.html
 */
const View: React.AbstractComponent<
  ViewProps,
  React.ElementRef<typeof ViewNativeComponent>,
> = React.forwardRef((props: ViewProps, forwardedRef) => {
  const viewRef = useRef<null | React.ElementRef<HostComponent<mixed>>>(null);

  const _setNativeRef = setAndForwardRef({
    getForwardedRef: () => forwardedRef,
    setLocalRef: ref => {
      viewRef.current = ref;
    },
  });

  const _onBlur = (event: BlurEvent) => {
    TextInputState.blurInput(viewRef.current);
    if (props.onBlur) {
      props.onBlur(event);
    }
  };

  const _onFocus = (event: FocusEvent) => {
    TextInputState.focusInput(viewRef.current);
    if (props.onFocus) {
      props.onFocus(event);
    }
  };

  return (
    <TextAncestor.Provider value={false}>
      <ViewNativeComponent
        {...props}
        onBlur={_onBlur}
        onFocus={_onFocus}
        ref={_setNativeRef}
      />
    </TextAncestor.Provider>
  );
});

View.displayName = 'View';

module.exports = View;
