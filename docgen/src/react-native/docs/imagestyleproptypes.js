/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "props": \{
    "resizeMode": \{
      "type": \{
        "name": "enum",
        "computed": true,
        "value": "Object.keys(ImageResizeMode)"
      },
      "required": false,
      "description": ""
    },
    "backfaceVisibility": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "'visible'",
            "computed": false
          },
          \{
            "value": "'hidden'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": ""
    },
    "backgroundColor": \{
      "type": \{
        "name": "custom",
        "raw": "ColorPropType"
      },
      "required": false,
      "description": ""
    },
    "borderColor": \{
      "type": \{
        "name": "custom",
        "raw": "ColorPropType"
      },
      "required": false,
      "description": ""
    },
    "borderWidth": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": ""
    },
    "borderRadius": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": ""
    },
    "overflow": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "'visible'",
            "computed": false
          },
          \{
            "value": "'hidden'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": ""
    },
    "tintColor": \{
      "type": \{
        "name": "custom",
        "raw": "ColorPropType"
      },
      "required": false,
      "description": "Changes the color of all the non-transparent pixels to the tintColor."
    },
    "opacity": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": ""
    },
    "overlayColor": \{
      "type": \{
        "name": "string"
      },
      "required": false,
      "description": "When the image has rounded corners, specifying an overlayColor will\\ncause the remaining space in the corners to be filled with a solid color.\\nThis is useful in cases which are not supported by the Android\\nimplementation of rounded corners:\\n  - Certain resize modes, such as 'contain'\\n  - Animated GIFs\\n\\nA typical way to use this prop is with images displayed on a solid\\nbackground and setting the \`overlayColor\` to the same color\\nas the background.\\n\\nFor details of how this works under the hood, see\\nhttp://frescolib.org/docs/rounded-corners-and-circles.html\\n\\n@platform android"
    },
    "borderTopLeftRadius": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": ""
    },
    "borderTopRightRadius": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": ""
    },
    "borderBottomLeftRadius": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": ""
    },
    "borderBottomRightRadius": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": ""
    }
  },
  "type": "style",
  "filepath": "Libraries/Image/ImageStylePropTypes.js",
  "componentName": "ImageStylePropTypes",
  "componentPlatform": "cross"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"imagestyleproptypes","title":"ImageStylePropTypes","layout":"autodocs","category":"APIs","permalink":"docs/imagestyleproptypes.html","platform":"cross","next":"imagestyleproptypes","previous":"viewstyleproptypes","sidebar":true,"path":"Libraries/Image/ImageStylePropTypes.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;