/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostInstance} from '../../src/private/types/HostInstance';
import type {ViewProps} from '../Components/View/ViewPropTypes';
import type {DirectEventHandler} from '../Types/CodegenTypes';

import NativeEventEmitter from '../EventEmitter/NativeEventEmitter';
import {type ColorValue} from '../StyleSheet/StyleSheet';
import NativeModalManager from './NativeModalManager';
import RCTModalHostView from './RCTModalHostViewNativeComponent';
import VirtualizedLists from '@react-native/virtualized-lists';
import * as React from 'react';
import {useCallback, useContext, useEffect, useState} from 'react';

const ScrollView = require('../Components/ScrollView/ScrollView').default;
const View = require('../Components/View/View').default;
const AppContainer = require('../ReactNative/AppContainer').default;
const I18nManager = require('../ReactNative/I18nManager').default;
const {RootTagContext} = require('../ReactNative/RootTag');
const StyleSheet = require('../StyleSheet/StyleSheet').default;
const Platform = require('../Utilities/Platform').default;

const VirtualizedListContextResetter =
  VirtualizedLists.VirtualizedListContextResetter;

type ModalEventDefinitions = {
  modalDismissed: [{modalID: number}],
};

export type ModalInstance = HostInstance;

/** @deprecated Use ModalInstance instead */
export type PublicModalInstance = ModalInstance;

const ModalEventEmitter =
  Platform.OS === 'ios' && NativeModalManager != null
    ? new NativeEventEmitter<ModalEventDefinitions>(
        // T88715063: NativeEventEmitter only used this parameter on iOS. Now it uses it on all platforms, so this code was modified automatically to preserve its behavior
        // If you want to use the native module on other platforms, please remove this condition and test its behavior
        Platform.OS !== 'ios' ? null : NativeModalManager,
      )
    : null;

/**
 * The Modal component is a simple way to present content above an enclosing view.
 *
 * See https://reactnative.dev/docs/modal
 */

// In order to route onDismiss callbacks, we need to uniquely identifier each
// <Modal> on screen. There can be different ones, either nested or as siblings.
// We cannot pass the onDismiss callback to native as the view will be
// destroyed before the callback is fired.
let uniqueModalIdentifier = 0;

type OrientationChangeEvent = Readonly<{
  orientation: 'portrait' | 'landscape',
}>;

/** @build-types emit-as-interface Uniwind compatibility */
export type ModalBaseProps = {
  /**
   * @deprecated Use animationType instead
   */
  animated?: boolean,
  /**
   * The `animationType` prop controls how the modal animates.
   *
   * - `slide` slides in from the bottom
   * - `fade` fades into view
   * - `none` appears without an animation
   */
  animationType?: ?('none' | 'slide' | 'fade'),
  /**
   * The `transparent` prop determines whether your modal will fill the entire view.
   * Setting this to `true` will render the modal over a transparent background.
   */
  transparent?: ?boolean,
  /**
   * The `visible` prop determines whether your modal is visible.
   */
  visible?: ?boolean,
  /**
   * The `onRequestClose` callback is called when the user taps the hardware back button on Android, dismisses the sheet using a gesture on iOS (when `allowSwipeDismissal` is set to true) or the menu button on Apple TV.
   *
   * This is required on iOS and Android.
   */
  // onRequestClose?: (event: NativeSyntheticEvent<any>) => void;
  onRequestClose?: ?DirectEventHandler<null>,
  /**
   * The `onShow` prop allows passing a function that will be called once the modal has been shown.
   */
  // onShow?: (event: NativeSyntheticEvent<any>) => void;
  onShow?: ?DirectEventHandler<null>,

  /**
   * The `backdropColor` props sets the background color of the modal's container.
   * Defaults to `white` if not provided and transparent is `false`. Ignored if `transparent` is `true`.
   */
  backdropColor?: ColorValue,

  /**
   * A ref to the native Modal component.
   */
  modalRef?: React.RefSetter<ModalInstance>,
};

export type ModalPropsIOS = {
  /**
   * The `presentationStyle` determines the style of modal to show
   */
  presentationStyle?: ?(
    | 'fullScreen'
    | 'pageSheet'
    | 'formSheet'
    | 'overFullScreen'
  ),

  /**
   * The `supportedOrientations` prop allows the modal to be rotated to any of the specified orientations.
   * On iOS, the modal is still restricted by what's specified in your app's Info.plist's UISupportedInterfaceOrientations field.
   */
  supportedOrientations?: ?ReadonlyArray<
    | 'portrait'
    | 'portrait-upside-down'
    | 'landscape'
    | 'landscape-left'
    | 'landscape-right',
  >,

  /**
   * The `onDismiss` prop allows passing a function that will be called once the modal has been dismissed.
   */
  // onDismiss?: (() => void) | undefined;
  onDismiss?: ?() => void,

  /**
   * The `onOrientationChange` callback is called when the orientation changes while the modal is being displayed.
   * The orientation provided is only 'portrait' or 'landscape'. This callback is also called on initial render, regardless of the current orientation.
   */
  // onOrientationChange?:
  //   | ((event: NativeSyntheticEvent<any>) => void)
  //   | undefined;
  onOrientationChange?: ?DirectEventHandler<OrientationChangeEvent>,

  /**
   * Controls whether the modal can be dismissed by swiping down on iOS.
   * This requires you to implement the `onRequestClose` prop to handle the dismissal.
   */
  allowSwipeDismissal?: ?boolean,
};

export type ModalPropsAndroid = {
  /**
   *  Controls whether to force hardware acceleration for the underlying window.
   */
  hardwareAccelerated?: ?boolean,

  /**
   *  Determines whether your modal should go under the system statusbar.
   */
  statusBarTranslucent?: ?boolean,

  /**
   *  Determines whether your modal should go under the system navigationbar.
   */
  navigationBarTranslucent?: ?boolean,
};

export type ModalProps = {
  ...ModalBaseProps,
  ...ModalPropsIOS,
  ...ModalPropsAndroid,
  ...ViewProps,
};

function confirmProps({
  transparent,
  presentationStyle,
  navigationBarTranslucent,
  statusBarTranslucent,
  allowSwipeDismissal,
  onRequestClose,
}: ModalProps) {
  if (__DEV__) {
    if (
      presentationStyle &&
      presentationStyle !== 'overFullScreen' &&
      transparent === true
    ) {
      console.warn(
        `Modal with '${presentationStyle}' presentation style and 'transparent' value is not supported.`,
      );
    }
    if (navigationBarTranslucent === true && statusBarTranslucent !== true) {
      console.warn(
        'Modal with translucent navigation bar and without translucent status bar is not supported.',
      );
    }

    if (
      Platform.OS === 'ios' &&
      allowSwipeDismissal === true &&
      !onRequestClose
    ) {
      console.warn(
        'Modal requires the onRequestClose prop when used with `allowSwipeDismissal`. This is necessary to prevent state corruption.',
      );
    }
  }
}

const onStartShouldSetResponder = () => true; // We don't want any responder events bubbling out of the modal.

const Modal: component(
  ref?: React.RefSetter<ModalInstance>,
  ...props: ModalProps
) = ({
  backdropColor,
  transparent,
  children,
  presentationStyle,
  animationType,
  onRequestClose,
  onShow,
  visible = true,
  hardwareAccelerated = false,
  ref: modalRef,
  statusBarTranslucent,
  navigationBarTranslucent,
  supportedOrientations,
  onOrientationChange,
  allowSwipeDismissal,
  testID,
  onDismiss,
}: {
  ref?: React.RefSetter<PublicModalInstance>,
  ...ModalProps,
}): React.Node => {
  const isVisible = visible === true;

  // Create a state to track whether the Modal is rendering or not.
  // This is the only prop that controls whether the modal is rendered or not.
  const [isRendered, setIsRendered] = useState(visible === true);
  const [identifier] = useState(() => uniqueModalIdentifier++);

  useEffect(() => {
    if (!ModalEventEmitter) {
      return;
    }

    const eventSubscription = ModalEventEmitter.addListener(
      'modalDismissed',
      event => {
        setIsRendered(false);
        if (event.modalID === identifier) {
          onDismiss?.();
        }
      },
    );
    return () => eventSubscription.remove();
  }, [onDismiss, identifier]);

  useEffect(() => {
    if (isVisible) {
      setIsRendered(true);
    }
  }, [isVisible]);

  useEffect(() => {
    return () => {
      setIsRendered(false);
    };
  }, []);

  useEffect(() => {
    if (__DEV__) {
      confirmProps({
        transparent,
        presentationStyle,
        navigationBarTranslucent,
        statusBarTranslucent,
        allowSwipeDismissal,
        onRequestClose,
      });
    }
  }, [
    transparent,
    presentationStyle,
    navigationBarTranslucent,
    statusBarTranslucent,
    allowSwipeDismissal,
    onRequestClose,
  ]);

  const rootTag = useContext(RootTagContext);

  const onDismissIos = useCallback(() => {
    // OnDismiss is implemented on iOS only.
    if (Platform.OS === 'ios') {
      setIsRendered(false);
      onDismiss?.();
    }
  }, [onDismiss]);

  const shouldShowModal =
    Platform.OS === 'ios' ? isRendered && isVisible : isVisible;

  if (!shouldShowModal) {
    return null;
  }

  const isTransparent = transparent === true;

  // Only override backgroundColor when transparent or backdropColor are
  // explicitly set, so that these Modal-specific props take precedence
  // over the generic style prop. The default backgroundColor ('white')
  // is defined in styles.container below.
  const containerStyles = {};
  if (this.props.transparent === true) {
    containerStyles.backgroundColor = 'transparent';
  } else if (this.props.backdropColor != null) {
    containerStyles.backgroundColor = this.props.backdropColor;
  }

  return (
    <RCTModalHostView
      /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
       * https://fburl.com/workplace/6291gfvu */
      animationType={animationType || 'none'}
      presentationStyle={
        presentationStyle || (isTransparent ? 'overFullScreen' : 'fullScreen')
      }
      transparent={transparent}
      hardwareAccelerated={hardwareAccelerated}
      onRequestClose={onRequestClose}
      onShow={onShow}
      onDismiss={onDismissIos}
      ref={modalRef}
      visible={visible}
      statusBarTranslucent={statusBarTranslucent}
      navigationBarTranslucent={navigationBarTranslucent}
      identifier={identifier}
      style={styles.modal}
      // $FlowFixMe[method-unbinding] added when improving typing for this parameters
      onStartShouldSetResponder={onStartShouldSetResponder}
      supportedOrientations={supportedOrientations}
      onOrientationChange={onOrientationChange}
      allowSwipeDismissal={allowSwipeDismissal}
      testID={testID}>
      <VirtualizedListContextResetter>
        <ScrollView.Context.Provider value={null}>
          <View
            // $FlowFixMe[incompatible-type]
            style={[styles.container, this.props.style, containerStyles]}
            collapsable={false}>
            {__DEV__ ? (
              <AppContainer rootTag={rootTag}>{children}</AppContainer>
            ) : (
              children
            )}
          </View>
        </ScrollView.Context.Provider>
      </VirtualizedListContextResetter>
    </RCTModalHostView>
  );
};

const side = I18nManager.getConstants().isRTL ? 'right' : 'left';
const styles = StyleSheet.create({
  modal: {
    position: 'absolute',
  },
  /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
   * https://fburl.com/workplace/6291gfvu */
  container: {
    /* $FlowFixMe[invalid-computed-prop] (>=0.111.0 site=react_native_fb) This
     * comment suppresses an error found when Flow v0.111 was deployed. To see
     * the error, delete this comment and run Flow. */
    // $FlowFixMe[incompatible-type]
    [side]: 0,
    top: 0,
    flex: 1,
    backgroundColor: 'white',
  },
});

Modal.displayName = 'Modal';

// $FlowExpectedError[prop-missing]
Modal.Context = VirtualizedListContextResetter;

export default Modal;
