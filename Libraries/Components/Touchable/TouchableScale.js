/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const Animated = require('animated');
const Touchable = require('Touchable');
const React = require('react');
const createReactClass = require('create-react-class');
const ensurePositiveDelayProps = require('ensurePositiveDelayProps');

const TouchableScale = createReactClass({
    mixins:[Touchable.Mixin],
    /*
    * `Touchable.Mixin` self callbacks.
    */
   touchableHandleActivePressIn: function(e){
       this.setScaleTo(this.props.activeScale || 0.9);
    },
    touchableHandleActivePressOut: function(e) {
        this.setScaleTo(1);
        this.props.onPressIn && this.props.onPressIn(e)
   },
    getInitialState: function() {
        return {
            ...this.touchableGetInitialState(),
            currentScale:new Animated.Value(1),           
        };
    },
    setScaleTo: function (value){
        Animated.spring(this.state.currentScale, {
            toValue: value,
        }).start();
    },
    componentDidMount: function(){
        ensurePositiveDelayProps(this.props);
    },
    UNSAFE_componentWillReceiveProps: function(nextProps) {
        ensurePositiveDelayProps(nextProps);
    },
    touchableHandlePress: function(e) {
        this.props.onPress && this.props.onPress(e);
    },
    render: function() {
        return (
            <Animated.View
            accessible={this.props.accessible !== false}
            accessibilityLabel={this.props.accessibilityLabel}
            accessibilityHint={this.props.accessibilityHint}
            accessibilityRole={this.props.accessibilityRole}
            accessibilityStates={this.props.accessibilityStates}
            nativeID={this.props.nativeID}
            testID={this.props.testID}
            onLayout={this.props.onLayout}
            style={[this.props.style, { transform: [{ scale: this.state.currentScale }] }]}
            onStartShouldSetResponder={this.touchableHandleStartShouldSetResponder}
            onResponderTerminationRequest={
                this.touchableHandleResponderTerminationRequest
              }
            onResponderGrant={this.touchableHandleResponderGrant}
            onResponderMove={this.touchableHandleResponderMove}
            onResponderRelease={this.touchableHandleResponderRelease}
            onResponderTerminate={this.touchableHandleResponderTerminate}>
            >
                {this.props.children}
            </Animated.View>
            );
    },
});

module.exports = TouchableScale;