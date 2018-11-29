/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const Color = require('art/core/color');
const Path = require('ARTSerializablePath');
const Transform = require('art/core/transform');

const React = require('React');
const PropTypes = require('prop-types');
const ReactNativeViewAttributes = require('ReactNativeViewAttributes');

const createReactNativeComponentClass = require('createReactNativeComponentClass');
const merge = require('merge');
const invariant = require('fbjs/lib/invariant');

// Diff Helpers

function arrayDiffer(a, b) {
  if (a == null || b == null) {
    return true;
  }
  if (a.length !== b.length) {
    return true;
  }
  for (let i = 0; i < a.length; i++) {
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

const SurfaceViewAttributes = merge(ReactNativeViewAttributes.UIView, {
  // This should contain pixel information such as width, height and
  // resolution to know what kind of buffer needs to be allocated.
  // Currently we rely on UIViews and style to figure that out.
});

const NodeAttributes = {
  transform: {diff: arrayDiffer},
  opacity: true,
};

const GroupAttributes = merge(NodeAttributes, {
  clipping: {diff: arrayDiffer},
});

const RenderableAttributes = merge(NodeAttributes, {
  fill: {diff: arrayDiffer},
  stroke: {diff: arrayDiffer},
  strokeWidth: true,
  strokeCap: true,
  strokeJoin: true,
  strokeDash: {diff: arrayDiffer},
});

const ShapeAttributes = merge(RenderableAttributes, {
  d: {diff: arrayDiffer},
});

const TextAttributes = merge(RenderableAttributes, {
  alignment: true,
  frame: {diff: fontAndLinesDiffer},
  path: {diff: arrayDiffer},
});

// Native Components

const NativeSurfaceView = createReactNativeComponentClass(
  'ARTSurfaceView',
  () => ({
    validAttributes: SurfaceViewAttributes,
    uiViewClassName: 'ARTSurfaceView',
  }),
);

const NativeGroup = createReactNativeComponentClass('ARTGroup', () => ({
  validAttributes: GroupAttributes,
  uiViewClassName: 'ARTGroup',
}));

const NativeShape = createReactNativeComponentClass('ARTShape', () => ({
  validAttributes: ShapeAttributes,
  uiViewClassName: 'ARTShape',
}));

const NativeText = createReactNativeComponentClass('ARTText', () => ({
  validAttributes: TextAttributes,
  uiViewClassName: 'ARTText',
}));

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

class Surface extends React.Component {
  static childContextTypes = {
    isInSurface: PropTypes.bool,
  };

  getChildContext() {
    return {isInSurface: true};
  }

  render() {
    const height = extractNumber(this.props.height, 0);
    const width = extractNumber(this.props.width, 0);

    return (
      <NativeSurfaceView style={[this.props.style, {height, width}]}>
        {this.props.children}
      </NativeSurfaceView>
    );
  }
}

// Node Props

// TODO: The desktop version of ART has title and cursor. We should have
// accessibility support here too even though hovering doesn't work.

function extractNumber(value, defaultValue) {
  if (value == null) {
    return defaultValue;
  }
  return +value;
}

const pooledTransform = new Transform();

function extractTransform(props) {
  const scaleX =
    props.scaleX != null ? props.scaleX : props.scale != null ? props.scale : 1;
  const scaleY =
    props.scaleY != null ? props.scaleY : props.scale != null ? props.scale : 1;

  pooledTransform
    .transformTo(1, 0, 0, 1, 0, 0)
    .move(props.x || 0, props.y || 0)
    .rotate(props.rotation || 0, props.originX, props.originY)
    .scale(scaleX, scaleY, props.originX, props.originY);

  if (props.transform != null) {
    pooledTransform.transform(props.transform);
  }

  return [
    pooledTransform.xx,
    pooledTransform.yx,
    pooledTransform.xy,
    pooledTransform.yy,
    pooledTransform.x,
    pooledTransform.y,
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

class Group extends React.Component {
  static contextTypes = {
    isInSurface: PropTypes.bool.isRequired,
  };

  render() {
    const props = this.props;
    invariant(
      this.context.isInSurface,
      'ART: <Group /> must be a child of a <Surface />',
    );
    return (
      <NativeGroup
        opacity={extractOpacity(props)}
        transform={extractTransform(props)}>
        {this.props.children}
      </NativeGroup>
    );
  }
}

class ClippingRectangle extends React.Component {
  render() {
    const props = this.props;
    const x = extractNumber(props.x, 0);
    const y = extractNumber(props.y, 0);
    const w = extractNumber(props.width, 0);
    const h = extractNumber(props.height, 0);
    const clipping = [x, y, w, h];
    // The current clipping API requires x and y to be ignored in the transform
    const propsExcludingXAndY = merge(props);
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
}

// Renderables

const SOLID_COLOR = 0;
const LINEAR_GRADIENT = 1;
const RADIAL_GRADIENT = 2;
const PATTERN = 3;

function insertColorIntoArray(color, targetArray, atIndex) {
  const c = new Color(color);
  targetArray[atIndex + 0] = c.red / 255;
  targetArray[atIndex + 1] = c.green / 255;
  targetArray[atIndex + 2] = c.blue / 255;
  targetArray[atIndex + 3] = c.alpha;
}

function insertColorsIntoArray(stops, targetArray, atIndex) {
  let i = 0;
  if ('length' in stops) {
    while (i < stops.length) {
      insertColorIntoArray(stops[i], targetArray, atIndex + i * 4);
      i++;
    }
  } else {
    for (const offset in stops) {
      insertColorIntoArray(stops[offset], targetArray, atIndex + i * 4);
      i++;
    }
  }
  return atIndex + i * 4;
}

function insertOffsetsIntoArray(stops, targetArray, atIndex, multi, reverse) {
  let offsetNumber;
  let i = 0;
  if ('length' in stops) {
    while (i < stops.length) {
      offsetNumber = (i / (stops.length - 1)) * multi;
      targetArray[atIndex + i] = reverse ? 1 - offsetNumber : offsetNumber;
      i++;
    }
  } else {
    for (const offsetString in stops) {
      offsetNumber = +offsetString * multi;
      targetArray[atIndex + i] = reverse ? 1 - offsetNumber : offsetNumber;
      i++;
    }
  }
  return atIndex + i;
}

function insertColorStopsIntoArray(stops, targetArray, atIndex) {
  const lastIndex = insertColorsIntoArray(stops, targetArray, atIndex);
  insertOffsetsIntoArray(stops, targetArray, lastIndex, 1, false);
}

function insertDoubleColorStopsIntoArray(stops, targetArray, atIndex) {
  let lastIndex = insertColorsIntoArray(stops, targetArray, atIndex);
  lastIndex = insertColorsIntoArray(stops, targetArray, lastIndex);
  lastIndex = insertOffsetsIntoArray(stops, targetArray, lastIndex, 0.5, false);
  insertOffsetsIntoArray(stops, targetArray, lastIndex, 0.5, true);
}

function applyBoundingBoxToBrushData(brushData, props) {
  const type = brushData[0];
  const width = +props.width;
  const height = +props.height;
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
  const c = new Color(colorOrBrush);
  return [SOLID_COLOR, c.red / 255, c.green / 255, c.blue / 255, c.alpha];
}

function extractColor(color) {
  if (color == null) {
    return null;
  }
  const c = new Color(color);
  return [c.red / 255, c.green / 255, c.blue / 255, c.alpha];
}

function extractStrokeCap(strokeCap) {
  switch (strokeCap) {
    case 'butt':
      return 0;
    case 'square':
      return 2;
    default:
      return 1; // round
  }
}

function extractStrokeJoin(strokeJoin) {
  switch (strokeJoin) {
    case 'miter':
      return 0;
    case 'bevel':
      return 2;
    default:
      return 1; // round
  }
}

// Shape

// Note: ART has a notion of width and height on Shape but AFAIK it's a noop in
// ReactART.

export type ShapeProps = {|
  fill?: mixed,
  stroke?: mixed,
  strokeCap?: mixed,
  strokeDash?: mixed,
  strokeJoin?: mixed,
  strokeWidth?: mixed,
  x?: number,
  y?: number,
  opacity?: mixed,
|};

class Shape extends React.Component<ShapeProps> {
  render() {
    const props = this.props;
    const path = props.d || childrenAsString(props.children);
    const d = (path instanceof Path ? path : new Path(path)).toJSON();
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
}

// Text

const cachedFontObjectsFromString = {};

const fontFamilyPrefix = /^[\s"']*/;
const fontFamilySuffix = /[\s"']*$/;

function extractSingleFontFamily(fontFamilyString) {
  // ART on the web allows for multiple font-families to be specified.
  // For compatibility, we extract the first font-family, hoping
  // we'll get a match.
  return fontFamilyString
    .split(',')[0]
    .replace(fontFamilyPrefix, '')
    .replace(fontFamilySuffix, '');
}

function parseFontString(font) {
  if (cachedFontObjectsFromString.hasOwnProperty(font)) {
    return cachedFontObjectsFromString[font];
  }
  const regexp = /^\s*((?:(?:normal|bold|italic)\s+)*)(?:(\d+(?:\.\d+)?)[ptexm\%]*(?:\s*\/.*?)?\s+)?\s*\"?([^\"]*)/i;
  const match = regexp.exec(font);
  if (!match) {
    return null;
  }
  const fontFamily = extractSingleFontFamily(match[3]);
  const fontSize = +match[2] || 12;
  const isBold = /bold/.exec(match[1]);
  const isItalic = /italic/.exec(match[1]);
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
  const fontFamily = extractSingleFontFamily(font.fontFamily);
  const fontSize = +font.fontSize || 12;
  const fontWeight =
    font.fontWeight != null ? font.fontWeight.toString() : '400';
  return {
    // Normalize
    fontFamily: fontFamily,
    fontSize: fontSize,
    fontWeight: fontWeight,
    fontStyle: font.fontStyle,
  };
}

const newLine = /\n/g;
function extractFontAndLines(font, text) {
  return {font: extractFont(font), lines: text.split(newLine)};
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

class Text extends React.Component {
  render() {
    const props = this.props;
    const path = props.path;
    const textPath = path
      ? (path instanceof Path ? path : new Path(path)).toJSON()
      : null;
    const textFrame = extractFontAndLines(
      props.font,
      childrenAsString(props.children),
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
}

// Declarative fill type objects - API design not finalized

function LinearGradient(stops, x1, y1, x2, y2) {
  const type = LINEAR_GRADIENT;

  if (arguments.length < 5) {
    const angle = ((x1 == null ? 270 : x1) * Math.PI) / 180;

    let x = Math.cos(angle);
    let y = -Math.sin(angle);
    const l = (Math.abs(x) + Math.abs(y)) / 2;

    x *= l;
    y *= l;

    x1 = 0.5 - x;
    x2 = 0.5 + x;
    y1 = 0.5 - y;
    y2 = 0.5 + y;
    this._bb = true;
  } else {
    this._bb = false;
  }

  const brushData = [type, +x1, +y1, +x2, +y2];
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
  const brushData = [RADIAL_GRADIENT, +fx, +fy, +rx * 2, +ry * 2, +cx, +cy];
  insertDoubleColorStopsIntoArray(stops, brushData, 7);
  this._brush = brushData;
}

function Pattern(url, width, height, left, top) {
  this._brush = [PATTERN, url, +left || 0, +top || 0, +width, +height];
}

const ReactART = {
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
