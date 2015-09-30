'use strict';

const nodeCrawl = require('./node');
const watchmanCrawl = require('./watchman');

function crawl(roots, options) {
  const {fileWatcher} = options;
  return fileWatcher.isWatchman().then(isWatchman => {
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
  });
}

module.exports = crawl;
