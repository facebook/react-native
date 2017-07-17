/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "description": "React component that wraps the platform \`DrawerLayout\` (Android only). The\\nDrawer (typically used for navigation) is rendered with \`renderNavigationView\`\\nand direct children are the main view (where your content goes). The navigation\\nview is initially not visible on the screen, but can be pulled in from the\\nside of the window specified by the \`drawerPosition\` prop and its width can\\nbe set by the \`drawerWidth\` prop.\\n\\nExample:\\n\\n\`\`\`\\nrender: function() \{\\n  var navigationView = (\\n    <View style=\{\{flex: 1, backgroundColor: '#fff'}}>\\n      <Text style=\{\{margin: 10, fontSize: 15, textAlign: 'left'}}>I'm in the Drawer!</Text>\\n    </View>\\n  );\\n  return (\\n    <DrawerLayoutAndroid\\n      drawerWidth=\{300}\\n      drawerPosition=\{DrawerLayoutAndroid.positions.Left}\\n      renderNavigationView=\{() => navigationView}>\\n      <View style=\{\{flex: 1, alignItems: 'center'}}>\\n        <Text style=\{\{margin: 10, fontSize: 15, textAlign: 'right'}}>Hello</Text>\\n        <Text style=\{\{margin: 10, fontSize: 15, textAlign: 'right'}}>World!</Text>\\n      </View>\\n    </DrawerLayoutAndroid>\\n  );\\n},\\n\`\`\`",
  "displayName": "DrawerLayoutAndroid",
  "methods": [
    \{
      "name": "openDrawer",
      "docblock": "Opens the drawer.",
      "modifiers": [],
      "params": [],
      "returns": null,
      "description": "Opens the drawer."
    },
    \{
      "name": "closeDrawer",
      "docblock": "Closes the drawer.",
      "modifiers": [],
      "params": [],
      "returns": null,
      "description": "Closes the drawer."
    }
  ],
  "props": \{
    "keyboardDismissMode": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "\\"none\\"",
            "computed": false
          },
          \{
            "value": "'on-drag'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "Determines whether the keyboard gets dismissed in response to a drag.\\n  - 'none' (the default), drags do not dismiss the keyboard.\\n  - 'on-drag', the keyboard is dismissed when a drag begins."
    },
    "drawerBackgroundColor": \{
      "type": \{
        "name": "custom",
        "raw": "ColorPropType"
      },
      "required": false,
      "description": "Specifies the background color of the drawer. The default value is white.\\nIf you want to set the opacity of the drawer, use rgba. Example:\\n\\n\`\`\`\\nreturn (\\n  <DrawerLayoutAndroid drawerBackgroundColor=\\"rgba(0,0,0,0.5)\\">\\n  </DrawerLayoutAndroid>\\n);\\n\`\`\`",
      "defaultValue": \{
        "value": "'white'",
        "computed": false
      }
    },
    "drawerPosition": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "DrawerConsts.DrawerPosition.Left",
            "computed": true
          },
          \{
            "value": "DrawerConsts.DrawerPosition.Right",
            "computed": true
          }
        ]
      },
      "required": false,
      "description": "Specifies the side of the screen from which the drawer will slide in."
    },
    "drawerWidth": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": "Specifies the width of the drawer, more precisely the width of the view that be pulled in\\nfrom the edge of the window."
    },
    "drawerLockMode": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "'unlocked'",
            "computed": false
          },
          \{
            "value": "'locked-closed'",
            "computed": false
          },
          \{
            "value": "'locked-open'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "Specifies the lock mode of the drawer. The drawer can be locked in 3 states:\\n- unlocked (default), meaning that the drawer will respond (open/close) to touch gestures.\\n- locked-closed, meaning that the drawer will stay closed and not respond to gestures.\\n- locked-open, meaning that the drawer will stay opened and not respond to gestures.\\nThe drawer may still be opened and closed programmatically (\`openDrawer\`/\`closeDrawer\`)."
    },
    "onDrawerSlide": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Function called whenever there is an interaction with the navigation view."
    },
    "onDrawerStateChanged": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Function called when the drawer state has changed. The drawer can be in 3 states:\\n- idle, meaning there is no interaction with the navigation view happening at the time\\n- dragging, meaning there is currently an interaction with the navigation view\\n- settling, meaning that there was an interaction with the navigation view, and the\\nnavigation view is now finishing its closing or opening animation"
    },
    "onDrawerOpen": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Function called whenever the navigation view has been opened."
    },
    "onDrawerClose": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Function called whenever the navigation view has been closed."
    },
    "renderNavigationView": \{
      "type": \{
        "name": "func"
      },
      "required": true,
      "description": "The navigation view that will be rendered to the side of the screen and can be pulled in."
    },
    "statusBarBackgroundColor": \{
      "type": \{
        "name": "custom",
        "raw": "ColorPropType"
      },
      "required": false,
      "description": "Make the drawer take the entire screen and draw the background of the\\nstatus bar to allow it to open over the status bar. It will only have an\\neffect on API 21+."
    }
  },
  "composes": [
    "ViewPropTypes"
  ],
  "type": "component",
  "filepath": "Libraries/Components/DrawerAndroid/DrawerLayoutAndroid.android.js",
  "componentName": "DrawerLayoutAndroid",
  "componentPlatform": "android",
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
      <Layout metadata={{"id":"drawerlayoutandroid","title":"DrawerLayoutAndroid","layout":"autodocs","category":"Components","permalink":"docs/drawerlayoutandroid.html","platform":"android","next":"flatlist","previous":"datepickerios","sidebar":true,"path":"Libraries/Components/DrawerAndroid/DrawerLayoutAndroid.android.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;