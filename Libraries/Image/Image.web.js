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
        if (props.resizeMode == 'stretch') {
            style.width = '100%';
        }
        if (props.resizeMode == 'contain') {
            style.display = 'inline';
            style.maxWidth = '100%';
            style.maxHeight = '100%';
        }
        return {style: style};
    },

    render: function() {
        if (this.props.source.capInsets) {
            var style = webifyStyle([this.state.style, this.props.style]);
            return <div style={style} />;

        } else if (this.props.resizeMode == 'contain') {
            var outerStyle = webifyStyle([this.props.style, {textAlign: 'center'}]);
            var innerStyle = webifyStyle(this.state.style);
            return (
                <div style={outerStyle}>
                    <img style={innerStyle} src={this.props.source.uri} />
                </div>
            );

        } else {
            var style = webifyStyle([this.state.style, this.props.style]);
            return <img style={style} src={this.props.source.uri} />;
        }
    },

});

module.exports = Image;
