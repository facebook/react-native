/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "description": "Component to control the app status bar.\\n\\n### Usage with Navigator\\n\\nIt is possible to have multiple \`StatusBar\` components mounted at the same\\ntime. The props will be merged in the order the \`StatusBar\` components were\\nmounted. One use case is to specify status bar styles per route using \`Navigator\`.\\n\\n\`\`\`\\n <View>\\n   <StatusBar\\n     backgroundColor=\\"blue\\"\\n     barStyle=\\"light-content\\"\\n   />\\n   <Navigator\\n     initialRoute=\{\{statusBarHidden: true}}\\n     renderScene=\{(route, navigator) =>\\n       <View>\\n         <StatusBar hidden=\{route.statusBarHidden} />\\n         ...\\n       </View>\\n     }\\n   />\\n </View>\\n\`\`\`\\n\\n### Imperative API\\n\\nFor cases where using a component is not ideal, there is also an imperative\\nAPI exposed as static functions on the component. It is however not recommended\\nto use the static API and the component for the same prop because any value\\nset by the static API will get overriden by the one set by the component in\\nthe next render.\\n\\n### Constants\\n\\n\`currentHeight\` (Android only) The height of the status bar.",
  "methods": [
    \{
      "name": "setHidden",
      "docblock": "Show or hide the status bar\\n@param hidden Hide the status bar.\\n@param animation Optional animation when\\n   changing the status bar hidden property.",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "name": "hidden",
          "description": "Hide the status bar.",
          "type": \{
            "names": [
              "boolean"
            ]
          }
        },
        \{
          "name": "animation",
          "description": "Optional animation when\\n   changing the status bar hidden property.",
          "type": \{
            "names": [
              "StatusBarAnimation"
            ]
          },
          "optional": true
        }
      ],
      "returns": null,
      "description": "Show or hide the status bar"
    },
    \{
      "name": "setBarStyle",
      "docblock": "Set the status bar style\\n@param style Status bar style to set\\n@param animated Animate the style change.",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "name": "style",
          "description": "Status bar style to set",
          "type": \{
            "names": [
              "StatusBarStyle"
            ]
          }
        },
        \{
          "name": "animated",
          "description": "Animate the style change.",
          "type": \{
            "names": [
              "boolean"
            ]
          },
          "optional": true
        }
      ],
      "returns": null,
      "description": "Set the status bar style"
    },
    \{
      "name": "setNetworkActivityIndicatorVisible",
      "docblock": "Control the visibility of the network activity indicator\\n@param visible Show the indicator.",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "name": "visible",
          "description": "Show the indicator.",
          "type": \{
            "names": [
              "boolean"
            ]
          }
        }
      ],
      "returns": null,
      "description": "Control the visibility of the network activity indicator"
    },
    \{
      "name": "setBackgroundColor",
      "docblock": "Set the background color for the status bar\\n@param color Background color.\\n@param animated Animate the style change.",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "name": "color",
          "description": "Background color.",
          "type": \{
            "names": [
              "string"
            ]
          }
        },
        \{
          "name": "animated",
          "description": "Animate the style change.",
          "type": \{
            "names": [
              "boolean"
            ]
          },
          "optional": true
        }
      ],
      "returns": null,
      "description": "Set the background color for the status bar"
    },
    \{
      "name": "setTranslucent",
      "docblock": "Control the translucency of the status bar\\n@param translucent Set as translucent.",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "name": "translucent",
          "description": "Set as translucent.",
          "type": \{
            "names": [
              "boolean"
            ]
          }
        }
      ],
      "returns": null,
      "description": "Control the translucency of the status bar"
    }
  ],
  "props": \{
    "hidden": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "If the status bar is hidden.",
      "flowType": \{
        "name": "boolean"
      }
    },
    "animated": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "If the transition between status bar property changes should be animated.\\nSupported for backgroundColor, barStyle and hidden.",
      "flowType": \{
        "name": "boolean"
      },
      "defaultValue": \{
        "value": "false",
        "computed": false
      }
    },
    "backgroundColor": \{
      "type": \{
        "name": "custom",
        "raw": "ColorPropType"
      },
      "required": false,
      "description": "The background color of the status bar.\\n@platform android",
      "flowType": \{
        "name": "string"
      }
    },
    "translucent": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "If the status bar is translucent.\\nWhen translucent is set to true, the app will draw under the status bar.\\nThis is useful when using a semi transparent status bar color.\\n\\n@platform android",
      "flowType": \{
        "name": "boolean"
      }
    },
    "barStyle": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "'default'",
            "computed": false
          },
          \{
            "value": "'light-content'",
            "computed": false
          },
          \{
            "value": "'dark-content'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "Sets the color of the status bar text.",
      "flowType": \{
        "name": "union",
        "raw": "'default' | 'light-content' | 'dark-content'",
        "elements": [
          \{
            "name": "literal",
            "value": "'default'"
          },
          \{
            "name": "literal",
            "value": "'light-content'"
          },
          \{
            "name": "literal",
            "value": "'dark-content'"
          }
        ]
      }
    },
    "networkActivityIndicatorVisible": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "If the network activity indicator should be visible.\\n\\n@platform ios",
      "flowType": \{
        "name": "boolean"
      }
    },
    "showHideTransition": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "'fade'",
            "computed": false
          },
          \{
            "value": "'slide'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "The transition effect when showing and hiding the status bar using the \`hidden\`\\nprop. Defaults to 'fade'.\\n\\n@platform ios",
      "flowType": \{
        "name": "union",
        "raw": "'fade' | 'slide'",
        "elements": [
          \{
            "name": "literal",
            "value": "'fade'"
          },
          \{
            "name": "literal",
            "value": "'slide'"
          }
        ]
      },
      "defaultValue": \{
        "value": "'fade'",
        "computed": false
      }
    }
  },
  "typedef": [
    \{
      "name": "StatusBarStyle",
      "description": "Status bar style",
      "type": \{
        "names": [
          "$Enum"
        ]
      },
      "values": [
        \{
          "type": \{
            "names": [
              "string"
            ]
          },
          "description": "Default status bar style (dark for iOS, light for Android)",
          "name": "default"
        },
        \{
          "type": \{
            "names": [
              "string"
            ]
          },
          "description": "Dark background, white texts and icons",
          "name": "light-content"
        },
        \{
          "type": \{
            "names": [
              "string"
            ]
          },
          "description": "Light background, dark texts and icons",
          "name": "dark-content"
        }
      ]
    },
    \{
      "name": "StatusBarAnimation",
      "description": "Status bar animation",
      "type": \{
        "names": [
          "$Enum"
        ]
      },
      "values": [
        \{
          "type": \{
            "names": [
              "string"
            ]
          },
          "description": "No animation",
          "name": "none"
        },
        \{
          "type": \{
            "names": [
              "string"
            ]
          },
          "description": "Fade animation",
          "name": "fade"
        },
        \{
          "type": \{
            "names": [
              "string"
            ]
          },
          "description": "Slide animation",
          "name": "slide"
        }
      ]
    }
  ],
  "type": "component",
  "filepath": "Libraries/Components/StatusBar/StatusBar.js",
  "componentName": "StatusBar",
  "componentPlatform": "cross",
  "styles": \{
    "ViewStylePropTypes": \{
      "props": \{
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
        "borderTopColor": \{
          "type": \{
            "name": "custom",
            "raw": "ColorPropType"
          },
          "required": false,
          "description": ""
        },
        "borderRightColor": \{
          "type": \{
            "name": "custom",
            "raw": "ColorPropType"
          },
          "required": false,
          "description": ""
        },
        "borderBottomColor": \{
          "type": \{
            "name": "custom",
            "raw": "ColorPropType"
          },
          "required": false,
          "description": ""
        },
        "borderLeftColor": \{
          "type": \{
            "name": "custom",
            "raw": "ColorPropType"
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
        },
        "borderStyle": \{
          "type": \{
            "name": "enum",
            "value": [
              \{
                "value": "'solid'",
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
          "description": ""
        },
        "borderWidth": \{
          "type": \{
            "name": "number"
          },
          "required": false,
          "description": ""
        },
        "borderTopWidth": \{
          "type": \{
            "name": "number"
          },
          "required": false,
          "description": ""
        },
        "borderRightWidth": \{
          "type": \{
            "name": "number"
          },
          "required": false,
          "description": ""
        },
        "borderBottomWidth": \{
          "type": \{
            "name": "number"
          },
          "required": false,
          "description": ""
        },
        "borderLeftWidth": \{
          "type": \{
            "name": "number"
          },
          "required": false,
          "description": ""
        },
        "opacity": \{
          "type": \{
            "name": "number"
          },
          "required": false,
          "description": ""
        },
        "elevation": \{
          "type": \{
            "name": "number"
          },
          "required": false,
          "description": "(Android-only) Sets the elevation of a view, using Android's underlying\\n[elevation API](https://developer.android.com/training/material/shadows-clipping.html#Elevation).\\nThis adds a drop shadow to the item and affects z-order for overlapping views.\\nOnly supported on Android 5.0+, has no effect on earlier versions.\\n@platform android"
        }
      },
      "composes": [
        "LayoutPropTypes",
        "ShadowPropTypesIOS",
        "TransformPropTypes"
      ]
    },
    "TextStylePropTypes": \{
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
      "composes": [
        "ViewStylePropTypes"
      ]
    },
    "ImageStylePropTypes": \{
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
      "composes": [
        "LayoutPropTypes",
        "ShadowPropTypesIOS",
        "TransformPropTypes"
      ]
    }
  }
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"statusbar","title":"StatusBar","layout":"autodocs","category":"Components","permalink":"docs/statusbar.html","platform":"cross","next":"switch","previous":"snapshotviewios","sidebar":true,"path":"Libraries/Components/StatusBar/StatusBar.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;