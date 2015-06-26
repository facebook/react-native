/**
 * @providesModule webifyStyle
 */
'use strict';

var merge = require('merge');
var flattenStyle = require('flattenStyle');
var precomputeStyle = require('precomputeStyle');

var styleKeyMap = {

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
        return {lineHeight: `${value}px`};
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
        return {transform: `matrix3d(${value})`};
    },

    transform: function(value) {
        var transformMatrix = precomputeStyle({transform: value}).transformMatrix;
        return {transform: `matrix3d(${transformMatrix})`};
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
