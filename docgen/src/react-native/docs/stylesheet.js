/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "methods": [
    \{
      "line": 175,
      "source": "setStyleAttributePreprocessor(property: string, process: (nextProp: mixed) => mixed) \{\\n    let value;\\n\\n    if (typeof ReactNativeStyleAttributes[property] === 'string') \{\\n      value = \{};\\n    } else if (typeof ReactNativeStyleAttributes[property] === 'object') \{\\n      value = ReactNativeStyleAttributes[property];\\n    } else \{\\n      console.error(\`$\{property} is not a valid style attribute\`);\\n      return;\\n    }\\n\\n    if (__DEV__ && typeof value.process === 'function') \{\\n      console.warn(\`Overwriting $\{property} style attribute preprocessor\`);\\n    }\\n\\n    ReactNativeStyleAttributes[property] = \{ ...value, process };\\n  }",
      "docblock": "/**\\n   * WARNING: EXPERIMENTAL. Breaking changes will probably happen a lot and will\\n   * not be reliably announced. The whole thing might be deleted, who knows? Use\\n   * at your own risk.\\n   *\\n   * Sets a function to use to pre-process a style property value. This is used\\n   * internally to process color and transform values. You should not use this\\n   * unless you really know what you are doing and have exhausted other options.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "property"
        },
        \{
          "typehint": "(nextProp: mixed) => mixed",
          "name": "process"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "setStyleAttributePreprocessor"
    },
    \{
      "line": 197,
      "source": "create<S: Styles>(obj: S): StyleSheet<S> \{\\n    const result: StyleSheet<S> = \{};\\n    for (var key in obj) \{\\n      StyleSheetValidation.validateStyle(key, obj);\\n      result[key] = ReactNativePropRegistry.register(obj[key]);\\n    }\\n    return result;\\n  }",
      "docblock": "/**\\n   * Creates a StyleSheet style reference from the given object.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"S\\",\\"length\\":1}",
          "name": "obj"
        }
      ],
      "tparams": [
        "S"
      ],
      "returntypehint": "\{\\"type\\":\\"generic\\",\\"value\\":[\{\\"type\\":\\"simple\\",\\"value\\":\\"StyleSheet\\",\\"length\\":1},\{\\"type\\":\\"simple\\",\\"value\\":\\"S\\",\\"length\\":1}],\\"length\\":4}",
      "name": "create"
    }
  ],
  "properties": [
    \{
      "name": "hairlineWidth",
      "type": \{
        "name": "CallExpression"
      },
      "docblock": "/**\\n   * This is defined as the width of a thin line on the platform. It can be\\n   * used as the thickness of a border or division between two elements.\\n   * Example:\\n   * \`\`\`\\n   *   \{\\n   *     borderBottomColor: '#bbb',\\n   *     borderBottomWidth: StyleSheet.hairlineWidth\\n   *   }\\n   * \`\`\`\\n   *\\n   * This constant will always be a round number of pixels (so a line defined\\n   * by it look crisp) and will try to match the standard width of a thin line\\n   * on the underlying platform. However, you should not rely on it being a\\n   * constant size, because on different platforms and screen densities its\\n   * value may be calculated differently.\\n   *\\n   * A line with hairline width may not be visible if your simulator is downscaled.\\n   */\\n",
      "source": "hairlineWidth",
      "modifiers": [
        "static"
      ],
      "propertySource": "PixelRatio.roundToNearestPixel(0.4)"
    },
    \{
      "name": "absoluteFill",
      "type": \{
        "name": "CallExpression"
      },
      "docblock": "/**\\n   * A very common pattern is to create overlays with position absolute and zero positioning,\\n   * so \`absoluteFill\` can be used for convenience and to reduce duplication of these repeated\\n   * styles.\\n   */\\n",
      "source": "absoluteFill",
      "modifiers": [
        "static"
      ],
      "propertySource": "ReactNativePropRegistry.register(absoluteFillObject)"
    },
    \{
      "name": "absoluteFillObject",
      "type": \{
        "name": "ObjectExpression"
      },
      "docblock": "/**\\n   * Sometimes you may want \`absoluteFill\` but with a couple tweaks - \`absoluteFillObject\` can be\\n   * used to create a customized entry in a \`StyleSheet\`, e.g.:\\n   *\\n   *   const styles = StyleSheet.create(\{\\n   *     wrapper: \{\\n   *       ...StyleSheet.absoluteFillObject,\\n   *       top: 10,\\n   *       backgroundColor: 'transparent',\\n   *     },\\n   *   });\\n   */\\n",
      "source": "absoluteFillObject",
      "modifiers": [
        "static"
      ],
      "propertySource": "\{\\n  position: 'absolute',\\n  left: 0,\\n  right: 0,\\n  top: 0,\\n  bottom: 0,\\n}"
    },
    \{
      "name": "flatten",
      "type": \{
        "name": "CallExpression"
      },
      "docblock": "/**\\n   * Flattens an array of style objects, into one aggregated style object.\\n   * Alternatively, this method can be used to lookup IDs, returned by\\n   * StyleSheet.register.\\n   *\\n   * > **NOTE**: Exercise caution as abusing this can tax you in terms of\\n   * > optimizations.\\n   * >\\n   * > IDs enable optimizations through the bridge and memory in general. Refering\\n   * > to style objects directly will deprive you of these optimizations.\\n   *\\n   * Example:\\n   * \`\`\`\\n   * var styles = StyleSheet.create(\{\\n   *   listItem: \{\\n   *     flex: 1,\\n   *     fontSize: 16,\\n   *     color: 'white'\\n   *   },\\n   *   selectedListItem: \{\\n   *     color: 'green'\\n   *   }\\n   * });\\n   *\\n   * StyleSheet.flatten([styles.listItem, styles.selectedListItem])\\n   * // returns \{ flex: 1, fontSize: 16, color: 'green' }\\n   * \`\`\`\\n   * Alternative use:\\n   * \`\`\`\\n   * StyleSheet.flatten(styles.listItem);\\n   * // return \{ flex: 1, fontSize: 16, color: 'white' }\\n   * // Simply styles.listItem would return its ID (number)\\n   * \`\`\`\\n   * This method internally uses \`StyleSheetRegistry.getStyleByID(style)\`\\n   * to resolve style objects represented by IDs. Thus, an array of style\\n   * objects (instances of StyleSheet.create), are individually resolved to,\\n   * their respective objects, merged as one and then returned. This also explains\\n   * the alternative use.\\n   */\\n",
      "source": "flatten",
      "modifiers": [
        "static"
      ],
      "propertySource": "require\('flattenStyle')"
    }
  ],
  "classes": [],
  "superClass": null,
  "type": "api",
  "line": 82,
  "name": "StyleSheet",
  "docblock": "/**\\n * A StyleSheet is an abstraction similar to CSS StyleSheets\\n *\\n * Create a new StyleSheet:\\n *\\n * \`\`\`\\n * var styles = StyleSheet.create(\{\\n *   container: \{\\n *     borderRadius: 4,\\n *     borderWidth: 0.5,\\n *     borderColor: '#d6d7da',\\n *   },\\n *   title: \{\\n *     fontSize: 19,\\n *     fontWeight: 'bold',\\n *   },\\n *   activeTitle: \{\\n *     color: 'red',\\n *   },\\n * });\\n * \`\`\`\\n *\\n * Use a StyleSheet:\\n *\\n * \`\`\`\\n * <View style=\{styles.container}>\\n *   <Text style=\{[styles.title, this.props.isActive && styles.activeTitle]} />\\n * </View>\\n * \`\`\`\\n *\\n * Code quality:\\n *\\n *  - By moving styles away from the render function, you're making the code\\n *  easier to understand.\\n *  - Naming the styles is a good way to add meaning to the low level components\\n *  in the render function.\\n *\\n * Performance:\\n *\\n *  - Making a stylesheet from a style object makes it possible to refer to it\\n * by ID instead of creating a new style object every time.\\n *  - It also allows to send the style only once through the bridge. All\\n * subsequent uses are going to refer an id (not implemented yet).\\n */\\n",
  "requires": [
    \{
      "name": "PixelRatio"
    },
    \{
      "name": "ReactNativePropRegistry"
    },
    \{
      "name": "ReactNativeStyleAttributes"
    },
    \{
      "name": "StyleSheetValidation"
    },
    \{
      "name": "flattenStyle"
    },
    \{
      "name": "flattenStyle"
    }
  ],
  "filepath": "Libraries/StyleSheet/StyleSheet.js",
  "componentName": "StyleSheet",
  "componentPlatform": "cross"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"stylesheet","title":"StyleSheet","layout":"autodocs","category":"APIs","permalink":"docs/stylesheet.html","platform":"cross","next":"systrace","previous":"statusbarios","sidebar":true,"path":"Libraries/StyleSheet/StyleSheet.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;