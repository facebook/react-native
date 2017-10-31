/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "class": [
    \{
      "meta": \{
        "range": [
          1920,
          14385
        ],
        "filename": "0ixhk1fcq0ospkxryfsrhc.js",
        "lineno": 62,
        "path": "/var/folders/82/w8hcc_tj7yq80482srkc1r2x0bj21j/T",
        "code": \{
          "id": "astnode100000024",
          "name": "AsyncStorage",
          "type": "ObjectExpression",
          "value": "\{\\"_getRequests\\":\\"\\",\\"_getKeys\\":\\"\\",\\"_immediate\\":null,\\"getItem\\":\\"\\",\\"setItem\\":\\"\\",\\"removeItem\\":\\"\\",\\"mergeItem\\":\\"\\",\\"clear\\":\\"\\",\\"getAllKeys\\":\\"\\",\\"flushGetRequests\\":\\"\\",\\"multiGet\\":\\"\\",\\"multiSet\\":\\"\\",\\"multiRemove\\":\\"\\",\\"multiMerge\\":\\"\\"}"
        }
      },
      "description": "\`AsyncStorage\` is a simple, unencrypted, asynchronous, persistent, key-value storage\\nsystem that is global to the app.  It should be used instead of LocalStorage.\\n\\nIt is recommended that you use an abstraction on top of \`AsyncStorage\`\\ninstead of \`AsyncStorage\` directly for anything more than light usage since\\nit operates globally.\\n\\nOn iOS, \`AsyncStorage\` is backed by native code that stores small values in a\\nserialized dictionary and larger values in separate files. On Android,\\n\`AsyncStorage\` will use either [RocksDB](http://rocksdb.org/) or SQLite\\nbased on what is available.\\n\\nThe \`AsyncStorage\` JavaScript code is a simple facade that provides a clear\\nJavaScript API, real \`Error\` objects, and simple non-multi functions. Each\\nmethod in the API returns a \`Promise\` object.\\n\\nPersisting data:\\n\`\`\`\\ntry \{\\n  await AsyncStorage.setItem('@MySuperStore:key', 'I like to save it.');\\n} catch (error) \{\\n  // Error saving data\\n}\\n\`\`\`\\n\\nFetching data:\\n\`\`\`\\ntry \{\\n  const value = await AsyncStorage.getItem('@MySuperStore:key');\\n  if (value !== null)\{\\n    // We have data!!\\n    console.log(value);\\n  }\\n} catch (error) \{\\n  // Error retrieving data\\n}\\n\`\`\`",
      "name": "AsyncStorage",
      "longname": "AsyncStorage",
      "scope": "global",
      "order": 0
    }
  ],
  "methods": [
    \{
      "meta": \{
        "range": [
          2285,
          2786
        ],
        "filename": "0ixhk1fcq0ospkxryfsrhc.js",
        "lineno": 75,
        "path": "/var/folders/82/w8hcc_tj7yq80482srkc1r2x0bj21j/T",
        "code": \{
          "id": "astnode100000033",
          "name": "getItem",
          "type": "FunctionExpression"
        },
        "vars": \{
          "": null
        }
      },
      "description": "Fetches an item for a \`key\` and invokes a callback upon completion.\\nReturns a \`Promise\` object.",
      "params": [
        \{
          "description": "Key of the item to fetch.",
          "name": "key",
          "type": \{
            "names": [
              "string"
            ]
          }
        },
        \{
          "description": "Function that will be called with a result if found or\\n   any error.",
          "name": "callback",
          "type": \{
            "names": [
              "?(error: ?Error, result: ?string) => void"
            ]
          },
          "optional": true
        }
      ],
      "returns": [
        \{
          "description": "A \`Promise\` object."
        }
      ],
      "name": "getItem",
      "longname": "AsyncStorage.getItem",
      "memberof": "AsyncStorage",
      "scope": "static",
      "order": 1,
      "line": 77,
      "source": "getItem: function(\\n    key: string,\\n    callback?: ?(error: ?Error, result: ?string) => void\\n  ): Promise \{\\n    return new Promise((resolve, reject) => \{\\n      RCTAsyncStorage.multiGet([key], function(errors, result) \{\\n        // Unpack result to get value from [[key,value]]\\n        var value = (result && result[0] && result[0][1]) ? result[0][1] : null;\\n        var errs = convertErrors(errors);\\n        callback && callback(errs && errs[0], value);\\n        if (errs) \{\\n          reject(errs[0]);\\n        } else \{\\n          resolve(value);\\n        }\\n      });\\n    });\\n  }",
      "docblock": "/**\\n   * Fetches an item for a \`key\` and invokes a callback upon completion.\\n   * Returns a \`Promise\` object.\\n   * @param key Key of the item to fetch.\\n   * @param callback Function that will be called with a result if found or\\n   *    any error.\\n   * @returns A \`Promise\` object.\\n   */\\n",
      "modifiers": [
        "static"
      ]
    },
    \{
      "meta": \{
        "range": [
          3094,
          3459
        ],
        "filename": "0ixhk1fcq0ospkxryfsrhc.js",
        "lineno": 99,
        "path": "/var/folders/82/w8hcc_tj7yq80482srkc1r2x0bj21j/T",
        "code": \{
          "id": "astnode100000108",
          "name": "setItem",
          "type": "FunctionExpression"
        },
        "vars": \{
          "": null
        }
      },
      "description": "Sets the value for a \`key\` and invokes a callback upon completion.\\nReturns a \`Promise\` object.",
      "params": [
        \{
          "description": "Key of the item to set.",
          "name": "key",
          "type": \{
            "names": [
              "string"
            ]
          }
        },
        \{
          "description": "Value to set for the \`key\`.",
          "name": "value",
          "type": \{
            "names": [
              "string"
            ]
          }
        },
        \{
          "description": "Function that will be called with any error.",
          "name": "callback",
          "type": \{
            "names": [
              "?(error: ?Error) => void"
            ]
          },
          "optional": true
        }
      ],
      "returns": [
        \{
          "description": "A \`Promise\` object."
        }
      ],
      "name": "setItem",
      "longname": "AsyncStorage.setItem",
      "memberof": "AsyncStorage",
      "scope": "static",
      "order": 2,
      "line": 104,
      "source": "setItem: function(\\n    key: string,\\n    value: string,\\n    callback?: ?(error: ?Error) => void\\n  ): Promise \{\\n    return new Promise((resolve, reject) => \{\\n      RCTAsyncStorage.multiSet([[key,value]], function(errors) \{\\n        var errs = convertErrors(errors);\\n        callback && callback(errs && errs[0]);\\n        if (errs) \{\\n          reject(errs[0]);\\n        } else \{\\n          resolve(null);\\n        }\\n      });\\n    });\\n  }",
      "docblock": "/**\\n   * Sets the value for a \`key\` and invokes a callback upon completion.\\n   * Returns a \`Promise\` object.\\n   * @param key Key of the item to set.\\n   * @param value Value to set for the \`key\`.\\n   * @param callback Function that will be called with any error.\\n   * @returns A \`Promise\` object.\\n   */\\n",
      "modifiers": [
        "static"
      ]
    },
    \{
      "meta": \{
        "range": [
          3725,
          4080
        ],
        "filename": "0ixhk1fcq0ospkxryfsrhc.js",
        "lineno": 120,
        "path": "/var/folders/82/w8hcc_tj7yq80482srkc1r2x0bj21j/T",
        "code": \{
          "id": "astnode100000163",
          "name": "removeItem",
          "type": "FunctionExpression"
        },
        "vars": \{
          "": null
        }
      },
      "description": "Removes an item for a \`key\` and invokes a callback upon completion.\\nReturns a \`Promise\` object.",
      "params": [
        \{
          "description": "Key of the item to remove.",
          "name": "key",
          "type": \{
            "names": [
              "string"
            ]
          }
        },
        \{
          "description": "Function that will be called with any error.",
          "name": "callback",
          "type": \{
            "names": [
              "?(error: ?Error) => void"
            ]
          },
          "optional": true
        }
      ],
      "returns": [
        \{
          "description": "A \`Promise\` object."
        }
      ],
      "name": "removeItem",
      "longname": "AsyncStorage.removeItem",
      "memberof": "AsyncStorage",
      "scope": "static",
      "order": 3,
      "line": 129,
      "source": "removeItem: function(\\n    key: string,\\n    callback?: ?(error: ?Error) => void\\n  ): Promise \{\\n    return new Promise((resolve, reject) => \{\\n      RCTAsyncStorage.multiRemove([key], function(errors) \{\\n        var errs = convertErrors(errors);\\n        callback && callback(errs && errs[0]);\\n        if (errs) \{\\n          reject(errs[0]);\\n        } else \{\\n          resolve(null);\\n        }\\n      });\\n    });\\n  }",
      "docblock": "/**\\n   * Removes an item for a \`key\` and invokes a callback upon completion.\\n   * Returns a \`Promise\` object.\\n   * @param key Key of the item to remove.\\n   * @param callback Function that will be called with any error.\\n   * @returns A \`Promise\` object.\\n   */\\n",
      "modifiers": [
        "static"
      ]
    },
    \{
      "meta": \{
        "range": [
          5240,
          5609
        ],
        "filename": "0ixhk1fcq0ospkxryfsrhc.js",
        "lineno": 169,
        "path": "/var/folders/82/w8hcc_tj7yq80482srkc1r2x0bj21j/T",
        "code": \{
          "id": "astnode100000215",
          "name": "mergeItem",
          "type": "FunctionExpression"
        },
        "vars": \{
          "": null
        }
      },
      "description": "Merges an existing \`key\` value with an input value, assuming both values\\nare stringified JSON. Returns a \`Promise\` object.\\n\\n**NOTE:** This is not supported by all native implementations.",
      "params": [
        \{
          "description": "Key of the item to modify.",
          "name": "key",
          "type": \{
            "names": [
              "string"
            ]
          }
        },
        \{
          "description": "New value to merge for the \`key\`.",
          "name": "value",
          "type": \{
            "names": [
              "string"
            ]
          }
        },
        \{
          "description": "Function that will be called with any error.",
          "name": "callback",
          "type": \{
            "names": [
              "?(error: ?Error) => void"
            ]
          },
          "optional": true
        }
      ],
      "returns": [
        \{
          "description": "A \`Promise\` object."
        }
      ],
      "examples": [
        "<caption>Example</caption>\\nlet UID123_object = \{\\n name: 'Chris',\\n age: 30,\\n traits: \{hair: 'brown', eyes: 'brown'},\\n};\\n// You only need to define what will be added or updated\\nlet UID123_delta = \{\\n age: 31,\\n traits: \{eyes: 'blue', shoe_size: 10}\\n};\\n\\nAsyncStorage.setItem('UID123', JSON.stringify(UID123_object), () => \{\\n  AsyncStorage.mergeItem('UID123', JSON.stringify(UID123_delta), () => \{\\n    AsyncStorage.getItem('UID123', (err, result) => \{\\n      console.log(result);\\n    });\\n  });\\n});\\n\\n// Console log result:\\n// => \{'name':'Chris','age':31,'traits':\\n//    \{'shoe_size':10,'hair':'brown','eyes':'blue'}}"
      ],
      "name": "mergeItem",
      "longname": "AsyncStorage.mergeItem",
      "memberof": "AsyncStorage",
      "scope": "static",
      "order": 4,
      "line": 181,
      "source": "mergeItem: function(\\n    key: string,\\n    value: string,\\n    callback?: ?(error: ?Error) => void\\n  ): Promise \{\\n    return new Promise((resolve, reject) => \{\\n      RCTAsyncStorage.multiMerge([[key,value]], function(errors) \{\\n        var errs = convertErrors(errors);\\n        callback && callback(errs && errs[0]);\\n        if (errs) \{\\n          reject(errs[0]);\\n        } else \{\\n          resolve(null);\\n        }\\n      });\\n    });\\n  }",
      "docblock": "/**\\n   * Merges an existing \`key\` value with an input value, assuming both values\\n   * are stringified JSON. Returns a \`Promise\` object.\\n   *\\n   * **NOTE:** This is not supported by all native implementations.\\n   *\\n   * @param key Key of the item to modify.\\n   * @param value New value to merge for the \`key\`.\\n   * @param callback Function that will be called with any error.\\n   * @returns A \`Promise\` object.\\n   *\\n   * @example <caption>Example</caption>\\n   * let UID123_object = \{\\n   *  name: 'Chris',\\n   *  age: 30,\\n   *  traits: \{hair: 'brown', eyes: 'brown'},\\n   * };\\n   * // You only need to define what will be added or updated\\n   * let UID123_delta = \{\\n   *  age: 31,\\n   *  traits: \{eyes: 'blue', shoe_size: 10}\\n   * };\\n   *\\n   * AsyncStorage.setItem('UID123', JSON.stringify(UID123_object), () => \{\\n   *   AsyncStorage.mergeItem('UID123', JSON.stringify(UID123_delta), () => \{\\n   *     AsyncStorage.getItem('UID123', (err, result) => \{\\n   *       console.log(result);\\n   *     });\\n   *   });\\n   * });\\n   *\\n   * // Console log result:\\n   * // => \{'name':'Chris','age':31,'traits':\\n   * //    \{'shoe_size':10,'hair':'brown','eyes':'blue'}}\\n   */\\n",
      "modifiers": [
        "static"
      ]
    },
    \{
      "meta": \{
        "range": [
          5934,
          6263
        ],
        "filename": "0ixhk1fcq0ospkxryfsrhc.js",
        "lineno": 190,
        "path": "/var/folders/82/w8hcc_tj7yq80482srkc1r2x0bj21j/T",
        "code": \{
          "id": "astnode100000270",
          "name": "clear",
          "type": "FunctionExpression"
        },
        "vars": \{
          "": null
        }
      },
      "description": "Erases *all* \`AsyncStorage\` for all clients, libraries, etc.  You probably\\ndon't want to call this; use \`removeItem\` or \`multiRemove\` to clear only\\nyour app's keys. Returns a \`Promise\` object.",
      "params": [
        \{
          "description": "Function that will be called with any error.",
          "name": "callback",
          "type": \{
            "names": [
              "?(error: ?Error) => void"
            ]
          },
          "optional": true
        }
      ],
      "returns": [
        \{
          "description": "A \`Promise\` object."
        }
      ],
      "name": "clear",
      "longname": "AsyncStorage.clear",
      "memberof": "AsyncStorage",
      "scope": "static",
      "order": 5,
      "line": 206,
      "source": "clear: function(callback?: ?(error: ?Error) => void): Promise \{\\n    return new Promise((resolve, reject) => \{\\n      RCTAsyncStorage.clear(function(error) \{\\n        callback && callback(convertError(error));\\n        if (error && convertError(error))\{\\n          reject(convertError(error));\\n        } else \{\\n          resolve(null);\\n        }\\n      });\\n    });\\n  }",
      "docblock": "/**\\n   * Erases *all* \`AsyncStorage\` for all clients, libraries, etc.  You probably\\n   * don't want to call this; use \`removeItem\` or \`multiRemove\` to clear only\\n   * your app's keys. Returns a \`Promise\` object.\\n   * @param callback Function that will be called with any error.\\n   * @returns A \`Promise\` object.\\n   */\\n",
      "modifiers": [
        "static"
      ]
    },
    \{
      "meta": \{
        "range": [
          6547,
          6875
        ],
        "filename": "0ixhk1fcq0ospkxryfsrhc.js",
        "lineno": 211,
        "path": "/var/folders/82/w8hcc_tj7yq80482srkc1r2x0bj21j/T",
        "code": \{
          "id": "astnode100000315",
          "name": "getAllKeys",
          "type": "FunctionExpression"
        },
        "vars": \{
          "": null
        }
      },
      "description": "Gets *all* keys known to your app; for all callers, libraries, etc.\\nReturns a \`Promise\` object.",
      "params": [
        \{
          "description": "Function that will be called the keys found and any error.",
          "name": "callback",
          "type": \{
            "names": [
              "?(error: ?Error, keys: ?Array<string>) => void"
            ]
          },
          "optional": true
        }
      ],
      "returns": [
        \{
          "description": "A \`Promise\` object.\\n\\nExample: see the \`multiGet\` example."
        }
      ],
      "name": "getAllKeys",
      "longname": "AsyncStorage.getAllKeys",
      "memberof": "AsyncStorage",
      "scope": "static",
      "order": 6,
      "line": 227,
      "source": "getAllKeys: function(callback?: ?(error: ?Error, keys: ?Array<string>) => void): Promise \{\\n    return new Promise((resolve, reject) => \{\\n      RCTAsyncStorage.getAllKeys(function(error, keys) \{\\n        callback && callback(convertError(error), keys);\\n        if (error) \{\\n          reject(convertError(error));\\n        } else \{\\n          resolve(keys);\\n        }\\n      });\\n    });\\n  }",
      "docblock": "/**\\n   * Gets *all* keys known to your app; for all callers, libraries, etc.\\n   * Returns a \`Promise\` object.\\n   * @param callback Function that will be called the keys found and any error.\\n   * @returns A \`Promise\` object.\\n   *\\n   * Example: see the \`multiGet\` example.\\n   */\\n",
      "modifiers": [
        "static"
      ]
    },
    \{
      "meta": \{
        "range": [
          7392,
          8575
        ],
        "filename": "0ixhk1fcq0ospkxryfsrhc.js",
        "lineno": 235,
        "path": "/var/folders/82/w8hcc_tj7yq80482srkc1r2x0bj21j/T",
        "code": \{
          "id": "astnode100000358",
          "name": "flushGetRequests",
          "type": "FunctionExpression"
        },
        "vars": \{
          "getRequests": "AsyncStorage.flushGetRequests~getRequests",
          "getKeys": "AsyncStorage.flushGetRequests~getKeys",
          "this._getRequests": "AsyncStorage.flushGetRequests#_getRequests",
          "this._getKeys": "AsyncStorage.flushGetRequests#_getKeys",
          "": null
        }
      },
      "description": "Flushes any pending requests using a single batch call to get the data.",
      "name": "flushGetRequests",
      "longname": "AsyncStorage.flushGetRequests",
      "memberof": "AsyncStorage",
      "scope": "static",
      "order": 7,
      "line": 251,
      "source": "flushGetRequests: function(): void \{\\n    const getRequests = this._getRequests;\\n    const getKeys = this._getKeys;\\n\\n    this._getRequests = [];\\n    this._getKeys = [];\\n\\n    RCTAsyncStorage.multiGet(getKeys, function(errors, result) \{\\n      // Even though the runtime complexity of this is theoretically worse vs if we used a map,\\n      // it's much, much faster in practice for the data sets we deal with (we avoid\\n      // allocating result pair arrays). This was heavily benchmarked.\\n      //\\n      // Is there a way to avoid using the map but fix the bug in this breaking test?\\n      // https://github.com/facebook/react-native/commit/8dd8ad76579d7feef34c014d387bf02065692264\\n      const map = \{};\\n      result && result.forEach(([key, value]) => \{ map[key] = value; return value; });\\n      const reqLength = getRequests.length;\\n      for (let i = 0; i < reqLength; i++) \{\\n        const request = getRequests[i];\\n        const requestKeys = request.keys;\\n        const requestResult = requestKeys.map(key => [key, map[key]]);\\n        request.callback && request.callback(null, requestResult);\\n        request.resolve && request.resolve(requestResult);\\n      }\\n    });\\n  }",
      "docblock": "/** Flushes any pending requests using a single batch call to get the data. */\\n",
      "modifiers": [
        "static"
      ],
      "params": \{
        "type": \{
          "names": [
            ""
          ]
        }
      },
      "returns": \{
        "type": \{
          "names": [
            "void"
          ]
        }
      }
    },
    \{
      "meta": \{
        "range": [
          9513,
          10248
        ],
        "filename": "0ixhk1fcq0ospkxryfsrhc.js",
        "lineno": 292,
        "path": "/var/folders/82/w8hcc_tj7yq80482srkc1r2x0bj21j/T",
        "code": \{
          "id": "astnode100000481",
          "name": "multiGet",
          "type": "FunctionExpression"
        },
        "vars": \{
          "this._immediate": "AsyncStorage.multiGet#_immediate",
          "": null,
          "getRequest": "AsyncStorage.multiGet~getRequest",
          "promiseResult": "AsyncStorage.multiGet~promiseResult"
        }
      },
      "description": "This allows you to batch the fetching of items given an array of \`key\`\\ninputs. Your callback will be invoked with an array of corresponding\\nkey-value pairs found:\\n\\n\`\`\`\\nmultiGet(['k1', 'k2'], cb) -> cb([['k1', 'val1'], ['k2', 'val2']])\\n\`\`\`\\n\\nThe method returns a \`Promise\` object.",
      "params": [
        \{
          "description": "Array of key for the items to get.",
          "name": "keys",
          "type": \{
            "names": [
              "Array<string>"
            ]
          }
        },
        \{
          "description": "Function that will be called with a key-value array of\\n    the results, plus an array of any key-specific errors found.",
          "name": "callback",
          "type": \{
            "names": [
              "?(errors: ?Array<Error>, result: ?Array<Array<string>>) => void"
            ]
          },
          "optional": true
        }
      ],
      "returns": [
        \{
          "description": "A \`Promise\` object."
        }
      ],
      "examples": [
        "<caption>Example</caption>\\n\\nAsyncStorage.getAllKeys((err, keys) => \{\\n  AsyncStorage.multiGet(keys, (err, stores) => \{\\n   stores.map((result, i, store) => \{\\n     // get at each store's key/value so you can work with it\\n     let key = store[i][0];\\n     let value = store[i][1];\\n    });\\n  });\\n});"
      ],
      "name": "multiGet",
      "longname": "AsyncStorage.multiGet",
      "memberof": "AsyncStorage",
      "scope": "static",
      "order": 8,
      "line": 306,
      "source": "multiGet: function(\\n    keys: Array<string>,\\n    callback?: ?(errors: ?Array<Error>, result: ?Array<Array<string>>) => void\\n  ): Promise \{\\n    if (!this._immediate) \{\\n      this._immediate = setImmediate(() => \{\\n        this._immediate = null;\\n        this.flushGetRequests();\\n      });\\n    }\\n\\n    var getRequest = \{\\n      keys: keys,\\n      callback: callback,\\n      // do we need this?\\n      keyIndex: this._getKeys.length,\\n      resolve: null,\\n      reject: null,\\n    };\\n\\n    var promiseResult = new Promise((resolve, reject) => \{\\n      getRequest.resolve = resolve;\\n      getRequest.reject = reject;\\n    });\\n\\n    this._getRequests.push(getRequest);\\n    // avoid fetching duplicates\\n    keys.forEach(key => \{\\n      if (this._getKeys.indexOf(key) === -1) \{\\n        this._getKeys.push(key);\\n      }\\n    });\\n\\n    return promiseResult;\\n  }",
      "docblock": "/**\\n   * This allows you to batch the fetching of items given an array of \`key\`\\n   * inputs. Your callback will be invoked with an array of corresponding\\n   * key-value pairs found:\\n   *\\n   * \`\`\`\\n   * multiGet(['k1', 'k2'], cb) -> cb([['k1', 'val1'], ['k2', 'val2']])\\n   * \`\`\`\\n   *\\n   * The method returns a \`Promise\` object.\\n   *\\n   * @param keys Array of key for the items to get.\\n   * @param callback Function that will be called with a key-value array of\\n   *     the results, plus an array of any key-specific errors found.\\n   * @returns A \`Promise\` object.\\n   *\\n   * @example <caption>Example</caption>\\n   *\\n   * AsyncStorage.getAllKeys((err, keys) => \{\\n   *   AsyncStorage.multiGet(keys, (err, stores) => \{\\n   *    stores.map((result, i, store) => \{\\n   *      // get at each store's key/value so you can work with it\\n   *      let key = store[i][0];\\n   *      let value = store[i][1];\\n   *     });\\n   *   });\\n   * });\\n   */\\n",
      "modifiers": [
        "static"
      ]
    },
    \{
      "meta": \{
        "range": [
          10805,
          11163
        ],
        "filename": "0ixhk1fcq0ospkxryfsrhc.js",
        "lineno": 341,
        "path": "/var/folders/82/w8hcc_tj7yq80482srkc1r2x0bj21j/T",
        "code": \{
          "id": "astnode100000589",
          "name": "multiSet",
          "type": "FunctionExpression"
        },
        "vars": \{
          "": null
        }
      },
      "description": "Use this as a batch operation for storing multiple key-value pairs. When\\nthe operation completes you'll get a single callback with any errors:\\n\\n\`\`\`\\nmultiSet([['k1', 'val1'], ['k2', 'val2']], cb);\\n\`\`\`\\n\\nThe method returns a \`Promise\` object.",
      "params": [
        \{
          "description": "Array of key-value array for the items to set.",
          "name": "keyValuePairs",
          "type": \{
            "names": [
              "Array<Array<string>>"
            ]
          }
        },
        \{
          "description": "Function that will be called with an array of any\\n   key-specific errors found.",
          "name": "callback",
          "type": \{
            "names": [
              "?(errors: ?Array<Error>) => void"
            ]
          },
          "optional": true
        }
      ],
      "returns": [
        \{
          "description": "A \`Promise\` object.\\nExample: see the \`multiMerge\` example."
        }
      ],
      "name": "multiSet",
      "longname": "AsyncStorage.multiSet",
      "memberof": "AsyncStorage",
      "scope": "static",
      "order": 9,
      "line": 358,
      "source": "multiSet: function(\\n    keyValuePairs: Array<Array<string>>,\\n    callback?: ?(errors: ?Array<Error>) => void\\n  ): Promise \{\\n    return new Promise((resolve, reject) => \{\\n      RCTAsyncStorage.multiSet(keyValuePairs, function(errors) \{\\n        var error = convertErrors(errors);\\n        callback && callback(error);\\n        if (error) \{\\n          reject(error);\\n        } else \{\\n          resolve(null);\\n        }\\n      });\\n    });\\n  }",
      "docblock": "/**\\n   * Use this as a batch operation for storing multiple key-value pairs. When\\n   * the operation completes you'll get a single callback with any errors:\\n   *\\n   * \`\`\`\\n   * multiSet([['k1', 'val1'], ['k2', 'val2']], cb);\\n   * \`\`\`\\n   *\\n   * The method returns a \`Promise\` object.\\n   *\\n   * @param keyValuePairs Array of key-value array for the items to set.\\n   * @param callback Function that will be called with an array of any\\n   *    key-specific errors found.\\n   * @returns A \`Promise\` object.\\n   * Example: see the \`multiMerge\` example.\\n   */\\n",
      "modifiers": [
        "static"
      ]
    },
    \{
      "meta": \{
        "range": [
          11710,
          12056
        ],
        "filename": "0ixhk1fcq0ospkxryfsrhc.js",
        "lineno": 371,
        "path": "/var/folders/82/w8hcc_tj7yq80482srkc1r2x0bj21j/T",
        "code": \{
          "id": "astnode100000634",
          "name": "multiRemove",
          "type": "FunctionExpression"
        },
        "vars": \{
          "": null
        }
      },
      "description": "Call this to batch the deletion of all keys in the \`keys\` array. Returns\\na \`Promise\` object.",
      "params": [
        \{
          "description": "Array of key for the items to delete.",
          "name": "keys",
          "type": \{
            "names": [
              "Array<string>"
            ]
          }
        },
        \{
          "description": "Function that will be called an array of any key-specific\\n   errors found.",
          "name": "callback",
          "type": \{
            "names": [
              "?(errors: ?Array<Error>) => void"
            ]
          },
          "optional": true
        }
      ],
      "returns": [
        \{
          "description": "A \`Promise\` object."
        }
      ],
      "examples": [
        "<caption>Example</caption>\\nlet keys = ['k1', 'k2'];\\nAsyncStorage.multiRemove(keys, (err) => \{\\n  // keys k1 & k2 removed, if they existed\\n  // do most stuff after removal (if you want)\\n});"
      ],
      "name": "multiRemove",
      "longname": "AsyncStorage.multiRemove",
      "memberof": "AsyncStorage",
      "scope": "static",
      "order": 10,
      "line": 391,
      "source": "multiRemove: function(\\n    keys: Array<string>,\\n    callback?: ?(errors: ?Array<Error>) => void\\n  ): Promise \{\\n    return new Promise((resolve, reject) => \{\\n      RCTAsyncStorage.multiRemove(keys, function(errors) \{\\n        var error = convertErrors(errors);\\n        callback && callback(error);\\n        if (error) \{\\n          reject(error);\\n        } else \{\\n          resolve(null);\\n        }\\n      });\\n    });\\n  }",
      "docblock": "/**\\n   * Call this to batch the deletion of all keys in the \`keys\` array. Returns\\n   * a \`Promise\` object.\\n   *\\n   * @param keys Array of key for the items to delete.\\n   * @param callback Function that will be called an array of any key-specific\\n   *    errors found.\\n   * @returns A \`Promise\` object.\\n   *\\n   * @example <caption>Example</caption>\\n   * let keys = ['k1', 'k2'];\\n   * AsyncStorage.multiRemove(keys, (err) => \{\\n   *   // keys k1 & k2 removed, if they existed\\n   *   // do most stuff after removal (if you want)\\n   * });\\n   */\\n",
      "modifiers": [
        "static"
      ]
    },
    \{
      "meta": \{
        "range": [
          14021,
          14383
        ],
        "filename": "0ixhk1fcq0ospkxryfsrhc.js",
        "lineno": 443,
        "path": "/var/folders/82/w8hcc_tj7yq80482srkc1r2x0bj21j/T",
        "code": \{
          "id": "astnode100000679",
          "name": "multiMerge",
          "type": "FunctionExpression"
        },
        "vars": \{
          "": null
        }
      },
      "description": "Batch operation to merge in existing and new values for a given set of\\nkeys. This assumes that the values are stringified JSON. Returns a\\n\`Promise\` object.\\n\\n**NOTE**: This is not supported by all native implementations.",
      "params": [
        \{
          "description": "Array of key-value array for the items to merge.",
          "name": "keyValuePairs",
          "type": \{
            "names": [
              "Array<Array<string>>"
            ]
          }
        },
        \{
          "description": "Function that will be called with an array of any\\n   key-specific errors found.",
          "name": "callback",
          "type": \{
            "names": [
              "?(errors: ?Array<Error>) => void"
            ]
          },
          "optional": true
        }
      ],
      "returns": [
        \{
          "description": "A \`Promise\` object."
        }
      ],
      "examples": [
        "<caption>Example</caption>\\n// first user, initial values\\nlet UID234_object = \{\\n name: 'Chris',\\n age: 30,\\n traits: \{hair: 'brown', eyes: 'brown'},\\n};\\n\\n// first user, delta values\\nlet UID234_delta = \{\\n age: 31,\\n traits: \{eyes: 'blue', shoe_size: 10},\\n};\\n\\n// second user, initial values\\nlet UID345_object = \{\\n name: 'Marge',\\n age: 25,\\n traits: \{hair: 'blonde', eyes: 'blue'},\\n};\\n\\n// second user, delta values\\nlet UID345_delta = \{\\n age: 26,\\n traits: \{eyes: 'green', shoe_size: 6},\\n};\\n\\nlet multi_set_pairs   = [['UID234', JSON.stringify(UID234_object)], ['UID345', JSON.stringify(UID345_object)]]\\nlet multi_merge_pairs = [['UID234', JSON.stringify(UID234_delta)], ['UID345', JSON.stringify(UID345_delta)]]\\n\\nAsyncStorage.multiSet(multi_set_pairs, (err) => \{\\n  AsyncStorage.multiMerge(multi_merge_pairs, (err) => \{\\n    AsyncStorage.multiGet(['UID234','UID345'], (err, stores) => \{\\n      stores.map( (result, i, store) => \{\\n        let key = store[i][0];\\n        let val = store[i][1];\\n        console.log(key, val);\\n      });\\n    });\\n  });\\n});\\n\\n// Console log results:\\n// => UID234 \{\\"name\\":\\"Chris\\",\\"age\\":31,\\"traits\\":\{\\"shoe_size\\":10,\\"hair\\":\\"brown\\",\\"eyes\\":\\"blue\\"}}\\n// => UID345 \{\\"name\\":\\"Marge\\",\\"age\\":26,\\"traits\\":\{\\"shoe_size\\":6,\\"hair\\":\\"blonde\\",\\"eyes\\":\\"green\\"}}"
      ],
      "name": "multiMerge",
      "longname": "AsyncStorage.multiMerge",
      "memberof": "AsyncStorage",
      "scope": "static",
      "order": 11,
      "line": 466,
      "source": "multiMerge: function(\\n    keyValuePairs: Array<Array<string>>,\\n    callback?: ?(errors: ?Array<Error>) => void\\n  ): Promise \{\\n    return new Promise((resolve, reject) => \{\\n      RCTAsyncStorage.multiMerge(keyValuePairs, function(errors) \{\\n        var error = convertErrors(errors);\\n        callback && callback(error);\\n        if (error) \{\\n          reject(error);\\n        } else \{\\n          resolve(null);\\n        }\\n      });\\n    });\\n  }",
      "docblock": "/**\\n   * Batch operation to merge in existing and new values for a given set of\\n   * keys. This assumes that the values are stringified JSON. Returns a\\n   * \`Promise\` object.\\n   *\\n   * **NOTE**: This is not supported by all native implementations.\\n   *\\n   * @param keyValuePairs Array of key-value array for the items to merge.\\n   * @param callback Function that will be called with an array of any\\n   *    key-specific errors found.\\n   * @returns A \`Promise\` object.\\n   *\\n   * @example <caption>Example</caption>\\n   * // first user, initial values\\n   * let UID234_object = \{\\n   *  name: 'Chris',\\n   *  age: 30,\\n   *  traits: \{hair: 'brown', eyes: 'brown'},\\n   * };\\n   *\\n   * // first user, delta values\\n   * let UID234_delta = \{\\n   *  age: 31,\\n   *  traits: \{eyes: 'blue', shoe_size: 10},\\n   * };\\n   *\\n   * // second user, initial values\\n   * let UID345_object = \{\\n   *  name: 'Marge',\\n   *  age: 25,\\n   *  traits: \{hair: 'blonde', eyes: 'blue'},\\n   * };\\n   *\\n   * // second user, delta values\\n   * let UID345_delta = \{\\n   *  age: 26,\\n   *  traits: \{eyes: 'green', shoe_size: 6},\\n   * };\\n   *\\n   * let multi_set_pairs   = [['UID234', JSON.stringify(UID234_object)], ['UID345', JSON.stringify(UID345_object)]]\\n   * let multi_merge_pairs = [['UID234', JSON.stringify(UID234_delta)], ['UID345', JSON.stringify(UID345_delta)]]\\n   *\\n   * AsyncStorage.multiSet(multi_set_pairs, (err) => \{\\n   *   AsyncStorage.multiMerge(multi_merge_pairs, (err) => \{\\n   *     AsyncStorage.multiGet(['UID234','UID345'], (err, stores) => \{\\n   *       stores.map( (result, i, store) => \{\\n   *         let key = store[i][0];\\n   *         let val = store[i][1];\\n   *         console.log(key, val);\\n   *       });\\n   *     });\\n   *   });\\n   * });\\n   *\\n   * // Console log results:\\n   * // => UID234 \{\\"name\\":\\"Chris\\",\\"age\\":31,\\"traits\\":\{\\"shoe_size\\":10,\\"hair\\":\\"brown\\",\\"eyes\\":\\"blue\\"}}\\n   * // => UID345 \{\\"name\\":\\"Marge\\",\\"age\\":26,\\"traits\\":\{\\"shoe_size\\":6,\\"hair\\":\\"blonde\\",\\"eyes\\":\\"green\\"}}\\n   */\\n",
      "modifiers": [
        "static"
      ]
    }
  ],
  "type": "api",
  "filepath": "Libraries/Storage/AsyncStorage.js",
  "componentName": "AsyncStorage",
  "componentPlatform": "cross"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"asyncstorage","title":"AsyncStorage","layout":"autodocs","category":"APIs","permalink":"docs/asyncstorage.html","platform":"cross","next":"asyncstorage","previous":"appregistry","sidebar":true,"path":"Libraries/Storage/AsyncStorage.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;