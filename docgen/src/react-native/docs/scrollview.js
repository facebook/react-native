/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "description": "Component that wraps platform ScrollView while providing\\nintegration with touch locking \\"responder\\" system.\\n\\nKeep in mind that ScrollViews must have a bounded height in order to work,\\nsince they contain unbounded-height children into a bounded container (via\\na scroll interaction). In order to bound the height of a ScrollView, either\\nset the height of the view directly (discouraged) or make sure all parent\\nviews have bounded height. Forgetting to transfer \`\{flex: 1}\` down the\\nview stack can lead to errors here, which the element inspector makes\\neasy to debug.\\n\\nDoesn't yet support other contained responders from blocking this scroll\\nview from becoming the responder.\\n\\n\\n\`<ScrollView>\` vs [\`<FlatList>\`](/react-native/docs/flatlist.html) - which one to use?\\n\\n\`ScrollView\` simply renders all its react child components at once. That\\nmakes it very easy to understand and use.\\n\\nOn the other hand, this has a performance downside. Imagine you have a very\\nlong list of items you want to display, maybe several screens worth of\\ncontent. Creating JS components and native views for everything all at once,\\nmuch of which may not even be shown, will contribute to slow rendering and\\nincreased memory usage.\\n\\nThis is where \`FlatList\` comes into play. \`FlatList\` renders items lazily,\\njust when they are about to appear, and removes items that scroll way off\\nscreen to save memory and processing time.\\n\\n\`FlatList\` is also handy if you want to render separators between your items,\\nmultiple columns, infinite scroll loading, or any number of other features it\\nsupports out of the box.",
  "displayName": "ScrollView",
  "methods": [
    \{
      "name": "scrollTo",
      "docblock": "Scrolls to a given x, y offset, either immediately or with a smooth animation.\\n\\nExample:\\n\\n\`scrollTo(\{x: 0, y: 0, animated: true})\`\\n\\nNote: The weird function signature is due to the fact that, for historical reasons,\\nthe function also accepts separate arguments as an alternative to the options object.\\nThis is deprecated due to ambiguity (y before x), and SHOULD NOT BE USED.",
      "modifiers": [],
      "params": [
        \{
          "name": "y",
          "optional": true,
          "type": \{
            "names": [
              "number",
              "object"
            ]
          }
        },
        \{
          "name": "x",
          "optional": true,
          "type": \{
            "names": [
              "number"
            ]
          }
        },
        \{
          "name": "animated",
          "optional": true,
          "type": \{
            "names": [
              "boolean"
            ]
          }
        }
      ],
      "returns": null,
      "description": "Scrolls to a given x, y offset, either immediately or with a smooth animation.\\n\\nExample:\\n\\n\`scrollTo(\{x: 0, y: 0, animated: true})\`\\n\\nNote: The weird function signature is due to the fact that, for historical reasons,\\nthe function also accepts separate arguments as an alternative to the options object.\\nThis is deprecated due to ambiguity (y before x), and SHOULD NOT BE USED."
    },
    \{
      "name": "scrollToEnd",
      "docblock": "If this is a vertical ScrollView scrolls to the bottom.\\nIf this is a horizontal ScrollView scrolls to the right.\\n\\nUse \`scrollToEnd(\{animated: true})\` for smooth animated scrolling,\\n\`scrollToEnd(\{animated: false})\` for immediate scrolling.\\nIf no options are passed, \`animated\` defaults to true.",
      "modifiers": [],
      "params": [
        \{
          "name": "options",
          "optional": true,
          "type": \{
            "names": [
              "object"
            ]
          }
        }
      ],
      "returns": null,
      "description": "If this is a vertical ScrollView scrolls to the bottom.\\nIf this is a horizontal ScrollView scrolls to the right.\\n\\nUse \`scrollToEnd(\{animated: true})\` for smooth animated scrolling,\\n\`scrollToEnd(\{animated: false})\` for immediate scrolling.\\nIf no options are passed, \`animated\` defaults to true."
    },
    \{
      "name": "scrollWithoutAnimationTo",
      "docblock": "Deprecated, use \`scrollTo\` instead.",
      "modifiers": [],
      "params": [
        \{
          "name": "y"
        },
        \{
          "name": "x"
        }
      ],
      "returns": null,
      "description": "Deprecated, use \`scrollTo\` instead."
    },
    \{
      "name": "flashScrollIndicators",
      "docblock": "Displays the scroll indicators momentarily.\\n\\n@platform ios",
      "modifiers": [],
      "params": [],
      "returns": null,
      "description": "Displays the scroll indicators momentarily."
    }
  ],
  "props": \{
    "automaticallyAdjustContentInsets": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "Controls whether iOS should automatically adjust the content inset\\nfor scroll views that are placed behind a navigation bar or\\ntab bar/ toolbar. The default value is true.\\n@platform ios"
    },
    "contentInset": \{
      "type": \{
        "name": "custom",
        "raw": "EdgeInsetsPropType"
      },
      "required": false,
      "description": "The amount by which the scroll view content is inset from the edges\\nof the scroll view. Defaults to \`\{top: 0, left: 0, bottom: 0, right: 0}\`.\\n@platform ios"
    },
    "contentOffset": \{
      "type": \{
        "name": "custom",
        "raw": "PointPropType"
      },
      "required": false,
      "description": "Used to manually set the starting scroll offset.\\nThe default value is \`\{x: 0, y: 0}\`.\\n@platform ios"
    },
    "bounces": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "When true, the scroll view bounces when it reaches the end of the\\ncontent if the content is larger then the scroll view along the axis of\\nthe scroll direction. When false, it disables all bouncing even if\\nthe \`alwaysBounce*\` props are true. The default value is true.\\n@platform ios"
    },
    "bouncesZoom": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "When true, gestures can drive zoom past min/max and the zoom will animate\\nto the min/max value at gesture end, otherwise the zoom will not exceed\\nthe limits.\\n@platform ios"
    },
    "alwaysBounceHorizontal": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "When true, the scroll view bounces horizontally when it reaches the end\\neven if the content is smaller than the scroll view itself. The default\\nvalue is true when \`horizontal=\{true}\` and false otherwise.\\n@platform ios"
    },
    "alwaysBounceVertical": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "When true, the scroll view bounces vertically when it reaches the end\\neven if the content is smaller than the scroll view itself. The default\\nvalue is false when \`horizontal=\{true}\` and true otherwise.\\n@platform ios"
    },
    "centerContent": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "When true, the scroll view automatically centers the content when the\\ncontent is smaller than the scroll view bounds; when the content is\\nlarger than the scroll view, this property has no effect. The default\\nvalue is false.\\n@platform ios"
    },
    "contentContainerStyle": \{
      "type": \{
        "name": "custom",
        "raw": "StyleSheetPropType(ViewStylePropTypes)"
      },
      "required": false,
      "description": "These styles will be applied to the scroll view content container which\\nwraps all of the child views. Example:\\n\\n\`\`\`\\nreturn (\\n  <ScrollView contentContainerStyle=\{styles.contentContainer}>\\n  </ScrollView>\\n);\\n...\\nconst styles = StyleSheet.create(\{\\n  contentContainer: \{\\n    paddingVertical: 20\\n  }\\n});\\n\`\`\`"
    },
    "decelerationRate": \{
      "type": \{
        "name": "union",
        "value": [
          \{
            "name": "enum",
            "value": [
              \{
                "value": "'fast'",
                "computed": false
              },
              \{
                "value": "'normal'",
                "computed": false
              }
            ]
          },
          \{
            "name": "number"
          }
        ]
      },
      "required": false,
      "description": "A floating-point number that determines how quickly the scroll view\\ndecelerates after the user lifts their finger. You may also use string\\nshortcuts \`\\"normal\\"\` and \`\\"fast\\"\` which match the underlying iOS settings\\nfor \`UIScrollViewDecelerationRateNormal\` and\\n\`UIScrollViewDecelerationRateFast\` respectively.\\n\\n  - \`'normal'\`: 0.998 (the default)\\n  - \`'fast'\`: 0.99\\n\\n@platform ios"
    },
    "horizontal": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "When true, the scroll view's children are arranged horizontally in a row\\ninstead of vertically in a column. The default value is false."
    },
    "indicatorStyle": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "\\"default\\"",
            "computed": false
          },
          \{
            "value": "'black'",
            "computed": false
          },
          \{
            "value": "'white'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "The style of the scroll indicators.\\n\\n  - \`'default'\` (the default), same as \`black\`.\\n  - \`'black'\`, scroll indicator is black. This style is good against a light background.\\n  - \`'white'\`, scroll indicator is white. This style is good against a dark background.\\n\\n@platform ios"
    },
    "directionalLockEnabled": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "When true, the ScrollView will try to lock to only vertical or horizontal\\nscrolling while dragging.  The default value is false.\\n@platform ios"
    },
    "canCancelContentTouches": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "When false, once tracking starts, won't try to drag if the touch moves.\\nThe default value is true.\\n@platform ios"
    },
    "keyboardDismissMode": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "\\"none\\"",
            "computed": false
          },
          \{
            "value": "'interactive'",
            "computed": false
          },
          \{
            "value": "'on-drag'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "Determines whether the keyboard gets dismissed in response to a drag.\\n\\n  - \`'none'\` (the default), drags do not dismiss the keyboard.\\n  - \`'on-drag'\`, the keyboard is dismissed when a drag begins.\\n  - \`'interactive'\`, the keyboard is dismissed interactively with the drag and moves in\\n    synchrony with the touch; dragging upwards cancels the dismissal.\\n    On android this is not supported and it will have the same behavior as 'none'."
    },
    "keyboardShouldPersistTaps": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "'always'",
            "computed": false
          },
          \{
            "value": "'never'",
            "computed": false
          },
          \{
            "value": "'handled'",
            "computed": false
          },
          \{
            "value": "false",
            "computed": false
          },
          \{
            "value": "true",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "Determines when the keyboard should stay visible after a tap.\\n\\n  - \`'never'\` (the default), tapping outside of the focused text input when the keyboard\\n    is up dismisses the keyboard. When this happens, children won't receive the tap.\\n  - \`'always'\`, the keyboard will not dismiss automatically, and the scroll view will not\\n    catch taps, but children of the scroll view can catch taps.\\n  - \`'handled'\`, the keyboard will not dismiss automatically when the tap was handled by\\n    a children, (or captured by an ancestor).\\n  - \`false\`, deprecated, use 'never' instead\\n  - \`true\`, deprecated, use 'always' instead"
    },
    "maximumZoomScale": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": "The maximum allowed zoom scale. The default value is 1.0.\\n@platform ios"
    },
    "minimumZoomScale": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": "The minimum allowed zoom scale. The default value is 1.0.\\n@platform ios"
    },
    "onScroll": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Fires at most once per frame during scrolling. The frequency of the\\nevents can be controlled using the \`scrollEventThrottle\` prop."
    },
    "onScrollAnimationEnd": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Called when a scrolling animation ends.\\n@platform ios"
    },
    "onContentSizeChange": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Called when scrollable content view of the ScrollView changes.\\n\\nHandler function is passed the content width and content height as parameters:\\n\`(contentWidth, contentHeight)\`\\n\\nIt's implemented using onLayout handler attached to the content container\\nwhich this ScrollView renders."
    },
    "pagingEnabled": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "When true, the scroll view stops on multiples of the scroll view's size\\nwhen scrolling. This can be used for horizontal pagination. The default\\nvalue is false.\\n\\nNote: Vertical pagination is not supported on Android."
    },
    "scrollEnabled": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "When false, the view cannot be scrolled via touch interaction.\\nThe default value is true.\\n\\nNote that the view can be always be scrolled by calling \`scrollTo\`."
    },
    "scrollEventThrottle": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": "This controls how often the scroll event will be fired while scrolling\\n(as a time interval in ms). A lower number yields better accuracy for code\\nthat is tracking the scroll position, but can lead to scroll performance\\nproblems due to the volume of information being send over the bridge.\\nYou will not notice a difference between values set between 1-16 as the\\nJS run loop is synced to the screen refresh rate. If you do not need precise\\nscroll position tracking, set this value higher to limit the information\\nbeing sent across the bridge. The default value is zero, which results in\\nthe scroll event being sent only once each time the view is scrolled.\\n@platform ios"
    },
    "scrollIndicatorInsets": \{
      "type": \{
        "name": "custom",
        "raw": "EdgeInsetsPropType"
      },
      "required": false,
      "description": "The amount by which the scroll view indicators are inset from the edges\\nof the scroll view. This should normally be set to the same value as\\nthe \`contentInset\`. Defaults to \`\{0, 0, 0, 0}\`.\\n@platform ios"
    },
    "scrollsToTop": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "When true, the scroll view scrolls to top when the status bar is tapped.\\nThe default value is true.\\n@platform ios"
    },
    "showsHorizontalScrollIndicator": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "When true, shows a horizontal scroll indicator.\\nThe default value is true."
    },
    "showsVerticalScrollIndicator": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "When true, shows a vertical scroll indicator.\\nThe default value is true."
    },
    "stickyHeaderIndices": \{
      "type": \{
        "name": "arrayOf",
        "value": \{
          "name": "number"
        }
      },
      "required": false,
      "description": "An array of child indices determining which children get docked to the\\ntop of the screen when scrolling. For example, passing\\n\`stickyHeaderIndices=\{[0]}\` will cause the first child to be fixed to the\\ntop of the scroll view. This property is not supported in conjunction\\nwith \`horizontal=\{true}\`."
    },
    "style": \{
      "type": \{
        "name": "stylesheet",
        "value": "ViewStylePropTypes"
      },
      "required": false,
      "description": ""
    },
    "snapToInterval": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": "When set, causes the scroll view to stop at multiples of the value of\\n\`snapToInterval\`. This can be used for paginating through children\\nthat have lengths smaller than the scroll view. Typically used in\\ncombination with \`snapToAlignment\` and \`decelerationRate=\\"fast\\"\`.\\nOverrides less configurable \`pagingEnabled\` prop.\\n\\n@platform ios"
    },
    "snapToAlignment": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "\\"start\\"",
            "computed": false
          },
          \{
            "value": "'center'",
            "computed": false
          },
          \{
            "value": "'end'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "When \`snapToInterval\` is set, \`snapToAlignment\` will define the relationship\\nof the snapping to the scroll view.\\n\\n  - \`'start'\` (the default) will align the snap at the left (horizontal) or top (vertical)\\n  - \`'center'\` will align the snap in the center\\n  - \`'end'\` will align the snap at the right (horizontal) or bottom (vertical)\\n\\n@platform ios"
    },
    "removeClippedSubviews": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "Experimental: When true, offscreen child views (whose \`overflow\` value is\\n\`hidden\`) are removed from their native backing superview when offscreen.\\nThis can improve scrolling performance on long lists. The default value is\\ntrue."
    },
    "zoomScale": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": "The current scale of the scroll view content. The default value is 1.0.\\n@platform ios"
    },
    "refreshControl": \{
      "type": \{
        "name": "element"
      },
      "required": false,
      "description": "A RefreshControl component, used to provide pull-to-refresh\\nfunctionality for the ScrollView. Only works for vertical ScrollViews\\n(\`horizontal\` prop must be \`false\`).\\n\\nSee [RefreshControl](docs/refreshcontrol.html)."
    },
    "endFillColor": \{
      "type": \{
        "name": "custom",
        "raw": "ColorPropType"
      },
      "required": false,
      "description": "Sometimes a scrollview takes up more space than its content fills. When this is\\nthe case, this prop will fill the rest of the scrollview with a color to avoid setting\\na background and creating unnecessary overdraw. This is an advanced optimization\\nthat is not needed in the general case.\\n@platform android"
    },
    "scrollPerfTag": \{
      "type": \{
        "name": "string"
      },
      "required": false,
      "description": "Tag used to log scroll performance on this scroll view. Will force\\nmomentum events to be turned on (see sendMomentumEvents). This doesn't do\\nanything out of the box and you need to implement a custom native\\nFpsListener for it to be useful.\\n@platform android"
    },
    "overScrollMode": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "'auto'",
            "computed": false
          },
          \{
            "value": "'always'",
            "computed": false
          },
          \{
            "value": "'never'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "Used to override default value of overScroll mode.\\n\\nPossible values:\\n\\n - \`'auto'\` - Default value, allow a user to over-scroll\\n   this view only if the content is large enough to meaningfully scroll.\\n - \`'always'\` - Always allow a user to over-scroll this view.\\n - \`'never'\` - Never allow a user to over-scroll this view.\\n\\n@platform android"
    },
    "DEPRECATED_sendUpdatedChildFrames": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "When true, ScrollView will emit updateChildFrames data in scroll events,\\notherwise will not compute or emit child frame data.  This only exists\\nto support legacy issues, \`onLayout\` should be used instead to retrieve\\nframe data.\\nThe default value is false.\\n@platform ios"
    }
  },
  "composes": [
    "ViewPropTypes"
  ],
  "type": "component",
  "filepath": "Libraries/Components/ScrollView/ScrollView.js",
  "componentName": "ScrollView",
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
      <Layout metadata={{"id":"scrollview","title":"ScrollView","layout":"autodocs","category":"Components","permalink":"docs/scrollview.html","platform":"cross","next":"scrollview","previous":"progressviewios","sidebar":true,"path":"Libraries/Components/ScrollView/ScrollView.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;