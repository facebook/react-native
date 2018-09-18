/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
'use strict';

export type ResolvedAssetSource = {|
  +__packager_asset: boolean,
  +width: ?number,
  +height: ?number,
  +uri: string,
  +scale: number,
|};

import type {PackagerAsset} from 'AssetRegistry';

const PixelRatio = require('PixelRatio');
const Platform = require('Platform');

const assetPathUtils = require('../../local-cli/bundle/assetPathUtils');
const invariant = require('fbjs/lib/invariant');

/**
 * Returns a path like 'assets/AwesomeModule/icon@2x.png'
 */
function getScaledAssetPath(asset): string {
  const scale = AssetSourceResolver.pickScale(asset.scales, PixelRatio.get());
  const scaleSuffix = scale === 1 ? '' : '@' + scale + 'x';
  const assetDir = assetPathUtils.getBasePath(asset);
  return assetDir + '/' + asset.name + scaleSuffix + '.' + asset.type;
}

/**
 * Returns a path like 'drawable-mdpi/icon.png'
 */
function getAssetPathInDrawableFolder(asset): string {
  const scale = AssetSourceResolver.pickScale(asset.scales, PixelRatio.get());
  const drawbleFolder = assetPathUtils.getAndroidResourceFolderName(
    asset,
    scale,
  );
  const fileName = assetPathUtils.getAndroidResourceIdentifier(asset);
  return drawbleFolder + '/' + fileName + '.' + asset.type;
}

class AssetSourceResolver {
  serverUrl: ?string;
  // where the jsbundle is being run from
  jsbundleUrl: ?string;
  // the asset to resolve
  asset: PackagerAsset;

  constructor(serverUrl: ?string, jsbundleUrl: ?string, asset: PackagerAsset) {
    this.serverUrl = serverUrl;
    this.jsbundleUrl = jsbundleUrl;
    this.asset = asset;
  }

  isLoadedFromServer(): boolean {
    return !!this.serverUrl;
  }

  isLoadedFromFileSystem(): boolean {
    return !!(this.jsbundleUrl && this.jsbundleUrl.startsWith('file://'));
  }

  defaultAsset(): ResolvedAssetSource {
    if (this.isLoadedFromServer()) {
      return this.assetServerURL();
    }

    if (Platform.OS === 'android') {
      return this.isLoadedFromFileSystem()
        ? this.drawableFolderInBundle()
        : this.resourceIdentifierWithoutScale();
    } else {
      return this.scaledAssetURLNearBundle();
    }
  }

  /**
   * Returns an absolute URL which can be used to fetch the asset
   * from the devserver
   */
  assetServerURL(): ResolvedAssetSource {
    invariant(!!this.serverUrl, 'need server to load from');
    return this.fromSource(
      this.serverUrl +
        getScaledAssetPath(this.asset) +
        '?platform=' +
        Platform.OS +
        '&hash=' +
        this.asset.hash,
    );
  }

  /**
   * Resolves to just the scaled asset filename
   * E.g. 'assets/AwesomeModule/icon@2x.png'
   */
  scaledAssetPath(): ResolvedAssetSource {
    return this.fromSource(getScaledAssetPath(this.asset));
  }

  /**
   * Resolves to where the bundle is running from, with a scaled asset filename
   * E.g. 'file:///sdcard/bundle/assets/AwesomeModule/icon@2x.png'
   */
  scaledAssetURLNearBundle(): ResolvedAssetSource {
    const path = this.jsbundleUrl || 'file://';
    return this.fromSource(path + getScaledAssetPath(this.asset));
  }

  /**
   * The default location of assets bundled with the app, located by
   * resource identifier
   * The Android resource system picks the correct scale.
   * E.g. 'assets_awesomemodule_icon'
   */
  resourceIdentifierWithoutScale(): ResolvedAssetSource {
    invariant(
      Platform.OS === 'android',
      'resource identifiers work on Android',
    );
    return this.fromSource(
      assetPathUtils.getAndroidResourceIdentifier(this.asset),
    );
  }

  /**
   * If the jsbundle is running from a sideload location, this resolves assets
   * relative to its location
   * E.g. 'file:///sdcard/AwesomeModule/drawable-mdpi/icon.png'
   */
  drawableFolderInBundle(): ResolvedAssetSource {
    const path = this.jsbundleUrl || 'file://';
    return this.fromSource(path + getAssetPathInDrawableFolder(this.asset));
  }

  fromSource(source: string): ResolvedAssetSource {
    return {
      __packager_asset: true,
      width: this.asset.width,
      height: this.asset.height,
      uri: source,
      scale: AssetSourceResolver.pickScale(this.asset.scales, PixelRatio.get()),
    };
  }

  static pickScale(scales: Array<number>, deviceScale: number): number {
    // Packager guarantees that `scales` array is sorted
    for (let i = 0; i < scales.length; i++) {
      if (scales[i] >= deviceScale) {
        return scales[i];
      }
    }

    // If nothing matches, device scale is larger than any available
    // scales, so we return the biggest one. Unless the array is empty,
    // in which case we default to 1
    return scales[scales.length - 1] || 1;
  }
}

module.exports = AssetSourceResolver;
