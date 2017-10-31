/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "name": "PixelRatio",
  "docblock": "/**\\n * PixelRatio class gives access to the device pixel density.\\n *\\n * ### Fetching a correctly sized image\\n *\\n * You should get a higher resolution image if you are on a high pixel density\\n * device. A good rule of thumb is to multiply the size of the image you display\\n * by the pixel ratio.\\n *\\n * \`\`\`\\n * var image = getImage(\{\\n *   width: PixelRatio.getPixelSizeForLayoutSize(200),\\n *   height: PixelRatio.getPixelSizeForLayoutSize(100),\\n * });\\n * <Image source=\{image} style=\{\{width: 200, height: 100}} />\\n * \`\`\`\\n */\\n",
  "methods": [
    \{
      "line": 52,
      "source": "static get(): number \{\\n    return Dimensions.get('window').scale;\\n  }",
      "docblock": "/**\\n   * Returns the device pixel density. Some examples:\\n   *\\n   *   - PixelRatio.get() === 1\\n   *     - mdpi Android devices (160 dpi)\\n   *   - PixelRatio.get() === 1.5\\n   *     - hdpi Android devices (240 dpi)\\n   *   - PixelRatio.get() === 2\\n   *     - iPhone 4, 4S\\n   *     - iPhone 5, 5c, 5s\\n   *     - iPhone 6\\n   *     - xhdpi Android devices (320 dpi)\\n   *   - PixelRatio.get() === 3\\n   *     - iPhone 6 plus\\n   *     - xxhdpi Android devices (480 dpi)\\n   *   - PixelRatio.get() === 3.5\\n   *     - Nexus 6\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
      "name": "get"
    },
    \{
      "line": 67,
      "source": "static getFontScale(): number \{\\n    return Dimensions.get('window').fontScale || PixelRatio.get();\\n  }",
      "docblock": "/**\\n   * Returns the scaling factor for font sizes. This is the ratio that is used to calculate the\\n   * absolute font size, so any elements that heavily depend on that should use this to do\\n   * calculations.\\n   *\\n   * If a font scale is not set, this returns the device pixel ratio.\\n   *\\n   * Currently this is only implemented on Android and reflects the user preference set in\\n   * Settings > Display > Font size, on iOS it will always return the default pixel ratio.\\n   * @platform android\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
      "name": "getFontScale"
    },
    \{
      "line": 76,
      "source": "static getPixelSizeForLayoutSize(layoutSize: number): number \{\\n    return Math.round(layoutSize * PixelRatio.get());\\n  }",
      "docblock": "/**\\n   * Converts a layout size (dp) to pixel size (px).\\n   *\\n   * Guaranteed to return an integer number.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
          "name": "layoutSize"
        }
      ],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
      "name": "getPixelSizeForLayoutSize"
    },
    \{
      "line": 86,
      "source": "static roundToNearestPixel(layoutSize: number): number \{\\n    var ratio = PixelRatio.get();\\n    return Math.round(layoutSize * ratio) / ratio;\\n  }",
      "docblock": "/**\\n   * Rounds a layout size (dp) to the nearest layout size that corresponds to\\n   * an integer number of pixels. For example, on a device with a PixelRatio\\n   * of 3, \`PixelRatio.roundToNearestPixel(8.4) = 8.33\`, which corresponds to\\n   * exactly (8.33 * 3) = 25 pixels.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
          "name": "layoutSize"
        }
      ],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
      "name": "roundToNearestPixel"
    },
    \{
      "line": 92,
      "source": "static startDetecting() \{}",
      "docblock": "// No-op for iOS, but used on the web. Should not be documented.",
      "modifiers": [
        "static"
      ],
      "params": [],
      "tparams": null,
      "returntypehint": null,
      "name": "startDetecting"
    }
  ],
  "type": "api",
  "line": 33,
  "requires": [
    \{
      "name": "Dimensions"
    }
  ],
  "filepath": "Libraries/Utilities/PixelRatio.js",
  "componentName": "PixelRatio",
  "componentPlatform": "cross"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"pixelratio","title":"PixelRatio","layout":"autodocs","category":"APIs","permalink":"docs/pixelratio.html","platform":"cross","next":"pixelratio","previous":"panresponder","sidebar":true,"path":"Libraries/Utilities/PixelRatio.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;