/**
 * @providesModule webifyStyle
 */
'use strict';

var merge = require('merge');
var flattenStyle = require('flattenStyle');
var precomputeStyle = require('precomputeStyle');

var legacyFlexAlignItemsMap = {
    'center': 'center',
    'stretch': 'stretch',
    'flex-start': 'start',
    'flex-end': 'end',
};

var legacyFlexJustifyContentMap = {
    'center': 'center',
    'stretch': 'justify',
    'flex-start': 'start',
    'flex-end': 'end',
    'space-between': 'justify',
};

var styleKeyMap = {

    flex: function(value) {
        return {
            flex: value,
            WebkitFlex: value,
            WebkitBoxFlex: value,
        };
    },

    flexDirection: function(value) {
        var oldValue;
        if (value == 'row') {
            oldValue = 'horizontal';
        } else {
            oldValue = 'vertical';
        }
        return {
            flexDirection: value,
            WebkitFlexDirection: value,
            WebkitBoxOrient: oldValue,
        };
    },

    alignItems: function(value) {
        return {
            alignItems: value,
            WebkitAlignItems: value,
            WebkitBoxAlign: legacyFlexAlignItemsMap[value],
        };
    },

    justifyContent: function(value) {
        return {
            justifyContent: value,
            WebkitJustifyContent: value,
            WebkitBoxPack: legacyFlexJustifyContentMap[value],
        };
    },

    alignSelf: function(value) {
        return {
            alignSelf: value,
            WebkitAlignSelf: value,
        };
    },

    shadowColor: function(value, allValues) {
        var color = value || 'transparent';
        var width = 0;
        var height = 0;
        var blur = allValues.shadowRadius || 0;
        if (allValues.shadowOffset) {
            width = allValues.shadowOffset.width || 0;
            height = allValues.shadowOffset.height || 0;
        }
        return {
            boxShadow: `${width}px ${height}px ${blur}px 0 ${color}`,
        };
    },

    shadowRadius: function(value) {
        return null;
    },

    shadowOpacity: function(value) {
        return null;
    },

    shadowOffset: function(value) {
        return null;
    },

    lineHeight: function(value) {
        return {
            lineHeight: `${value}px`,
        };
    },

    paddingHorizontal: function(value) {
        return {
            paddingLeft: value,
            paddingRight: value,
        };
    },

    paddingVertical: function(value) {
        return {
            paddingTop: value,
            paddingBottom: value,
        };
    },

    marginHorizontal: function(value) {
        return {
            marginLeft: value,
            marginRight: value,
        };
    },

    marginVertical: function(value) {
        return {
            marginTop: value,
            marginBottom: value,
        };
    },

    transformMatrix: function(value) {
        var cssValue = `matrix3d(${value})`;
        return {
            transform: cssValue,
            WebkitTransform: cssValue,
        };
    },

    transform: function(value) {
        var transformMatrix = precomputeStyle({transform: value}).transformMatrix;
        var cssValue = `matrix3d(${transformMatrix})`;
        return {
            transform: cssValue,
            WebkitTransform: cssValue,
        };
    },

}

var webifyStyle = function(style) {
    var webifiedStyle = {};
    var flattenedStyle = flattenStyle(style);
    for (var key in flattenedStyle) {
        var value = flattenedStyle[key];
        var transformFunction = styleKeyMap[key];
        if (transformFunction) {
            webifiedStyle = merge(webifiedStyle, transformFunction(value, flattenedStyle));
        } else {
            webifiedStyle[key] = value;
        }
    }
    return webifiedStyle;
};

module.exports = webifyStyle;
