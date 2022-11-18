/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {PartialViewConfigWithoutName} from './PlatformBaseViewConfig';

import ReactNativeStyleAttributes from '../Components/View/ReactNativeStyleAttributes';
import {DynamicallyInjectedByGestureHandler} from './ViewConfigIgnore';

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
  topPointerEnter: {
    phasedRegistrationNames: {
      captured: 'onPointerEnterCapture',
      bubbled: 'onPointerEnter',
      skipBubbling: true,
    },
  },
  topPointerLeave: {
    phasedRegistrationNames: {
      captured: 'onPointerLeaveCapture',
      bubbled: 'onPointerLeave',
      skipBubbling: true,
    },
  },
  topPointerMove: {
    phasedRegistrationNames: {
      captured: 'onPointerMoveCapture',
      bubbled: 'onPointerMove',
    },
  },
  topPointerUp: {
    phasedRegistrationNames: {
      captured: 'onPointerUpCapture',
      bubbled: 'onPointerUp',
    },
  },
  topPointerOut: {
    phasedRegistrationNames: {
      captured: 'onPointerOutCapture',
      bubbled: 'onPointerOut',
    },
  },
  topPointerOver: {
    phasedRegistrationNames: {
      captured: 'onPointerOverCapture',
      bubbled: 'onPointerOver',
    },
  },
};

const directEventTypes = {
  topAccessibilityAction: {
    registrationName: 'onAccessibilityAction',
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
  accessibilityCollection: true,
  accessibilityCollectionItem: true,
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
  rowGap: true,
  columnGap: true,
  gap: true,
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
  marginBlock: true,
  marginBlockEnd: true,
  marginBlockStart: true,
  marginBottom: true,
  marginEnd: true,
  marginHorizontal: true,
  marginInline: true,
  marginInlineEnd: true,
  marginInlineStart: true,
  marginLeft: true,
  marginRight: true,
  marginStart: true,
  marginTop: true,
  marginVertical: true,

  padding: true,
  paddingBlock: true,
  paddingBlockEnd: true,
  paddingBlockStart: true,
  paddingBottom: true,
  paddingEnd: true,
  paddingHorizontal: true,
  paddingInline: true,
  paddingInlineEnd: true,
  paddingInlineStart: true,
  paddingLeft: true,
  paddingRight: true,
  paddingStart: true,
  paddingTop: true,
  paddingVertical: true,

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
  onPointerEnterCapture: true,
  onPointerLeave: true,
  onPointerLeaveCapture: true,
  onPointerMove: true,
  onPointerMoveCapture: true,
  onPointerOut: true,
  onPointerOutCapture: true,
  onPointerOver: true,
  onPointerOverCapture: true,
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
