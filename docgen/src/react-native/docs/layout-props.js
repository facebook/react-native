/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "props": \{
    "display": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "'none'",
            "computed": false
          },
          \{
            "value": "'flex'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "\`display\` sets the display type of this component.\\n\\n It works similarly to \`display\` in CSS, but only support 'flex' and 'none'.\\n 'flex' is the default."
    },
    "width": \{
      "type": \{
        "name": "union",
        "value": [
          \{
            "name": "number"
          },
          \{
            "name": "string"
          }
        ]
      },
      "required": false,
      "description": "\`width\` sets the width of this component.\\n\\n It works similarly to \`width\` in CSS, but in React Native you\\n must use points or percentages. Ems and other units are not supported.\\n See https://developer.mozilla.org/en-US/docs/Web/CSS/width for more details."
    },
    "height": \{
      "type": \{
        "name": "union",
        "value": [
          \{
            "name": "number"
          },
          \{
            "name": "string"
          }
        ]
      },
      "required": false,
      "description": "\`height\` sets the height of this component.\\n\\n It works similarly to \`height\` in CSS, but in React Native you\\n must use points or percentages. Ems and other units are not supported.\\n See https://developer.mozilla.org/en-US/docs/Web/CSS/height for more details."
    },
    "top": \{
      "type": \{
        "name": "union",
        "value": [
          \{
            "name": "number"
          },
          \{
            "name": "string"
          }
        ]
      },
      "required": false,
      "description": "\`top\` is the number of logical pixels to offset the top edge of\\n this component.\\n\\n It works similarly to \`top\` in CSS, but in React Native you\\n must use points or percentages. Ems and other units are not supported.\\n\\n See https://developer.mozilla.org/en-US/docs/Web/CSS/top\\n for more details of how \`top\` affects layout."
    },
    "left": \{
      "type": \{
        "name": "union",
        "value": [
          \{
            "name": "number"
          },
          \{
            "name": "string"
          }
        ]
      },
      "required": false,
      "description": "\`left\` is the number of logical pixels to offset the left edge of\\n this component.\\n\\n It works similarly to \`left\` in CSS, but in React Native you\\n must use points or percentages. Ems and other units are not supported.\\n\\n See https://developer.mozilla.org/en-US/docs/Web/CSS/left\\n for more details of how \`left\` affects layout."
    },
    "right": \{
      "type": \{
        "name": "union",
        "value": [
          \{
            "name": "number"
          },
          \{
            "name": "string"
          }
        ]
      },
      "required": false,
      "description": "\`right\` is the number of logical pixels to offset the right edge of\\n this component.\\n\\n It works similarly to \`right\` in CSS, but in React Native you\\n must use points or percentages. Ems and other units are not supported.\\n\\n See https://developer.mozilla.org/en-US/docs/Web/CSS/right\\n for more details of how \`right\` affects layout."
    },
    "bottom": \{
      "type": \{
        "name": "union",
        "value": [
          \{
            "name": "number"
          },
          \{
            "name": "string"
          }
        ]
      },
      "required": false,
      "description": "\`bottom\` is the number of logical pixels to offset the bottom edge of\\n this component.\\n\\n It works similarly to \`bottom\` in CSS, but in React Native you\\n must use points or percentages. Ems and other units are not supported.\\n\\n See https://developer.mozilla.org/en-US/docs/Web/CSS/bottom\\n for more details of how \`bottom\` affects layout."
    },
    "minWidth": \{
      "type": \{
        "name": "union",
        "value": [
          \{
            "name": "number"
          },
          \{
            "name": "string"
          }
        ]
      },
      "required": false,
      "description": "\`minWidth\` is the minimum width for this component, in logical pixels.\\n\\n It works similarly to \`min-width\` in CSS, but in React Native you\\n must use points or percentages. Ems and other units are not supported.\\n\\n See https://developer.mozilla.org/en-US/docs/Web/CSS/min-width\\n for more details."
    },
    "maxWidth": \{
      "type": \{
        "name": "union",
        "value": [
          \{
            "name": "number"
          },
          \{
            "name": "string"
          }
        ]
      },
      "required": false,
      "description": "\`maxWidth\` is the maximum width for this component, in logical pixels.\\n\\n It works similarly to \`max-width\` in CSS, but in React Native you\\n must use points or percentages. Ems and other units are not supported.\\n\\n See https://developer.mozilla.org/en-US/docs/Web/CSS/max-width\\n for more details."
    },
    "minHeight": \{
      "type": \{
        "name": "union",
        "value": [
          \{
            "name": "number"
          },
          \{
            "name": "string"
          }
        ]
      },
      "required": false,
      "description": "\`minHeight\` is the minimum height for this component, in logical pixels.\\n\\n It works similarly to \`min-height\` in CSS, but in React Native you\\n must use points or percentages. Ems and other units are not supported.\\n\\n See https://developer.mozilla.org/en-US/docs/Web/CSS/min-height\\n for more details."
    },
    "maxHeight": \{
      "type": \{
        "name": "union",
        "value": [
          \{
            "name": "number"
          },
          \{
            "name": "string"
          }
        ]
      },
      "required": false,
      "description": "\`maxHeight\` is the maximum height for this component, in logical pixels.\\n\\n It works similarly to \`max-height\` in CSS, but in React Native you\\n must use points or percentages. Ems and other units are not supported.\\n\\n See https://developer.mozilla.org/en-US/docs/Web/CSS/max-height\\n for more details."
    },
    "margin": \{
      "type": \{
        "name": "union",
        "value": [
          \{
            "name": "number"
          },
          \{
            "name": "string"
          }
        ]
      },
      "required": false,
      "description": "Setting \`margin\` has the same effect as setting each of\\n \`marginTop\`, \`marginLeft\`, \`marginBottom\`, and \`marginRight\`.\\n See https://developer.mozilla.org/en-US/docs/Web/CSS/margin\\n for more details."
    },
    "marginVertical": \{
      "type": \{
        "name": "union",
        "value": [
          \{
            "name": "number"
          },
          \{
            "name": "string"
          }
        ]
      },
      "required": false,
      "description": "Setting \`marginVertical\` has the same effect as setting both\\n \`marginTop\` and \`marginBottom\`."
    },
    "marginHorizontal": \{
      "type": \{
        "name": "union",
        "value": [
          \{
            "name": "number"
          },
          \{
            "name": "string"
          }
        ]
      },
      "required": false,
      "description": "Setting \`marginHorizontal\` has the same effect as setting\\n both \`marginLeft\` and \`marginRight\`."
    },
    "marginTop": \{
      "type": \{
        "name": "union",
        "value": [
          \{
            "name": "number"
          },
          \{
            "name": "string"
          }
        ]
      },
      "required": false,
      "description": "\`marginTop\` works like \`margin-top\` in CSS.\\n See https://developer.mozilla.org/en-US/docs/Web/CSS/margin-top\\n for more details."
    },
    "marginBottom": \{
      "type": \{
        "name": "union",
        "value": [
          \{
            "name": "number"
          },
          \{
            "name": "string"
          }
        ]
      },
      "required": false,
      "description": "\`marginBottom\` works like \`margin-bottom\` in CSS.\\n See https://developer.mozilla.org/en-US/docs/Web/CSS/margin-bottom\\n for more details."
    },
    "marginLeft": \{
      "type": \{
        "name": "union",
        "value": [
          \{
            "name": "number"
          },
          \{
            "name": "string"
          }
        ]
      },
      "required": false,
      "description": "\`marginLeft\` works like \`margin-left\` in CSS.\\n See https://developer.mozilla.org/en-US/docs/Web/CSS/margin-left\\n for more details."
    },
    "marginRight": \{
      "type": \{
        "name": "union",
        "value": [
          \{
            "name": "number"
          },
          \{
            "name": "string"
          }
        ]
      },
      "required": false,
      "description": "\`marginRight\` works like \`margin-right\` in CSS.\\n See https://developer.mozilla.org/en-US/docs/Web/CSS/margin-right\\n for more details."
    },
    "padding": \{
      "type": \{
        "name": "union",
        "value": [
          \{
            "name": "number"
          },
          \{
            "name": "string"
          }
        ]
      },
      "required": false,
      "description": "Setting \`padding\` has the same effect as setting each of\\n \`paddingTop\`, \`paddingBottom\`, \`paddingLeft\`, and \`paddingRight\`.\\n See https://developer.mozilla.org/en-US/docs/Web/CSS/padding\\n for more details."
    },
    "paddingVertical": \{
      "type": \{
        "name": "union",
        "value": [
          \{
            "name": "number"
          },
          \{
            "name": "string"
          }
        ]
      },
      "required": false,
      "description": "Setting \`paddingVertical\` is like setting both of\\n \`paddingTop\` and \`paddingBottom\`."
    },
    "paddingHorizontal": \{
      "type": \{
        "name": "union",
        "value": [
          \{
            "name": "number"
          },
          \{
            "name": "string"
          }
        ]
      },
      "required": false,
      "description": "Setting \`paddingHorizontal\` is like setting both of\\n \`paddingLeft\` and \`paddingRight\`."
    },
    "paddingTop": \{
      "type": \{
        "name": "union",
        "value": [
          \{
            "name": "number"
          },
          \{
            "name": "string"
          }
        ]
      },
      "required": false,
      "description": "\`paddingTop\` works like \`padding-top\` in CSS.\\nSee https://developer.mozilla.org/en-US/docs/Web/CSS/padding-top\\nfor more details."
    },
    "paddingBottom": \{
      "type": \{
        "name": "union",
        "value": [
          \{
            "name": "number"
          },
          \{
            "name": "string"
          }
        ]
      },
      "required": false,
      "description": "\`paddingBottom\` works like \`padding-bottom\` in CSS.\\nSee https://developer.mozilla.org/en-US/docs/Web/CSS/padding-bottom\\nfor more details."
    },
    "paddingLeft": \{
      "type": \{
        "name": "union",
        "value": [
          \{
            "name": "number"
          },
          \{
            "name": "string"
          }
        ]
      },
      "required": false,
      "description": "\`paddingLeft\` works like \`padding-left\` in CSS.\\nSee https://developer.mozilla.org/en-US/docs/Web/CSS/padding-left\\nfor more details."
    },
    "paddingRight": \{
      "type": \{
        "name": "union",
        "value": [
          \{
            "name": "number"
          },
          \{
            "name": "string"
          }
        ]
      },
      "required": false,
      "description": "\`paddingRight\` works like \`padding-right\` in CSS.\\nSee https://developer.mozilla.org/en-US/docs/Web/CSS/padding-right\\nfor more details."
    },
    "borderWidth": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": "\`borderWidth\` works like \`border-width\` in CSS.\\nSee https://developer.mozilla.org/en-US/docs/Web/CSS/border-width\\nfor more details."
    },
    "borderTopWidth": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": "\`borderTopWidth\` works like \`border-top-width\` in CSS.\\nSee https://developer.mozilla.org/en-US/docs/Web/CSS/border-top-width\\nfor more details."
    },
    "borderRightWidth": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": "\`borderRightWidth\` works like \`border-right-width\` in CSS.\\nSee https://developer.mozilla.org/en-US/docs/Web/CSS/border-right-width\\nfor more details."
    },
    "borderBottomWidth": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": "\`borderBottomWidth\` works like \`border-bottom-width\` in CSS.\\nSee https://developer.mozilla.org/en-US/docs/Web/CSS/border-bottom-width\\nfor more details."
    },
    "borderLeftWidth": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": "\`borderLeftWidth\` works like \`border-left-width\` in CSS.\\nSee https://developer.mozilla.org/en-US/docs/Web/CSS/border-left-width\\nfor more details."
    },
    "position": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "'absolute'",
            "computed": false
          },
          \{
            "value": "'relative'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "\`position\` in React Native is similar to regular CSS, but\\n everything is set to \`relative\` by default, so \`absolute\`\\n positioning is always just relative to the parent.\\n\\n If you want to position a child using specific numbers of logical\\n pixels relative to its parent, set the child to have \`absolute\`\\n position.\\n\\n If you want to position a child relative to something\\n that is not its parent, just don't use styles for that. Use the\\n component tree.\\n\\n See https://github.com/facebook/yoga\\n for more details on how \`position\` differs between React Native\\n and CSS."
    },
    "flexDirection": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "'row'",
            "computed": false
          },
          \{
            "value": "'row-reverse'",
            "computed": false
          },
          \{
            "value": "'column'",
            "computed": false
          },
          \{
            "value": "'column-reverse'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "\`flexDirection\` controls which directions children of a container go.\\n \`row\` goes left to right, \`column\` goes top to bottom, and you may\\n be able to guess what the other two do. It works like \`flex-direction\`\\n in CSS, except the default is \`column\`.\\n See https://developer.mozilla.org/en-US/docs/Web/CSS/flex-direction\\n for more details."
    },
    "flexWrap": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "'wrap'",
            "computed": false
          },
          \{
            "value": "'nowrap'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "\`flexWrap\` controls whether children can wrap around after they\\n hit the end of a flex container.\\n It works like \`flex-wrap\` in CSS (default: nowrap).\\n See https://developer.mozilla.org/en-US/docs/Web/CSS/flex-wrap\\n for more details."
    },
    "justifyContent": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "'flex-start'",
            "computed": false
          },
          \{
            "value": "'flex-end'",
            "computed": false
          },
          \{
            "value": "'center'",
            "computed": false
          },
          \{
            "value": "'space-between'",
            "computed": false
          },
          \{
            "value": "'space-around'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "\`justifyContent\` aligns children in the main direction.\\n For example, if children are flowing vertically, \`justifyContent\`\\n controls how they align vertically.\\n It works like \`justify-content\` in CSS (default: flex-start).\\n See https://developer.mozilla.org/en-US/docs/Web/CSS/justify-content\\n for more details."
    },
    "alignItems": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "'flex-start'",
            "computed": false
          },
          \{
            "value": "'flex-end'",
            "computed": false
          },
          \{
            "value": "'center'",
            "computed": false
          },
          \{
            "value": "'stretch'",
            "computed": false
          },
          \{
            "value": "'baseline'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "\`alignItems\` aligns children in the cross direction.\\n For example, if children are flowing vertically, \`alignItems\`\\n controls how they align horizontally.\\n It works like \`align-items\` in CSS (default: stretch).\\n See https://developer.mozilla.org/en-US/docs/Web/CSS/align-items\\n for more details."
    },
    "alignSelf": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "'auto'",
            "computed": false
          },
          \{
            "value": "'flex-start'",
            "computed": false
          },
          \{
            "value": "'flex-end'",
            "computed": false
          },
          \{
            "value": "'center'",
            "computed": false
          },
          \{
            "value": "'stretch'",
            "computed": false
          },
          \{
            "value": "'baseline'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "\`alignSelf\` controls how a child aligns in the cross direction,\\n overriding the \`alignItems\` of the parent. It works like \`align-self\`\\n in CSS (default: auto).\\n See https://developer.mozilla.org/en-US/docs/Web/CSS/align-self\\n for more details."
    },
    "alignContent": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "'flex-start'",
            "computed": false
          },
          \{
            "value": "'flex-end'",
            "computed": false
          },
          \{
            "value": "'center'",
            "computed": false
          },
          \{
            "value": "'stretch'",
            "computed": false
          },
          \{
            "value": "'space-between'",
            "computed": false
          },
          \{
            "value": "'space-around'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "\`alignContent\` controls how rows align in the cross direction,\\n overriding the \`alignContent\` of the parent.\\n See https://developer.mozilla.org/en-US/docs/Web/CSS/align-content\\n for more details."
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
          },
          \{
            "value": "'scroll'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "\`overflow\` controls how a children are measured and displayed.\\n \`overflow: hidden\` causes views to be clipped while \`overflow: scroll\`\\n causes views to be measured independently of their parents main axis.\\n It works like \`overflow\` in CSS (default: visible).\\n See https://developer.mozilla.org/en/docs/Web/CSS/overflow\\n for more details.\\n \`overflow: visible\` only works on iOS. On Android, all views will clip\\n their children."
    },
    "flex": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": "In React Native \`flex\` does not work the same way that it does in CSS.\\n \`flex\` is a number rather than a string, and it works\\n according to the \`Yoga\` library\\n at https://github.com/facebook/yoga\\n\\n When \`flex\` is a positive number, it makes the component flexible\\n and it will be sized proportional to its flex value. So a\\n component with \`flex\` set to 2 will take twice the space as a\\n component with \`flex\` set to 1.\\n\\n When \`flex\` is 0, the component is sized according to \`width\`\\n and \`height\` and it is inflexible.\\n\\n When \`flex\` is -1, the component is normally sized according\\n \`width\` and \`height\`. However, if there's not enough space,\\n the component will shrink to its \`minWidth\` and \`minHeight\`.\\n\\nflexGrow, flexShrink, and flexBasis work the same as in CSS."
    },
    "flexGrow": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": ""
    },
    "flexShrink": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": ""
    },
    "flexBasis": \{
      "type": \{
        "name": "union",
        "value": [
          \{
            "name": "number"
          },
          \{
            "name": "string"
          }
        ]
      },
      "required": false,
      "description": ""
    },
    "aspectRatio": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": "Aspect ratio control the size of the undefined dimension of a node. Aspect ratio is a\\nnon-standard property only available in react native and not CSS.\\n\\n- On a node with a set width/height aspect ratio control the size of the unset dimension\\n- On a node with a set flex basis aspect ratio controls the size of the node in the cross axis\\n  if unset\\n- On a node with a measure function aspect ratio works as though the measure function measures\\n  the flex basis\\n- On a node with flex grow/shrink aspect ratio controls the size of the node in the cross axis\\n  if unset\\n- Aspect ratio takes min/max dimensions into account"
    },
    "zIndex": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": "\`zIndex\` controls which components display on top of others.\\n Normally, you don't use \`zIndex\`. Components render according to\\n their order in the document tree, so later components draw over\\n earlier ones. \`zIndex\` may be useful if you have animations or custom\\n modal interfaces where you don't want this behavior.\\n\\n It works like the CSS \`z-index\` property - components with a larger\\n \`zIndex\` will render on top. Think of the z-direction like it's\\n pointing from the phone into your eyeball.\\n See https://developer.mozilla.org/en-US/docs/Web/CSS/z-index for\\n more details."
    },
    "direction": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "'inherit'",
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
      "description": "\`direction\` specifies the directional flow of the user interface.\\n The default is \`inherit\`, except for root node which will have\\n value based on the current locale.\\n See https://facebook.github.io/yoga/docs/rtl/\\n for more details.\\n @platform ios"
    }
  },
  "type": "style",
  "filepath": "Libraries/StyleSheet/LayoutPropTypes.js",
  "componentName": "Layout Props",
  "componentPlatform": "cross"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"layout-props","title":"Layout Props","layout":"autodocs","category":"APIs","permalink":"docs/layout-props.html","platform":"cross","next":"layout-props","previous":"vibration","sidebar":true,"path":"Libraries/StyleSheet/LayoutPropTypes.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;