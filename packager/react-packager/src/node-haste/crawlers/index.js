'use strict';

const nodeCrawl = require('./node');
const watchmanCrawl = require('./watchman');

function crawl(roots, options) {
  const {fileWatcher} = options;
  return (fileWatcher ? fileWatcher.isWatchman() : Promise.resolve(false)).then(
    isWatchman => isWatchman ? watchmanCrawl(roots, options) : nodeCrawl(roots, options)
  );
}

module.exports = crawl;
