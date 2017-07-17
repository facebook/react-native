/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "description": "A React component for displaying different types of images,\\nincluding network images, static resources, temporary local images, and\\nimages from local disk, such as the camera roll.\\n\\nThis example shows fetching and displaying an image from local storage\\nas well as one from network and even from data provided in the \`'data:'\` uri scheme.\\n\\n> Note that for network and data images, you will need to manually specify the dimensions of your image!\\n\\n\`\`\`ReactNativeWebPlayer\\nimport React, \{ Component } from 'react';\\nimport \{ AppRegistry, View, Image } from 'react-native';\\n\\nexport default class DisplayAnImage extends Component \{\\n  render() \{\\n    return (\\n      <View>\\n        <Image\\n          source=\{require\('./img/favicon.png')}\\n        />\\n        <Image\\n          style=\{\{width: 50, height: 50}}\\n          source=\{\{uri: 'https://facebook.github.io/react/img/logo_og.png'}}\\n        />\\n        <Image\\n          style=\{\{width: 66, height: 58}}\\n          source=\{\{uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAzCAYAAAA6oTAqAAAAEXRFWHRTb2Z0d2FyZQBwbmdjcnVzaEB1SfMAAABQSURBVGje7dSxCQBACARB+2/ab8BEeQNhFi6WSYzYLYudDQYGBgYGBgYGBgYGBgYGBgZmcvDqYGBgmhivGQYGBgYGBgYGBgYGBgYGBgbmQw+P/eMrC5UTVAAAAABJRU5ErkJggg=='}}\\n        />\\n      </View>\\n    );\\n  }\\n}\\n\\n// skip this line if using Create React Native App\\nAppRegistry.registerComponent('DisplayAnImage', () => DisplayAnImage);\\n\`\`\`\\n\\nYou can also add \`style\` to an image:\\n\\n\`\`\`ReactNativeWebPlayer\\nimport React, \{ Component } from 'react';\\nimport \{ AppRegistry, View, Image, StyleSheet } from 'react-native';\\n\\nconst styles = StyleSheet.create(\{\\n  stretch: \{\\n    width: 50,\\n    height: 200\\n  }\\n});\\n\\nexport default class DisplayAnImageWithStyle extends Component \{\\n  render() \{\\n    return (\\n      <View>\\n        <Image\\n          style=\{styles.stretch}\\n          source=\{require\('./img/favicon.png')}\\n        />\\n      </View>\\n    );\\n  }\\n}\\n\\n// skip these lines if using Create React Native App\\nAppRegistry.registerComponent(\\n  'DisplayAnImageWithStyle',\\n  () => DisplayAnImageWithStyle\\n);\\n\`\`\`\\n\\n### GIF and WebP support on Android\\n\\nWhen building your own native code, GIF and WebP are not supported by default on Android.\\n\\nYou will need to add some optional modules in \`android/app/build.gradle\`, depending on the needs of your app.\\n\\n\`\`\`\\ndependencies \{\\n  // If your app supports Android versions before Ice Cream Sandwich (API level 14)\\n  compile 'com.facebook.fresco:animated-base-support:1.3.0'\\n\\n  // For animated GIF support\\n  compile 'com.facebook.fresco:animated-gif:1.3.0'\\n\\n  // For WebP support, including animated WebP\\n  compile 'com.facebook.fresco:animated-webp:1.3.0'\\n  compile 'com.facebook.fresco:webpsupport:1.3.0'\\n\\n  // For WebP support, without animations\\n  compile 'com.facebook.fresco:webpsupport:1.3.0'\\n}\\n\`\`\`\\n\\nAlso, if you use GIF with ProGuard, you will need to add this rule in \`proguard-rules.pro\` :\\n\`\`\`\\n-keep class com.facebook.imagepipeline.animated.factory.AnimatedFactoryImpl \{\\n  public AnimatedFactoryImpl(com.facebook.imagepipeline.bitmaps.PlatformBitmapFactory, com.facebook.imagepipeline.core.ExecutorSupplier);\\n}\\n\`\`\`",
  "displayName": "Image",
  "methods": [
    \{
      "name": "getSize",
      "docblock": "Retrieve the width and height (in pixels) of an image prior to displaying it.\\nThis method can fail if the image cannot be found, or fails to download.\\n\\nIn order to retrieve the image dimensions, the image may first need to be\\nloaded or downloaded, after which it will be cached. This means that in\\nprinciple you could use this method to preload images, however it is not\\noptimized for that purpose, and may in future be implemented in a way that\\ndoes not fully load/download the image data. A proper, supported way to\\npreload images will be provided as a separate API.\\n\\nDoes not work for static image resources.\\n\\n@param uri The location of the image.\\n@param success The function that will be called if the image was successfully found and width\\nand height retrieved.\\n@param failure The function that will be called if there was an error, such as failing to\\nto retrieve the image.\\n\\n@returns void\\n\\n@platform ios",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "name": "uri",
          "description": "The location of the image.",
          "type": \{
            "names": [
              "string"
            ]
          }
        },
        \{
          "name": "success",
          "description": "The function that will be called if the image was successfully found and width\\nand height retrieved.",
          "type": \{
            "names": [
              "function"
            ]
          }
        },
        \{
          "name": "failure",
          "description": "The function that will be called if there was an error, such as failing to\\nto retrieve the image.",
          "type": \{
            "names": [
              "function"
            ]
          },
          "optional": true
        }
      ],
      "returns": \{
        "description": "void",
        "type": [
          null
        ]
      },
      "description": "Retrieve the width and height (in pixels) of an image prior to displaying it.\\nThis method can fail if the image cannot be found, or fails to download.\\n\\nIn order to retrieve the image dimensions, the image may first need to be\\nloaded or downloaded, after which it will be cached. This means that in\\nprinciple you could use this method to preload images, however it is not\\noptimized for that purpose, and may in future be implemented in a way that\\ndoes not fully load/download the image data. A proper, supported way to\\npreload images will be provided as a separate API.\\n\\nDoes not work for static image resources."
    },
    \{
      "name": "prefetch",
      "docblock": "Prefetches a remote image for later use by downloading it to the disk\\ncache\\n\\n@param url The remote location of the image.\\n\\n@return The prefetched image.",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "name": "url",
          "description": "The remote location of the image.",
          "type": \{
            "names": [
              "string"
            ]
          }
        }
      ],
      "returns": \{
        "description": "The prefetched image.",
        "type": [
          null
        ]
      },
      "description": "Prefetches a remote image for later use by downloading it to the disk\\ncache"
    }
  ],
  "props": \{
    "style": \{
      "type": \{
        "name": "stylesheet",
        "value": "ImageStylePropTypes"
      },
      "required": false,
      "description": "> \`ImageResizeMode\` is an \`Enum\` for different image resizing modes, set via the\\n> \`resizeMode\` style property on \`Image\` components. The values are \`contain\`, \`cover\`,\\n> \`stretch\`, \`center\`, \`repeat\`."
    },
    "source": \{
      "type": \{
        "name": "custom",
        "raw": "ImageSourcePropType"
      },
      "required": false,
      "description": "The image source (either a remote URL or a local file resource).\\n\\nThis prop can also contain several remote URLs, specified together with\\ntheir width and height and potentially with scale/other URI arguments.\\nThe native side will then choose the best \`uri\` to display based on the\\nmeasured size of the image container. A \`cache\` property can be added to\\ncontrol how networked request interacts with the local cache.\\n\\nThe currently supported formats are \`png\`, \`jpg\`, \`jpeg\`, \`bmp\`, \`gif\`,\\n\`webp\` (Android only), \`psd\` (iOS only)."
    },
    "defaultSource": \{
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
              "width": \{
                "name": "number",
                "required": false
              },
              "height": \{
                "name": "number",
                "required": false
              },
              "scale": \{
                "name": "number",
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
      "description": "A static image to display while loading the image source.\\n\\n- \`uri\` - a string representing the resource identifier for the image, which\\nshould be either a local file path or the name of a static image resource\\n(which should be wrapped in the \`require\('./path/to/image.png')\` function).\\n- \`width\`, \`height\` - can be specified if known at build time, in which case\\nthese will be used to set the default \`<Image/>\` component dimensions.\\n- \`scale\` - used to indicate the scale factor of the image. Defaults to 1.0 if\\nunspecified, meaning that one image pixel equates to one display point / DIP.\\n- \`number\` - Opaque type returned by something like \`require\('./image.jpg')\`.\\n\\n@platform ios"
    },
    "accessible": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "When true, indicates the image is an accessibility element.\\n@platform ios"
    },
    "accessibilityLabel": \{
      "type": \{
        "name": "node"
      },
      "required": false,
      "description": "The text that's read by the screen reader when the user interacts with\\nthe image.\\n@platform ios"
    },
    "blurRadius": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": "blurRadius: the blur radius of the blur filter added to the image"
    },
    "capInsets": \{
      "type": \{
        "name": "custom",
        "raw": "EdgeInsetsPropType"
      },
      "required": false,
      "description": "When the image is resized, the corners of the size specified\\nby \`capInsets\` will stay a fixed size, but the center content and borders\\nof the image will be stretched.  This is useful for creating resizable\\nrounded buttons, shadows, and other resizable assets.  More info in the\\n[official Apple documentation](https://developer.apple.com/library/ios/documentation/UIKit/Reference/UIImage_Class/index.html#//apple_ref/occ/instm/UIImage/resizableImageWithCapInsets).\\n\\n@platform ios"
    },
    "resizeMethod": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "'auto'",
            "computed": false
          },
          \{
            "value": "'resize'",
            "computed": false
          },
          \{
            "value": "'scale'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "The mechanism that should be used to resize the image when the image's dimensions\\ndiffer from the image view's dimensions. Defaults to \`auto\`.\\n\\n- \`auto\`: Use heuristics to pick between \`resize\` and \`scale\`.\\n\\n- \`resize\`: A software operation which changes the encoded image in memory before it\\ngets decoded. This should be used instead of \`scale\` when the image is much larger\\nthan the view.\\n\\n- \`scale\`: The image gets drawn downscaled or upscaled. Compared to \`resize\`, \`scale\` is\\nfaster (usually hardware accelerated) and produces higher quality images. This\\nshould be used if the image is smaller than the view. It should also be used if the\\nimage is slightly bigger than the view.\\n\\nMore details about \`resize\` and \`scale\` can be found at http://frescolib.org/docs/resizing-rotating.html.\\n\\n@platform android"
    },
    "resizeMode": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "'cover'",
            "computed": false
          },
          \{
            "value": "'contain'",
            "computed": false
          },
          \{
            "value": "'stretch'",
            "computed": false
          },
          \{
            "value": "'repeat'",
            "computed": false
          },
          \{
            "value": "'center'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "Determines how to resize the image when the frame doesn't match the raw\\nimage dimensions.\\n\\n- \`cover\`: Scale the image uniformly (maintain the image's aspect ratio)\\nso that both dimensions (width and height) of the image will be equal\\nto or larger than the corresponding dimension of the view (minus padding).\\n\\n- \`contain\`: Scale the image uniformly (maintain the image's aspect ratio)\\nso that both dimensions (width and height) of the image will be equal to\\nor less than the corresponding dimension of the view (minus padding).\\n\\n- \`stretch\`: Scale width and height independently, This may change the\\naspect ratio of the src.\\n\\n- \`repeat\`: Repeat the image to cover the frame of the view. The\\nimage will keep it's size and aspect ratio. (iOS only)"
    },
    "testID": \{
      "type": \{
        "name": "string"
      },
      "required": false,
      "description": "A unique identifier for this element to be used in UI Automation\\ntesting scripts."
    },
    "onLayout": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Invoked on mount and layout changes with\\n\`\{nativeEvent: \{layout: \{x, y, width, height}}}\`."
    },
    "onLoadStart": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Invoked on load start.\\n\\ne.g., \`onLoadStart=\{(e) => this.setState(\{loading: true})}\`"
    },
    "onProgress": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Invoked on download progress with \`\{nativeEvent: \{loaded, total}}\`.\\n@platform ios"
    },
    "onError": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Invoked on load error with \`\{nativeEvent: \{error}}\`."
    },
    "onPartialLoad": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Invoked when a partial load of the image is complete. The definition of\\nwhat constitutes a \\"partial load\\" is loader specific though this is meant\\nfor progressive JPEG loads.\\n@platform ios"
    },
    "onLoad": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Invoked when load completes successfully."
    },
    "onLoadEnd": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Invoked when load either succeeds or fails."
    }
  },
  "type": "component",
  "filepath": "Libraries/Image/Image.ios.js",
  "componentName": "Image",
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
      <Layout metadata={{"id":"image","title":"Image","layout":"autodocs","category":"Components","permalink":"docs/image.html","platform":"cross","next":"keyboardavoidingview","previous":"flatlist","sidebar":true,"path":"Libraries/Image/Image.ios.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;