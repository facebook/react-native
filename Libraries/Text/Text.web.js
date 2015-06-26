/**
 * @providesModule Text
 */
'use strict';

var React = require('React');
var StyleSheetPropType = require('StyleSheetPropType');
var TextStylePropTypes = require('TextStylePropTypes');
var webifyStyle = require('webifyStyle');

var stylePropType = StyleSheetPropType(TextStylePropTypes);

var Text = React.createClass({

    propTypes: {

        style: stylePropType,

    },

    setNativeProps: function(props) {
        // TODO
    },

    render: function() {
        var style = webifyStyle(this.props.style);

        var innerElements = this.props.children;
        if (typeof innerElements == 'string' && innerElements.indexOf('\n') >= 0) {
            var textParts = innerElements.split('\n');
            var textPartsIncludingNewlines = [];
            for (var i in textParts) {
                if (i > 0) {
                    textPartsIncludingNewlines.push('\n');
                }
                textPartsIncludingNewlines.push(textParts[i]);
            }
            innerElements = textPartsIncludingNewlines.map(this._renderInnerElement);
        }

        return (
            <span
                {...this.props}
                style={style}
                onClick={this.props.onPress}
                children={innerElements}
                />
        );
    },

    _renderInnerElement: function(text) {
        if (text == '\n') {
            return <br/>;
        }
        return <Text>{text}</Text>
    },

});

module.exports = Text;
