/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "description": "\`WebView\` renders web content in a native view.\\n\\n\`\`\`\\nimport React, \{ Component } from 'react';\\nimport \{ WebView } from 'react-native';\\n\\nclass MyWeb extends Component \{\\n  render() \{\\n    return (\\n      <WebView\\n        source=\{\{uri: 'https://github.com/facebook/react-native'}}\\n        style=\{\{marginTop: 20}}\\n      />\\n    );\\n  }\\n}\\n\`\`\`\\n\\nYou can use this component to navigate back and forth in the web view's\\nhistory and configure various properties for the web content.",
  "methods": [],
  "props": \{
    "html": \{
      "type": \{
        "name": "string"
      },
      "required": false,
      "description": "",
      "deprecationMessage": "Use the \`source\` prop instead."
    },
    "url": \{
      "type": \{
        "name": "string"
      },
      "required": false,
      "description": "",
      "deprecationMessage": "Use the \`source\` prop instead."
    },
    "source": \{
      "type": \{
        "name": "union",
        "value": [
          \{
            "name": "shape",
            "value": \{
              "uri": \{
                "name": "string",
                "required": false
              },
              "method": \{
                "name": "string",
                "required": false
              },
              "headers": \{
                "name": "object",
                "required": false
              },
              "body": \{
                "name": "string",
                "required": false
              }
            }
          },
          \{
            "name": "shape",
            "value": \{
              "html": \{
                "name": "string",
                "required": false
              },
              "baseUrl": \{
                "name": "string",
                "required": false
              }
            }
          },
          \{
            "name": "number"
          }
        ]
      },
      "required": false,
      "description": "Loads static html or a uri (with optional headers) in the WebView."
    },
    "renderError": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Function that returns a view to show if there's an error."
    },
    "renderLoading": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Function that returns a loading indicator."
    },
    "onLoad": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Function that is invoked when the \`WebView\` has finished loading."
    },
    "onLoadEnd": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Function that is invoked when the \`WebView\` load succeeds or fails."
    },
    "onLoadStart": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Function that is invoked when the \`WebView\` starts loading."
    },
    "onError": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Function that is invoked when the \`WebView\` load fails."
    },
    "bounces": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "Boolean value that determines whether the web view bounces\\nwhen it reaches the edge of the content. The default value is \`true\`.\\n@platform ios"
    },
    "decelerationRate": \{
      "type": \{
        "name": "custom",
        "raw": "ScrollView.propTypes.decelerationRate"
      },
      "required": false,
      "description": "A floating-point number that determines how quickly the scroll view\\ndecelerates after the user lifts their finger. You may also use the\\nstring shortcuts \`\\"normal\\"\` and \`\\"fast\\"\` which match the underlying iOS\\nsettings for \`UIScrollViewDecelerationRateNormal\` and\\n\`UIScrollViewDecelerationRateFast\` respectively:\\n\\n  - normal: 0.998\\n  - fast: 0.99 (the default for iOS web view)\\n@platform ios"
    },
    "scrollEnabled": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "Boolean value that determines whether scrolling is enabled in the\\n\`WebView\`. The default value is \`true\`.\\n@platform ios"
    },
    "automaticallyAdjustContentInsets": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "Controls whether to adjust the content inset for web views that are\\nplaced behind a navigation bar, tab bar, or toolbar. The default value\\nis \`true\`."
    },
    "contentInset": \{
      "type": \{
        "name": "custom",
        "raw": "EdgeInsetsPropType"
      },
      "required": false,
      "description": "The amount by which the web view content is inset from the edges of\\nthe scroll view. Defaults to \{top: 0, left: 0, bottom: 0, right: 0}."
    },
    "onNavigationStateChange": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Function that is invoked when the \`WebView\` loading starts or ends."
    },
    "onMessage": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "A function that is invoked when the webview calls \`window.postMessage\`.\\nSetting this property will inject a \`postMessage\` global into your\\nwebview, but will still call pre-existing values of \`postMessage\`.\\n\\n\`window.postMessage\` accepts one argument, \`data\`, which will be\\navailable on the event object, \`event.nativeEvent.data\`. \`data\`\\nmust be a string."
    },
    "startInLoadingState": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "Boolean value that forces the \`WebView\` to show the loading view\\non the first load."
    },
    "style": \{
      "type": \{
        "name": "custom",
        "raw": "ViewPropTypes.style"
      },
      "required": false,
      "description": "The style to apply to the \`WebView\`."
    },
    "dataDetectorTypes": \{
      "type": \{
        "name": "union",
        "value": [
          \{
            "name": "enum",
            "value": [
              \{
                "value": "'phoneNumber'",
                "computed": false
              },
              \{
                "value": "'link'",
                "computed": false
              },
              \{
                "value": "'address'",
                "computed": false
              },
              \{
                "value": "'calendarEvent'",
                "computed": false
              },
              \{
                "value": "'none'",
                "computed": false
              },
              \{
                "value": "'all'",
                "computed": false
              }
            ]
          },
          \{
            "name": "arrayOf",
            "value": \{
              "name": "enum",
              "value": [
                \{
                  "value": "'phoneNumber'",
                  "computed": false
                },
                \{
                  "value": "'link'",
                  "computed": false
                },
                \{
                  "value": "'address'",
                  "computed": false
                },
                \{
                  "value": "'calendarEvent'",
                  "computed": false
                },
                \{
                  "value": "'none'",
                  "computed": false
                },
                \{
                  "value": "'all'",
                  "computed": false
                }
              ]
            }
          }
        ]
      },
      "required": false,
      "description": "Determines the types of data converted to clickable URLs in the web view’s content.\\nBy default only phone numbers are detected.\\n\\nYou can provide one type or an array of many types.\\n\\nPossible values for \`dataDetectorTypes\` are:\\n\\n- \`'phoneNumber'\`\\n- \`'link'\`\\n- \`'address'\`\\n- \`'calendarEvent'\`\\n- \`'none'\`\\n- \`'all'\`\\n\\n@platform ios"
    },
    "javaScriptEnabled": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "Boolean value to enable JavaScript in the \`WebView\`. Used on Android only\\nas JavaScript is enabled by default on iOS. The default value is \`true\`.\\n@platform android"
    },
    "thirdPartyCookiesEnabled": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "Boolean value to enable third party cookies in the \`WebView\`. Used on\\nAndroid Lollipop and above only as third party cookies are enabled by\\ndefault on Android Kitkat and below and on iOS. The default value is \`true\`.\\n@platform android"
    },
    "domStorageEnabled": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "Boolean value to control whether DOM Storage is enabled. Used only in\\nAndroid.\\n@platform android"
    },
    "injectedJavaScript": \{
      "type": \{
        "name": "string"
      },
      "required": false,
      "description": "Set this to provide JavaScript that will be injected into the web page\\nwhen the view loads."
    },
    "userAgent": \{
      "type": \{
        "name": "string"
      },
      "required": false,
      "description": "Sets the user-agent for the \`WebView\`.\\n@platform android"
    },
    "scalesPageToFit": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "Boolean that controls whether the web content is scaled to fit\\nthe view and enables the user to change the scale. The default value\\nis \`true\`.",
      "defaultValue": \{
        "value": "true",
        "computed": false
      }
    },
    "onShouldStartLoadWithRequest": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Function that allows custom handling of any web view requests. Return\\n\`true\` from the function to continue loading the request and \`false\`\\nto stop loading.\\n@platform ios"
    },
    "allowsInlineMediaPlayback": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "Boolean that determines whether HTML5 videos play inline or use the\\nnative full-screen controller. The default value is \`false\`.\\n\\n**NOTE** : In order for video to play inline, not only does this\\nproperty need to be set to \`true\`, but the video element in the HTML\\ndocument must also include the \`webkit-playsinline\` attribute.\\n@platform ios"
    },
    "mediaPlaybackRequiresUserAction": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "Boolean that determines whether HTML5 audio and video requires the user\\nto tap them before they start playing. The default value is \`true\`."
    },
    "injectJavaScript": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Function that accepts a string that will be passed to the WebView and\\nexecuted immediately as JavaScript."
    },
    "mixedContentMode": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "'never'",
            "computed": false
          },
          \{
            "value": "'always'",
            "computed": false
          },
          \{
            "value": "'compatibility'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "Specifies the mixed content mode. i.e WebView will allow a secure origin to load content from any other origin.\\n\\nPossible values for \`mixedContentMode\` are:\\n\\n- \`'never'\` (default) - WebView will not allow a secure origin to load content from an insecure origin.\\n- \`'always'\` - WebView will allow a secure origin to load content from any other origin, even if that origin is insecure.\\n- \`'compatibility'\` -  WebView will attempt to be compatible with the approach of a modern web browser with regard to mixed content.\\n@platform android"
    }
  },
  "composes": [
    "ViewPropTypes"
  ],
  "type": "component",
  "filepath": "Libraries/Components/WebView/WebView.ios.js",
  "componentName": "WebView",
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
      <Layout metadata={{"id":"webview","title":"WebView","layout":"autodocs","category":"Components","permalink":"docs/webview.html","platform":"cross","next":"accessibilityinfo","previous":"virtualizedlist","sidebar":true,"path":"Libraries/Components/WebView/WebView.ios.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;