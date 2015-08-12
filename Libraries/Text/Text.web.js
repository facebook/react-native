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
        var innerElements = this.props.children;
        if (typeof innerElements == 'string') {
            if (innerElements.indexOf('\n') >= 0) {
                var textParts = innerElements.split('\n');
                var textPartsIncludingNewlines = [];
                for (var i in textParts) {
                    if (i > 0) {
                        textPartsIncludingNewlines.push('\n');
                    }
                    textPartsIncludingNewlines.push(textParts[i]);
                }
                innerElements = textPartsIncludingNewlines.map(this._renderInnerText);
            }
        } else if (innerElements) {
            innerElements = innerElements.map(this._renderChild)
        }

        if (this.props.isChild) {
            var style = webifyStyle(this.props.style);
            return (
                <span
                    {...this.props}
                    isChild={true}
                    style={style}
                    children={innerElements}
                    />
            );

        } else {
            var style = webifyStyle([this.props.style, {display: 'inline-block'}]);
            return (
                <div
                    {...this.props}
                    style={style}
                    children={innerElements}
                    />
            );
        }
    },

    _renderInnerText: function(text) {
        if (text == '\n') {
            return <br/>;
        }
        return <span>{text}</span>
    },

    _renderChild: function(child) {
        if (React.isValidElement(child)) {
            return React.cloneElement(child, {
                isChild: true,
            });
        }
        return this._renderInnerText(child);
    },

});

module.exports = Text;
