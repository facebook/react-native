/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "name": "AppState",
  "docblock": "/**\\n * \`AppState\` can tell you if the app is in the foreground or background,\\n * and notify you when the state changes.\\n *\\n * AppState is frequently used to determine the intent and proper behavior when\\n * handling push notifications.\\n *\\n * ### App States\\n *\\n *  - \`active\` - The app is running in the foreground\\n *  - \`background\` - The app is running in the background. The user is either\\n *     in another app or on the home screen\\n *  - \`inactive\` - This is a state that occurs when transitioning between\\n *     foreground & background, and during periods of inactivity such as\\n *     entering the Multitasking view or in the event of an incoming call\\n *\\n * For more information, see\\n * [Apple's documentation](https://developer.apple.com/library/ios/documentation/iPhone/Conceptual/iPhoneOSProgrammingGuide/TheAppLifeCycle/TheAppLifeCycle.html)\\n *\\n * ### Basic Usage\\n *\\n * To see the current state, you can check \`AppState.currentState\`, which\\n * will be kept up-to-date. However, \`currentState\` will be null at launch\\n * while \`AppState\` retrieves it over the bridge.\\n *\\n * \`\`\`\\n * import React, \{Component} from 'react'\\n * import \{AppState, Text} from 'react-native'\\n *\\n * class AppStateExample extends Component \{\\n *\\n *   state = \{\\n *     appState: AppState.currentState\\n *   }\\n *\\n *   componentDidMount() \{\\n *     AppState.addEventListener('change', this._handleAppStateChange);\\n *   }\\n *\\n *   componentWillUnmount() \{\\n *     AppState.removeEventListener('change', this._handleAppStateChange);\\n *   }\\n *\\n *   _handleAppStateChange = (nextAppState) => \{\\n *     if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') \{\\n *       console.log('App has come to the foreground!')\\n *     }\\n *     this.setState(\{appState: nextAppState});\\n *   }\\n *\\n *   render() \{\\n *     return (\\n *       <Text>Current state is: \{this.state.appState}</Text>\\n *     );\\n *   }\\n *\\n * }\\n * \`\`\`\\n *\\n * This example will only ever appear to say \\"Current state is: active\\" because\\n * the app is only visible to the user when in the \`active\` state, and the null\\n * state will happen only momentarily.\\n */\\n",
  "methods": [
    \{
      "line": 90,
      "source": "= true;\\n\\n  constructor() \{\\n    super(RCTAppState);\\n\\n    this.isAvailable = true;\\n    this._eventHandlers = \{\\n      change: new Map(),\\n      memoryWarning: new Map(),\\n    };\\n\\n    // TODO: Remove the 'active' fallback after \`initialAppState\` is exported by\\n    // the Android implementation.\\n    this.currentState = RCTAppState.initialAppState || 'active';\\n\\n    // TODO: this is a terrible solution - in order to ensure \`currentState\` prop\\n    // is up to date, we have to register an observer that updates it whenever\\n    // the state changes, even if nobody cares. We should just deprecate the\\n    // \`currentState\` property and get rid of this.\\n    this.addListener(\\n      'appStateDidChange',\\n      (appStateData) => \{\\n        this.currentState = appStateData.app_state;\\n      }\\n    );\\n\\n    // TODO: see above - this request just populates the value of \`currentState\`\\n    // when the module is first initialized. Would be better to get rid of the prop\\n    // and expose \`getCurrentAppState\` method directly.\\n    RCTAppState.getCurrentAppState(\\n      (appStateData) => \{\\n        this.currentState = appStateData.app_state;\\n      },\\n      logError\\n    );\\n  }",
      "modifiers": [],
      "params": [
        \{
          "typehint": null,
          "name": ";"
        },
        \{
          "typehint": null,
          "name": "("
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "="
    },
    \{
      "line": 137,
      "source": "addEventListener(\\n    type: string,\\n    handler: Function\\n  ) \{\\n    invariant(\\n      ['change', 'memoryWarning'].indexOf(type) !== -1,\\n      'Trying to subscribe to unknown event: \\"%s\\"', type\\n    );\\n    if (type === 'change') \{\\n      this._eventHandlers[type].set(handler, this.addListener(\\n        'appStateDidChange',\\n        (appStateData) => \{\\n          handler(appStateData.app_state);\\n        }\\n      ));\\n    } else if (type === 'memoryWarning') \{\\n      this._eventHandlers[type].set(handler, this.addListener(\\n        'memoryWarning',\\n        handler\\n      ));\\n    }\\n  }",
      "docblock": "/**\\n   * Add a handler to AppState changes by listening to the \`change\` event type\\n   * and providing the handler\\n   *\\n   * TODO: now that AppState is a subclass of NativeEventEmitter, we could deprecate\\n   * \`addEventListener\` and \`removeEventListener\` and just use \`addListener\` and\\n   * \`listener.remove()\` directly. That will be a breaking change though, as both\\n   * the method and event names are different (addListener events are currently\\n   * required to be globally unique).\\n   */\\n",
      "modifiers": [],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "type"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Function\\",\\"length\\":1}",
          "name": "handler"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "addEventListener"
    },
    \{
      "line": 163,
      "source": "removeEventListener(\\n    type: string,\\n    handler: Function\\n  ) \{\\n    invariant(\\n      ['change', 'memoryWarning'].indexOf(type) !== -1,\\n      'Trying to remove listener for unknown event: \\"%s\\"', type\\n    );\\n    if (!this._eventHandlers[type].has(handler)) \{\\n      return;\\n    }\\n    this._eventHandlers[type].get(handler).remove();\\n    this._eventHandlers[type].delete(handler);\\n  }",
      "docblock": "/**\\n   * Remove a handler by passing the \`change\` event type and the handler\\n   */\\n",
      "modifiers": [],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "type"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Function\\",\\"length\\":1}",
          "name": "handler"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "removeEventListener"
    }
  ],
  "superClass": "NativeEventEmitter",
  "type": "api",
  "line": 86,
  "requires": [
    \{
      "name": "MissingNativeEventEmitterShim"
    },
    \{
      "name": "NativeEventEmitter"
    },
    \{
      "name": "NativeModules"
    },
    \{
      "name": "logError"
    },
    \{
      "name": "fbjs/lib/invariant"
    }
  ],
  "filepath": "Libraries/AppState/AppState.js",
  "componentName": "AppState",
  "componentPlatform": "cross"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"appstate","title":"AppState","layout":"autodocs","category":"APIs","permalink":"docs/appstate.html","platform":"cross","next":"asyncstorage","previous":"appregistry","sidebar":true,"path":"Libraries/AppState/AppState.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;