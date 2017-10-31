/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "description": "A foundational component for inputting text into the app via a\\nkeyboard. Props provide configurability for several features, such as\\nauto-correction, auto-capitalization, placeholder text, and different keyboard\\ntypes, such as a numeric keypad.\\n\\nThe simplest use case is to plop down a \`TextInput\` and subscribe to the\\n\`onChangeText\` events to read the user input. There are also other events,\\nsuch as \`onSubmitEditing\` and \`onFocus\` that can be subscribed to. A simple\\nexample:\\n\\n\`\`\`ReactNativeWebPlayer\\nimport React, \{ Component } from 'react';\\nimport \{ AppRegistry, TextInput } from 'react-native';\\n\\nexport default class UselessTextInput extends Component \{\\n  constructor(props) \{\\n    super(props);\\n    this.state = \{ text: 'Useless Placeholder' };\\n  }\\n\\n  render() \{\\n    return (\\n      <TextInput\\n        style=\{\{height: 40, borderColor: 'gray', borderWidth: 1}}\\n        onChangeText=\{(text) => this.setState(\{text})}\\n        value=\{this.state.text}\\n      />\\n    );\\n  }\\n}\\n\\n// skip this line if using Create React Native App\\nAppRegistry.registerComponent('AwesomeProject', () => UselessTextInput);\\n\`\`\`\\n\\nNote that some props are only available with \`multiline=\{true/false}\`.\\nAdditionally, border styles that apply to only one side of the element\\n(e.g., \`borderBottomColor\`, \`borderLeftWidth\`, etc.) will not be applied if\\n\`multiline=false\`. To achieve the same effect, you can wrap your \`TextInput\`\\nin a \`View\`:\\n\\n\`\`\`ReactNativeWebPlayer\\nimport React, \{ Component } from 'react';\\nimport \{ AppRegistry, View, TextInput } from 'react-native';\\n\\nclass UselessTextInput extends Component \{\\n  render() \{\\n    return (\\n      <TextInput\\n        \{...this.props} // Inherit any props passed to it; e.g., multiline, numberOfLines below\\n        editable = \{true}\\n        maxLength = \{40}\\n      />\\n    );\\n  }\\n}\\n\\nexport default class UselessTextInputMultiline extends Component \{\\n  constructor(props) \{\\n    super(props);\\n    this.state = \{\\n      text: 'Useless Multiline Placeholder',\\n    };\\n  }\\n\\n  // If you type something in the text box that is a color, the background will change to that\\n  // color.\\n  render() \{\\n    return (\\n     <View style=\{\{\\n       backgroundColor: this.state.text,\\n       borderBottomColor: '#000000',\\n       borderBottomWidth: 1 }}\\n     >\\n       <UselessTextInput\\n         multiline = \{true}\\n         numberOfLines = \{4}\\n         onChangeText=\{(text) => this.setState(\{text})}\\n         value=\{this.state.text}\\n       />\\n     </View>\\n    );\\n  }\\n}\\n\\n// skip these lines if using Create React Native App\\nAppRegistry.registerComponent(\\n 'AwesomeProject',\\n () => UselessTextInputMultiline\\n);\\n\`\`\`\\n\\n\`TextInput\` has by default a border at the bottom of its view. This border\\nhas its padding set by the background image provided by the system, and it\\ncannot be changed. Solutions to avoid this is to either not set height\\nexplicitly, case in which the system will take care of displaying the border\\nin the correct position, or to not display the border by setting\\n\`underlineColorAndroid\` to transparent.\\n\\nNote that on Android performing text selection in input can change\\napp's activity \`windowSoftInputMode\` param to \`adjustResize\`.\\nThis may cause issues with components that have position: 'absolute'\\nwhile keyboard is active. To avoid this behavior either specify \`windowSoftInputMode\`\\nin AndroidManifest.xml ( https://developer.android.com/guide/topics/manifest/activity-element.html )\\nor control this param programmatically with native code.",
  "displayName": "TextInput",
  "methods": [
    \{
      "name": "isFocused",
      "docblock": "Returns \`true\` if the input is currently focused; \`false\` otherwise.",
      "modifiers": [],
      "params": [],
      "returns": \{
        "type": [
          null
        ]
      },
      "description": "Returns \`true\` if the input is currently focused; \`false\` otherwise."
    },
    \{
      "name": "clear",
      "docblock": "Removes all text from the \`TextInput\`.",
      "modifiers": [],
      "params": [],
      "returns": null,
      "description": "Removes all text from the \`TextInput\`."
    }
  ],
  "props": \{
    "autoCapitalize": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "'none'",
            "computed": false
          },
          \{
            "value": "'sentences'",
            "computed": false
          },
          \{
            "value": "'words'",
            "computed": false
          },
          \{
            "value": "'characters'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "Can tell \`TextInput\` to automatically capitalize certain characters.\\n\\n- \`characters\`: all characters.\\n- \`words\`: first letter of each word.\\n- \`sentences\`: first letter of each sentence (*default*).\\n- \`none\`: don't auto capitalize anything."
    },
    "autoCorrect": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "If \`false\`, disables auto-correct. The default value is \`true\`."
    },
    "spellCheck": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "If \`false\`, disables spell-check style (i.e. red underlines).\\nThe default value is inherited from \`autoCorrect\`.\\n@platform ios"
    },
    "autoFocus": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "If \`true\`, focuses the input on \`componentDidMount\`.\\nThe default value is \`false\`."
    },
    "editable": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "If \`false\`, text is not editable. The default value is \`true\`."
    },
    "keyboardType": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "\\"default\\"",
            "computed": false
          },
          \{
            "value": "'email-address'",
            "computed": false
          },
          \{
            "value": "'numeric'",
            "computed": false
          },
          \{
            "value": "'phone-pad'",
            "computed": false
          },
          \{
            "value": "\\"ascii-capable\\"",
            "computed": false
          },
          \{
            "value": "'numbers-and-punctuation'",
            "computed": false
          },
          \{
            "value": "'url'",
            "computed": false
          },
          \{
            "value": "'number-pad'",
            "computed": false
          },
          \{
            "value": "'name-phone-pad'",
            "computed": false
          },
          \{
            "value": "'decimal-pad'",
            "computed": false
          },
          \{
            "value": "'twitter'",
            "computed": false
          },
          \{
            "value": "'web-search'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "Determines which keyboard to open, e.g.\`numeric\`.\\n\\nThe following values work across platforms:\\n\\n- \`default\`\\n- \`numeric\`\\n- \`email-address\`\\n- \`phone-pad\`"
    },
    "keyboardAppearance": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "'default'",
            "computed": false
          },
          \{
            "value": "'light'",
            "computed": false
          },
          \{
            "value": "'dark'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "Determines the color of the keyboard.\\n@platform ios"
    },
    "returnKeyType": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "\\"done\\"",
            "computed": false
          },
          \{
            "value": "'go'",
            "computed": false
          },
          \{
            "value": "'next'",
            "computed": false
          },
          \{
            "value": "'search'",
            "computed": false
          },
          \{
            "value": "'send'",
            "computed": false
          },
          \{
            "value": "\\"none\\"",
            "computed": false
          },
          \{
            "value": "'previous'",
            "computed": false
          },
          \{
            "value": "\\"default\\"",
            "computed": false
          },
          \{
            "value": "'emergency-call'",
            "computed": false
          },
          \{
            "value": "'google'",
            "computed": false
          },
          \{
            "value": "'join'",
            "computed": false
          },
          \{
            "value": "'route'",
            "computed": false
          },
          \{
            "value": "'yahoo'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "Determines how the return key should look. On Android you can also use\\n\`returnKeyLabel\`.\\n\\n*Cross platform*\\n\\nThe following values work across platforms:\\n\\n- \`done\`\\n- \`go\`\\n- \`next\`\\n- \`search\`\\n- \`send\`\\n\\n*Android Only*\\n\\nThe following values work on Android only:\\n\\n- \`none\`\\n- \`previous\`\\n\\n*iOS Only*\\n\\nThe following values work on iOS only:\\n\\n- \`default\`\\n- \`emergency-call\`\\n- \`google\`\\n- \`join\`\\n- \`route\`\\n- \`yahoo\`"
    },
    "returnKeyLabel": \{
      "type": \{
        "name": "string"
      },
      "required": false,
      "description": "Sets the return key to the label. Use it instead of \`returnKeyType\`.\\n@platform android"
    },
    "maxLength": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": "Limits the maximum number of characters that can be entered. Use this\\ninstead of implementing the logic in JS to avoid flicker."
    },
    "numberOfLines": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": "Sets the number of lines for a \`TextInput\`. Use it with multiline set to\\n\`true\` to be able to fill the lines.\\n@platform android"
    },
    "disableFullscreenUI": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "When \`false\`, if there is a small amount of space available around a text input\\n(e.g. landscape orientation on a phone), the OS may choose to have the user edit\\nthe text inside of a full screen text input mode. When \`true\`, this feature is\\ndisabled and users will always edit the text directly inside of the text input.\\nDefaults to \`false\`.\\n@platform android"
    },
    "enablesReturnKeyAutomatically": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "If \`true\`, the keyboard disables the return key when there is no text and\\nautomatically enables it when there is text. The default value is \`false\`.\\n@platform ios"
    },
    "multiline": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "If \`true\`, the text input can be multiple lines.\\nThe default value is \`false\`."
    },
    "textBreakStrategy": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "'simple'",
            "computed": false
          },
          \{
            "value": "'highQuality'",
            "computed": false
          },
          \{
            "value": "'balanced'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "Set text break strategy on Android API Level 23+, possible values are \`simple\`, \`highQuality\`, \`balanced\`\\nThe default value is \`simple\`.\\n@platform android"
    },
    "onBlur": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Callback that is called when the text input is blurred."
    },
    "onFocus": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Callback that is called when the text input is focused."
    },
    "onChange": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Callback that is called when the text input's text changes."
    },
    "onChangeText": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Callback that is called when the text input's text changes.\\nChanged text is passed as an argument to the callback handler."
    },
    "onContentSizeChange": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Callback that is called when the text input's content size changes.\\nThis will be called with\\n\`\{ nativeEvent: \{ contentSize: \{ width, height } } }\`.\\n\\nOnly called for multiline text inputs."
    },
    "onEndEditing": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Callback that is called when text input ends."
    },
    "onSelectionChange": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Callback that is called when the text input selection is changed.\\nThis will be called with\\n\`\{ nativeEvent: \{ selection: \{ start, end } } }\`."
    },
    "onSubmitEditing": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Callback that is called when the text input's submit button is pressed.\\nInvalid if \`multiline=\{true}\` is specified."
    },
    "onKeyPress": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Callback that is called when a key is pressed.\\nThis will be called with \`\{ nativeEvent: \{ key: keyValue } }\`\\nwhere \`keyValue\` is \`'Enter'\` or \`'Backspace'\` for respective keys and\\nthe typed-in character otherwise including \`' '\` for space.\\nFires before \`onChange\` callbacks.\\n@platform ios"
    },
    "onLayout": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Invoked on mount and layout changes with \`\{x, y, width, height}\`."
    },
    "onScroll": \{
      "type": \{
        "name": "func"
      },
      "required": false,
      "description": "Invoked on content scroll with \`\{ nativeEvent: \{ contentOffset: \{ x, y } } }\`.\\nMay also contain other properties from ScrollEvent but on Android contentSize\\nis not provided for performance reasons."
    },
    "placeholder": \{
      "type": \{
        "name": "node"
      },
      "required": false,
      "description": "The string that will be rendered before text input has been entered."
    },
    "placeholderTextColor": \{
      "type": \{
        "name": "custom",
        "raw": "ColorPropType"
      },
      "required": false,
      "description": "The text color of the placeholder string."
    },
    "secureTextEntry": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "If \`true\`, the text input obscures the text entered so that sensitive text\\nlike passwords stay secure. The default value is \`false\`."
    },
    "selectionColor": \{
      "type": \{
        "name": "custom",
        "raw": "ColorPropType"
      },
      "required": false,
      "description": "The highlight and cursor color of the text input."
    },
    "selectionState": \{
      "type": \{
        "name": "instanceOf",
        "value": "DocumentSelectionState"
      },
      "required": false,
      "description": "An instance of \`DocumentSelectionState\`, this is some state that is responsible for\\nmaintaining selection information for a document.\\n\\nSome functionality that can be performed with this instance is:\\n\\n- \`blur()\`\\n- \`focus()\`\\n- \`update()\`\\n\\n> You can reference \`DocumentSelectionState\` in\\n> [\`vendor/document/selection/DocumentSelectionState.js\`](https://github.com/facebook/react-native/blob/master/Libraries/vendor/document/selection/DocumentSelectionState.js)\\n\\n@platform ios"
    },
    "selection": \{
      "type": \{
        "name": "shape",
        "value": \{
          "start": \{
            "name": "number",
            "required": true
          },
          "end": \{
            "name": "number",
            "required": false
          }
        }
      },
      "required": false,
      "description": "The start and end of the text input's selection. Set start and end to\\nthe same value to position the cursor."
    },
    "value": \{
      "type": \{
        "name": "string"
      },
      "required": false,
      "description": "The value to show for the text input. \`TextInput\` is a controlled\\ncomponent, which means the native value will be forced to match this\\nvalue prop if provided. For most uses, this works great, but in some\\ncases this may cause flickering - one common cause is preventing edits\\nby keeping value the same. In addition to simply setting the same value,\\neither set \`editable=\{false}\`, or set/update \`maxLength\` to prevent\\nunwanted edits without flicker."
    },
    "defaultValue": \{
      "type": \{
        "name": "string"
      },
      "required": false,
      "description": "Provides an initial value that will change when the user starts typing.\\nUseful for simple use-cases where you do not want to deal with listening\\nto events and updating the value prop to keep the controlled state in sync."
    },
    "clearButtonMode": \{
      "type": \{
        "name": "enum",
        "value": [
          \{
            "value": "'never'",
            "computed": false
          },
          \{
            "value": "'while-editing'",
            "computed": false
          },
          \{
            "value": "'unless-editing'",
            "computed": false
          },
          \{
            "value": "'always'",
            "computed": false
          }
        ]
      },
      "required": false,
      "description": "When the clear button should appear on the right side of the text view.\\n@platform ios"
    },
    "clearTextOnFocus": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "If \`true\`, clears the text field automatically when editing begins.\\n@platform ios"
    },
    "selectTextOnFocus": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "If \`true\`, all text will automatically be selected on focus."
    },
    "blurOnSubmit": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "If \`true\`, the text field will blur when submitted.\\nThe default value is true for single-line fields and false for\\nmultiline fields. Note that for multiline fields, setting \`blurOnSubmit\`\\nto \`true\` means that pressing return will blur the field and trigger the\\n\`onSubmitEditing\` event instead of inserting a newline into the field."
    },
    "style": \{
      "type": \{
        "name": "custom",
        "raw": "Text.propTypes.style"
      },
      "required": false,
      "description": "Note that not all Text styles are supported,\\nsee [Issue#7070](https://github.com/facebook/react-native/issues/7070)\\nfor more detail.\\n\\n[Styles](docs/style.html)"
    },
    "underlineColorAndroid": \{
      "type": \{
        "name": "custom",
        "raw": "ColorPropType"
      },
      "required": false,
      "description": "The color of the \`TextInput\` underline.\\n@platform android"
    },
    "inlineImageLeft": \{
      "type": \{
        "name": "string"
      },
      "required": false,
      "description": "If defined, the provided image resource will be rendered on the left.\\n@platform android"
    },
    "inlineImagePadding": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": "Padding between the inline image, if any, and the text input itself.\\n@platform android"
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
      "description": "Determines the types of data converted to clickable URLs in the text input.\\nOnly valid if \`multiline=\{true}\` and \`editable=\{false}\`.\\nBy default no data types are detected.\\n\\nYou can provide one type or an array of many types.\\n\\nPossible values for \`dataDetectorTypes\` are:\\n\\n- \`'phoneNumber'\`\\n- \`'link'\`\\n- \`'address'\`\\n- \`'calendarEvent'\`\\n- \`'none'\`\\n- \`'all'\`\\n\\n@platform ios"
    },
    "caretHidden": \{
      "type": \{
        "name": "bool"
      },
      "required": false,
      "description": "If \`true\`, caret is hidden. The default value is \`false\`."
    }
  },
  "composes": [
    "ViewPropTypes"
  ],
  "type": "component",
  "filepath": "Libraries/Components/TextInput/TextInput.js",
  "componentName": "TextInput",
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
      <Layout metadata={{"id":"textinput","title":"TextInput","layout":"autodocs","category":"Components","permalink":"docs/textinput.html","platform":"cross","next":"textinput","previous":"tabbarios-item","sidebar":true,"path":"Libraries/Components/TextInput/TextInput.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;