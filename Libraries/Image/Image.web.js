/**
 * @providesModule Image
 */
'use strict';

var React = require('React');
var StyleSheet = require('StyleSheet');
var webifyStyle = require('webifyStyle');
var ImageResizeMode = require('ImageResizeMode');
var ImageStylePropTypes = require('ImageStylePropTypes');
var StyleSheetPropType = require('StyleSheetPropType');
var EdgeInsetsPropType = require('EdgeInsetsPropType');

var styles = StyleSheet.create({

    container: {
        justifyContent: 'center',
    },

});

var Image = React.createClass({

    propTypes: {
        style: StyleSheetPropType(ImageStylePropTypes),
        source: React.PropTypes.shape({
            uri: React.PropTypes.string,
        }),
        capInsets: EdgeInsetsPropType,
        resizeMode: React.PropTypes.oneOf(['contain', 'stretch']),
        onLayout: React.PropTypes.func,
    },

    statics: {
        resizeMode: ImageResizeMode,
    },

    getInitialState: function() {
        return this._getStateFromProps(this.props);
    },

    componentWillReceiveProps: function(nextProps) {
        this.setState(this._getStateFromProps(nextProps));
    },

    _getStateFromProps: function(props) {
        var style = {};
        var source = props.source;
        if (source.capInsets) {
            var capPercents = {
                top: source.capInsets.top / source.intrinsicHeight * 100,
                right: source.capInsets.right / source.intrinsicWidth * 100,
                bottom: source.capInsets.bottom / source.intrinsicHeight * 100,
                left: source.capInsets.left / source.intrinsicWidth * 100,
            };
            Object.assign(style, {
                borderTopWidth: source.capInsets.top,
                borderRightWidth: source.capInsets.right,
                borderBottomWidth: source.capInsets.bottom,
                borderLeftWidth: source.capInsets.left,
                borderImage: `url(${source.uri}) ${capPercents.top}% ${capPercents.right}% ${capPercents.bottom}% ${capPercents.left}% stretch`,
            })
        }
        if (props.resizeMode == "stretch") {
            style.width = "100%";
        }
        return {style: style};
    },

    render: function() {
        var style = webifyStyle([this.state.style, this.props.style]);
        if (this.props.source.capInsets) {
            return <div {...this.props} style={style} />;
        } else {
            return <img {...this.props} style={style} src={this.props.source.uri} />;
        }
    },

});

module.exports = Image;
