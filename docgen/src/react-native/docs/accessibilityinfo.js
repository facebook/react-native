/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "methods": [
    \{
      "line": 87,
      "source": "fetch: function(): Promise \{\\n    return new Promise((resolve, reject) => \{\\n      AccessibilityManager.getCurrentVoiceOverState(\\n        resolve,\\n        reject\\n      );\\n    });\\n  }",
      "docblock": "/**\\n   * Query whether a screen reader is currently enabled. Returns a promise which\\n   * resolves to a boolean. The result is \`true\` when a screen reader is enabled\\n   * and \`false\` otherwise.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Promise\\",\\"length\\":1}",
      "name": "fetch"
    },
    \{
      "line": 108,
      "source": "addEventListener: function (\\n    eventName: ChangeEventName,\\n    handler: Function\\n  ): Object \{\\n    var listener;\\n\\n    if (eventName === 'change') \{\\n      listener = RCTDeviceEventEmitter.addListener(\\n        VOICE_OVER_EVENT,\\n        handler\\n      );\\n    } else if (eventName === 'announcementFinished') \{\\n      listener = RCTDeviceEventEmitter.addListener(\\n        ANNOUNCEMENT_DID_FINISH_EVENT,\\n        handler\\n      );\\n    }\\n\\n    _subscriptions.set(handler, listener);\\n    return \{\\n      remove: AccessibilityInfo.removeEventListener.bind(null, eventName, handler),\\n    };\\n  }",
      "docblock": "/**\\n   * Add an event handler. Supported events:\\n   *\\n   * - \`change\`: Fires when the state of the screen reader changes. The argument\\n   *   to the event handler is a boolean. The boolean is \`true\` when a screen\\n   *   reader is enabled and \`false\` otherwise.\\n   * - \`announcementFinished\`: iOS-only event. Fires when the screen reader has\\n   *   finished making an announcement. The argument to the event handler is a dictionary\\n   *   with these keys:\\n   *     - \`announcement\`: The string announced by the screen reader.\\n   *     - \`success\`: A boolean indicating whether the announcement was successfully made.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"ChangeEventName\\",\\"length\\":1}",
          "name": "eventName"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Function\\",\\"length\\":1}",
          "name": "handler"
        }
      ],
      "tparams": null,
      "returntypehint": "Object",
      "name": "addEventListener"
    },
    \{
      "line": 135,
      "source": "setAccessibilityFocus: function(\\n    reactTag: number\\n  ): void \{\\n    AccessibilityManager.setAccessibilityFocus(reactTag);\\n  }",
      "docblock": "/**\\n   * iOS-Only. Set accessibility focus to a react component.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
          "name": "reactTag"
        }
      ],
      "tparams": null,
      "returntypehint": "void",
      "name": "setAccessibilityFocus"
    },
    \{
      "line": 144,
      "source": "announceForAccessibility: function(\\n    announcement: string\\n  ): void \{\\n    AccessibilityManager.announceForAccessibility(announcement);\\n  }",
      "docblock": "/**\\n   * iOS-Only. Post a string to be announced by the screen reader.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "announcement"
        }
      ],
      "tparams": null,
      "returntypehint": "void",
      "name": "announceForAccessibility"
    },
    \{
      "line": 153,
      "source": "removeEventListener: function(\\n    eventName: ChangeEventName,\\n    handler: Function\\n  ): void \{\\n    var listener = _subscriptions.get(handler);\\n    if (!listener) \{\\n      return;\\n    }\\n    listener.remove();\\n    _subscriptions.delete(handler);\\n  }",
      "docblock": "/**\\n   * Remove an event handler.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"ChangeEventName\\",\\"length\\":1}",
          "name": "eventName"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Function\\",\\"length\\":1}",
          "name": "handler"
        }
      ],
      "tparams": null,
      "returntypehint": "void",
      "name": "removeEventListener"
    }
  ],
  "properties": [],
  "classes": [],
  "superClass": null,
  "type": "api",
  "line": 80,
  "name": "AccessibilityInfo",
  "docblock": "/**\\n * Sometimes it's useful to know whether or not the device has a screen reader that is currently active. The\\n * \`AccessibilityInfo\` API is designed for this purpose. You can use it to query the current state of the\\n * screen reader as well as to register to be notified when the state of the screen reader changes.\\n *\\n * Here's a small example illustrating how to use \`AccessibilityInfo\`:\\n *\\n * \`\`\`javascript\\n * class ScreenReaderStatusExample extends React.Component \{\\n *   state = \{\\n *     screenReaderEnabled: false,\\n *   }\\n *\\n *   componentDidMount() \{\\n *     AccessibilityInfo.addEventListener(\\n *       'change',\\n *       this._handleScreenReaderToggled\\n *     );\\n *     AccessibilityInfo.fetch().done((isEnabled) => \{\\n *       this.setState(\{\\n *         screenReaderEnabled: isEnabled\\n *       });\\n *     });\\n *   }\\n *\\n *   componentWillUnmount() \{\\n *     AccessibilityInfo.removeEventListener(\\n *       'change',\\n *       this._handleScreenReaderToggled\\n *     );\\n *   }\\n *\\n *   _handleScreenReaderToggled = (isEnabled) => \{\\n *     this.setState(\{\\n *       screenReaderEnabled: isEnabled,\\n *     });\\n *   }\\n *\\n *   render() \{\\n *     return (\\n *       <View>\\n *         <Text>\\n *           The screen reader is \{this.state.screenReaderEnabled ? 'enabled' : 'disabled'}.\\n *         </Text>\\n *       </View>\\n *     );\\n *   }\\n * }\\n * \`\`\`\\n */\\n",
  "requires": [
    \{
      "name": "NativeModules"
    },
    \{
      "name": "Promise"
    },
    \{
      "name": "RCTDeviceEventEmitter"
    }
  ],
  "filepath": "Libraries/Components/AccessibilityInfo/AccessibilityInfo.ios.js",
  "componentName": "AccessibilityInfo",
  "componentPlatform": "cross"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"accessibilityinfo","title":"AccessibilityInfo","layout":"autodocs","category":"APIs","permalink":"docs/accessibilityinfo.html","platform":"cross","next":"actionsheetios","previous":"webview","sidebar":true,"path":"Libraries/Components/AccessibilityInfo/AccessibilityInfo.ios.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;