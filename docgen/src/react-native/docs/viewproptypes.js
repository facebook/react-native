/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "props": \{
    "accessible": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "When \`true\`, indicates that the view is an accessibility element. By default,\\nall the touchable elements are accessible."
    },
    "accessibilityLabel": \{
      "type": \{
        "name": "node"
      },
      "required": false,
      "description": "Overrides the text that's read by the screen reader when the user interacts\\nwith the element. By default, the label is constructed by traversing all the\\nchildren and accumulating all the \`Text\` nodes separated by space."
    },
    "accessibilityComponentType": \{
      "type": \{
        "name": "enum",
        "computed": true,
        "value": "AccessibilityComponentTypes"
      },
      "required": false,
      "description": "Indicates to accessibility services to treat UI component like a\\nnative one. Works for Android only.\\n\\nPossible values are one of:\\n\\n- \`'none'\`\\n- \`'button'\`\\n- \`'radiobutton_checked'\`\\n- \`'radiobutton_unchecked'\`\\n\\n@platform android"
    },
    "accessibilityLiveRegion": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "'none'",
            "computed": false
          },
          \{
            "value": "'polite'",
            "computed": false
          },
          \{
            "value": "'assertive'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "Indicates to accessibility services whether the user should be notified\\nwhen this view changes. Works for Android API >= 19 only.\\nPossible values:\\n\\n- \`'none'\` - Accessibility services should not announce changes to this view.\\n- \`'polite'\`- Accessibility services should announce changes to this view.\\n- \`'assertive'\` - Accessibility services should interrupt ongoing speech to immediately announce changes to this view.\\n\\nSee the [Android \`View\` docs](http://developer.android.com/reference/android/view/View.html#attr_android:accessibilityLiveRegion)\\nfor reference.\\n\\n@platform android"
    },
    "importantForAccessibility": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "'auto'",
            "computed": false
          },
          \{
            "value": "'yes'",
            "computed": false
          },
          \{
            "value": "'no'",
            "computed": false
          },
          \{
            "value": "'no-hide-descendants'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "Controls how view is important for accessibility which is if it\\nfires accessibility events and if it is reported to accessibility services\\nthat query the screen. Works for Android only.\\n\\nPossible values:\\n\\n - \`'auto'\` - The system determines whether the view is important for accessibility -\\n   default (recommended).\\n - \`'yes'\` - The view is important for accessibility.\\n - \`'no'\` - The view is not important for accessibility.\\n - \`'no-hide-descendants'\` - The view is not important for accessibility,\\n   nor are any of its descendant views.\\n\\nSee the [Android \`importantForAccessibility\` docs](http://developer.android.com/reference/android/R.attr.html#importantForAccessibility)\\nfor reference.\\n\\n@platform android"
    },
    "accessibilityTraits": \{
      "type": \{
        "name": "union",
        "value": [
          \{
            "name": "enum",
            "computed": true,
            "value": "AccessibilityTraits"
          },
          \{
            "name": "arrayOf",
            "value": \{
              "name": "enum",
              "computed": true,
              "value": "AccessibilityTraits"
            }
          }
        ]
      },
      "required": false,
      "description": "Provides additional traits to screen reader. By default no traits are\\nprovided unless specified otherwise in element.\\n\\nYou can provide one trait or an array of many traits.\\n\\nPossible values for \`AccessibilityTraits\` are:\\n\\n- \`'none'\` - The element has no traits.\\n- \`'button'\` - The element should be treated as a button.\\n- \`'link'\` - The element should be treated as a link.\\n- \`'header'\` - The element is a header that divides content into sections.\\n- \`'search'\` - The element should be treated as a search field.\\n- \`'image'\` - The element should be treated as an image.\\n- \`'selected'\` - The element is selected.\\n- \`'plays'\` - The element plays sound.\\n- \`'key'\` - The element should be treated like a keyboard key.\\n- \`'text'\` - The element should be treated as text.\\n- \`'summary'\` - The element provides app summary information.\\n- \`'disabled'\` - The element is disabled.\\n- \`'frequentUpdates'\` - The element frequently changes its value.\\n- \`'startsMedia'\` - The element starts a media session.\\n- \`'adjustable'\` - The element allows adjustment over a range of values.\\n- \`'allowsDirectInteraction'\` - The element allows direct touch interaction for VoiceOver users.\\n- \`'pageTurn'\` - Informs VoiceOver that it should scroll to the next page when it finishes reading the contents of the element.\\n\\nSee the [Accessibility guide](docs/accessibility.html#accessibilitytraits-ios)\\nfor more information.\\n\\n@platform ios"
    },
    "accessibilityViewIsModal": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "A value indicating whether VoiceOver should ignore the elements\\nwithin views that are siblings of the receiver.\\nDefault is \`false\`.\\n\\nSee the [Accessibility guide](docs/accessibility.html#accessibilitytraits-ios)\\nfor more information.\\n\\n@platform ios"
    },
    "onAccessibilityTap": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "When \`accessible\` is true, the system will try to invoke this function\\nwhen the user performs accessibility tap gesture."
    },
    "onMagicTap": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "When \`accessible\` is \`true\`, the system will invoke this function when the\\nuser performs the magic tap gesture."
    },
    "testID": \{
      "type": \{
        "name": "string"
      },
      "required": false,
      "description": "Used to locate this view in end-to-end tests.\\n\\n> This disables the 'layout-only view removal' optimization for this view!"
    },
    "nativeID": \{
      "type": \{
        "name": "string"
      },
      "required": false,
      "description": "Used to locate this view from native classes.\\n\\n> This disables the 'layout-only view removal' optimization for this view!"
    },
    "onResponderGrant": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "The View is now responding for touch events. This is the time to highlight and show the user\\nwhat is happening.\\n\\n\`View.props.onResponderGrant: (event) => \{}\`, where \`event\` is a synthetic touch event as\\ndescribed above."
    },
    "onResponderMove": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "The user is moving their finger.\\n\\n\`View.props.onResponderMove: (event) => \{}\`, where \`event\` is a synthetic touch event as\\ndescribed above."
    },
    "onResponderReject": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Another responder is already active and will not release it to that \`View\` asking to be\\nthe responder.\\n\\n\`View.props.onResponderReject: (event) => \{}\`, where \`event\` is a synthetic touch event as\\ndescribed above."
    },
    "onResponderRelease": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Fired at the end of the touch.\\n\\n\`View.props.onResponderRelease: (event) => \{}\`, where \`event\` is a synthetic touch event as\\ndescribed above."
    },
    "onResponderTerminate": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "The responder has been taken from the \`View\`. Might be taken by other views after a call to\\n\`onResponderTerminationRequest\`, or might be taken by the OS without asking (e.g., happens\\nwith control center/ notification center on iOS)\\n\\n\`View.props.onResponderTerminate: (event) => \{}\`, where \`event\` is a synthetic touch event as\\ndescribed above."
    },
    "onResponderTerminationRequest": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Some other \`View\` wants to become responder and is asking this \`View\` to release its\\nresponder. Returning \`true\` allows its release.\\n\\n\`View.props.onResponderTerminationRequest: (event) => \{}\`, where \`event\` is a synthetic touch\\nevent as described above."
    },
    "onStartShouldSetResponder": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Does this view want to become responder on the start of a touch?\\n\\n\`View.props.onStartShouldSetResponder: (event) => [true | false]\`, where \`event\` is a\\nsynthetic touch event as described above."
    },
    "onStartShouldSetResponderCapture": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "If a parent \`View\` wants to prevent a child \`View\` from becoming responder on a touch start,\\nit should have this handler which returns \`true\`.\\n\\n\`View.props.onStartShouldSetResponderCapture: (event) => [true | false]\`, where \`event\` is a\\nsynthetic touch event as described above."
    },
    "onMoveShouldSetResponder": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Does this view want to \\"claim\\" touch responsiveness? This is called for every touch move on\\nthe \`View\` when it is not the responder.\\n\\n\`View.props.onMoveShouldSetResponder: (event) => [true | false]\`, where \`event\` is a\\nsynthetic touch event as described above."
    },
    "onMoveShouldSetResponderCapture": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "If a parent \`View\` wants to prevent a child \`View\` from becoming responder on a move,\\nit should have this handler which returns \`true\`.\\n\\n\`View.props.onMoveShouldSetResponderCapture: (event) => [true | false]\`, where \`event\` is a\\nsynthetic touch event as described above."
    },
    "hitSlop": \{
      "type": \{
        "name": "custom",
        "raw": "EdgeInsetsPropType"
      },
      "required": false,
      "description": "This defines how far a touch event can start away from the view.\\nTypical interface guidelines recommend touch targets that are at least\\n30 - 40 points/density-independent pixels.\\n\\nFor example, if a touchable view has a height of 20 the touchable height can be extended to\\n40 with \`hitSlop=\{\{top: 10, bottom: 10, left: 0, right: 0}}\`\\n\\n> The touch area never extends past the parent view bounds and the Z-index\\n> of sibling views always takes precedence if a touch hits two overlapping\\n> views."
    },
    "onLayout": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Invoked on mount and layout changes with:\\n\\n\`\{nativeEvent: \{ layout: \{x, y, width, height}}}\`\\n\\nThis event is fired immediately once the layout has been calculated, but\\nthe new layout may not yet be reflected on the screen at the time the\\nevent is received, especially if a layout animation is in progress."
    },
    "pointerEvents": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "'box-none'",
            "computed": false
          },
          \{
            "value": "'none'",
            "computed": false
          },
          \{
            "value": "'box-only'",
            "computed": false
          },
          \{
            "value": "'auto'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "Controls whether the \`View\` can be the target of touch events.\\n\\n  - \`'auto'\`: The View can be the target of touch events.\\n  - \`'none'\`: The View is never the target of touch events.\\n  - \`'box-none'\`: The View is never the target of touch events but it's\\n    subviews can be. It behaves like if the view had the following classes\\n    in CSS:\\n\`\`\`\\n.box-none \{\\n     pointer-events: none;\\n}\\n.box-none * \{\\n     pointer-events: all;\\n}\\n\`\`\`\\n  - \`'box-only'\`: The view can be the target of touch events but it's\\n    subviews cannot be. It behaves like if the view had the following classes\\n    in CSS:\\n\`\`\`\\n.box-only \{\\n     pointer-events: all;\\n}\\n.box-only * \{\\n     pointer-events: none;\\n}\\n\`\`\`\\n> Since \`pointerEvents\` does not affect layout/appearance, and we are\\n> already deviating from the spec by adding additional modes, we opt to not\\n> include \`pointerEvents\` on \`style\`. On some platforms, we would need to\\n> implement it as a \`className\` anyways. Using \`style\` or not is an\\n> implementation detail of the platform."
    },
    "style": \{
      "type": \{
        "name": "custom",
        "raw": "stylePropType"
      },
      "required": false,
      "description": ""
    },
    "removeClippedSubviews": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "This is a special performance property exposed by \`RCTView\` and is useful\\nfor scrolling content when there are many subviews, most of which are\\noffscreen. For this property to be effective, it must be applied to a\\nview that contains many subviews that extend outside its bound. The\\nsubviews must also have \`overflow: hidden\`, as should the containing view\\n(or one of its superviews)."
    },
    "renderToHardwareTextureAndroid": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "Whether this \`View\` should render itself (and all of its children) into a\\nsingle hardware texture on the GPU.\\n\\nOn Android, this is useful for animations and interactions that only\\nmodify opacity, rotation, translation, and/or scale: in those cases, the\\nview doesn't have to be redrawn and display lists don't need to be\\nre-executed. The texture can just be re-used and re-composited with\\ndifferent parameters. The downside is that this can use up limited video\\nmemory, so this prop should be set back to false at the end of the\\ninteraction/animation.\\n\\n@platform android"
    },
    "shouldRasterizeIOS": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "Whether this \`View\` should be rendered as a bitmap before compositing.\\n\\nOn iOS, this is useful for animations and interactions that do not\\nmodify this component's dimensions nor its children; for example, when\\ntranslating the position of a static view, rasterization allows the\\nrenderer to reuse a cached bitmap of a static view and quickly composite\\nit during each frame.\\n\\nRasterization incurs an off-screen drawing pass and the bitmap consumes\\nmemory. Test and measure when using this property.\\n\\n@platform ios"
    },
    "collapsable": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "Views that are only used to layout their children or otherwise don't draw\\nanything may be automatically removed from the native hierarchy as an\\noptimization. Set this property to \`false\` to disable this optimization and\\nensure that this \`View\` exists in the native view hierarchy.\\n\\n@platform android"
    },
    "needsOffscreenAlphaCompositing": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "Whether this \`View\` needs to rendered offscreen and composited with an alpha\\nin order to preserve 100% correct colors and blending behavior. The default\\n(\`false\`) falls back to drawing the component and its children with an alpha\\napplied to the paint used to draw each element instead of rendering the full\\ncomponent offscreen and compositing it back with an alpha value. This default\\nmay be noticeable and undesired in the case where the \`View\` you are setting\\nan opacity on has multiple overlapping elements (e.g. multiple overlapping\\n\`View\`s, or text and a background).\\n\\nRendering offscreen to preserve correct alpha behavior is extremely\\nexpensive and hard to debug for non-native developers, which is why it is\\nnot turned on by default. If you do need to enable this property for an\\nanimation, consider combining it with renderToHardwareTextureAndroid if the\\nview **contents** are static (i.e. it doesn't need to be redrawn each frame).\\nIf that property is enabled, this View will be rendered off-screen once,\\nsaved in a hardware texture, and then composited onto the screen with an alpha\\neach frame without having to switch rendering targets on the GPU.\\n\\n@platform android"
    }
  },
  "type": "style",
  "filepath": "Libraries/Components/View/ViewPropTypes.js",
  "componentName": "ViewPropTypes",
  "componentPlatform": "cross"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"viewproptypes","title":"ViewPropTypes","layout":"autodocs","category":"APIs","permalink":"docs/viewproptypes.html","platform":"cross","next":"viewproptypes","previous":"layout-props","sidebar":true,"path":"Libraries/Components/View/ViewPropTypes.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;