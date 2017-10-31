/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "description": "\`NavigatorIOS\` is a wrapper around\\n[\`UINavigationController\`](https://developer.apple.com/library/ios/documentation/UIKit/Reference/UINavigationController_Class/),\\nenabling you to implement a navigation stack. It works exactly the same as it\\nwould on a native app using \`UINavigationController\`, providing the same\\nanimations and behavior from UIKIt.\\n\\nAs the name implies, it is only available on iOS. Take a look at\\n[\`React Navigation\`](https://reactnavigation.org/) for a cross-platform\\nsolution in JavaScript, or check out either of these components for native\\nsolutions: [native-navigation](http://airbnb.io/native-navigation/),\\n[react-native-navigation](https://github.com/wix/react-native-navigation).\\n\\nTo set up the navigator, provide the \`initialRoute\` prop with a route\\nobject. A route object is used to describe each scene that your app\\nnavigates to. \`initialRoute\` represents the first route in your navigator.\\n\\n\`\`\`\\nimport React, \{ Component, PropTypes } from 'react';\\nimport \{ NavigatorIOS, Text } from 'react-native';\\n\\nexport default class NavigatorIOSApp extends Component \{\\n  render() \{\\n    return (\\n      <NavigatorIOS\\n        initialRoute=\{\{\\n          component: MyScene,\\n          title: 'My Initial Scene',\\n        }}\\n        style=\{\{flex: 1}}\\n      />\\n    );\\n  }\\n}\\n\\nclass MyScene extends Component \{\\n  static propTypes = \{\\n    title: PropTypes.string.isRequired,\\n    navigator: PropTypes.object.isRequired,\\n  }\\n\\n  _onForward = () => \{\\n    this.props.navigator.push(\{\\n      title: 'Scene ' + nextIndex,\\n    });\\n  }\\n\\n  render() \{\\n    return (\\n      <View>\\n        <Text>Current Scene: \{ this.props.title }</Text>\\n        <TouchableHighlight onPress=\{this._onForward}>\\n          <Text>Tap me to load the next scene</Text>\\n        </TouchableHighlight>\\n      </View>\\n    )\\n  }\\n}\\n\`\`\`\\n\\nIn this code, the navigator renders the component specified in initialRoute,\\nwhich in this case is \`MyScene\`. This component will receive a \`route\` prop\\nand a \`navigator\` prop representing the navigator. The navigator's navigation\\nbar will render the title for the current scene, \\"My Initial Scene\\".\\n\\nYou can optionally pass in a \`passProps\` property to your \`initialRoute\`.\\n\`NavigatorIOS\` passes this in as props to the rendered component:\\n\\n\`\`\`\\ninitialRoute=\{\{\\n  component: MyScene,\\n  title: 'My Initial Scene',\\n  passProps: \{ myProp: 'foo' }\\n}}\\n\`\`\`\\n\\nYou can then access the props passed in via \`\{this.props.myProp}\`.\\n\\n#### Handling Navigation\\n\\nTo trigger navigation functionality such as pushing or popping a view, you\\nhave access to a \`navigator\` object. The object is passed in as a prop to any\\ncomponent that is rendered by \`NavigatorIOS\`. You can then call the\\nrelevant methods to perform the navigation action you need:\\n\\n\`\`\`\\nclass MyView extends Component \{\\n  _handleBackPress() \{\\n    this.props.navigator.pop();\\n  }\\n\\n  _handleNextPress(nextRoute) \{\\n    this.props.navigator.push(nextRoute);\\n  }\\n\\n  render() \{\\n    const nextRoute = \{\\n      component: MyView,\\n      title: 'Bar That',\\n      passProps: \{ myProp: 'bar' }\\n    };\\n    return(\\n      <TouchableHighlight onPress=\{() => this._handleNextPress(nextRoute)}>\\n        <Text style=\{\{marginTop: 200, alignSelf: 'center'}}>\\n          See you on the other nav \{this.props.myProp}!\\n        </Text>\\n      </TouchableHighlight>\\n    );\\n  }\\n}\\n\`\`\`\\n\\nYou can also trigger navigator functionality from the \`NavigatorIOS\`\\ncomponent:\\n\\n\`\`\`\\nclass NavvyIOS extends Component \{\\n  _handleNavigationRequest() \{\\n    this.refs.nav.push(\{\\n      component: MyView,\\n      title: 'Genius',\\n      passProps: \{ myProp: 'genius' },\\n    });\\n  }\\n\\n  render() \{\\n    return (\\n      <NavigatorIOS\\n        ref='nav'\\n        initialRoute=\{\{\\n          component: MyView,\\n          title: 'Foo This',\\n          passProps: \{ myProp: 'foo' },\\n          rightButtonTitle: 'Add',\\n          onRightButtonPress: () => this._handleNavigationRequest(),\\n        }}\\n        style=\{\{flex: 1}}\\n      />\\n    );\\n  }\\n}\\n\`\`\`\\n\\nThe code above adds a \`_handleNavigationRequest\` private method that is\\ninvoked from the \`NavigatorIOS\` component when the right navigation bar item\\nis pressed. To get access to the navigator functionality, a reference to it\\nis saved in the \`ref\` prop and later referenced to push a new scene into the\\nnavigation stack.\\n\\n#### Navigation Bar Configuration\\n\\nProps passed to \`NavigatorIOS\` will set the default configuration\\nfor the navigation bar. Props passed as properties to a route object will set\\nthe configuration for that route's navigation bar, overriding any props\\npassed to the \`NavigatorIOS\` component.\\n\\n\`\`\`\\n_handleNavigationRequest() \{\\n  this.refs.nav.push(\{\\n    //...\\n    passProps: \{ myProp: 'genius' },\\n    barTintColor: '#996699',\\n  });\\n}\\n\\nrender() \{\\n  return (\\n    <NavigatorIOS\\n      //...\\n      style=\{\{flex: 1}}\\n      barTintColor='#ffffcc'\\n    />\\n  );\\n}\\n\`\`\`\\n\\nIn the example above the navigation bar color is changed when the new route\\nis pushed.",
  "displayName": "NavigatorIOS",
  "methods": [
    \{
      "name": "push",
      "docblock": "Navigate forward to a new route.\\n@param route The new route to navigate to.",
      "modifiers": [],
      "params": [
        \{
          "name": "route",
          "description": "The new route to navigate to.",
          "type": \{
            "names": [
              "object"
            ]
          }
        }
      ],
      "returns": null,
      "description": "Navigate forward to a new route."
    },
    \{
      "name": "popN",
      "docblock": "Go back N scenes at once. When N=1, behavior matches \`pop()\`.\\n@param n The number of scenes to pop.",
      "modifiers": [],
      "params": [
        \{
          "name": "n",
          "description": "The number of scenes to pop.",
          "type": \{
            "names": [
              "number"
            ]
          }
        }
      ],
      "returns": null,
      "description": "Go back N scenes at once. When N=1, behavior matches \`pop()\`."
    },
    \{
      "name": "pop",
      "docblock": "Pop back to the previous scene.",
      "modifiers": [],
      "params": [],
      "returns": null,
      "description": "Pop back to the previous scene."
    },
    \{
      "name": "replaceAtIndex",
      "docblock": "Replace a route in the navigation stack.\\n\\n@param route The new route that will replace the specified one.\\n@param index The route into the stack that should be replaced.\\n   If it is negative, it counts from the back of the stack.",
      "modifiers": [],
      "params": [
        \{
          "name": "route",
          "description": "The new route that will replace the specified one.",
          "type": \{
            "names": [
              "object"
            ]
          }
        },
        \{
          "name": "index",
          "description": "The route into the stack that should be replaced.\\n   If it is negative, it counts from the back of the stack.",
          "type": \{
            "names": [
              "number"
            ]
          }
        }
      ],
      "returns": null,
      "description": "Replace a route in the navigation stack."
    },
    \{
      "name": "replace",
      "docblock": "Replace the route for the current scene and immediately\\nload the view for the new route.\\n@param route The new route to navigate to.",
      "modifiers": [],
      "params": [
        \{
          "name": "route",
          "description": "The new route to navigate to.",
          "type": \{
            "names": [
              "object"
            ]
          }
        }
      ],
      "returns": null,
      "description": "Replace the route for the current scene and immediately\\nload the view for the new route."
    },
    \{
      "name": "replacePrevious",
      "docblock": "Replace the route/view for the previous scene.\\n@param route The new route to will replace the previous scene.",
      "modifiers": [],
      "params": [
        \{
          "name": "route",
          "description": "The new route to will replace the previous scene.",
          "type": \{
            "names": [
              "object"
            ]
          }
        }
      ],
      "returns": null,
      "description": "Replace the route/view for the previous scene."
    },
    \{
      "name": "popToTop",
      "docblock": "Go back to the topmost item in the navigation stack.",
      "modifiers": [],
      "params": [],
      "returns": null,
      "description": "Go back to the topmost item in the navigation stack."
    },
    \{
      "name": "popToRoute",
      "docblock": "Go back to the item for a particular route object.\\n@param route The new route to navigate to.",
      "modifiers": [],
      "params": [
        \{
          "name": "route",
          "description": "The new route to navigate to.",
          "type": \{
            "names": [
              "object"
            ]
          }
        }
      ],
      "returns": null,
      "description": "Go back to the item for a particular route object."
    },
    \{
      "name": "replacePreviousAndPop",
      "docblock": "Replaces the previous route/view and transitions back to it.\\n@param route The new route that replaces the previous scene.",
      "modifiers": [],
      "params": [
        \{
          "name": "route",
          "description": "The new route that replaces the previous scene.",
          "type": \{
            "names": [
              "object"
            ]
          }
        }
      ],
      "returns": null,
      "description": "Replaces the previous route/view and transitions back to it."
    },
    \{
      "name": "resetTo",
      "docblock": "Replaces the top item and pop to it.\\n@param route The new route that will replace the topmost item.",
      "modifiers": [],
      "params": [
        \{
          "name": "route",
          "description": "The new route that will replace the topmost item.",
          "type": \{
            "names": [
              "object"
            ]
          }
        }
      ],
      "returns": null,
      "description": "Replaces the top item and pop to it."
    }
  ],
  "props": \{
    "initialRoute": \{
      "type": \{
        "name": "shape",
        "value": \{
          "component": \{
            "name": "func",
            "description": "The React Class to render for this route",
            "required": true
          },
          "title": \{
            "name": "string",
            "description": "The title displayed in the navigation bar and the back button for this\\nroute.",
            "required": true
          },
          "titleImage": \{
            "name": "custom",
            "raw": "Image.propTypes.source",
            "description": "If set, a title image will appear instead of the text title.",
            "required": false
          },
          "passProps": \{
            "name": "object",
            "description": "Use this to specify additional props to pass to the rendered\\ncomponent. \`NavigatorIOS\` will automatically pass in \`route\` and\\n\`navigator\` props to the comoponent.",
            "required": false
          },
          "backButtonIcon": \{
            "name": "custom",
            "raw": "Image.propTypes.source",
            "description": "If set, the left navigation button image will be displayed using this\\nsource. Note that this doesn't apply to the header of the current\\nview, but to those views that are subsequently pushed.",
            "required": false
          },
          "backButtonTitle": \{
            "name": "string",
            "description": "If set, the left navigation button text will be set to this. Note that\\nthis doesn't apply to the left button of the current view, but to\\nthose views that are subsequently pushed",
            "required": false
          },
          "leftButtonIcon": \{
            "name": "custom",
            "raw": "Image.propTypes.source",
            "description": "If set, the left navigation button image will be displayed using\\nthis source.",
            "required": false
          },
          "leftButtonTitle": \{
            "name": "string",
            "description": "If set, the left navigation button will display this text.",
            "required": false
          },
          "leftButtonSystemIcon": \{
            "name": "enum",
            "computed": true,
            "value": "Object.keys(SystemIcons)",
            "description": "If set, the left header button will appear with this system icon\\n\\nSupported icons are \`done\`, \`cancel\`, \`edit\`, \`save\`, \`add\`,\\n\`compose\`, \`reply\`, \`action\`, \`organize\`, \`bookmarks\`, \`search\`,\\n\`refresh\`, \`stop\`, \`camera\`, \`trash\`, \`play\`, \`pause\`, \`rewind\`,\\n\`fast-forward\`, \`undo\`, \`redo\`, and \`page-curl\`",
            "required": false
          },
          "onLeftButtonPress": \{
            "name": "func",
            "description": "This function will be invoked when the left navigation bar item is\\npressed.",
            "required": false
          },
          "rightButtonIcon": \{
            "name": "custom",
            "raw": "Image.propTypes.source",
            "description": "If set, the right navigation button image will be displayed using\\nthis source.",
            "required": false
          },
          "rightButtonTitle": \{
            "name": "string",
            "description": "If set, the right navigation button will display this text.",
            "required": false
          },
          "rightButtonSystemIcon": \{
            "name": "enum",
            "computed": true,
            "value": "Object.keys(SystemIcons)",
            "description": "If set, the right header button will appear with this system icon\\n\\nSee leftButtonSystemIcon for supported icons",
            "required": false
          },
          "onRightButtonPress": \{
            "name": "func",
            "description": "This function will be invoked when the right navigation bar item is\\npressed.",
            "required": false
          },
          "wrapperStyle": \{
            "name": "custom",
            "raw": "ViewPropTypes.style",
            "description": "Styles for the navigation item containing the component.",
            "required": false
          },
          "navigationBarHidden": \{
            "name": "bool",
            "description": "Boolean value that indicates whether the navigation bar is hidden.",
            "required": false
          },
          "shadowHidden": \{
            "name": "bool",
            "description": "Boolean value that indicates whether to hide the 1px hairline\\nshadow.",
            "required": false
          },
          "tintColor": \{
            "name": "string",
            "description": "The color used for the buttons in the navigation bar.",
            "required": false
          },
          "barTintColor": \{
            "name": "string",
            "description": "The background color of the navigation bar.",
            "required": false
          },
          "titleTextColor": \{
            "name": "string",
            "description": "The text color of the navigation bar title.",
            "required": false
          },
          "translucent": \{
            "name": "bool",
            "description": "Boolean value that indicates whether the navigation bar is\\ntranslucent.",
            "required": false
          }
        }
      },
      "required": true,
      "description": "NavigatorIOS uses \`route\` objects to identify child views, their props,\\nand navigation bar configuration. Navigation operations such as push\\noperations expect routes to look like this the \`initialRoute\`."
    },
    "navigationBarHidden": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "Boolean value that indicates whether the navigation bar is hidden\\nby default."
    },
    "shadowHidden": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "Boolean value that indicates whether to hide the 1px hairline shadow\\nby default."
    },
    "itemWrapperStyle": \{
      "type": \{
        "name": "custom",
        "raw": "ViewPropTypes.style"
      },
      "required": false,
      "description": "The default wrapper style for components in the navigator.\\nA common use case is to set the \`backgroundColor\` for every scene."
    },
    "tintColor": \{
      "type": \{
        "name": "string"
      },
      "required": false,
      "description": "The default color used for the buttons in the navigation bar."
    },
    "barTintColor": \{
      "type": \{
        "name": "string"
      },
      "required": false,
      "description": "The default background color of the navigation bar."
    },
    "titleTextColor": \{
      "type": \{
        "name": "string"
      },
      "required": false,
      "description": "The default text color of the navigation bar title."
    },
    "translucent": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "Boolean value that indicates whether the navigation bar is\\ntranslucent by default",
      "defaultValue": \{
        "value": "true",
        "computed": false
      }
    },
    "interactivePopGestureEnabled": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "Boolean value that indicates whether the interactive pop gesture is\\nenabled. This is useful for enabling/disabling the back swipe navigation\\ngesture.\\n\\nIf this prop is not provided, the default behavior is for the back swipe\\ngesture to be enabled when the navigation bar is shown and disabled when\\nthe navigation bar is hidden. Once you've provided the\\n\`interactivePopGestureEnabled\` prop, you can never restore the default\\nbehavior."
    }
  },
  "type": "component",
  "filepath": "Libraries/Components/Navigation/NavigatorIOS.ios.js",
  "componentName": "NavigatorIOS",
  "componentPlatform": "ios",
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
      <Layout metadata={{"id":"navigatorios","title":"NavigatorIOS","layout":"autodocs","category":"Components","permalink":"docs/navigatorios.html","platform":"ios","next":"navigatorios","previous":"maskedviewios","sidebar":true,"path":"Libraries/Components/Navigation/NavigatorIOS.ios.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;