/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "name": "PermissionsAndroid",
  "docblock": "/**\\n * <div class=\\"banner-crna-ejected\\">\\n *   <h3>Project with Native Code Required</h3>\\n *   <p>\\n *     This API only works in projects made with <code>react-native init</code>\\n *     or in those made with Create React Native App which have since ejected. For\\n *     more information about ejecting, please see\\n *     the <a href=\\"https://github.com/react-community/create-react-native-app/blob/master/EJECTING.md\\" target=\\"_blank\\">guide</a> on\\n *     the Create React Native App repository.\\n *   </p>\\n * </div>\\n *\\n * \`PermissionsAndroid\` provides access to Android M's new permissions model.\\n * Some permissions are granted by default when the application is installed\\n * so long as they appear in \`AndroidManifest.xml\`. However, \\"dangerous\\"\\n * permissions require a dialog prompt. You should use this module for those\\n * permissions.\\n *\\n * On devices before SDK version 23, the permissions are automatically granted\\n * if they appear in the manifest, so \`check\` and \`request\`\\n * should always be true.\\n *\\n * If a user has previously turned off a permission that you prompt for, the OS\\n * will advise your app to show a rationale for needing the permission. The\\n * optional \`rationale\` argument will show a dialog prompt only if\\n * necessary - otherwise the normal permission prompt will appear.\\n *\\n * ### Example\\n * \`\`\`\\n * async function requestCameraPermission() \{\\n *   try \{\\n *     const granted = await PermissionsAndroid.request(\\n *       PermissionsAndroid.PERMISSIONS.CAMERA,\\n *       \{\\n *         'title': 'Cool Photo App Camera Permission',\\n *         'message': 'Cool Photo App needs access to your camera ' +\\n *                    'so you can take awesome pictures.'\\n *       }\\n *     )\\n *     if (granted === PermissionsAndroid.RESULTS.GRANTED) \{\\n *       console.log(\\"You can use the camera\\")\\n *     } else \{\\n *       console.log(\\"Camera permission denied\\")\\n *     }\\n *   } catch (err) \{\\n *     console.warn(err)\\n *   }\\n * }\\n * \`\`\`\\n */\\n",
  "methods": [
    \{
      "line": 77,
      "source": "constructor() \{\\n    /**\\n     * A list of specified \\"dangerous\\" permissions that require prompting the user\\n     */\\n    this.PERMISSIONS = \{\\n      READ_CALENDAR: 'android.permission.READ_CALENDAR',\\n      WRITE_CALENDAR: 'android.permission.WRITE_CALENDAR',\\n      CAMERA: 'android.permission.CAMERA',\\n      READ_CONTACTS: 'android.permission.READ_CONTACTS',\\n      WRITE_CONTACTS: 'android.permission.WRITE_CONTACTS',\\n      GET_ACCOUNTS:  'android.permission.GET_ACCOUNTS',\\n      ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',\\n      ACCESS_COARSE_LOCATION: 'android.permission.ACCESS_COARSE_LOCATION',\\n      RECORD_AUDIO: 'android.permission.RECORD_AUDIO',\\n      READ_PHONE_STATE: 'android.permission.READ_PHONE_STATE',\\n      CALL_PHONE: 'android.permission.CALL_PHONE',\\n      READ_CALL_LOG: 'android.permission.READ_CALL_LOG',\\n      WRITE_CALL_LOG: 'android.permission.WRITE_CALL_LOG',\\n      ADD_VOICEMAIL: 'com.android.voicemail.permission.ADD_VOICEMAIL',\\n      USE_SIP: 'android.permission.USE_SIP',\\n      PROCESS_OUTGOING_CALLS: 'android.permission.PROCESS_OUTGOING_CALLS',\\n      BODY_SENSORS:  'android.permission.BODY_SENSORS',\\n      SEND_SMS: 'android.permission.SEND_SMS',\\n      RECEIVE_SMS: 'android.permission.RECEIVE_SMS',\\n      READ_SMS: 'android.permission.READ_SMS',\\n      RECEIVE_WAP_PUSH: 'android.permission.RECEIVE_WAP_PUSH',\\n      RECEIVE_MMS: 'android.permission.RECEIVE_MMS',\\n      READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',\\n      WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',\\n    };\\n\\n    this.RESULTS = \{\\n      GRANTED: 'granted',\\n      DENIED: 'denied',\\n      NEVER_ASK_AGAIN: 'never_ask_again',\\n    };\\n  }",
      "modifiers": [],
      "params": [],
      "tparams": null,
      "returntypehint": null,
      "name": "constructor"
    },
    \{
      "line": 123,
      "source": "checkPermission(permission: string) : Promise<boolean> \{\\n    console.warn('\\"PermissionsAndroid.checkPermission\\" is deprecated. Use \\"PermissionsAndroid.check\\" instead');\\n    return NativeModules.PermissionsAndroid.checkPermission(permission);\\n  }",
      "docblock": "/**\\n   * DEPRECATED - use check\\n   *\\n   * Returns a promise resolving to a boolean value as to whether the specified\\n   * permissions has been granted\\n   *\\n   * @deprecated\\n   */\\n",
      "modifiers": [],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "permission"
        }
      ],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"generic\\",\\"value\\":[\{\\"type\\":\\"simple\\",\\"value\\":\\"Promise\\",\\"length\\":1},\{\\"type\\":\\"simple\\",\\"value\\":\\"boolean\\",\\"length\\":1}],\\"length\\":4}",
      "name": "checkPermission"
    },
    \{
      "line": 132,
      "source": "check(permission: string) : Promise<boolean> \{\\n    return NativeModules.PermissionsAndroid.checkPermission(permission);\\n  }",
      "docblock": "/**\\n   * Returns a promise resolving to a boolean value as to whether the specified\\n   * permissions has been granted\\n   */\\n",
      "modifiers": [],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "permission"
        }
      ],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"generic\\",\\"value\\":[\{\\"type\\":\\"simple\\",\\"value\\":\\"Promise\\",\\"length\\":1},\{\\"type\\":\\"simple\\",\\"value\\":\\"boolean\\",\\"length\\":1}],\\"length\\":4}",
      "name": "check"
    },
    \{
      "line": 150,
      "source": "async requestPermission(permission: string, rationale?: Rationale) : Promise<boolean> \{\\n    console.warn('\\"PermissionsAndroid.requestPermission\\" is deprecated. Use \\"PermissionsAndroid.request\\" instead');\\n    const response = await this.request(permission, rationale);\\n    return (response === this.RESULTS.GRANTED);\\n  }",
      "docblock": "/**\\n   * DEPRECATED - use request\\n   *\\n   * Prompts the user to enable a permission and returns a promise resolving to a\\n   * boolean value indicating whether the user allowed or denied the request\\n   *\\n   * If the optional rationale argument is included (which is an object with a\\n   * \`title\` and \`message\`), this function checks with the OS whether it is\\n   * necessary to show a dialog explaining why the permission is needed\\n   * (https://developer.android.com/training/permissions/requesting.html#explain)\\n   * and then shows the system permission dialog\\n   *\\n   * @deprecated\\n   */\\n",
      "modifiers": [],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "permission"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Rationale\\",\\"length\\":1}",
          "name": "rationale?"
        }
      ],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"generic\\",\\"value\\":[\{\\"type\\":\\"simple\\",\\"value\\":\\"Promise\\",\\"length\\":1},\{\\"type\\":\\"simple\\",\\"value\\":\\"boolean\\",\\"length\\":1}],\\"length\\":4}",
      "name": "requestPermission"
    },
    \{
      "line": 166,
      "source": "async request(permission: string, rationale?: Rationale) : Promise<PermissionStatus> \{\\n    if (rationale) \{\\n      const shouldShowRationale = await NativeModules.PermissionsAndroid.shouldShowRequestPermissionRationale(permission);\\n\\n      if (shouldShowRationale) \{\\n        return new Promise((resolve, reject) => \{\\n          NativeModules.DialogManagerAndroid.showAlert(\\n            rationale,\\n            () => reject(new Error('Error showing rationale')),\\n            () => resolve(NativeModules.PermissionsAndroid.requestPermission(permission))\\n          );\\n        });\\n      }\\n    }\\n    return NativeModules.PermissionsAndroid.requestPermission(permission);\\n  }",
      "docblock": "/**\\n   * Prompts the user to enable a permission and returns a promise resolving to a\\n   * string value indicating whether the user allowed or denied the request\\n   *\\n   * If the optional rationale argument is included (which is an object with a\\n   * \`title\` and \`message\`), this function checks with the OS whether it is\\n   * necessary to show a dialog explaining why the permission is needed\\n   * (https://developer.android.com/training/permissions/requesting.html#explain)\\n   * and then shows the system permission dialog\\n   */\\n",
      "modifiers": [],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "permission"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Rationale\\",\\"length\\":1}",
          "name": "rationale?"
        }
      ],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"generic\\",\\"value\\":[\{\\"type\\":\\"simple\\",\\"value\\":\\"Promise\\",\\"length\\":1},\{\\"type\\":\\"simple\\",\\"value\\":\\"PermissionStatus\\",\\"length\\":1}],\\"length\\":4}",
      "name": "request"
    },
    \{
      "line": 188,
      "source": "requestMultiple(permissions: Array<string>) : Promise<\{[permission: string]: PermissionStatus}> \{\\n    return NativeModules.PermissionsAndroid.requestMultiplePermissions(permissions);\\n  }",
      "docblock": "/**\\n   * Prompts the user to enable multiple permissions in the same dialog and\\n   * returns an object with the permissions as keys and strings as values\\n   * indicating whether the user allowed or denied the request\\n   */\\n",
      "modifiers": [],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"generic\\",\\"value\\":[\{\\"type\\":\\"simple\\",\\"value\\":\\"Array\\",\\"length\\":1},\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}],\\"length\\":4}",
          "name": "permissions"
        }
      ],
      "tparams": null,
      "returntypehint": "Promise<\{[permission: string]: PermissionStatus}>",
      "name": "requestMultiple"
    }
  ],
  "type": "api",
  "line": 73,
  "requires": [
    \{
      "name": "NativeModules"
    }
  ],
  "filepath": "Libraries/PermissionsAndroid/PermissionsAndroid.js",
  "componentName": "PermissionsAndroid",
  "componentPlatform": "android"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"permissionsandroid","title":"PermissionsAndroid","layout":"autodocs","category":"APIs","permalink":"docs/permissionsandroid.html","platform":"android","next":"permissionsandroid","previous":"netinfo","sidebar":true,"path":"Libraries/PermissionsAndroid/PermissionsAndroid.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;