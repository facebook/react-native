/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeART
 */
'use strict';

var Color = require('art/core/color');
var Path = require('ARTSerializablePath');
var Transform = require('art/core/transform');

var React = require('React');
var ReactNativeViewAttributes = require('ReactNativeViewAttributes');

var createReactNativeComponentClass = require('createReactNativeComponentClass');
var merge = require('merge');

// Diff Helpers

function arrayDiffer(a, b) {
  if (a == null) {
    return true;
  }
  if (a.length !== b.length) {
    return true;
  }
  for (var i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return true;
    }
  }
  return false;
}

function fontAndLinesDiffer(a, b) {
  if (a === b) {
    return false;
  }
  if (a.font !== b.font) {
    if (a.font === null) {
      return true;
    }
    if (b.font === null) {
      return true;
    }

    if (
      a.font.fontFamily !== b.font.fontFamily ||
      a.font.fontSize !== b.font.fontSize ||
      a.font.fontWeight !== b.font.fontWeight ||
      a.font.fontStyle !== b.font.fontStyle
    ) {
      return true;
    }
  }
  return arrayDiffer(a.lines, b.lines);
}

// Native Attributes

var SurfaceViewAttributes = merge(ReactNativeViewAttributes.UIView, {
  // This should contain pixel information such as width, height and
  // resolution to know what kind of buffer needs to be allocated.
  // Currently we rely on UIViews and style to figure that out.
});

var NodeAttributes = {
  transform: { diff: arrayDiffer },
  opacity: true,
};

var GroupAttributes = merge(NodeAttributes, {
  clipping: { diff: arrayDiffer }
});

var RenderableAttributes = merge(NodeAttributes, {
  fill: { diff: arrayDiffer },
  stroke: { diff: arrayDiffer },
  strokeWidth: true,
  strokeCap: true,
  strokeJoin: true,
  strokeDash: { diff: arrayDiffer },
});

var ShapeAttributes = merge(RenderableAttributes, {
  d: { diff: arrayDiffer },
});

var TextAttributes = merge(RenderableAttributes, {
  alignment: true,
  frame: { diff: fontAndLinesDiffer },
  path: { diff: arrayDiffer }
});

// Native Components

var NativeSurfaceView = createReactNativeComponentClass({
  validAttributes: SurfaceViewAttributes,
  uiViewClassName: 'ARTSurfaceView',
});

var NativeGroup = createReactNativeComponentClass({
  validAttributes: GroupAttributes,
  uiViewClassName: 'ARTGroup',
});

var NativeShape = createReactNativeComponentClass({
  validAttributes: ShapeAttributes,
  uiViewClassName: 'ARTShape',
});

var NativeText = createReactNativeComponentClass({
  validAttributes: TextAttributes,
  uiViewClassName: 'ARTText',
});

// Utilities

function childrenAsString(children) {
  if (!children) {
    return '';
  }
  if (typeof children === 'string') {
    return children;
  }
  if (children.length) {
    return children.join('\n');
  }
  return '';
}

// Surface - Root node of all ART

var Surface = React.createClass({

  render: function() {
    var props = this.props;
    var w = extractNumber(props.width, 0);
    var h = extractNumber(props.height, 0);
    return (
      <NativeSurfaceView style={[props.style, { width: w, height: h }]}>
        {this.props.children}
      </NativeSurfaceView>
    );
  }

});

// Node Props

// TODO: The desktop version of ART has title and cursor. We should have
// accessibility support here too even though hovering doesn't work.

function extractNumber(value, defaultValue) {
  if (value == null) {
    return defaultValue;
  }
  return +value;
}

var pooledTransform = new Transform();

function extractTransform(props) {
  var scaleX = props.scaleX != null ? props.scaleX :
               props.scale != null ? props.scale : 1;
  var scaleY = props.scaleY != null ? props.scaleY :
               props.scale != null ? props.scale : 1;

  pooledTransform
    .transformTo(1, 0, 0, 1, 0, 0)
    .move(props.x || 0, props.y || 0)
    .rotate(props.rotation || 0, props.originX, props.originY)
    .scale(scaleX, scaleY, props.originX, props.originY);

  if (props.transform != null) {
    pooledTransform.transform(props.transform);
  }

  return [
    pooledTransform.xx, pooledTransform.yx,
    pooledTransform.xy, pooledTransform.yy,
    pooledTransform.x,  pooledTransform.y,
  ];
}

function extractOpacity(props) {
  // TODO: visible === false should also have no hit detection
  if (props.visible === false) {
    return 0;
  }
  if (props.opacity == null) {
    return 1;
  }
  return +props.opacity;
}

// Groups

// Note: ART has a notion of width and height on Group but AFAIK it's a noop in
// ReactART.

var Group = React.createClass({

  render: function() {
    var props = this.props;
    return (
      <NativeGroup
        opacity={extractOpacity(props)}
        transform={extractTransform(props)}>
        {this.props.children}
      </NativeGroup>
    );
  }

});

var ClippingRectangle = React.createClass({

  render: function() {
    var props = this.props;
    var x = extractNumber(props.x, 0);
    var y = extractNumber(props.y, 0);
    var w = extractNumber(props.width, 0);
    var h = extractNumber(props.height, 0);
    var clipping = [x, y, w, h];
    // The current clipping API requires x and y to be ignored in the transform
    var propsExcludingXAndY = merge(props);
    delete propsExcludingXAndY.x;
    delete propsExcludingXAndY.y;
    return (
      <NativeGroup
        clipping={clipping}
        opacity={extractOpacity(props)}
        transform={extractTransform(propsExcludingXAndY)}>
        {this.props.children}
      </NativeGroup>
    );
  }

});

// Renderables

var SOLID_COLOR = 0;
var LINEAR_GRADIENT = 1;
var RADIAL_GRADIENT = 2;
var PATTERN = 3;

function insertColorIntoArray(color, targetArray, atIndex) {
  var c = new Color(color);
  targetArray[atIndex + 0] = c.red / 255;
  targetArray[atIndex + 1] = c.green / 255;
  targetArray[atIndex + 2] = c.blue / 255;
  targetArray[atIndex + 3] = c.alpha;
}

function insertColorsIntoArray(stops, targetArray, atIndex) {
  var i = 0;
  if ('length' in stops) {
    while (i < stops.length) {
      insertColorIntoArray(stops[i], targetArray, atIndex + i * 4);
      i++;
    }
  } else {
    for (var offset in stops) {
      insertColorIntoArray(stops[offset], targetArray, atIndex + i * 4);
      i++;
    }
  }
  return atIndex + i * 4;
}

function insertOffsetsIntoArray(stops, targetArray, atIndex, multi, reverse) {
  var offsetNumber;
  var i = 0;
  if ('length' in stops) {
    while (i < stops.length) {
      offsetNumber = i / (stops.length - 1) * multi;
      targetArray[atIndex + i] = reverse ? 1 - offsetNumber : offsetNumber;
      i++;
    }
  } else {
    for (var offsetString in stops) {
      offsetNumber = (+offsetString) * multi;
      targetArray[atIndex + i] = reverse ? 1 - offsetNumber : offsetNumber;
      i++;
    }
  }
  return atIndex + i;
}

function insertColorStopsIntoArray(stops, targetArray, atIndex) {
  var lastIndex = insertColorsIntoArray(stops, targetArray, atIndex);
  insertOffsetsIntoArray(stops, targetArray, lastIndex, 1, false);
}

function insertDoubleColorStopsIntoArray(stops, targetArray, atIndex) {
  var lastIndex = insertColorsIntoArray(stops, targetArray, atIndex);
  lastIndex = insertColorsIntoArray(stops, targetArray, lastIndex);
  lastIndex = insertOffsetsIntoArray(stops, targetArray, lastIndex, 0.5, false);
  insertOffsetsIntoArray(stops, targetArray, lastIndex, 0.5, true);
}

function applyBoundingBoxToBrushData(brushData, props) {
  var type = brushData[0];
  var width = +props.width;
  var height = +props.height;
  if (type === LINEAR_GRADIENT) {
    brushData[1] *= width;
    brushData[2] *= height;
    brushData[3] *= width;
    brushData[4] *= height;
  } else if (type === RADIAL_GRADIENT) {
    brushData[1] *= width;
    brushData[2] *= height;
    brushData[3] *= width;
    brushData[4] *= height;
    brushData[5] *= width;
    brushData[6] *= height;
  } else if (type === PATTERN) {
    // todo
  }
}

function extractBrush(colorOrBrush, props) {
  if (colorOrBrush == null) {
    return null;
  }
  if (colorOrBrush._brush) {
    if (colorOrBrush._bb) {
      // The legacy API for Gradients allow for the bounding box to be used
      // as a convenience for specifying gradient positions. This should be
      // deprecated. It's not properly implemented in canvas mode. ReactART
      // doesn't handle update to the bounding box correctly. That's why we
      // mutate this so that if it's reused, we reuse the same resolved box.
      applyBoundingBoxToBrushData(colorOrBrush._brush, props);
      colorOrBrush._bb = false;
    }
    return colorOrBrush._brush;
  }
  var c = new Color(colorOrBrush);
  return [SOLID_COLOR, c.red / 255, c.green / 255, c.blue / 255, c.alpha];
}

function extractColor(color) {
  if (color == null) {
    return null;
  }
  var c = new Color(color);
  return [c.red / 255, c.green / 255, c.blue / 255, c.alpha];
}

function extractStrokeCap(strokeCap) {
  switch (strokeCap) {
    case 'butt': return 0;
    case 'square': return 2;
    default: return 1; // round
  }
}

function extractStrokeJoin(strokeJoin) {
  switch (strokeJoin) {
    case 'miter': return 0;
    case 'bevel': return 2;
    default: return 1; // round
  }
}

// Shape

// Note: ART has a notion of width and height on Shape but AFAIK it's a noop in
// ReactART.

var Shape = React.createClass({

  render: function() {
    var props = this.props;
    var path = props.d || childrenAsString(props.children);
    var d = new Path(path).toJSON();
    return (
      <NativeShape
        fill={extractBrush(props.fill, props)}
        opacity={extractOpacity(props)}
        stroke={extractColor(props.stroke)}
        strokeCap={extractStrokeCap(props.strokeCap)}
        strokeDash={props.strokeDash || null}
        strokeJoin={extractStrokeJoin(props.strokeJoin)}
        strokeWidth={extractNumber(props.strokeWidth, 1)}
        transform={extractTransform(props)}

        d={d}
      />
    );
  }

});

// Text

var cachedFontObjectsFromString = {};

var fontFamilyPrefix = /^[\s"']*/;
var fontFamilySuffix = /[\s"']*$/;

function extractSingleFontFamily(fontFamilyString) {
  // ART on the web allows for multiple font-families to be specified.
  // For compatibility, we extract the first font-family, hoping
  // we'll get a match.
  return fontFamilyString.split(',')[0]
         .replace(fontFamilyPrefix, '')
         .replace(fontFamilySuffix, '');
}

function parseFontString(font) {
  if (cachedFontObjectsFromString.hasOwnProperty(font)) {
    return cachedFontObjectsFromString[font];
  }
  var regexp = /^\s*((?:(?:normal|bold|italic)\s+)*)(?:(\d+(?:\.\d+)?)[ptexm\%]*(?:\s*\/.*?)?\s+)?\s*\"?([^\"]*)/i;
  var match = regexp.exec(font);
  if (!match) {
    return null;
  }
  var fontFamily = extractSingleFontFamily(match[3]);
  var fontSize = +match[2] || 12;
  var isBold = /bold/.exec(match[1]);
  var isItalic = /italic/.exec(match[1]);
  cachedFontObjectsFromString[font] = {
    fontFamily: fontFamily,
    fontSize: fontSize,
    fontWeight: isBold ? 'bold' : 'normal',
    fontStyle: isItalic ? 'italic' : 'normal',
  };
  return cachedFontObjectsFromString[font];
}

function extractFont(font) {
  if (font == null) {
    return null;
  }
  if (typeof font === 'string') {
    return parseFontString(font);
  }
  var fontFamily = extractSingleFontFamily(font.fontFamily);
  var fontSize = +font.fontSize || 12;
  return {
    // Normalize
    fontFamily: fontFamily,
    fontSize: fontSize,
    fontWeight: font.fontWeight,
    fontStyle: font.fontStyle,
  };
}

var newLine = /\n/g;
function extractFontAndLines(font, text) {
  return { font: extractFont(font), lines: text.split(newLine) };
}

function extractAlignment(alignment) {
  switch (alignment) {
    case 'right':
      return 1;
    case 'center':
      return 2;
    default:
      return 0;
  }
}

var Text = React.createClass({

  render: function() {
    var props = this.props;
    var textPath = props.path ? new Path(props.path).toJSON() : null;
    var textFrame = extractFontAndLines(
      props.font,
      childrenAsString(props.children)
    );
    return (
      <NativeText
        fill={extractBrush(props.fill, props)}
        opacity={extractOpacity(props)}
        stroke={extractColor(props.stroke)}
        strokeCap={extractStrokeCap(props.strokeCap)}
        strokeDash={props.strokeDash || null}
        strokeJoin={extractStrokeJoin(props.strokeJoin)}
        strokeWidth={extractNumber(props.strokeWidth, 1)}
        transform={extractTransform(props)}

        alignment={extractAlignment(props.alignment)}
        frame={textFrame}
        path={textPath}
      />
    );
  }

});

// Declarative fill type objects - API design not finalized

function LinearGradient(stops, x1, y1, x2, y2) {
  var type = LINEAR_GRADIENT;

  if (arguments.length < 5) {
    var angle = ((x1 == null) ? 270 : x1) * Math.PI / 180;

    var x = Math.cos(angle);
    var y = -Math.sin(angle);
    var l = (Math.abs(x) + Math.abs(y)) / 2;

    x *= l; y *= l;

    x1 = 0.5 - x;
    x2 = 0.5 + x;
    y1 = 0.5 - y;
    y2 = 0.5 + y;
    this._bb = true;
  } else {
    this._bb = false;
  }

  var brushData = [type, +x1, +y1, +x2, +y2];
  insertColorStopsIntoArray(stops, brushData, 5);
  this._brush = brushData;
}

function RadialGradient(stops, fx, fy, rx, ry, cx, cy) {
  if (ry == null) {
    ry = rx;
  }
  if (cx == null) {
    cx = fx;
  }
  if (cy == null) {
    cy = fy;
  }
  if (fx == null) {
    // As a convenience we allow the whole radial gradient to cover the
    // bounding box. We should consider dropping this API.
    fx = fy = rx = ry = cx = cy = 0.5;
    this._bb = true;
  } else {
    this._bb = false;
  }
  // The ART API expects the radial gradient to be repeated at the edges.
  // To simulate this we render the gradient twice as large and add double
  // color stops. Ideally this API would become more restrictive so that this
  // extra work isn't needed.
  var brushData = [RADIAL_GRADIENT, +fx, +fy, +rx * 2, +ry * 2, +cx, +cy];
  insertDoubleColorStopsIntoArray(stops, brushData, 7);
  this._brush = brushData;
}

function Pattern(url, width, height, left, top) {
  this._brush = [PATTERN, url, +left || 0, +top || 0, +width, +height];
}

var ReactART = {
  LinearGradient: LinearGradient,
  RadialGradient: RadialGradient,
  Pattern: Pattern,
  Transform: Transform,
  Path: Path,
  Surface: Surface,
  Group: Group,
  ClippingRectangle: ClippingRectangle,
  Shape: Shape,
  Text: Text,
};

module.exports = ReactART;
