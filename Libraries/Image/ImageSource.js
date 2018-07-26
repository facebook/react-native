/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
'use strict';

// This is to sync with ImageSourcePropTypes.js.
// We explicitly don't want this to be strict so that we can pass in objects
// that might have more keys. This also has to be inexact to support taking
// instances of classes like FBIcon.
// https://fburl.com/8lynhvtw
type ImageURISource = $ReadOnly<{
  uri?: ?string,
  bundle?: ?string,
  method?: ?string,
  headers?: ?Object,
  body?: ?string,
  cache?: ?('default' | 'reload' | 'force-cache' | 'only-if-cached'),
  width?: ?number,
  height?: ?number,
  scale?: ?number,
}>;

// We have to export any because of an issue in Flow with objects that come from Relay:
// https://fburl.com/8ljo5tmr
// https://fb.facebook.com/groups/flow/permalink/1824103160971624/
// $FlowFixMe T26861415
export type ImageSource = ImageURISource | number | Array<ImageURISource>;
