/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "description": "Base implementation for the more convenient [\`<FlatList>\`](/react-native/docs/flatlist.html)\\nand [\`<SectionList>\`](/react-native/docs/sectionlist.html) components, which are also better\\ndocumented. In general, this should only really be used if you need more flexibility than\\n\`FlatList\` provides, e.g. for use with immutable data instead of plain arrays.\\n\\nVirtualization massively improves memory consumption and performance of large lists by\\nmaintaining a finite render window of active items and replacing all items outside of the render\\nwindow with appropriately sized blank space. The window adapts to scrolling behavior, and items\\nare rendered incrementally with low-pri (after any running interactions) if they are far from the\\nvisible area, or with hi-pri otherwise to minimize the potential of seeing blank space.\\n\\nSome caveats:\\n\\n- Internal state is not preserved when content scrolls out of the render window. Make sure all\\n  your data is captured in the item data or external stores like Flux, Redux, or Relay.\\n- This is a \`PureComponent\` which means that it will not re-render if \`props\` remain shallow-\\n  equal. Make sure that everything your \`renderItem\` function depends on is passed as a prop\\n  (e.g. \`extraData\`) that is not \`===\` after updates, otherwise your UI may not update on\\n  changes. This includes the \`data\` prop and parent component state.\\n- In order to constrain memory and enable smooth scrolling, content is rendered asynchronously\\n  offscreen. This means it's possible to scroll faster than the fill rate ands momentarily see\\n  blank content. This is a tradeoff that can be adjusted to suit the needs of each application,\\n  and we are working on improving it behind the scenes.\\n- By default, the list looks for a \`key\` prop on each item and uses that for the React key.\\n  Alternatively, you can provide a custom \`keyExtractor\` prop.",
  "methods": [
    \{
      "name": "scrollToEnd",
      "docblock": null,
      "modifiers": [],
      "params": [
        \{
          "name": "params",
          "optional": true,
          "type": \{
            "names": [
              "object"
            ]
          }
        }
      ],
      "returns": null
    },
    \{
      "name": "scrollToIndex",
      "docblock": null,
      "modifiers": [],
      "params": [
        \{
          "name": "params",
          "type": \{
            "names": [
              "object"
            ]
          }
        }
      ],
      "returns": null
    },
    \{
      "name": "scrollToItem",
      "docblock": null,
      "modifiers": [],
      "params": [
        \{
          "name": "params",
          "type": \{
            "names": [
              "object"
            ]
          }
        }
      ],
      "returns": null
    },
    \{
      "name": "scrollToOffset",
      "docblock": "Scroll to a specific content pixel offset in the list.\\n\\nParam \`offset\` expects the offset to scroll to.\\nIn case of \`horizontal\` is true, the offset is the x-value,\\nin any other case the offset is the y-value.\\n\\nParam \`animated\` (\`true\` by default) defines whether the list\\nshould do an animation while scrolling.",
      "modifiers": [],
      "params": [
        \{
          "name": "params",
          "type": \{
            "names": [
              "object"
            ]
          }
        }
      ],
      "returns": null,
      "description": "Scroll to a specific content pixel offset in the list.\\n\\nParam \`offset\` expects the offset to scroll to.\\nIn case of \`horizontal\` is true, the offset is the x-value,\\nin any other case the offset is the y-value.\\n\\nParam \`animated\` (\`true\` by default) defines whether the list\\nshould do an animation while scrolling."
    },
    \{
      "name": "recordInteraction",
      "docblock": null,
      "modifiers": [],
      "params": [],
      "returns": null
    },
    \{
      "name": "flashScrollIndicators",
      "docblock": null,
      "modifiers": [],
      "params": [],
      "returns": null
    }
  ],
  "props": \{
    "renderItem": \{
      "flowType": \{
        "name": "signature",
        "type": "function",
        "raw": "(info: any) => ?React.Element<any>",
        "signature": \{
          "arguments": [
            \{
              "name": "info",
              "type": \{
                "name": "any"
              }
            }
          ],
          "return": \{
            "elements": [
              \{
                "name": "any"
              }
            ],
            "raw": "React.Element<any>",
            "nullable": true
          }
        }
      },
      "required": true,
      "description": ""
    },
    "data": \{
      "flowType": \{
        "name": "any"
      },
      "required": false,
      "description": "The default accessor functions assume this is an Array<\{key: string}> but you can override\\ngetItem, getItemCount, and keyExtractor to handle any type of index-based data."
    },
    "getItem": \{
      "flowType": \{
        "name": "signature",
        "type": "function",
        "raw": "(data: any, index: number) => ?Item",
        "signature": \{
          "arguments": [
            \{
              "name": "data",
              "type": \{
                "name": "any"
              }
            },
            \{
              "name": "index",
              "type": \{
                "name": "number"
              }
            }
          ],
          "return": \{
            "name": "any",
            "nullable": true
          }
        }
      },
      "required": true,
      "description": "A generic accessor for extracting an item from any sort of data blob."
    },
    "getItemCount": \{
      "flowType": \{
        "name": "signature",
        "type": "function",
        "raw": "(data: any) => number",
        "signature": \{
          "arguments": [
            \{
              "name": "data",
              "type": \{
                "name": "any"
              }
            }
          ],
          "return": \{
            "name": "number"
          }
        }
      },
      "required": true,
      "description": "Determines how many items are in the data blob."
    },
    "debug": \{
      "flowType": \{
        "name": "boolean",
        "nullable": true
      },
      "required": false,
      "description": "\`debug\` will turn on extra logging and visual overlays to aid with debugging both usage and\\nimplementation, but with a significant perf hit."
    },
    "disableVirtualization": \{
      "flowType": \{
        "name": "boolean"
      },
      "required": true,
      "description": "DEPRECATED: Virtualization provides significant performance and memory optimizations, but fully\\nunmounts react instances that are outside of the render window. You should only need to disable\\nthis for debugging purposes.",
      "defaultValue": \{
        "value": "false",
        "computed": false
      }
    },
    "extraData": \{
      "flowType": \{
        "name": "any"
      },
      "required": false,
      "description": "A marker property for telling the list to re-render (since it implements \`PureComponent\`). If\\nany of your \`renderItem\`, Header, Footer, etc. functions depend on anything outside of the\\n\`data\` prop, stick it here and treat it immutably."
    },
    "getItemLayout": \{
      "flowType": \{
        "name": "signature",
        "type": "function",
        "raw": "(\\n  data: any,\\n  index: number,\\n) => \{length: number, offset: number, index: number}",
        "signature": \{
          "arguments": [
            \{
              "name": "data",
              "type": \{
                "name": "any"
              }
            },
            \{
              "name": "index",
              "type": \{
                "name": "number"
              }
            }
          ],
          "return": \{
            "name": "signature",
            "type": "object",
            "raw": "\{length: number, offset: number, index: number}",
            "signature": \{
              "properties": [
                \{
                  "key": "length",
                  "value": \{
                    "name": "number",
                    "required": true
                  }
                },
                \{
                  "key": "offset",
                  "value": \{
                    "name": "number",
                    "required": true
                  }
                },
                \{
                  "key": "index",
                  "value": \{
                    "name": "number",
                    "required": true
                  }
                }
              ]
            }
          }
        }
      },
      "required": false,
      "description": ""
    },
    "horizontal": \{
      "flowType": \{
        "name": "boolean",
        "nullable": true
      },
      "required": false,
      "description": "",
      "defaultValue": \{
        "value": "false",
        "computed": false
      }
    },
    "initialNumToRender": \{
      "flowType": \{
        "name": "number"
      },
      "required": true,
      "description": "How many items to render in the initial batch. This should be enough to fill the screen but not\\nmuch more. Note these items will never be unmounted as part of the windowed rendering in order\\nto improve perceived performance of scroll-to-top actions.",
      "defaultValue": \{
        "value": "10",
        "computed": false
      }
    },
    "initialScrollIndex": \{
      "flowType": \{
        "name": "number",
        "nullable": true
      },
      "required": false,
      "description": "Instead of starting at the top with the first item, start at \`initialScrollIndex\`. This\\ndisables the \\"scroll to top\\" optimization that keeps the first \`initialNumToRender\` items\\nalways rendered and immediately renders the items starting at this initial index. Requires\\n\`getItemLayout\` to be implemented."
    },
    "inverted": \{
      "flowType": \{
        "name": "boolean",
        "nullable": true
      },
      "required": false,
      "description": "Reverses the direction of scroll. Uses scale transforms of -1."
    },
    "keyExtractor": \{
      "flowType": \{
        "name": "signature",
        "type": "function",
        "raw": "(item: Item, index: number) => string",
        "signature": \{
          "arguments": [
            \{
              "name": "item",
              "type": \{
                "name": "any"
              }
            },
            \{
              "name": "index",
              "type": \{
                "name": "number"
              }
            }
          ],
          "return": \{
            "name": "string"
          }
        }
      },
      "required": true,
      "description": "",
      "defaultValue": \{
        "value": "(item: Item, index: number) => \{\\n  if (item.key != null) \{\\n    return item.key;\\n  }\\n  _usedIndexForKey = true;\\n  return String(index);\\n}",
        "computed": false
      }
    },
    "ListEmptyComponent": \{
      "flowType": \{
        "name": "union",
        "raw": "(ReactClass<any> | React.Element<any>)",
        "elements": [
          \{
            "name": "ReactClass",
            "elements": [
              \{
                "name": "any"
              }
            ],
            "raw": "ReactClass<any>"
          },
          \{
            "elements": [
              \{
                "name": "any"
              }
            ],
            "raw": "React.Element<any>"
          }
        ],
        "nullable": true
      },
      "required": false,
      "description": "Rendered when the list is empty. Can be a React Component Class, a render function, or\\na rendered element."
    },
    "ListFooterComponent": \{
      "flowType": \{
        "name": "union",
        "raw": "(ReactClass<any> | React.Element<any>)",
        "elements": [
          \{
            "name": "ReactClass",
            "elements": [
              \{
                "name": "any"
              }
            ],
            "raw": "ReactClass<any>"
          },
          \{
            "elements": [
              \{
                "name": "any"
              }
            ],
            "raw": "React.Element<any>"
          }
        ],
        "nullable": true
      },
      "required": false,
      "description": "Rendered at the bottom of all the items. Can be a React Component Class, a render function, or\\na rendered element."
    },
    "ListHeaderComponent": \{
      "flowType": \{
        "name": "union",
        "raw": "(ReactClass<any> | React.Element<any>)",
        "elements": [
          \{
            "name": "ReactClass",
            "elements": [
              \{
                "name": "any"
              }
            ],
            "raw": "ReactClass<any>"
          },
          \{
            "elements": [
              \{
                "name": "any"
              }
            ],
            "raw": "React.Element<any>"
          }
        ],
        "nullable": true
      },
      "required": false,
      "description": "Rendered at the top of all the items. Can be a React Component Class, a render function, or\\na rendered element."
    },
    "maxToRenderPerBatch": \{
      "flowType": \{
        "name": "number"
      },
      "required": true,
      "description": "The maximum number of items to render in each incremental render batch. The more rendered at\\nonce, the better the fill rate, but responsiveness my suffer because rendering content may\\ninterfere with responding to button taps or other interactions.",
      "defaultValue": \{
        "value": "10",
        "computed": false
      }
    },
    "onEndReached": \{
      "flowType": \{
        "name": "signature",
        "type": "function",
        "raw": "(info: \{distanceFromEnd: number}) => void",
        "signature": \{
          "arguments": [
            \{
              "name": "info",
              "type": \{
                "name": "signature",
                "type": "object",
                "raw": "\{distanceFromEnd: number}",
                "signature": \{
                  "properties": [
                    \{
                      "key": "distanceFromEnd",
                      "value": \{
                        "name": "number",
                        "required": true
                      }
                    }
                  ]
                }
              }
            }
          ],
          "return": \{
            "name": "void"
          }
        },
        "nullable": true
      },
      "required": false,
      "description": ""
    },
    "onEndReachedThreshold": \{
      "flowType": \{
        "name": "number",
        "nullable": true
      },
      "required": false,
      "description": "",
      "defaultValue": \{
        "value": "2",
        "computed": false
      }
    },
    "onLayout": \{
      "flowType": \{
        "name": "Function",
        "nullable": true
      },
      "required": false,
      "description": ""
    },
    "onRefresh": \{
      "flowType": \{
        "name": "Function",
        "nullable": true
      },
      "required": false,
      "description": "If provided, a standard RefreshControl will be added for \\"Pull to Refresh\\" functionality. Make\\nsure to also set the \`refreshing\` prop correctly."
    },
    "onViewableItemsChanged": \{
      "flowType": \{
        "name": "signature",
        "type": "function",
        "raw": "(info: \{\\n  viewableItems: Array<ViewToken>,\\n  changed: Array<ViewToken>,\\n}) => void",
        "signature": \{
          "arguments": [
            \{
              "name": "info",
              "type": \{
                "name": "signature",
                "type": "object",
                "raw": "\{\\n  viewableItems: Array<ViewToken>,\\n  changed: Array<ViewToken>,\\n}",
                "signature": \{
                  "properties": [
                    \{
                      "key": "viewableItems",
                      "value": \{
                        "name": "Array",
                        "elements": [
                          \{
                            "name": "ViewToken"
                          }
                        ],
                        "raw": "Array<ViewToken>",
                        "required": true
                      }
                    },
                    \{
                      "key": "changed",
                      "value": \{
                        "name": "Array",
                        "elements": [
                          \{
                            "name": "ViewToken"
                          }
                        ],
                        "raw": "Array<ViewToken>",
                        "required": true
                      }
                    }
                  ]
                }
              }
            }
          ],
          "return": \{
            "name": "void"
          }
        },
        "nullable": true
      },
      "required": false,
      "description": "Called when the viewability of rows changes, as defined by the\\n\`viewabilityConfig\` prop."
    },
    "progressViewOffset": \{
      "flowType": \{
        "name": "number"
      },
      "required": false,
      "description": "Set this when offset is needed for the loading indicator to show correctly.\\n@platform android"
    },
    "refreshing": \{
      "flowType": \{
        "name": "boolean",
        "nullable": true
      },
      "required": false,
      "description": "Set this true while waiting for new data from a refresh."
    },
    "removeClippedSubviews": \{
      "flowType": \{
        "name": "boolean"
      },
      "required": false,
      "description": "Note: may have bugs (missing content) in some circumstances - use at your own risk.\\n\\nThis may improve scroll performance for large lists."
    },
    "renderScrollComponent": \{
      "flowType": \{
        "name": "signature",
        "type": "function",
        "raw": "(props: Object) => React.Element<any>",
        "signature": \{
          "arguments": [
            \{
              "name": "props",
              "type": \{
                "name": "Object"
              }
            }
          ],
          "return": \{
            "elements": [
              \{
                "name": "any"
              }
            ],
            "raw": "React.Element<any>"
          }
        }
      },
      "required": false,
      "description": "Render a custom scroll component, e.g. with a differently styled \`RefreshControl\`."
    },
    "updateCellsBatchingPeriod": \{
      "flowType": \{
        "name": "number"
      },
      "required": true,
      "description": "Amount of time between low-pri item render batches, e.g. for rendering items quite a ways off\\nscreen. Similar fill rate/responsiveness tradeoff as \`maxToRenderPerBatch\`.",
      "defaultValue": \{
        "value": "50",
        "computed": false
      }
    },
    "viewabilityConfig": \{
      "flowType": \{
        "name": "ViewabilityConfig"
      },
      "required": false,
      "description": ""
    },
    "windowSize": \{
      "flowType": \{
        "name": "number"
      },
      "required": true,
      "description": "Determines the maximum number of items rendered outside of the visible area, in units of\\nvisible lengths. So if your list fills the screen, then \`windowSize=\{21}\` (the default) will\\nrender the visible screen area plus up to 10 screens above and 10 below the viewport. Reducing\\nthis number will reduce memory consumption and may improve performance, but will increase the\\nchance that fast scrolling may reveal momentary blank areas of unrendered content.",
      "defaultValue": \{
        "value": "21",
        "computed": false
      }
    },
    "scrollEventThrottle": \{
      "defaultValue": \{
        "value": "50",
        "computed": false
      }
    }
  },
  "typedef": [
    \{
      "name": "Props",
      "description": null,
      "type": \{
        "names": [
          "IntersectionTypeAnnotation"
        ]
      },
      "values": []
    }
  ],
  "type": "component",
  "filepath": "Libraries/Lists/VirtualizedList.js",
  "componentName": "VirtualizedList",
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
      <Layout metadata={{"id":"virtualizedlist","title":"VirtualizedList","layout":"autodocs","category":"Components","permalink":"docs/virtualizedlist.html","platform":"cross","next":"webview","previous":"viewpagerandroid","sidebar":true,"path":"Libraries/Lists/VirtualizedList.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;