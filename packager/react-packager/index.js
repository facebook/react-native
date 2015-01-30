var Packager = require('./src/Packager');
var Activity = require('./src/Activity');
var url = require('url');

exports.buildPackageFromUrl = function(options, reqUrl) {
  Activity.disable();
  var packager = createPackager(options);
  var params = getOptionsFromPath(url.parse(reqUrl).pathname);
  return packager.package(
    params.main,
    params.runModule,
    params.sourceMapUrl
  ).then(function(p) {
    packager.kill();
    return p;
  });
};

exports.catalystMiddleware = function(options) {
  var packager = createPackager(options);

  return function(req, res, next) {
    var options;
    if (req.url.match(/\.bundle$/)) {
      options = getOptionsFromPath(url.parse(req.url).pathname);
      packager.package(
        options.main,
        options.runModule,
        options.sourceMapUrl
      ).then(
        function(package) {
          res.end(package.getSource());
        },
        function(error) {
          handleError(res, error);
        }
      ).done();
    } else if (req.url.match(/\.map$/)) {
      options = getOptionsFromPath(url.parse(req.url).pathname);
      packager.package(
        options.main,
        options.runModule,
        options.sourceMapUrl
      ).then(
        function(package) {
          res.end(JSON.stringify(package.getSourceMap()));
        },
        function(error) {
          handleError(res, error);
        }
      ).done();
    } else {
      next();
    }
  };
};

function getOptionsFromPath(pathname) {
  var parts = pathname.split('.');
  // Remove the leading slash.
  var main = parts[0].slice(1) + '.js';
  return {
    runModule: parts.slice(1).some(function(part) {
      return part === 'runModule';
    }),
    main: main,
    sourceMapUrl: parts.slice(0, -1).join('.') + '.map'
  };
}

function handleError(res, error) {
  res.writeHead(500, {
    'Content-Type': 'application/json; charset=UTF-8',
  });

  if (error.type === 'TransformError') {
    res.end(JSON.stringify(error));
  } else {
    console.error(error.stack || error);
    res.end(JSON.stringify({
      type: 'InternalError',
      message: 'React packager has encountered an internal error, ' +
        'please check your terminal error output for more details',
    }));
  }
}

function createPackager(options) {
  return new Packager({
    projectRoot: options.projectRoot,
    blacklistRE: options.blacklistRE,
    polyfillModuleNames: options.polyfillModuleNames || [],
    runtimeCode: options.runtimeCode,
    cacheVersion: options.cacheVersion,
    resetCache: options.resetCache,
    dev: options.dev,
  });
}

exports.kill = Packager.kill;
