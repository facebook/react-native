/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "name": "Dimensions",
  "docblock": "/**\\n */\\n",
  "methods": [
    \{
      "line": 31,
      "source": "static set(dims: \{[key:string]: any}): void \{\\n    // We calculate the window dimensions in JS so that we don't encounter loss of\\n    // precision in transferring the dimensions (which could be non-integers) over\\n    // the bridge.\\n    if (dims && dims.windowPhysicalPixels) \{\\n      // parse/stringify => Clone hack\\n      dims = JSON.parse(JSON.stringify(dims));\\n\\n      var windowPhysicalPixels = dims.windowPhysicalPixels;\\n      dims.window = \{\\n        width: windowPhysicalPixels.width / windowPhysicalPixels.scale,\\n        height: windowPhysicalPixels.height / windowPhysicalPixels.scale,\\n        scale: windowPhysicalPixels.scale,\\n        fontScale: windowPhysicalPixels.fontScale,\\n      };\\n      if (Platform.OS === 'android') \{\\n        // Screen and window dimensions are different on android\\n        var screenPhysicalPixels = dims.screenPhysicalPixels;\\n        dims.screen = \{\\n          width: screenPhysicalPixels.width / screenPhysicalPixels.scale,\\n          height: screenPhysicalPixels.height / screenPhysicalPixels.scale,\\n          scale: screenPhysicalPixels.scale,\\n          fontScale: screenPhysicalPixels.fontScale,\\n        };\\n\\n        // delete so no callers rely on this existing\\n        delete dims.screenPhysicalPixels;\\n      } else \{\\n        dims.screen = dims.window;\\n      }\\n      // delete so no callers rely on this existing\\n      delete dims.windowPhysicalPixels;\\n    }\\n\\n    Object.assign(dimensions, dims);\\n    if (dimensionsInitialized) \{\\n      // Don't fire 'change' the first time the dimensions are set.\\n      eventEmitter.emit('change', \{\\n        window: dimensions.window,\\n        screen: dimensions.screen\\n      });\\n    } else \{\\n      dimensionsInitialized = true;\\n    }\\n  }",
      "docblock": "/**\\n   * This should only be called from native code by sending the\\n   * didUpdateDimensions event.\\n   *\\n   * @param \{object} dims Simple string-keyed object of dimensions to set\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{[key:string]: any}",
          "name": "dims"
        }
      ],
      "tparams": null,
      "returntypehint": "void",
      "name": "set"
    },
    \{
      "line": 92,
      "source": "static get(dim: string): Object \{\\n    invariant(dimensions[dim], 'No dimension set for key ' + dim);\\n    return dimensions[dim];\\n  }",
      "docblock": "/**\\n   * Initial dimensions are set before \`runApplication\` is called so they should\\n   * be available before any other require's are run, but may be updated later.\\n   *\\n   * Note: Although dimensions are available immediately, they may change (e.g\\n   * due to device rotation) so any rendering logic or styles that depend on\\n   * these constants should try to call this function on every render, rather\\n   * than caching the value (for example, using inline styles rather than\\n   * setting a value in a \`StyleSheet\`).\\n   *\\n   * Example: \`var \{height, width} = Dimensions.get('window');\`\\n   *\\n   * @param \{string} dim Name of dimension as defined when calling \`set\`.\\n   * @returns \{Object?} Value for the dimension.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "dim"
        }
      ],
      "tparams": null,
      "returntypehint": "Object",
      "name": "get"
    },
    \{
      "line": 105,
      "source": "static addEventListener(\\n    type: string,\\n    handler: Function\\n  ) \{\\n    invariant(\\n      'change' === type,\\n      'Trying to subscribe to unknown event: \\"%s\\"', type\\n    );\\n    eventEmitter.addListener(type, handler);\\n  }",
      "docblock": "/**\\n   * Add an event handler. Supported events:\\n   *\\n   * - \`change\`: Fires when a property within the \`Dimensions\` object changes. The argument\\n   *   to the event handler is an object with \`window\` and \`screen\` properties whose values\\n   *   are the same as the return values of \`Dimensions.get('window')\` and\\n   *   \`Dimensions.get('screen')\`, respectively.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "type"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Function\\",\\"length\\":1}",
          "name": "handler"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "addEventListener"
    },
    \{
      "line": 119,
      "source": "static removeEventListener(\\n    type: string,\\n    handler: Function\\n  ) \{\\n    invariant(\\n      'change' === type,\\n      'Trying to remove listener for unknown event: \\"%s\\"', type\\n    );\\n    eventEmitter.removeListener(type, handler);\\n  }",
      "docblock": "/**\\n   * Remove an event handler.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "type"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Function\\",\\"length\\":1}",
          "name": "handler"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "removeEventListener"
    }
  ],
  "type": "api",
  "line": 24,
  "requires": [
    \{
      "name": "DeviceInfo"
    },
    \{
      "name": "EventEmitter"
    },
    \{
      "name": "Platform"
    },
    \{
      "name": "RCTDeviceEventEmitter"
    },
    \{
      "name": "fbjs/lib/invariant"
    }
  ],
  "filepath": "Libraries/Utilities/Dimensions.js",
  "componentName": "Dimensions",
  "componentPlatform": "cross"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"dimensions","title":"Dimensions","layout":"autodocs","category":"APIs","permalink":"docs/dimensions.html","platform":"cross","next":"dimensions","previous":"clipboard","sidebar":true,"path":"Libraries/Utilities/Dimensions.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;