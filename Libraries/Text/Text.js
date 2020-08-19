/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @generate-docs
 */

'use strict';

const DeprecatedTextPropTypes = require('../DeprecatedPropTypes/DeprecatedTextPropTypes');
const React = require('react');
const ReactNativeViewAttributes = require('../Components/View/ReactNativeViewAttributes');
const TextAncestor = require('./TextAncestor');
const Touchable = require('../Components/Touchable/Touchable');
const UIManager = require('../ReactNative/UIManager');

const createReactNativeComponentClass = require('../Renderer/shims/createReactNativeComponentClass');
const nullthrows = require('nullthrows');
const processColor = require('../StyleSheet/processColor');

import type {PressEvent} from '../Types/CoreEventTypes';
import type {HostComponent} from '../Renderer/shims/ReactNativeTypes';
import type {PressRetentionOffset, TextProps} from './TextProps';

type ResponseHandlers = $ReadOnly<{|
  onStartShouldSetResponder: () => boolean,
  onResponderGrant: (event: PressEvent, dispatchID: string) => void,
  onResponderMove: (event: PressEvent) => void,
  onResponderRelease: (event: PressEvent) => void,
  onResponderTerminate: (event: PressEvent) => void,
  onResponderTerminationRequest: () => boolean,
|}>;

type Props = $ReadOnly<{|
  ...TextProps,
  forwardedRef: ?React.Ref<'RCTText' | 'RCTVirtualText'>,
|}>;

type State = {|
  touchable: {|
    touchState: ?string,
    responderID: ?number,
  |},
  isHighlighted: boolean,
  createResponderHandlers: () => ResponseHandlers,
  responseHandlers: ?ResponseHandlers,
|};

const PRESS_RECT_OFFSET = {top: 20, left: 20, right: 20, bottom: 30};

const viewConfig = {
  validAttributes: {
    ...ReactNativeViewAttributes.UIView,
    isHighlighted: true,
    numberOfLines: true,
    ellipsizeMode: true,
    allowFontScaling: true,
    maxFontSizeMultiplier: true,
    disabled: true,
    selectable: true,
    selectionColor: true,
    adjustsFontSizeToFit: true,
    minimumFontScale: true,
    textBreakStrategy: true,
    onTextLayout: true,
    onInlineViewLayout: true,
    dataDetectorType: true,
    android_hyphenationFrequency: true,
  },
  directEventTypes: {
    topTextLayout: {
      registrationName: 'onTextLayout',
    },
    topInlineViewLayout: {
      registrationName: 'onInlineViewLayout',
    },
  },
  uiViewClassName: 'RCTText',
};

class TouchableText extends React.Component<Props, State> {
  static defaultProps = {
    accessible: true,
    allowFontScaling: true,
    ellipsizeMode: 'tail',
  };

  touchableGetPressRectOffset: ?() => PressRetentionOffset;
  touchableHandleActivePressIn: ?() => void;
  touchableHandleActivePressOut: ?() => void;
  touchableHandleLongPress: ?(event: PressEvent) => void;
  touchableHandlePress: ?(event: PressEvent) => void;
  touchableHandleResponderGrant: ?(
    event: PressEvent,
    dispatchID: string,
  ) => void;
  touchableHandleResponderMove: ?(event: PressEvent) => void;
  touchableHandleResponderRelease: ?(event: PressEvent) => void;
  touchableHandleResponderTerminate: ?(event: PressEvent) => void;
  touchableHandleResponderTerminationRequest: ?() => boolean;

  state = {
    ...Touchable.Mixin.touchableGetInitialState(),
    isHighlighted: false,
    createResponderHandlers: this._createResponseHandlers.bind(this),
    responseHandlers: null,
  };

  static getDerivedStateFromProps(
    nextProps: Props,
    prevState: State,
  ): $Shape<State> | null {
    return prevState.responseHandlers == null && isTouchable(nextProps)
      ? {
          responseHandlers: prevState.createResponderHandlers(),
        }
      : null;
  }

  static viewConfig = viewConfig;

  render(): React.Node {
    let props = this.props;
    if (isTouchable(props)) {
      props = {
        ...props,
        ...this.state.responseHandlers,
        isHighlighted: this.state.isHighlighted,
      };
    }
    if (props.selectionColor != null) {
      props = {
        ...props,
        selectionColor: processColor(props.selectionColor),
      };
    }
    if (__DEV__) {
      if (Touchable.TOUCH_TARGET_DEBUG && props.onPress != null) {
        props = {
          ...props,
          style: [props.style, {color: 'magenta'}],
        };
      }
    }
    return (
      <TextAncestor.Consumer>
        {hasTextAncestor =>
          hasTextAncestor ? (
            <RCTVirtualText {...props} ref={props.forwardedRef} />
          ) : (
            <TextAncestor.Provider value={true}>
              <RCTText {...props} ref={props.forwardedRef} />
            </TextAncestor.Provider>
          )
        }
      </TextAncestor.Consumer>
    );
  }

  _createResponseHandlers(): ResponseHandlers {
    return {
      onStartShouldSetResponder: (): boolean => {
        const {onStartShouldSetResponder} = this.props;
        const shouldSetResponder =
          (onStartShouldSetResponder == null
            ? false
            : onStartShouldSetResponder()) || isTouchable(this.props);

        if (shouldSetResponder) {
          this._attachTouchHandlers();
        }
        return shouldSetResponder;
      },
      onResponderGrant: (event: PressEvent, dispatchID: string): void => {
        nullthrows(this.touchableHandleResponderGrant)(event, dispatchID);
        if (this.props.onResponderGrant != null) {
          this.props.onResponderGrant.call(this, event, dispatchID);
        }
      },
      onResponderMove: (event: PressEvent): void => {
        nullthrows(this.touchableHandleResponderMove)(event);
        if (this.props.onResponderMove != null) {
          this.props.onResponderMove.call(this, event);
        }
      },
      onResponderRelease: (event: PressEvent): void => {
        nullthrows(this.touchableHandleResponderRelease)(event);
        if (this.props.onResponderRelease != null) {
          this.props.onResponderRelease.call(this, event);
        }
      },
      onResponderTerminate: (event: PressEvent): void => {
        nullthrows(this.touchableHandleResponderTerminate)(event);
        if (this.props.onResponderTerminate != null) {
          this.props.onResponderTerminate.call(this, event);
        }
      },
      onResponderTerminationRequest: (): boolean => {
        const {onResponderTerminationRequest} = this.props;
        if (!nullthrows(this.touchableHandleResponderTerminationRequest)()) {
          return false;
        }
        if (onResponderTerminationRequest == null) {
          return true;
        }
        return onResponderTerminationRequest();
      },
    };
  }

  /**
   * Lazily attaches Touchable.Mixin handlers.
   */
  _attachTouchHandlers(): void {
    if (this.touchableGetPressRectOffset != null) {
      return;
    }
    for (const key in Touchable.Mixin) {
      if (typeof Touchable.Mixin[key] === 'function') {
        (this: any)[key] = Touchable.Mixin[key].bind(this);
      }
    }
    this.touchableHandleActivePressIn = (): void => {
      if (!this.props.suppressHighlighting && isTouchable(this.props)) {
        this.setState({isHighlighted: true});
      }
    };
    this.touchableHandleActivePressOut = (): void => {
      if (!this.props.suppressHighlighting && isTouchable(this.props)) {
        this.setState({isHighlighted: false});
      }
    };
    this.touchableHandlePress = (event: PressEvent): void => {
      if (this.props.onPress != null) {
        this.props.onPress(event);
      }
    };
    this.touchableHandleLongPress = (event: PressEvent): void => {
      if (this.props.onLongPress != null) {
        this.props.onLongPress(event);
      }
    };
    this.touchableGetPressRectOffset = (): PressRetentionOffset =>
      this.props.pressRetentionOffset == null
        ? PRESS_RECT_OFFSET
        : this.props.pressRetentionOffset;
  }
}

const isTouchable = (props: Props): boolean =>
  props.onPress != null ||
  props.onLongPress != null ||
  props.onStartShouldSetResponder != null;

const RCTText = createReactNativeComponentClass(
  viewConfig.uiViewClassName,
  () => viewConfig,
);

const RCTVirtualText =
  UIManager.getViewManagerConfig('RCTVirtualText') == null
    ? RCTText
    : createReactNativeComponentClass('RCTVirtualText', () => ({
        validAttributes: {
          ...ReactNativeViewAttributes.UIView,
          isHighlighted: true,
          maxFontSizeMultiplier: true,
        },
        uiViewClassName: 'RCTVirtualText',
      }));

/**
  A React component for displaying text.

  `Text` supports nesting, styling, and touch handling.

  In the following example, the nested title and body text will inherit the
  `fontFamily` from `styles.baseText`, but the title provides its own additional
  styles. The title and body will stack on top of each other on account of the
  literal newlines:

  ```SnackPlayer name=Text%20Function%20Component%20Example
  import React, { useState } from "react";
  import { Text, StyleSheet } from "react-native";

  const onPressTitle = () => {
    console.log("title pressed");
  };

  const TextInANest = () => {
    const titleText = useState("Bird's Nest");
    const bodyText = useState("This is not really a bird nest.");

    return (
      <Text style={styles.baseText}>
        <Text style={styles.titleText} onPress={onPressTitle}>
          {titleText}
          {"\n"}
          {"\n"}
        </Text>
        <Text numberOfLines={5}>{bodyText}</Text>
      </Text>
    );
  };

  const styles = StyleSheet.create({
    baseText: {
      fontFamily: "Cochin"
    },
    titleText: {
      fontSize: 20,
      fontWeight: "bold"
    }
  });

  export default TextInANest;
  ```

  ```SnackPlayer name=Text%20Class%20Component%20Example
  import React, { Component } from "react";
  import { Text, StyleSheet } from "react-native";

  class TextInANest extends Component {
    constructor(props) {
      super(props);
      this.state = {
        titleText: "Bird's Nest",
        bodyText: "This is not really a bird nest."
      };
    }

    render() {
      return (
        <Text style={styles.baseText}>
          <Text style={styles.titleText} onPress={this.onPressTitle}>
            {this.state.titleText}
            {"\n"}
            {"\n"}
          </Text>
          <Text numberOfLines={5}>{this.state.bodyText}</Text>
        </Text>
      );
    }
  }

  const styles = StyleSheet.create({
    baseText: {
      fontFamily: "Cochin"
    },
    titleText: {
      fontSize: 20,
      fontWeight: "bold"
    }
  });

  export default TextInANest;
  ```

  ## Nested text

  Both Android and iOS allow you to display formatted text by annotating ranges
  of a string with specific formatting like bold or colored text
  (`NSAttributedString` on iOS, `SpannableString` on Android). In practice, this
  is very tedious. For React Native, we decided to use web paradigm for this
  where you can nest text to achieve the same effect.

  ```SnackPlayer name=Nested%20Text%20Example
  import React from 'react';
  import { Text, StyleSheet } from 'react-native';

  const BoldAndBeautiful = () => {
    return (
      <Text style={styles.baseText}>
        I am bold
        <Text style={styles.innerText}> and red</Text>
      </Text>
    );
  };

  const styles = StyleSheet.create({
    baseText: {
      fontWeight: 'bold'
    },
    innerText: {
      color: 'red'
    }
  });

  export default BoldAndBeautiful;
  ```

  Behind the scenes, React Native converts this to a flat `NSAttributedString`
  or `SpannableString` that contains the following information:

  ```jsx
  "I am bold and red"
  0-9: bold
  9-17: bold, red
  ```

  ## Containers

  The `<Text>` element is unique relative to layout: everything inside is no
  longer using the Flexbox layout but using text layout. This means that
  elements inside of a `<Text>` are no longer rectangles, but wrap when they see
  the end of the line.

  ```jsx
  <Text>
    <Text>First part and </Text>
    <Text>second part</Text>
  </Text>
  // Text container: the text will be inline if the space allowed it
  // |First part and second part|

  // otherwise, the text will flow as if it was one
  // |First part |
  // |and second |
  // |part       |

  <View>
    <Text>First part and </Text>
    <Text>second part</Text>
  </View>
  // View container: each text is its own block
  // |First part and|
  // |second part   |

  // otherwise, the text will flow in its own block
  // |First part |
  // |and        |
  // |second part|
  ```

  ## Limited Style Inheritance

  On the web, the usual way to set a font family and size for the entire
  document is to take advantage of inherited CSS properties like so:

  ```css
  html {
    font-family: 'lucida grande', tahoma, verdana, arial, sans-serif;
    font-size: 11px;
    color: #141823;
  }
  ```

  All elements in the document will inherit this font unless they or one of
  their parents specifies a new rule.

  In React Native, we are more strict about it: **you must wrap all the text nodes
  inside of a `<Text>` component**. You cannot have a text node directly under a
  `<View>`.

  ```jsx
  // BAD: will raise exception, can't have a text node as child of a <View>
  <View>
    Some text
  </View>

  // GOOD
  <View>
    <Text>
      Some text
    </Text>
  </View>
  ```

  You also lose the ability to set up a default font for an entire subtree.
  Meanwhile, `fontFamily` only accepts a single font name, which is different
  from `font-family` in CSS. The recommended way to use consistent fonts and
  sizes across your application is to create a component `MyAppText` that
  includes them and use this component across your app. You can also use this
  component to make more specific components like `MyAppHeaderText` for other
  kinds of text.

  ```jsx
  <View>
    <MyAppText>
      Text styled with the default font for the entire application
    </MyAppText>
    <MyAppHeaderText>Text styled as a header</MyAppHeaderText>
  </View>
  ```

  Assuming that `MyAppText` is a component that only renders out its children into
  a `Text` component with styling, then `MyAppHeaderText` can be defined as
  follows:

  ```jsx
  class MyAppHeaderText extends Component {
    render() {
      return (
        <MyAppText>
          <Text style={{ fontSize: 20 }}>
            {this.props.children}
          </Text>
        </MyAppText>
      );
    }
  }
  ```

  Composing `MyAppText` in this way ensures that we get the styles from a
  top-level component, but leaves us the ability to add / override them in
  specific use cases.

  React Native still has the concept of style inheritance, but limited to text
  subtrees. In this case, the second part will be both bold and red.

  ```jsx
  <Text style={{ fontWeight: 'bold' }}>
    I am bold
    <Text style={{ color: 'red' }}>and red</Text>
  </Text>
  ```

  We believe that this more constrained way to style text will yield better
  apps:

  - (Developer) React components are designed with strong isolation in mind: You
    should be able to drop a component anywhere in your application, trusting
    that as long as the props are the same, it will look and behave the same
    way. Text properties that could inherit from outside of the props would
    break this isolation.

  - (Implementor) The implementation of React Native is also simplified. We do
    not need to have a `fontFamily` field on every single element, and we do not
    need to potentially traverse the tree up to the root every time we display a
    text node. The style inheritance is only encoded inside of the native Text
    component and doesn't leak to other components or the system itself.  
 */
const Text = (
  props: TextProps,
  forwardedRef: ?React.Ref<'RCTText' | 'RCTVirtualText'>,
) => {
  return <TouchableText {...props} forwardedRef={forwardedRef} />;
};
const TextToExport = React.forwardRef(Text);
TextToExport.displayName = 'Text';

// TODO: Deprecate this.
/* $FlowFixMe(>=0.89.0 site=react_native_fb) This comment suppresses an error
 * found when Flow v0.89 was deployed. To see the error, delete this comment
 * and run Flow. */
TextToExport.propTypes = DeprecatedTextPropTypes;

type TextStatics = $ReadOnly<{|
  propTypes: typeof DeprecatedTextPropTypes,
|}>;

module.exports = ((TextToExport: any): React.AbstractComponent<
  TextProps,
  React.ElementRef<HostComponent<TextProps>>,
> &
  TextStatics);
