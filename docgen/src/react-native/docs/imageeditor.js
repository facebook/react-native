/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "name": "ImageEditor",
  "docblock": "/**\\n */\\n",
  "methods": [
    \{
      "line": 62,
      "source": "static cropImage(\\n    uri: string,\\n    cropData: ImageCropData,\\n    success: (uri: string) => void,\\n    failure: (error: Object) => void\\n  ) \{\\n    RCTImageEditingManager.cropImage(uri, cropData, success, failure);\\n  }",
      "docblock": "/**\\n   * Crop the image specified by the URI param. If URI points to a remote\\n   * image, it will be downloaded automatically. If the image cannot be\\n   * loaded/downloaded, the failure callback will be called.\\n   *\\n   * If the cropping process is successful, the resultant cropped image\\n   * will be stored in the ImageStore, and the URI returned in the success\\n   * callback will point to the image in the store. Remember to delete the\\n   * cropped image from the ImageStore when you are done with it.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "uri"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"ImageCropData\\",\\"length\\":1}",
          "name": "cropData"
        },
        \{
          "typehint": "(uri: string) => void",
          "name": "success"
        },
        \{
          "typehint": "(error: Object) => void",
          "name": "failure"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "cropImage"
    }
  ],
  "type": "api",
  "line": 51,
  "requires": [
    \{
      "name": "NativeModules"
    }
  ],
  "filepath": "Libraries/Image/ImageEditor.js",
  "componentName": "ImageEditor",
  "componentPlatform": "cross"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"imageeditor","title":"ImageEditor","layout":"autodocs","category":"APIs","permalink":"docs/imageeditor.html","platform":"cross","next":"imageeditor","previous":"easing","sidebar":true,"path":"Libraries/Image/ImageEditor.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;