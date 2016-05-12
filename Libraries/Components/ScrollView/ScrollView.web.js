/**
 * @providesModule ScrollView
 */
'use strict';

var React = require('React');
var ReactDOM = require('react-dom');
var StyleSheet = require('StyleSheet');
var View = require('View');

var styles = StyleSheet.create({

    scroll: {
        flex: 1,
        WebkitOverflowScrolling: 'touch',
    },

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
        var node = ReactDOM.findDOMNode(this.refs.scrollView);
        node.scrollTop = y;
        node.scrollLeft = x;
    },

    scrollWithoutAnimationTo: function(y, x) {
        this.scrollTo(y, x);
    },

    scrollToEndOnNextContentChange: function() {
        this._scrollToEndOnNextContentChange = true;
    },

    scrollToEnd: function() {
        var scrollProps = this.scrollProperties;
        var offsetX = scrollProps.contentSize.width - scrollProps.layout.width;
        var offsetY = scrollProps.contentSize.height - scrollProps.layout.height;
        this.scrollTo(offsetY, offsetX);
    },

    componentWillMount: function() {
        this.scrollProperties = {
            layout: null,
            contentSize: {
                width: 0,
                height: 0,
            },
            contentOffset: {
                x: 0,
                y: 0,
            },
        };
    },

    componentDidMount: function() {
        this._updateScrollProperties();
        if (this.props.inverted) {
            this.scrollToEnd(); // HACK don't love
        }
    },

    componentDidUpdate: function(oldProps, oldState) {
        if (this.props.inverted) {
            var oldScrollProps = this.scrollProperties;
            var newScrollProps = this._updateScrollProperties();
            var contentDelta = newScrollProps.contentSize.height - oldScrollProps.contentSize.height;
            if (contentDelta > 0) {
                if (!!this._scrollToEndOnNextContentChange) {
                    this._scrollToEndOnNextContentChange = false;
                    this.scrollToEnd();
                } else {
                    this.scrollTo(oldScrollProps.contentOffset.y + contentDelta, 0);
                }
            }
        }
    },

    getInnerViewNode: function() {
        return this.refs.containerView;
    },

    render: function() {
        var scrollStyle = [
            styles.scroll,
            (this.props.horizontal ? styles.horizontal : null),
            (this.props.horizontal ? {overflowX: 'auto'} : {overflowY: 'auto'}),
        ];

        var containerStyle = [
            this.props.contentContainerStyle,
            (this.props.horizontal ? styles.horizontalContainer : null),
        ];

        return (
            <View {...this.props}>
                <View ref="scrollView" style={scrollStyle} onScroll={this._onScroll}>
                    <View ref="containerView" style={containerStyle}>
                        {this.props.children}
                    </View>
                </View>
            </View>
        );
    },

    _updateScrollProperties: function() {
        var layout = this.refs.scrollView.measure();
        var containerLayout = this.refs.containerView.measure();
        var scrollViewNode = ReactDOM.findDOMNode(this.refs.scrollView);
        var contentSize = {
            width: containerLayout.width,
            height: containerLayout.height,
        };
        var contentOffset = {
            x: scrollViewNode.scrollLeft,
            y: scrollViewNode.scrollTop,
        };
        this.scrollProperties = {
            layout: layout,
            contentSize: contentSize,
            contentOffset: contentOffset,
        };
        return this.scrollProperties;
    },

    _onScroll: function(e) {
        if (this.props.onScroll) {
            var scrollProperties = this._updateScrollProperties();
            e.nativeEvent.layoutMeasurement = scrollProperties.layout;
            e.nativeEvent.contentSize = scrollProperties.contentSize;
            e.nativeEvent.contentOffset = scrollProperties.contentOffset;
            this.props.onScroll(e);
        }
    },

});

module.exports = ScrollView;
