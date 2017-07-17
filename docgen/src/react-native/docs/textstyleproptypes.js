/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "props": \{
    "color": \{
      "type": \{
        "name": "custom",
        "raw": "ColorPropType"
      },
      "required": false,
      "description": ""
    },
    "fontFamily": \{
      "type": \{
        "name": "string"
      },
      "required": false,
      "description": ""
    },
    "fontSize": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": ""
    },
    "fontStyle": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "'normal'",
            "computed": false
          },
          \{
            "value": "'italic'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": ""
    },
    "fontWeight": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "\\"normal\\"",
            "computed": false
          },
          \{
            "value": "'bold'",
            "computed": false
          },
          \{
            "value": "'100'",
            "computed": false
          },
          \{
            "value": "'200'",
            "computed": false
          },
          \{
            "value": "'300'",
            "computed": false
          },
          \{
            "value": "'400'",
            "computed": false
          },
          \{
            "value": "'500'",
            "computed": false
          },
          \{
            "value": "'600'",
            "computed": false
          },
          \{
            "value": "'700'",
            "computed": false
          },
          \{
            "value": "'800'",
            "computed": false
          },
          \{
            "value": "'900'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "Specifies font weight. The values 'normal' and 'bold' are supported for\\nmost fonts. Not all fonts have a variant for each of the numeric values,\\nin that case the closest one is chosen."
    },
    "fontVariant": \{
      "type": \{
        "name": "arrayOf",
        "value": \{
          "name": "enum",
          "value": [
            \{
              "value": "'small-caps'",
              "computed": false
            },
            \{
              "value": "'oldstyle-nums'",
              "computed": false
            },
            \{
              "value": "'lining-nums'",
              "computed": false
            },
            \{
              "value": "'tabular-nums'",
              "computed": false
            },
            \{
              "value": "'proportional-nums'",
              "computed": false
            }
          ]
        }
      },
      "required": false,
      "description": "@platform ios"
    },
    "textShadowOffset": \{
      "type": \{
        "name": "shape",
        "value": \{
          "width": \{
            "name": "number",
            "required": false
          },
          "height": \{
            "name": "number",
            "required": false
          }
        }
      },
      "required": false,
      "description": ""
    },
    "textShadowRadius": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": ""
    },
    "textShadowColor": \{
      "type": \{
        "name": "custom",
        "raw": "ColorPropType"
      },
      "required": false,
      "description": ""
    },
    "letterSpacing": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": "@platform ios"
    },
    "lineHeight": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": ""
    },
    "textAlign": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "\\"auto\\"",
            "computed": false
          },
          \{
            "value": "'left'",
            "computed": false
          },
          \{
            "value": "'right'",
            "computed": false
          },
          \{
            "value": "'center'",
            "computed": false
          },
          \{
            "value": "'justify'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "Specifies text alignment. The value 'justify' is only supported on iOS and\\nfallbacks to \`left\` on Android."
    },
    "textAlignVertical": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "\\"auto\\"",
            "computed": false
          },
          \{
            "value": "'top'",
            "computed": false
          },
          \{
            "value": "'bottom'",
            "computed": false
          },
          \{
            "value": "'center'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "@platform android"
    },
    "includeFontPadding": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "Set to \`false\` to remove extra font padding intended to make space for certain ascenders / descenders.\\nWith some fonts, this padding can make text look slightly misaligned when centered vertically.\\nFor best results also set \`textAlignVertical\` to \`center\`. Default is true.\\n@platform android"
    },
    "textDecorationLine": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "\\"none\\"",
            "computed": false
          },
          \{
            "value": "'underline'",
            "computed": false
          },
          \{
            "value": "'line-through'",
            "computed": false
          },
          \{
            "value": "'underline line-through'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": ""
    },
    "textDecorationStyle": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "\\"solid\\"",
            "computed": false
          },
          \{
            "value": "'double'",
            "computed": false
          },
          \{
            "value": "'dotted'",
            "computed": false
          },
          \{
            "value": "'dashed'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "@platform ios"
    },
    "textDecorationColor": \{
      "type": \{
        "name": "custom",
        "raw": "ColorPropType"
      },
      "required": false,
      "description": "@platform ios"
    },
    "writingDirection": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "\\"auto\\"",
            "computed": false
          },
          \{
            "value": "'ltr'",
            "computed": false
          },
          \{
            "value": "'rtl'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "@platform ios"
    }
  },
  "type": "style",
  "filepath": "Libraries/Text/TextStylePropTypes.js",
  "componentName": "TextStylePropTypes",
  "componentPlatform": "cross"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"textstyleproptypes","title":"TextStylePropTypes","layout":"autodocs","category":"APIs","permalink":"docs/textstyleproptypes.html","platform":"cross","next":"imagestyleproptypes","previous":"viewstyleproptypes","sidebar":true,"path":"Libraries/Text/TextStylePropTypes.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;