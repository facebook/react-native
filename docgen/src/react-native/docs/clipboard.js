/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "methods": [
    \{
      "line": 28,
      "source": "getString(): Promise<string> \{\\n    return Clipboard.getString();\\n  }",
      "docblock": "/**\\n   * Get content of string type, this method returns a \`Promise\`, so you can use following code to get clipboard content\\n   * \`\`\`javascript\\n   * async _getContent() \{\\n   *   var content = await Clipboard.getString();\\n   * }\\n   * \`\`\`\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"generic\\",\\"value\\":[\{\\"type\\":\\"simple\\",\\"value\\":\\"Promise\\",\\"length\\":1},\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}],\\"length\\":4}",
      "name": "getString"
    },
    \{
      "line": 40,
      "source": "setString(content: string) \{\\n    Clipboard.setString(content);\\n  }",
      "docblock": "/**\\n   * Set content of string type. You can use following code to set clipboard content\\n   * \`\`\`javascript\\n   * _setContent() \{\\n   *   Clipboard.setString('hello world');\\n   * }\\n   * \`\`\`\\n   * @param the content to be stored in the clipboard.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "content"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "setString"
    }
  ],
  "properties": [],
  "classes": [],
  "superClass": null,
  "type": "api",
  "line": 19,
  "name": "Clipboard",
  "docblock": "/**\\n * \`Clipboard\` gives you an interface for setting and getting content from Clipboard on both iOS and Android\\n */\\n",
  "requires": [
    \{
      "name": "NativeModules"
    }
  ],
  "filepath": "Libraries/Components/Clipboard/Clipboard.js",
  "componentName": "Clipboard",
  "componentPlatform": "cross"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"clipboard","title":"Clipboard","layout":"autodocs","category":"APIs","permalink":"docs/clipboard.html","platform":"cross","next":"clipboard","previous":"backhandler","sidebar":true,"path":"Libraries/Components/Clipboard/Clipboard.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;