/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import typeof * as AnimatedExports from './AnimatedExports';

// The AnimatedExports module is typed as multiple exports to allow
// for an implicit namespace, but underneath is's a single default export.
const Animated: AnimatedExports = (require('./AnimatedExports') as $FlowFixMe)
  .default;

export default Animated;
