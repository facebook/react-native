/**
 * @providesModule Image
 */
'use strict';

var React = require('React');
var StyleSheet = require('StyleSheet');
var webifyStyle = require('webifyStyle');

var styles = StyleSheet.create({

    container: {
        justifyContent: 'center',
    },

});

var Image = React.createClass({

    propTypes: {
        resizeMode: React.PropTypes.string, // TODO
    },

    statics: {
        resizeMode: {
            cover: "cover",
            contain: "contain",
            stretch: "stretch",
        },
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
                borderImage: `url(${source.uri}) ${capPercents.top}% ${capPercents.right}% ${capPercents.bottom}% ${capPercents.left}% stretch;`,
            })
        }
        return {style: style};
    },

    render: function() {
        var uri = !this.props.source.capInsets && this.props.source.uri;
        var style = webifyStyle([this.state.style, this.props.style]);
        return <img style={style} src={uri} />;
    },

});

module.exports = Image;
