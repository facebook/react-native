/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "name": "ImageStore",
  "docblock": "/**\\n */\\n",
  "methods": [
    \{
      "line": 21,
      "source": "static hasImageForTag(uri: string, callback: (hasImage: bool) => void) \{\\n    if (RCTImageStoreManager.hasImageForTag) \{\\n      RCTImageStoreManager.hasImageForTag(uri, callback);\\n    } else \{\\n      console.warn('hasImageForTag() not implemented');\\n    }\\n  }",
      "docblock": "/**\\n   * Check if the ImageStore contains image data for the specified URI.\\n   * @platform ios\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "uri"
        },
        \{
          "typehint": "(hasImage: bool) => void",
          "name": "callback"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "hasImageForTag"
    },
    \{
      "line": 37,
      "source": "static removeImageForTag(uri: string) \{\\n    if (RCTImageStoreManager.removeImageForTag) \{\\n      RCTImageStoreManager.removeImageForTag(uri);\\n    } else \{\\n      console.warn('removeImageForTag() not implemented');\\n    }\\n  }",
      "docblock": "/**\\n   * Delete an image from the ImageStore. Images are stored in memory and\\n   * must be manually removed when you are finished with them, otherwise they\\n   * will continue to use up RAM until the app is terminated. It is safe to\\n   * call \`removeImageForTag()\` without first calling \`hasImageForTag()\`, it\\n   * will simply fail silently.\\n   * @platform ios\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "uri"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "removeImageForTag"
    },
    \{
      "line": 56,
      "source": "static addImageFromBase64(\\n    base64ImageData: string,\\n    success: (uri: string) => void,\\n    failure: (error: any) => void\\n  ) \{\\n    RCTImageStoreManager.addImageFromBase64(base64ImageData, success, failure);\\n  }",
      "docblock": "/**\\n   * Stores a base64-encoded image in the ImageStore, and returns a URI that\\n   * can be used to access or display the image later. Images are stored in\\n   * memory only, and must be manually deleted when you are finished with\\n   * them by calling \`removeImageForTag()\`.\\n   *\\n   * Note that it is very inefficient to transfer large quantities of binary\\n   * data between JS and native code, so you should avoid calling this more\\n   * than necessary.\\n   * @platform ios\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "base64ImageData"
        },
        \{
          "typehint": "(uri: string) => void",
          "name": "success"
        },
        \{
          "typehint": "(error: any) => void",
          "name": "failure"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "addImageFromBase64"
    },
    \{
      "line": 75,
      "source": "static getBase64ForTag(\\n    uri: string,\\n    success: (base64ImageData: string) => void,\\n    failure: (error: any) => void\\n  ) \{\\n    RCTImageStoreManager.getBase64ForTag(uri, success, failure);\\n  }",
      "docblock": "/**\\n   * Retrieves the base64-encoded data for an image in the ImageStore. If the\\n   * specified URI does not match an image in the store, the failure callback\\n   * will be called.\\n   *\\n   * Note that it is very inefficient to transfer large quantities of binary\\n   * data between JS and native code, so you should avoid calling this more\\n   * than necessary. To display an image in the ImageStore, you can just pass\\n   * the URI to an \`<Image/>\` component; there is no need to retrieve the\\n   * base64 data.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "uri"
        },
        \{
          "typehint": "(base64ImageData: string) => void",
          "name": "success"
        },
        \{
          "typehint": "(error: any) => void",
          "name": "failure"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "getBase64ForTag"
    }
  ],
  "type": "api",
  "line": 16,
  "requires": [
    \{
      "name": "NativeModules"
    }
  ],
  "filepath": "Libraries/Image/ImageStore.js",
  "componentName": "ImageStore",
  "componentPlatform": "cross"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"imagestore","title":"ImageStore","layout":"autodocs","category":"APIs","permalink":"docs/imagestore.html","platform":"cross","next":"imagestore","previous":"imageeditor","sidebar":true,"path":"Libraries/Image/ImageStore.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;