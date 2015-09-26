/**
 * @providesModule View
 * @flow
 */
'use strict';

var React = require('React');
var StyleSheet = require('StyleSheet');
var StyleSheetPropType = require('StyleSheetPropType');
var ViewStylePropTypes = require('ViewStylePropTypes');
var webifyStyle = require('webifyStyle');
var Touchable = require('Touchable');

var stylePropType = StyleSheetPropType(ViewStylePropTypes);

var pixelKeys = {
    top: true,
    left: true,
    right: true,
    bottom: true,
};

var View = React.createClass({

    touchGranted: false,

    propTypes: {
        style: stylePropType,
        stopPropagation: React.PropTypes.bool,
    },

    cachedMeasurement: {
        width: 0,
        height: 0,
    },

    componentDidMount: function() {
        // Listen for window resize as an indicator
        // that our measurements may have changed
        window.addEventListener('resize', this._onWindowResize);
    },

    componentWillUnmount: function() {
        window.removeEventListener('resize', this._onWindowResize);
    },

    setNativeProps: function(props: Object) {
        if (!this.refs.div) {
            return;
        }
        if (props.opacity) {
            this.refs.div.style.opacity = props.opacity;
        }
        if (props.style) {
            var style = webifyStyle(props.style);
            for (var key in style) {
                var value = style[key];
                if (pixelKeys[key]) {
                    value = value + 'px';
                }
                this.refs.div.style[key] = value;
            }
        }
    },

    measure: function(callback?: Function): Object {
        var m = this.refs.div.getBoundingClientRect();
        if (callback) {
            callback(m.left, m.top, m.width, m.height, m.left, m.top);
        }
        return m;
    },

    render: function(): ReactElement {
        var style = webifyStyle(this.props.style);

        // I don't like this at all but
        // componentDidUpdate is not being fired reliably
        // Not sure what's going on...
        setTimeout(this._onLayout, 50);

        return (
            <div
                {...this.props}
                ref="div"
                style={style}
                onTouchStart={this.props.stopPropagation && this._onTouchStart}
                onTouchMove={this.props.stopPropagation && this._onTouchMove}
                onTouchEnd={this.props.stopPropagation && this._onTouchEnd}
                onTouchCancel={this.props.stopPropagation && this._onTouchCancel}
                onMouseEnter={this.props.stopPropagation && this._onMouseEnter}
                onMouseLeave={this.props.stopPropagation && this._onMouseLeave}
                onMouseDown={this.props.stopPropagation && this._onMouseDown}
                onMouseMove={this.props.stopPropagation && this._onMouseMove}
                onMouseUp={this.props.stopPropagation && this._onMouseUp}
            />
        );
    },

    _onWindowResize: function() {
        this._onLayout();
    },

    _onLayout: function() {
        if (!this.props.onLayout || !this.refs.div) {
            return;
        }
        var measure = this.measure();
        if (measure.width != this.cachedMeasurement.width ||
            measure.height != this.cachedMeasurement.height) {
            this.cachedMeasurement = measure;
            this.props.onLayout({
                nativeEvent: {
                    layout: {
                        width: measure.width,
                        height: measure.height,
                    },
                },
            });
        }
    },

    _processEvent: function(e: SyntheticEvent) {
        if (this.props.stopPropagation) {
            e.stopPropagation();
        }
    },

    _onTouchStart: function(e: SyntheticTouchEvent) {
        this._processEvent(e);
        if (this.props.onResponderGrant) {
            var domID = this.refs.div.dataset.reactid;
            this.props.onResponderGrant(e, domID);
        }
    },

    _onTouchMove: function(e: SyntheticTouchEvent) {
        this._processEvent(e);
        if (this.props.onResponderMove) {
            this.props.onResponderMove(e);
        }
    },

    _onTouchEnd: function(e: SyntheticTouchEvent) {
        this._processEvent(e);
        if (this.props.onResponderRelease) {
            this.props.onResponderRelease(e);
        }
    },

    _onTouchCancel: function(e: SyntheticTouchEvent) {
        this._processEvent(e);
        if (this.props.onResponderTerminate) {
            this.props.onResponderTerminate(e);
        }
    },

    _onMouseEnter: function(e: SyntheticMouseEvent) {
        this._processEvent(e);
        if (this.props.onResponderGrant) {
            var domID = this.refs.div.dataset.reactid;
            this.props.onResponderGrant(e, domID);
            this.touchGranted = true;
        }
    },

    _onMouseMove: function(e: SyntheticMouseEvent) {
        this._processEvent(e);
        if (this.touchGranted && this.props.onResponderMove) {
            this.props.onResponderMove(e);
        }
    },

    _onMouseLeave: function(e: SyntheticMouseEvent) {
        this._processEvent(e);
        if (this.touchGranted && this.props.onResponderTerminate) {
            this.props.onResponderTerminate(e);
            this.touchGranted = false;
        }
    },

    _onMouseDown: function(e: SyntheticMouseEvent) {
        this._processEvent(e);
        if (!Touchable.touchesEnabled && this.props.onResponderGrant) {
            var domID = this.refs.div.dataset.reactid;
            this.props.onResponderGrant(e, domID);
            this.touchGranted = true;
        }
    },

    _onMouseUp: function(e: SyntheticMouseEvent) {
        this._processEvent(e);
        if (!Touchable.touchesEnabled && this.props.onResponderRelease) {
            this.props.onResponderRelease(e);
            this.touchGranted = false;
        }
    },

});

module.exports = View;
