/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "description": "React component that wraps the Android-only [\`Toolbar\` widget][0]. A Toolbar can display a logo,\\nnavigation icon (e.g. hamburger menu), a title & subtitle and a list of actions. The title and\\nsubtitle are expanded so the logo and navigation icons are displayed on the left, title and\\nsubtitle in the middle and the actions on the right.\\n\\nIf the toolbar has an only child, it will be displayed between the title and actions.\\n\\nAlthough the Toolbar supports remote images for the logo, navigation and action icons, this\\nshould only be used in DEV mode where \`require\('./some_icon.png')\` translates into a packager\\nURL. In release mode you should always use a drawable resource for these icons. Using\\n\`require\('./some_icon.png')\` will do this automatically for you, so as long as you don't\\nexplicitly use e.g. \`\{uri: 'http://...'}\`, you will be good.\\n\\nExample:\\n\\n\`\`\`\\nrender: function() \{\\n  return (\\n    <ToolbarAndroid\\n      logo=\{require\('./app_logo.png')}\\n      title=\\"AwesomeApp\\"\\n      actions=\{[\{title: 'Settings', icon: require\('./icon_settings.png'), show: 'always'}]}\\n      onActionSelected=\{this.onActionSelected} />\\n  )\\n},\\nonActionSelected: function(position) \{\\n  if (position === 0) \{ // index of 'Settings'\\n    showSettings();\\n  }\\n}\\n\`\`\`\\n\\n[0]: https://developer.android.com/reference/android/support/v7/widget/Toolbar.html",
  "displayName": "ToolbarAndroid",
  "methods": [],
  "props": \{
    "actions": \{
      "type": \{
        "name": "arrayOf",
        "value": \{
          "name": "shape",
          "value": \{
            "title": \{
              "name": "string",
              "required": true
            },
            "icon": \{
              "name": "custom",
              "raw": "optionalImageSource",
              "required": false
            },
            "show": \{
              "name": "enum",
              "value": [
                \{
                  "value": "'always'",
                  "computed": false
                },
                \{
                  "value": "'ifRoom'",
                  "computed": false
                },
                \{
                  "value": "'never'",
                  "computed": false
                }
              ],
              "required": false
            },
            "showWithText": \{
              "name": "bool",
              "required": false
            }
          }
        }
      },
      "required": false,
      "description": "Sets possible actions on the toolbar as part of the action menu. These are displayed as icons\\nor text on the right side of the widget. If they don't fit they are placed in an 'overflow'\\nmenu.\\n\\nThis property takes an array of objects, where each object has the following keys:\\n\\n* \`title\`: **required**, the title of this action\\n* \`icon\`: the icon for this action, e.g. \`require\('./some_icon.png')\`\\n* \`show\`: when to show this action as an icon or hide it in the overflow menu: \`always\`,\\n\`ifRoom\` or \`never\`\\n* \`showWithText\`: boolean, whether to show text alongside the icon or not"
    },
    "logo": \{
      "type": \{
        "name": "custom",
        "raw": "optionalImageSource"
      },
      "required": false,
      "description": "Sets the toolbar logo."
    },
    "navIcon": \{
      "type": \{
        "name": "custom",
        "raw": "optionalImageSource"
      },
      "required": false,
      "description": "Sets the navigation icon."
    },
    "onActionSelected": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Callback that is called when an action is selected. The only argument that is passed to the\\ncallback is the position of the action in the actions array."
    },
    "onIconClicked": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Callback called when the icon is selected."
    },
    "overflowIcon": \{
      "type": \{
        "name": "custom",
        "raw": "optionalImageSource"
      },
      "required": false,
      "description": "Sets the overflow icon."
    },
    "subtitle": \{
      "type": \{
        "name": "string"
      },
      "required": false,
      "description": "Sets the toolbar subtitle."
    },
    "subtitleColor": \{
      "type": \{
        "name": "custom",
        "raw": "ColorPropType"
      },
      "required": false,
      "description": "Sets the toolbar subtitle color."
    },
    "title": \{
      "type": \{
        "name": "string"
      },
      "required": false,
      "description": "Sets the toolbar title."
    },
    "titleColor": \{
      "type": \{
        "name": "custom",
        "raw": "ColorPropType"
      },
      "required": false,
      "description": "Sets the toolbar title color."
    },
    "contentInsetStart": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": "Sets the content inset for the toolbar starting edge.\\n\\nThe content inset affects the valid area for Toolbar content other than\\nthe navigation button and menu. Insets define the minimum margin for\\nthese components and can be used to effectively align Toolbar content\\nalong well-known gridlines."
    },
    "contentInsetEnd": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": "Sets the content inset for the toolbar ending edge.\\n\\nThe content inset affects the valid area for Toolbar content other than\\nthe navigation button and menu. Insets define the minimum margin for\\nthese components and can be used to effectively align Toolbar content\\nalong well-known gridlines."
    },
    "rtl": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "Used to set the toolbar direction to RTL.\\nIn addition to this property you need to add\\n\\n  android:supportsRtl=\\"true\\"\\n\\nto your application AndroidManifest.xml and then call\\n\`setLayoutDirection(LayoutDirection.RTL)\` in your MainActivity\\n\`onCreate\` method."
    },
    "testID": \{
      "type": \{
        "name": "string"
      },
      "required": false,
      "description": "Used to locate this view in end-to-end tests."
    }
  },
  "composes": [
    "ViewPropTypes"
  ],
  "type": "component",
  "filepath": "Libraries/Components/ToolbarAndroid/ToolbarAndroid.android.js",
  "componentName": "ToolbarAndroid",
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
      <Layout metadata={{"id":"toolbarandroid","title":"ToolbarAndroid","layout":"autodocs","category":"Components","permalink":"docs/toolbarandroid.html","platform":"android","next":"toolbarandroid","previous":"text","sidebar":true,"path":"Libraries/Components/ToolbarAndroid/ToolbarAndroid.android.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;