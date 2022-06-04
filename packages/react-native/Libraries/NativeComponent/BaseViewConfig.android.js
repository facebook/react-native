/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import {DynamicallyInjectedByGestureHandler} from './ViewConfigIgnore';
import ReactNativeStyleAttributes from '../Components/View/ReactNativeStyleAttributes';
import type {PartialViewConfigWithoutName} from './PlatformBaseViewConfig';

const bubblingEventTypes = {
  // Bubbling events from UIManagerModuleConstants.java
  topChange: {
    phasedRegistrationNames: {
      captured: 'onChangeCapture',
      bubbled: 'onChange',
    },
  },
  topSelect: {
    phasedRegistrationNames: {
      captured: 'onSelectCapture',
      bubbled: 'onSelect',
    },
  },
  topTouchEnd: {
    phasedRegistrationNames: {
      captured: 'onTouchEndCapture',
      bubbled: 'onTouchEnd',
    },
  },
  topTouchCancel: {
    phasedRegistrationNames: {
      captured: 'onTouchCancelCapture',
      bubbled: 'onTouchCancel',
    },
  },
  topTouchStart: {
    phasedRegistrationNames: {
      captured: 'onTouchStartCapture',
      bubbled: 'onTouchStart',
    },
  },
  topTouchMove: {
    phasedRegistrationNames: {
      captured: 'onTouchMoveCapture',
      bubbled: 'onTouchMove',
    },
  },

  // Experimental/Work in Progress Pointer Events (not yet ready for use)
  topPointerCancel: {
    phasedRegistrationNames: {
      captured: 'onPointerCancelCapture',
      bubbled: 'onPointerCancel',
    },
  },
  topPointerDown: {
    phasedRegistrationNames: {
      captured: 'onPointerDownCapture',
      bubbled: 'onPointerDown',
    },
  },
  topPointerEnter2: {
    phasedRegistrationNames: {
      captured: 'onPointerEnter2Capture',
      bubbled: 'onPointerEnter2',
      skipBubbling: true,
    },
  },
  topPointerLeave2: {
    phasedRegistrationNames: {
      captured: 'onPointerLeave2Capture',
      bubbled: 'onPointerLeave2',
      skipBubbling: true,
    },
  },
  topPointerMove2: {
    phasedRegistrationNames: {
      captured: 'onPointerMove2Capture',
      bubbled: 'onPointerMove2',
    },
  },
  topPointerUp: {
    phasedRegistrationNames: {
      captured: 'onPointerUpCapture',
      bubbled: 'onPointerUp',
    },
  },
};

const directEventTypes = {
  topAccessibilityAction: {
    registrationName: 'onAccessibilityAction',
  },
  topPointerEnter: {
    registrationName: 'onPointerEnter',
  },
  topPointerLeave: {
    registrationName: 'onPointerLeave',
  },
  topPointerMove: {
    registrationName: 'onPointerMove',
  },
  onGestureHandlerEvent: DynamicallyInjectedByGestureHandler({
    registrationName: 'onGestureHandlerEvent',
  }),
  onGestureHandlerStateChange: DynamicallyInjectedByGestureHandler({
    registrationName: 'onGestureHandlerStateChange',
  }),

  // Direct events from UIManagerModuleConstants.java
  topContentSizeChange: {
    registrationName: 'onContentSizeChange',
  },
  topScrollBeginDrag: {
    registrationName: 'onScrollBeginDrag',
  },
  topMessage: {
    registrationName: 'onMessage',
  },
  topSelectionChange: {
    registrationName: 'onSelectionChange',
  },
  topLoadingFinish: {
    registrationName: 'onLoadingFinish',
  },
  topMomentumScrollEnd: {
    registrationName: 'onMomentumScrollEnd',
  },
  topClick: {
    registrationName: 'onClick',
  },
  topLoadingStart: {
    registrationName: 'onLoadingStart',
  },
  topLoadingError: {
    registrationName: 'onLoadingError',
  },
  topMomentumScrollBegin: {
    registrationName: 'onMomentumScrollBegin',
  },
  topScrollEndDrag: {
    registrationName: 'onScrollEndDrag',
  },
  topScroll: {
    registrationName: 'onScroll',
  },
  topLayout: {
    registrationName: 'onLayout',
  },
};

const validAttributesForNonEventProps = {
  // @ReactProps from BaseViewManager
  backgroundColor: {process: require('../StyleSheet/processColor')},
  transform: true,
  opacity: true,
  elevation: true,
  shadowColor: {process: require('../StyleSheet/processColor')},
  zIndex: true,
  renderToHardwareTextureAndroid: true,
  testID: true,
  nativeID: true,
  accessibilityLabelledBy: true,
  accessibilityLabel: true,
  accessibilityHint: true,
  accessibilityRole: true,
  accessibilityState: true,
  accessibilityActions: true,
  accessibilityValue: true,
  importantForAccessibility: true,
  rotation: true,
  scaleX: true,
  scaleY: true,
  translateX: true,
  translateY: true,
  accessibilityLiveRegion: true,

  // @ReactProps from LayoutShadowNode
  width: true,
  minWidth: true,
  collapsable: true,
  maxWidth: true,
  height: true,
  minHeight: true,
  maxHeight: true,
  flex: true,
  flexGrow: true,
  flexShrink: true,
  flexBasis: true,
  aspectRatio: true,
  flexDirection: true,
  flexWrap: true,
  alignSelf: true,
  alignItems: true,
  alignContent: true,
  justifyContent: true,
  overflow: true,
  display: true,

  margin: true,
  marginVertical: true,
  marginHorizontal: true,
  marginStart: true,
  marginEnd: true,
  marginTop: true,
  marginBottom: true,
  marginLeft: true,
  marginRight: true,

  padding: true,
  paddingVertical: true,
  paddingHorizontal: true,
  paddingStart: true,
  paddingEnd: true,
  paddingTop: true,
  paddingBottom: true,
  paddingLeft: true,
  paddingRight: true,

  borderWidth: true,
  borderStartWidth: true,
  borderEndWidth: true,
  borderTopWidth: true,
  borderBottomWidth: true,
  borderLeftWidth: true,
  borderRightWidth: true,

  start: true,
  end: true,
  left: true,
  right: true,
  top: true,
  bottom: true,

  position: true,

  style: ReactNativeStyleAttributes,
};

// Props for bubbling and direct events
const validAttributesForEventProps = {
  onLayout: true,

  // PanResponder handlers
  onMoveShouldSetResponder: true,
  onMoveShouldSetResponderCapture: true,
  onStartShouldSetResponder: true,
  onStartShouldSetResponderCapture: true,
  onResponderGrant: true,
  onResponderReject: true,
  onResponderStart: true,
  onResponderEnd: true,
  onResponderRelease: true,
  onResponderMove: true,
  onResponderTerminate: true,
  onResponderTerminationRequest: true,
  onShouldBlockNativeResponder: true,

  // Touch events
  onTouchStart: true,
  onTouchMove: true,
  onTouchEnd: true,
  onTouchCancel: true,

  // Pointer events
  onPointerEnter: true,
  onPointerLeave: true,
  onPointerMove: true,
};

/**
 * On Android, Props are derived from a ViewManager and its ShadowNode.
 *
 * Where did we find these base platform props from?
 * - Nearly all component ViewManagers descend from BaseViewManager,
 * - and BaseViewManagers' ShadowNodes descend from LayoutShadowNode.
 * - Also, all components inherit ViewConfigs from UIManagerModuleConstants.java.
 *
 * So, these ViewConfigs are generated from LayoutShadowNode and BaseViewManager.
 */
const PlatformBaseViewConfigAndroid: PartialViewConfigWithoutName = {
  directEventTypes,
  bubblingEventTypes,
  validAttributes: {
    ...validAttributesForNonEventProps,
    ...validAttributesForEventProps,
  },
};

export default PlatformBaseViewConfigAndroid;
