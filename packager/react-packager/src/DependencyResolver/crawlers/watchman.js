'use strict';

const Promise = require('promise');
const path = require('path');

function watchmanRecReadDir(roots, {ignore, fileWatcher, exts}) {
  const files = [];
  return Promise.all(
    roots.map(
      root => fileWatcher.getWatcherForRoot(root)
    )
  ).then(
    watchers => {
      // All watchman roots for all watches we have.
      const watchmanRoots = watchers.map(
        watcher => watcher.watchProjectInfo.root
      );

      // Actual unique watchers (because we use watch-project we may end up with
      // duplicate "real" watches, and that's by design).
      // TODO(amasad): push this functionality into the `FileWatcher`.
      const uniqueWatchers = watchers.filter(
        (watcher, i) => watchmanRoots.indexOf(watcher.watchProjectInfo.root) === i
      );

      return Promise.all(
        uniqueWatchers.map(watcher => {
          const watchedRoot = watcher.watchProjectInfo.root;

          // Build up an expression to filter the output by the relevant roots.
          const dirExpr = ['anyof'];
          for (let i = 0; i < roots.length; i++) {
            const root = roots[i];
            if (isDescendant(watchedRoot, root)) {
              dirExpr.push(['dirname', path.relative(watchedRoot, root)]);
            }
          }

          const cmd = Promise.denodeify(watcher.client.command.bind(watcher.client));
          return cmd(['query', watchedRoot, {
            'suffix': exts,
            'expression': ['allof', ['type', 'f'], 'exists', dirExpr],
            'fields': ['name'],
          }]).then(resp => {
            if ('warning' in resp) {
              console.warn('watchman warning: ', resp.warning);
            }

            resp.files.forEach(filePath => {
              filePath = path.join(
                watchedRoot,
                filePath
              );

              if (!ignore(filePath)) {
                files.push(filePath);
              }
              return false;
            });
          });
        })
      );
    }).then(() => files);
}

function isDescendant(root, child) {
  return path.relative(root, child).indexOf('..') !== 0;
}

module.exports = watchmanRecReadDir;
