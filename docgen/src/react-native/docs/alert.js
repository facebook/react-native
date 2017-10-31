/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "name": "Alert",
  "docblock": "/**\\n * Launches an alert dialog with the specified title and message.\\n *\\n * Optionally provide a list of buttons. Tapping any button will fire the\\n * respective onPress callback and dismiss the alert. By default, the only\\n * button will be an 'OK' button.\\n *\\n * This is an API that works both on iOS and Android and can show static\\n * alerts. To show an alert that prompts the user to enter some information,\\n * see \`AlertIOS\`; entering text in an alert is common on iOS only.\\n *\\n * ## iOS\\n *\\n * On iOS you can specify any number of buttons. Each button can optionally\\n * specify a style, which is one of 'default', 'cancel' or 'destructive'.\\n *\\n * ## Android\\n *\\n * On Android at most three buttons can be specified. Android has a concept\\n * of a neutral, negative and a positive button:\\n *\\n *   - If you specify one button, it will be the 'positive' one (such as 'OK')\\n *   - Two buttons mean 'negative', 'positive' (such as 'Cancel', 'OK')\\n *   - Three buttons mean 'neutral', 'negative', 'positive' (such as 'Later', 'Cancel', 'OK')\\n *\\n * By default alerts on Android can be dismissed by tapping outside of the alert\\n * box. This event can be handled by providing an optional \`options\` parameter,\\n * with an \`onDismiss\` callback property \`\{ onDismiss: () => \{} }\`.\\n *\\n * Alternatively, the dismissing behavior can be disabled altogether by providing\\n * an optional \`options\` parameter with the \`cancelable\` property set to \`false\`\\n * i.e. \`\{ cancelable: false }\`\\n *\\n * Example usage:\\n * \`\`\`\\n * // Works on both iOS and Android\\n * Alert.alert(\\n *   'Alert Title',\\n *   'My Alert Msg',\\n *   [\\n *     \{text: 'Ask me later', onPress: () => console.log('Ask me later pressed')},\\n *     \{text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},\\n *     \{text: 'OK', onPress: () => console.log('OK Pressed')},\\n *   ],\\n *   \{ cancelable: false }\\n * )\\n * \`\`\`\\n */\\n",
  "methods": [
    \{
      "line": 81,
      "source": "static alert(\\n    title: ?string,\\n    message?: ?string,\\n    buttons?: Buttons,\\n    options?: Options,\\n    type?: AlertType,\\n  ): void \{\\n    if (Platform.OS === 'ios') \{\\n      if (typeof type !== 'undefined') \{\\n        console.warn('Alert.alert() with a 5th \\"type\\" parameter is deprecated and will be removed. Use AlertIOS.prompt() instead.');\\n        AlertIOS.alert(title, message, buttons, type);\\n        return;\\n      }\\n      AlertIOS.alert(title, message, buttons);\\n    } else if (Platform.OS === 'android') \{\\n      AlertAndroid.alert(title, message, buttons, options);\\n    }\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":2,\\"nullable\\":true}",
          "name": "title"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":2,\\"nullable\\":true}",
          "name": "message?"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Buttons\\",\\"length\\":1}",
          "name": "buttons?"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Options\\",\\"length\\":1}",
          "name": "options?"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"AlertType\\",\\"length\\":1}",
          "name": "type?"
        }
      ],
      "tparams": null,
      "returntypehint": "void",
      "name": "alert"
    }
  ],
  "type": "api",
  "line": 79,
  "requires": [
    \{
      "name": "AlertIOS"
    },
    \{
      "name": "NativeModules"
    },
    \{
      "name": "Platform"
    }
  ],
  "filepath": "Libraries/Alert/Alert.js",
  "componentName": "Alert",
  "componentPlatform": "cross"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"alert","title":"Alert","layout":"autodocs","category":"APIs","permalink":"docs/alert.html","platform":"cross","next":"alert","previous":"accessibilityinfo","sidebar":true,"path":"Libraries/Alert/Alert.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;