/**
 * @providesModule ScrollView
 */
'use strict';

var React = require('React');
var StyleSheet = require('StyleSheet');
var View = require('View');
var webifyStyle = require('webifyStyle');

var styles = StyleSheet.create({

    scroll: {
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
        this.refs.scrollView.getDOMNode().scrollTop = y;
        this.refs.scrollView.getDOMNode().scrollLeft = x;
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

    componentDidUpdate: function() {
        if (this.props.inverted) {
            var oldScrollProps = this.scrollProperties;
            var newScrollProps = this._updateScrollProperties();
            var contentDelta = newScrollProps.contentSize.height - oldScrollProps.contentSize.height;
            if (contentDelta > 0) {
                this.scrollTo(oldScrollProps.contentOffset.y + contentDelta, 0);
            }
        }
    },

    render: function() {
        var {
            paddingTop,
            paddingRight,
            paddingBottom,
            paddingLeft,
            padding,
            ...style,
        } = webifyStyle(this.props.style);

        var scrollStyle = [
            /*
            We need to do this ridiculousness because when using 2009 flexbox,
            changing inline styles on any element in a scroll view with box-flex defined
            will cause scrollTop to reset to zero. e.g. modifying the opacity of a button
            in the scroll view will cause the scroll view to jump back to the top. Gah!
            */
            {
                position: 'absolute',
                top: paddingTop || padding || 0,
                right: paddingRight || padding || 0,
                bottom: paddingBottom || padding || 0,
                left: paddingLeft || padding || 0,
            },
            styles.scroll,
            (this.props.horizontal ? styles.horizontal : null),
            (this.props.horizontal ? {overflowX: 'scroll'} : {overflowY: 'scroll'}),
        ];

        var containerStyle = [
            this.props.contentContainerStyle,
            (this.props.horizontal ? styles.horizontalContainer : null),
        ];

        return (
            <View {...this.props} style={style}>
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
        var scrollViewNode = this.refs.scrollView.getDOMNode();
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
