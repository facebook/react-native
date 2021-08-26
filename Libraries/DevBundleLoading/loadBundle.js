/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import HMRClient from '../Utilities/HMRClient';
import LoadingView from '../Utilities/LoadingView';
import getDevServer from '../Core/Devtools/getDevServer';
import qs from 'qs';
import NativeDevSplitBundleLoader from '../Utilities/NativeDevSplitBundleLoader.js';
import Networking from '../Network/RCTNetworking';

declare var global: {globalEvalWithSourceUrl?: (string, string) => mixed, ...};

let pendingRequests = 0;

function asyncRequest(
  url: string,
): Promise<{body: string, headers: {[string]: string}}> {
  let id = null;
  let responseText = null;
  let headers = null;
  let dataListener;
  let completeListener;
  let responseListener;
  return new Promise((resolve, reject) => {
    dataListener = Networking.addListener(
      'didReceiveNetworkData',
      ([requestId, response]) => {
        if (requestId === id) {
          responseText = response;
        }
      },
    );
    responseListener = Networking.addListener(
      'didReceiveNetworkResponse',
      ([requestId, status, responseHeaders]) => {
        if (requestId === id) {
          headers = responseHeaders;
        }
      },
    );
    completeListener = Networking.addListener(
      'didCompleteNetworkResponse',
      ([requestId, error]) => {
        if (requestId === id) {
          if (error) {
            reject(error);
          } else {
            resolve({body: responseText, headers});
          }
        }
      },
    );
    Networking.sendRequest(
      'GET',
      'asyncRequest',
      url,
      {},
      '',
      'text',
      false,
      0,
      requestId => {
        id = requestId;
      },
      true,
    );
    //$FlowFixMe[incompatible-return]
  }).finally(() => {
    dataListener && dataListener.remove();
    completeListener && completeListener.remove();
    responseListener && responseListener.remove();
  });
}

function buildUrlForBundle(bundlePath, params) {
  const {
    fullBundleUrl,
    url: serverUrl,
    bundleLoadedFromServer,
  } = getDevServer();
  if (!bundleLoadedFromServer) {
    throw new Error(
      'This bundle was compiled with transformer.experimentalImportBundleSupport and can only be used when connected to a Metro server.',
    );
  }
  let query = {};
  if (fullBundleUrl != null) {
    const queryStart = fullBundleUrl.indexOf('?');
    if (queryStart !== -1) {
      query = qs.parse(fullBundleUrl.substring(queryStart + 1));
    }
  }
  Object.assign(query, params);
  return serverUrl + bundlePath + '.bundle?' + qs.stringify(query);
}

module.exports = function(bundlePath: string): Promise<mixed> {
  if (NativeDevSplitBundleLoader && NativeDevSplitBundleLoader.loadBundle) {
    return NativeDevSplitBundleLoader.loadBundle(bundlePath).catch(e => {
      // On Android 'e' is not an instance of Error, which seems to be a bug.
      // As a workaround, re-throw an Error to not break the error handling code.
      throw new Error(e.message);
    });
  }

  const requestUrl = buildUrlForBundle(bundlePath, {
    modulesOnly: 'true',
    runModule: 'false',
    // The JavaScript loader does not support bytecode.
    runtimeBytecodeVersion: null,
  });

  LoadingView.showMessage('Downloading...', 'load');
  return asyncRequest(requestUrl)
    .then(({body, headers}) => {
      if (
        headers['Content-Type'] != null &&
        headers['Content-Type'].indexOf('application/json') >= 0
      ) {
        // Errors are returned as JSON.
        throw new Error(
          JSON.parse(body).message || `Unknown error fetching '${bundlePath}'`,
        );
      }

      HMRClient.registerBundle(requestUrl);

      // Some engines do not support `sourceURL` as a comment. We expose a
      // `globalEvalWithSourceUrl` function to handle updates in that case.
      if (global.globalEvalWithSourceUrl) {
        global.globalEvalWithSourceUrl(body, requestUrl);
      } else {
        // eslint-disable-next-line no-eval
        eval(body);
      }
    })
    .finally(() => {
      if (!--pendingRequests) {
        LoadingView.hide();
      }
    });
};
