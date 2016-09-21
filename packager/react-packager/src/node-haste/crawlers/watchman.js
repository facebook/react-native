'use strict';

const denodeify = require('denodeify');
const path = require('../fastpath');

const watchmanURL = 'https://facebook.github.io/watchman/docs/troubleshooting.html';

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

          const cmd = denodeify(watcher.client.command.bind(watcher.client));
          return cmd(['query', watchedRoot, {
            suffix: exts,
            expression: ['allof', ['type', 'f'], 'exists', dirExpr],
            fields: ['name'],
          }]).then(resp => {
            if ('warning' in resp) {
              console.warn('watchman warning: ', resp.warning);
            }

            resp.files.forEach(filePath => {
              filePath = watchedRoot + path.sep + filePath;
              if (!ignore(filePath)) {
                files.push(filePath);
              }
              return false;
            });
          });
        })
      );
    }).then(
      () => files,
      error => {
        throw new Error(
          `Watchman error: ${error.message.trim()}. Make sure watchman ` +
          `is running for this project. See ${watchmanURL}.`
        );
      }
    );
}

function isDescendant(root, child) {
  return root === child || child.startsWith(root + path.sep);
}

module.exports = watchmanRecReadDir;
