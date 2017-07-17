/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "name": "CameraRoll",
  "docblock": "/**\\n * \`CameraRoll\` provides access to the local camera roll / gallery.\\n * Before using this you must link the \`RCTCameraRoll\` library.\\n * You can refer to [Linking](docs/linking-libraries-ios.html) for help.\\n *\\n * ### Permissions\\n * The user's permission is required in order to access the Camera Roll on devices running iOS 10 or later.\\n * Add the \`NSPhotoLibraryUsageDescription\` key in your \`Info.plist\` with a string that describes how your\\n * app will use this data. This key will appear as \`Privacy - Photo Library Usage Description\` in Xcode.\\n *\\n */\\n",
  "methods": [
    \{
      "line": 122,
      "source": "= GROUP_TYPES_OPTIONS;\\n  static AssetTypeOptions: Object = ASSET_TYPE_OPTIONS;\\n\\n  /**\\n   * \`CameraRoll.saveImageWithTag()\` is deprecated. Use \`CameraRoll.saveToCameraRoll()\` instead.\\n   */\\n  static saveImageWithTag(tag: string): Promise<Object> \{\\n    console.warn(\\n      '\`CameraRoll.saveImageWithTag()\` is deprecated. Use \`CameraRoll.saveToCameraRoll()\` instead.',\\n    );\\n    return this.saveToCameraRoll(tag, 'photo');\\n  }",
      "modifiers": [],
      "params": [
        \{
          "typehint": null,
          "name": ";"
        },
        \{
          "typehint": "Object",
          "name": "AssetTypeOptions"
        },
        \{
          "typehint": null,
          "name": "static"
        },
        \{
          "typehint": null,
          "name": "("
        },
        \{
          "typehint": null,
          "name": ":"
        }
      ],
      "tparams": null,
      "returntypehint": "Promise<Object>",
      "name": "="
    },
    \{
      "line": 149,
      "source": "static saveToCameraRoll(\\n    tag: string,\\n    type?: 'photo' | 'video',\\n  ): Promise<Object> \{\\n    invariant(\\n      typeof tag === 'string',\\n      'CameraRoll.saveToCameraRoll must be a valid string.',\\n    );\\n\\n    invariant(\\n      type === 'photo' || type === 'video' || type === undefined,\\n      // $FlowFixMe(>=0.28.0)\\n      \`The second argument to saveToCameraRoll must be 'photo' or 'video'. You passed $\{type}\`,\\n    );\\n\\n    let mediaType = 'photo';\\n    if (type) \{\\n      mediaType = type;\\n    } else if (['mov', 'mp4'].indexOf(tag.split('.').slice(-1)[0]) >= 0) \{\\n      mediaType = 'video';\\n    }\\n\\n    return RCTCameraRollManager.saveToCameraRoll(tag, mediaType);\\n  }",
      "docblock": "/**\\n   * Saves the photo or video to the camera roll / gallery.\\n   *\\n   * On Android, the tag must be a local image or video URI, such as \`\\"file:///sdcard/img.png\\"\`.\\n   *\\n   * On iOS, the tag can be any image URI (including local, remote asset-library and base64 data URIs)\\n   * or a local video file URI (remote or data URIs are not supported for saving video at this time).\\n   *\\n   * If the tag has a file extension of .mov or .mp4, it will be inferred as a video. Otherwise\\n   * it will be treated as a photo. To override the automatic choice, you can pass an optional\\n   * \`type\` parameter that must be one of 'photo' or 'video'.\\n   *\\n   * Returns a Promise which will resolve with the new URI.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "tag"
        },
        \{
          "typehint": "'photo' | 'video'",
          "name": "type?"
        }
      ],
      "tparams": null,
      "returntypehint": "Promise<Object>",
      "name": "saveToCameraRoll"
    },
    \{
      "line": 220,
      "source": "static getPhotos(params) \{\\n    if (__DEV__) \{\\n      checkPropTypes(\\n        \{params: getPhotosParamChecker},\\n        \{params},\\n        'params',\\n        'CameraRoll.getPhotos',\\n      );\\n    }\\n    if (arguments.length > 1) \{\\n      console.warn(\\n        'CameraRoll.getPhotos(tag, success, error) is deprecated.  Use the returned Promise instead',\\n      );\\n      let successCallback = arguments[1];\\n      if (__DEV__) \{\\n        const callback = arguments[1];\\n        successCallback = response => \{\\n          checkPropTypes(\\n            \{response: getPhotosReturnChecker},\\n            \{response},\\n            'response',\\n            'CameraRoll.getPhotos callback',\\n          );\\n          callback(response);\\n        };\\n      }\\n      const errorCallback = arguments[2] || (() => \{});\\n      RCTCameraRollManager.getPhotos(params).then(\\n        successCallback,\\n        errorCallback,\\n      );\\n    }\\n    // TODO: Add the __DEV__ check back in to verify the Promise result\\n    return RCTCameraRollManager.getPhotos(params);\\n  }",
      "docblock": "/**\\n   * Returns a Promise with photo identifier objects from the local camera\\n   * roll of the device matching shape defined by \`getPhotosReturnChecker\`.\\n   *\\n   * Expects a params object of the following shape:\\n   *\\n   * - \`first\` : \{number} : The number of photos wanted in reverse order of the photo application (i.e. most recent first for SavedPhotos).\\n   * - \`after\` : \{string} : A cursor that matches \`page_info \{ end_cursor }\` returned from a previous call to \`getPhotos\`.\\n   * - \`groupTypes\` : \{string} : Specifies which group types to filter the results to. Valid values are:\\n   *      - \`Album\`\\n   *      - \`All\`\\n   *      - \`Event\`\\n   *      - \`Faces\`\\n   *      - \`Library\`\\n   *      - \`PhotoStream\`\\n   *      - \`SavedPhotos\` // default\\n   * - \`groupName\` : \{string} : Specifies filter on group names, like 'Recent Photos' or custom album titles.\\n   * - \`assetType\` : \{string} : Specifies filter on asset type. Valid values are:\\n   *      - \`All\`\\n   *      - \`Videos\`\\n   *      - \`Photos\` // default\\n   * - \`mimeTypes\` : \{string} : Filter by mimetype (e.g. image/jpeg).\\n   *\\n   * Returns a Promise which when resolved will be of the following shape:\\n   *\\n   * - \`edges\` : \{Array<node>} An array of node objects\\n   *      - \`node\`: \{object} An object with the following shape:\\n   *          - \`type\`: \{string}\\n   *          - \`group_name\`: \{string}\\n   *          - \`image\`: \{object} : An object with the following shape:\\n   *              - \`uri\`: \{string}\\n   *              - \`height\`: \{number}\\n   *              - \`width\`: \{number}\\n   *              - \`isStored\`: \{boolean}\\n   *          - \`timestamp\`: \{number}\\n   *          - \`location\`: \{object} : An object with the following shape:\\n   *              - \`latitude\`: \{number}\\n   *              - \`longitude\`: \{number}\\n   *              - \`altitude\`: \{number}\\n   *              - \`heading\`: \{number}\\n   *              - \`speed\`: \{number}\\n   * - \`page_info\` : \{object} : An object with the following shape:\\n   *      - \`has_next_page\`: \{boolean}\\n   *      - \`start_cursor\`: \{boolean}\\n   *      - \`end_cursor\`: \{boolean}\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": null,
          "name": "params"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "getPhotos"
    }
  ],
  "type": "api",
  "line": 121,
  "requires": [
    \{
      "name": "prop-types"
    },
    \{
      "name": "NativeModules"
    },
    \{
      "name": "createStrictShapeTypeChecker"
    },
    \{
      "name": "fbjs/lib/invariant"
    }
  ],
  "filepath": "Libraries/CameraRoll/CameraRoll.js",
  "componentName": "CameraRoll",
  "componentPlatform": "cross"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"cameraroll","title":"CameraRoll","layout":"autodocs","category":"APIs","permalink":"docs/cameraroll.html","platform":"cross","next":"clipboard","previous":"backhandler","sidebar":true,"path":"Libraries/CameraRoll/CameraRoll.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;