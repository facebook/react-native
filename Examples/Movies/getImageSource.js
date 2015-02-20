/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 * @flow
 */
'use strict';

function getImageSource(movie: Object, kind: ?string): {uri: ?string} {
  var uri = movie && movie.posters ? movie.posters.thumbnail : null;
  if (uri && kind) {
    uri = uri.replace('tmb', kind);
  }
  return { uri };
}

module.exports = getImageSource;
