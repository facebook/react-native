/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const groupBy = require('lodash').groupBy;
const mime = require('mime');

/**
 * Since there are no officially registered MIME types
 * for ttf/otf yet http://www.iana.org/assignments/media-types/media-types.xhtml,
 * we define two non-standard ones for the sake of parsing
 */
mime.define({
  'font/opentype': ['otf'],
  'font/truetype': ['ttf'],
});

/**
 * Given an array of files, it groups it by it's type.
 * Type of the file is inferred from it's mimetype based on the extension
 * file ends up with. The returned value is an object with properties that
 * correspond to the first part of the mimetype, e.g. images will be grouped
 * under `image` key since the mimetype for them is `image/jpg` etc.
 *
 * Example:
 * Given an array ['fonts/a.ttf', 'images/b.jpg'],
 * the returned object will be: {font: ['fonts/a.ttf'], image: ['images/b.jpg']}
 */
module.exports = function groupFilesByType(assets) {
  return groupBy(assets, type => mime.lookup(type).split('/')[0]);
};
