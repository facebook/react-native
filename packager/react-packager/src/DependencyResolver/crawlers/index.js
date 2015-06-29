'use strict';

const nodeCrawl = require('./node');
//const watchmanCrawl = require('./watchman');

function crawl(roots, options) {
  return nodeCrawl(roots, options);

  // Although, in theory, watchman should be much faster;
  // there is currently a bottleneck somewhere in the
  // encoding/decoding that is causing it to be slower
  // than node crawling. However, this should be fixed soon.
  // https://github.com/facebook/watchman/issues/113
  /*
  const {fileWatcher} = options;
  return fileWatcher.isWatchman().then(isWatchman => {

    console.log(isWatchman);
    if (!isWatchman) {
      return false;
    }

    // Make sure we're dealing with a version of watchman
    // that's using `watch-project`
    // TODO(amasad): properly expose (and document) used sane internals.
    return fileWatcher.getWatchers().then(([watcher]) => !!watcher.watchProjectInfo.root);
  }).then(isWatchman => {
    if (isWatchman) {
      return watchmanCrawl(roots, options);
    }

    return nodeCrawl(roots, options);
  });*/
}

module.exports = crawl;
