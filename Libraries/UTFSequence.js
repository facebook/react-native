/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule UTFSequence
 * @flow
 * @format
 */

'use strict';

const deepFreezeAndThrowOnMutationInDev = require('deepFreezeAndThrowOnMutationInDev');

/**
 * A collection of Unicode sequences for various characters and emoji.
 *
 *  - More explicit than using the sequences directly in code.
 *  - Source code should be limitted to ASCII.
 *  - Less chance of typos.
 */
const UTFSequence = deepFreezeAndThrowOnMutationInDev({
  BULLET: '\u2022', // bullet: &#8226;
  BULLET_SP: '\u00A0\u2022\u00A0', // &nbsp;&#8226;&nbsp;
  MIDDOT: '\u00B7', // normal middle dot: &middot;
  MIDDOT_SP: '\u00A0\u00B7\u00A0', // &nbsp;&middot;&nbsp;
  MIDDOT_KATAKANA: '\u30FB', // katakana middle dot
  MDASH: '\u2014', // em dash: &mdash;
  MDASH_SP: '\u00A0\u2014\u00A0', // &nbsp;&mdash;&nbsp;
  NDASH: '\u2013', // en dash: &ndash;
  NDASH_SP: '\u00A0\u2013\u00A0', // &nbsp;&ndash;&nbsp;
  NBSP: '\u00A0', // non-breaking space: &nbsp;
  PIZZA: '\uD83C\uDF55',
});

module.exports = UTFSequence;
