/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "methods": [
    \{
      "line": 109,
      "source": "addListener(eventName: KeyboardEventName, callback: KeyboardEventListener) \{\\n    invariant(false, 'Dummy method used for documentation');\\n  }",
      "docblock": "/**\\n   * The \`addListener\` function connects a JavaScript function to an identified native\\n   * keyboard notification event.\\n   *\\n   * This function then returns the reference to the listener.\\n   *\\n   * @param \{string} eventName The \`nativeEvent\` is the string that identifies the event you're listening for.  This\\n   *can be any of the following:\\n   *\\n   * - \`keyboardWillShow\`\\n   * - \`keyboardDidShow\`\\n   * - \`keyboardWillHide\`\\n   * - \`keyboardDidHide\`\\n   * - \`keyboardWillChangeFrame\`\\n   * - \`keyboardDidChangeFrame\`\\n   *\\n   * Note that if you set \`android:windowSoftInputMode\` to \`adjustResize\`  or \`adjustNothing\`,\\n   * only \`keyboardDidShow\` and \`keyboardDidHide\` events will be available on Android.\\n   * \`keyboardWillShow\` as well as \`keyboardWillHide\` are generally not available on Android\\n   * since there is no native corresponding event.\\n   *\\n   * @param \{function} callback function to be called when the event fires.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"KeyboardEventName\\",\\"length\\":1}",
          "name": "eventName"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"KeyboardEventListener\\",\\"length\\":1}",
          "name": "callback"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "addListener"
    },
    \{
      "line": 119,
      "source": "removeListener(eventName: KeyboardEventName, callback: Function) \{\\n    invariant(false, 'Dummy method used for documentation');\\n  }",
      "docblock": "/**\\n   * Removes a specific listener.\\n   *\\n   * @param \{string} eventName The \`nativeEvent\` is the string that identifies the event you're listening for.\\n   * @param \{function} callback function to be called when the event fires.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"KeyboardEventName\\",\\"length\\":1}",
          "name": "eventName"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Function\\",\\"length\\":1}",
          "name": "callback"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "removeListener"
    },
    \{
      "line": 128,
      "source": "removeAllListeners(eventName: KeyboardEventName) \{\\n    invariant(false, 'Dummy method used for documentation');\\n  }",
      "docblock": "/**\\n   * Removes all listeners for a specific event type.\\n   *\\n   * @param \{string} eventType The native event string listeners are watching which will be removed.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"KeyboardEventName\\",\\"length\\":1}",
          "name": "eventName"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "removeAllListeners"
    },
    \{
      "line": 135,
      "source": "dismiss() \{\\n    invariant(false, 'Dummy method used for documentation');\\n  }",
      "docblock": "/**\\n   * Dismisses the active keyboard and removes focus.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [],
      "tparams": null,
      "returntypehint": null,
      "name": "dismiss"
    }
  ],
  "properties": [],
  "classes": [],
  "superClass": null,
  "type": "api",
  "line": 85,
  "name": "Keyboard",
  "docblock": "/**\\n * \`Keyboard\` module to control keyboard events.\\n *\\n * ### Usage\\n *\\n * The Keyboard module allows you to listen for native events and react to them, as\\n * well as make changes to the keyboard, like dismissing it.\\n *\\n *\`\`\`\\n * import React, \{ Component } from 'react';\\n * import \{ Keyboard, TextInput } from 'react-native';\\n *\\n * class Example extends Component \{\\n *   componentWillMount () \{\\n *     this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);\\n *     this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);\\n *   }\\n *\\n *   componentWillUnmount () \{\\n *     this.keyboardDidShowListener.remove();\\n *     this.keyboardDidHideListener.remove();\\n *   }\\n *\\n *   _keyboardDidShow () \{\\n *     alert('Keyboard Shown');\\n *   }\\n *\\n *   _keyboardDidHide () \{\\n *     alert('Keyboard Hidden');\\n *   }\\n *\\n *   render() \{\\n *     return (\\n *       <TextInput\\n *         onSubmitEditing=\{Keyboard.dismiss}\\n *       />\\n *     );\\n *   }\\n * }\\n *\`\`\`\\n */\\n",
  "requires": [
    \{
      "name": "fbjs/lib/invariant"
    },
    \{
      "name": "NativeEventEmitter"
    },
    \{
      "name": "NativeModules"
    },
    \{
      "name": "dismissKeyboard"
    }
  ],
  "filepath": "Libraries/Components/Keyboard/Keyboard.js",
  "componentName": "Keyboard",
  "componentPlatform": "cross"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"keyboard","title":"Keyboard","layout":"autodocs","category":"APIs","permalink":"docs/keyboard.html","platform":"cross","next":"keyboard","previous":"imagestore","sidebar":true,"path":"Libraries/Components/Keyboard/Keyboard.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;