/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// Partial types for Octokit based on the usage in react-native-github
declare module '@octokit/rest' {
  declare class Octokit {
    constructor(options?: {auth?: string, ...}): this;

    repos: $ReadOnly<{
      listReleaseAssets: (
        params: $ReadOnly<{
          owner: string,
          repo: string,
          release_id: string,
        }>,
      ) => Promise<{
        data: Array<{
          id: string,
          name: string,
          ...
        }>,
        ...
      }>,
      uploadReleaseAsset: (
        params: $ReadOnly<{
          owner: string,
          repo: string,
          release_id: string,
          name: string,
          data: Buffer,
          headers: $ReadOnly<{
            'content-type': string,
            ...
          }>,
          ...
        }>,
      ) => Promise<{
        data: {
          browser_download_url: string,
          ...
        },
        ...
      }>,
      deleteReleaseAsset: (params: {
        owner: string,
        repo: string,
        asset_id: string,
        ...
      }) => Promise<mixed>,
    }>;
  }

  declare export {Octokit};
}
