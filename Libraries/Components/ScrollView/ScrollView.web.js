/**
 * @providesModule ScrollView
 */
'use strict';

var React = require('React');
var StyleSheet = require('StyleSheet');
var View = require('View');

var styles = StyleSheet.create({

    horizontal: {
        alignItems: 'flex-start',
    },

    horizontalContainer: {
        flexDirection: 'row',
    },

});

var ScrollView = React.createClass({

    propTypes: {
        horizontal: React.PropTypes.bool,
        automaticallyAdjustContentInsets: React.PropTypes.bool,
    },

    getDefaultProps: function() {
        return {
            automaticallyAdjustContentInsets: true,
        };
    },

    getScrollResponder: function() {
        return this;
    },

    scrollTo: function(y, x) {
        this.refs.scrollView.getDOMNode().scrollTop = y;
        this.refs.scrollView.getDOMNode().scrollLeft = x;
    },

    render: function() {
        var style = [
            this.props.style,
            (this.props.horizontal ? styles.horizontal : null),
            (this.props.horizontal ? {overflowX: 'scroll'} : {overflowY: 'scroll'}),
        ];

        var containerStyle = [
            this.props.contentContainerStyle,
            (this.props.horizontal ? styles.horizontalContainer : null),
        ];

        return (
            <View ref="scrollView" {...this.props} style={style} onScroll={this._onScroll}>
                <View ref="containerView" style={containerStyle}>
                    {this.props.children}
                </View>
            </View>
        );
    },

    _onScroll: function(e) {
        if (this.props.onScroll) {
            e.nativeEvent.layoutMeasurement = this.refs.scrollView.measure();
            e.nativeEvent.contentSize = {
                width: this.refs.containerView.measure().width,
                height: this.refs.containerView.measure().height,
            };
            e.nativeEvent.contentOffset = {
                x: this.refs.scrollView.getDOMNode().scrollLeft,
                y: this.refs.scrollView.getDOMNode().scrollTop,
            };
            this.props.onScroll(e);
        }
    },

});

module.exports = ScrollView;
