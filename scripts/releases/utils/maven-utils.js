/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {getWithCurl} = require('./curl-utils');

async function getLatestMavenSnapshotVersion(
  groupId /*: string */,
  artifactId /*: string */,
  repository /*: string */ = 'https://central.sonatype.com/repository/maven-snapshots',
) /*: Promise<string> */ {
  const groupPath = groupId.replace(/\./g, '/');
  const metadataUrl = `${repository}/${groupPath}/${artifactId}/maven-metadata.xml`;
  const {data} = await getWithCurl(metadataUrl);
  const xml = data.toString('utf8');

  const regex = new RegExp(`<latest>([^<]+)</latest>`);
  const match = xml.match(regex);

  if (!match) {
    throw new Error(
      `Failed to find latest version for ${groupId}:${artifactId} in ${metadataUrl}`,
    );
  }

  return match[1].substring(0, match[1].length - '-SNAPSHOT'.length);
}

module.exports = {
  getLatestMavenSnapshotVersion,
};
