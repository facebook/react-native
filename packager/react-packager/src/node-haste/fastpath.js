/*!
 * fast-path - index.js
 * MIT License
 *
 * Copyright Joyent, Inc. and other Node contributors.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to permit
 * persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
 * NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * original author: dead_horse <dead_horse@qq.com>
 * ported by: yaycmyk <evan@yaycmyk.com>
 *
 * VERSION 1.2.0
 */

'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');

const all = Object.keys(exports).filter((name) => name !== 'replace');
const IS_WINDOWS = process.platform === 'win32';

function isString(arg) {
  return typeof arg === 'string';
}

const splitDeviceRe =
      /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/;

function getDevice(filename) {
  const result = splitDeviceRe.exec(filename);

  return (result[1] || '') + (result[2] || '');
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  const nonEmptyParts = [];
  let nonBack = true;

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];

    if (p && p !== '.') {
      nonEmptyParts.push(p);
    }

    if (p === '..') {
      nonBack = false;
    }
  }

  parts = nonEmptyParts;

  // if the path does not contain ..
  if (nonBack) {
    return parts;
  }

  // if the path tries to go ab ove the root, `up` ends up > 0
  let up = 0;
  const res = [];

  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i] === '..') {
      up++;
    } else if (up) {
      up--;
    } else {
      res.push(parts[i]);
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      res.push('..');
    }
  }

  return res.reverse();
}

function trim(arr) {
  let start = 0;

  for (; start < arr.length; start++) {
    if (arr[start] !== '') { break; }
  }

  let end = arr.length - 1;

  for (; end >= 0; end--) {
    if (arr[end] !== '') { break; }
  }

  return start <= end ? arr.slice(start, end + 1) : [];
}

function normalizeUNCRoot(device) {
  return '\\\\' + device.replace(/^[\\\/]+/, '').replace(/[\\\/]+/g, '\\');
}

exports.sep = IS_WINDOWS ? '\\' : '/';
exports.delimiter = IS_WINDOWS ? ';' : ':';

if (IS_WINDOWS) {
  // path.resolve([from ...], to)
  // windows version
  exports.resolve = function resolveWIN32() {
    let resolvedDevice = '';
    let resolvedTail = '';
    let resolvedAbsolute = false;

    for (let i = arguments.length - 1; i >= -1; i--) {
      let path;

      if (i >= 0) {
        path = arguments[i];
      } else if (!resolvedDevice) {
        path = process.cwd();
      } else {
        // Windows has the concept of drive-specific current working
        // directories. If we've resolved a drive letter but not yet an
        // absolute path, get cwd for that drive. We're sure the device is not
        // an unc path at this points, because unc paths are always absolute.
        path = process.env['=' + resolvedDevice];

        // Verify that a drive-local cwd was found and that it actually points
        // to our drive. If not, default to the drive's root.
        if (!path || path.substr(0, 3).toLowerCase() !==
            resolvedDevice.toLowerCase() + '\\') {
          path = resolvedDevice + '\\';
        }
      }

      // Skip empty and invalid entries
      if (!isString(path)) {
        throw new TypeError('Arguments to path.resolve must be strings');
      } else if (!path) {
        continue;
      }

      const result = splitDeviceRe.exec(path);
      const device = result[1] || '';
      const isUnc = device && device.charAt(1) !== ':';
      const isAbsolute = exports.isAbsolute(path);
      const tail = result[3];

      if (device &&
          resolvedDevice &&
          device.toLowerCase() !== resolvedDevice.toLowerCase()) {
        // This path points to another device so it is not applicable
        continue;
      }

      if (!resolvedDevice) {
        resolvedDevice = device;
      }

      if (!resolvedAbsolute) {
        resolvedTail = tail + '\\' + resolvedTail;
        resolvedAbsolute = isAbsolute;
      }

      // Convert slashes to backslashes when `resolvedDevice` points to an UNC
      // root. Also squash multiple slashes into a single one where appropriate.
      if (isUnc) {
        resolvedDevice = normalizeUNCRoot(resolvedDevice);
      }

      if (resolvedDevice && resolvedAbsolute) {
        break;
      }
    }

    // At this point the path should be resolved to a full absolute path,
    // but handle relative paths to be safe (might happen when process.cwd()
    // fails)

    // Normalize the tail path
    resolvedTail = normalizeArray(
      resolvedTail.split(/[\\\/]+/),
      !resolvedAbsolute
    ).join('\\');

    return (resolvedDevice + (resolvedAbsolute ? '\\' : '') + resolvedTail)
           || '.';
  };

  // windows version
  exports.normalize = function normalizeWIN32(path) {
    const result = splitDeviceRe.exec(path);
    let device = result[1] || '';
    const isUnc = device && device.charAt(1) !== ':';
    const isAbsolute = exports.isAbsolute(path);
    let tail = result[3];
    const trailingSlash = /[\\\/]$/.test(tail);

    // Normalize the tail path
    tail = normalizeArray(tail.split(/[\\\/]+/), !isAbsolute).join('\\');

    if (!tail && !isAbsolute) {
      tail = '.';
    }
    if (tail && trailingSlash) {
      tail += '\\';
    }

    // Convert slashes to backslashes when `device` points to an UNC root.
    // Also squash multiple slashes into a single one where appropriate.
    if (isUnc) {
      device = normalizeUNCRoot(device);
    }

    return device + (isAbsolute ? '\\' : '') + tail;
  };

  // windows version
  exports.isAbsolute = function isAbsoluteWIN32(path) {
    const result = splitDeviceRe.exec(path);
    const device = result[1] || '';
    const isUnc = !!device && device.charAt(1) !== ':';

    // UNC paths are always absolute
    return !!result[2] || isUnc;
  };

  // windows version
  exports.join = function joinWIN32() {
    function f(p) {
      if (!isString(p)) {
        throw new TypeError('Arguments to path.join must be strings');
      }

      return p;
    }

    const paths = Array.prototype.filter.call(arguments, f);
    let joined = paths.join('\\');

    // Make sure that the joined path doesn't start with two slashes, because
    // normalize() will mistake it for an UNC path then.
    //
    // This step is skipped when it is very clear that the user actually
    // intended to point at an UNC path. This is assumed when the first
    // non-empty string arguments starts with exactly two slashes followed by
    // at least one more non-slash character.
    //
    // Note that for normalize() to treat a path as an UNC path it needs to
    // have at least 2 components, so we don't filter for that here.
    // This means that the user can use join to construct UNC paths from
    // a server name and a share name; for example:
    //   path.join('//server', 'share') -> '\\\\server\\share\')
    if (!/^[\\\/]{2}[^\\\/]/.test(paths[0])) {
      joined = joined.replace(/^[\\\/]{2,}/, '\\');
    }

    return exports.normalize(joined);
  };

  // path.relative(from, to)
  // it will solve the relative path from 'from' to 'to', for instance:
  // from = 'C:\\orandea\\test\\aaa'
  // to = 'C:\\orandea\\impl\\bbb'
  // The output of the function should be: '..\\..\\impl\\bbb'
  // windows version
  exports.relative = function relativeWIN32(from, to) {
    from = exports.resolve(from);
    to = exports.resolve(to);

    // windows is not case sensitive
    const lowerFrom = from.toLowerCase();
    const lowerTo = to.toLowerCase();

    const toParts = trim(to.split('\\'));

    const lowerFromParts = trim(lowerFrom.split('\\'));
    const lowerToParts = trim(lowerTo.split('\\'));

    const length = Math.min(lowerFromParts.length, lowerToParts.length);
    let samePartsLength = length;

    for (let i = 0; i < length; i++) {
      if (lowerFromParts[i] !== lowerToParts[i]) {
        samePartsLength = i;
        break;
      }
    }

    if (samePartsLength == 0) {
      return to;
    }

    let outputParts = [];

    for (let i = samePartsLength; i < lowerFromParts.length; i++) {
      outputParts.push('..');
    }

    outputParts = outputParts.concat(toParts.slice(samePartsLength));

    return outputParts.join('\\');
  };

} else /* posix */ {

  // path.resolve([from ...], to)
  // posix version
  exports.resolve = function resolvePOSIX() {
    let resolvedPath = '';
    let resolvedAbsolute = false;

    for (let i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      const path = i >= 0 ? arguments[i] : process.cwd();

      // Skip empty and invalid entries
      if (!isString(path)) {
        throw new TypeError('Arguments to path.resolve must be strings');
      } else if (!path) {
        continue;
      }

      resolvedPath = path + '/' + resolvedPath;
      resolvedAbsolute = path.charAt(0) === '/';
    }

    // At this point the path should be resolved to a full absolute path, but
    // handle relative paths to be safe (might happen when process.cwd() fails)

    // Normalize the path
    resolvedPath = normalizeArray(
      resolvedPath.split('/'),
      !resolvedAbsolute
    ).join('/');

    return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
  };

  // path.normalize(path)
  // posix version
  exports.normalize = function normalizePOSIX(path) {
    const isAbsolute = exports.isAbsolute(path);
    const trailingSlash = path[path.length - 1] === '/';

    // normalize the path
    path = normalizeArray(path.split('/'), !isAbsolute).join('/');

    if (!path && !isAbsolute) {
      path = '.';
    }
    if (path && trailingSlash) {
      path += '/';
    }

    return (isAbsolute ? '/' : '') + path;
  };

  // posix version
  exports.isAbsolute = function isAbsolutePOSIX(path) {
    return path.charAt(0) === '/';
  };

  // posix version
  exports.join = function joinPOSIX() {
    let path = '';

    for (let i = 0; i < arguments.length; i++) {
      const segment = arguments[i];

      if (!isString(segment)) {
        throw new TypeError('Arguments to path.join must be strings');
      }

      if (segment) {
        path += `${path ? '/' : ''}${segment}`;
      }
    }

    return exports.normalize(path);
  };

  // path.relative(from, to)
  // posix version
  exports.relative = function relativePOSIX(from, to) {
    from = exports.resolve(from).substr(1);
    to = exports.resolve(to).substr(1);

    const fromParts = trim(from.split('/'));
    const toParts = trim(to.split('/'));

    const length = Math.min(fromParts.length, toParts.length);
    let samePartsLength = length;

    for (let i = 0; i < length; i++) {
      if (fromParts[i] !== toParts[i]) {
        samePartsLength = i;
        break;
      }
    }

    let outputParts = [];

    for (let i = samePartsLength; i < fromParts.length; i++) {
      outputParts.push('..');
    }

    outputParts = outputParts.concat(toParts.slice(samePartsLength));

    return outputParts.join('/');
  };
}

exports.exists = util.deprecate(function exists(path, callback) {
  return fs.exists(path, callback);
}, 'path.exists is now called `fs.exists`.');

exports.existsSync = util.deprecate(function existsSync(path) {
  return fs.existsSync(path);
}, 'path.existsSync is now called `fs.existsSync`.');

if (IS_WINDOWS) {
  exports._makeLong = function _makeLongWIN32(path) {
    // Note: this will *probably* throw somewhere.
    if (!isString(path)) { return path; }
    if (!path) { return ''; }

    const resolvedPath = exports.resolve(path);

    if (/^[a-zA-Z]\:\\/.test(resolvedPath)) {
      // path is local filesystem path, which needs to be converted
      // to long UNC path.
      return '\\\\?\\' + resolvedPath;
    } else if (/^\\\\[^?.]/.test(resolvedPath)) {
      // path is network UNC path, which needs to be converted
      // to long UNC path.
      return '\\\\?\\UNC\\' + resolvedPath.substring(2);
    }

    return path;
  };

} else {
  exports._makeLong = function _makeLongPOSIX(path) {
    return path;
  };
}

exports.extname = function _extname(filename) {
  if (!filename) { return ''; }

  // /a.js///
  let end = filename.length;
  let c = filename[end - 1];

  while (c === exports.sep || c === '/') {
    end--;
    c = filename[end - 1];
  }

  let lastDot = -1;
  let lastSep = -1;

  for (let i = end; i--;) {
    const ch = filename[i];

    if (lastDot === -1 && ch === '.') {
      lastDot = i;
    } else if (lastSep === -1 && ch === '/') {
      lastSep = i;
    } else if (IS_WINDOWS && lastSep === -1 && ch === '\\') {
      lastSep = i;
    }

    // /xxx
    if (lastSep !== -1 && lastDot === -1) { return ''; }
    // /*.js
    if (lastDot !== -1 && i === lastDot - 2) { break; }
    // /.js
    if (lastSep !== -1 && lastDot !== -1) { break; }
  }

  // ./js and /.js
  if (lastDot < lastSep + 2) { return ''; }

  const extname = filename.slice(lastDot, end);

  if (extname === '.' && filename[lastDot - 1] === '.') {
    // ..
    if (lastDot === 1) { return ''; }

    const pre = filename[lastDot - 2];
    // [//\/]..
    if (pre === '/' || pre === exports.sep) { return ''; }
  }

  return extname;
};

exports.basename = function _basename(filename, ext) {
  if (!filename) { return ''; }

  // /a.js///
  let end = filename.length;
  let c = filename[end - 1];

  while (c === exports.sep || c === '/') {
    end--;
    c = filename[end - 1];
  }

  let lastSep = -1;

  for (let i = end; i--;) {
    const ch = filename[i];

    if (lastSep === -1 && ch === '/') {
      lastSep = i;
      break;
    }

    if (IS_WINDOWS && lastSep === -1 && ch === '\\') {
      lastSep = i;
      break;
    }
  }

  const basename = filename.slice(lastSep + 1, end);

  if (ext) {
    const match = basename.lastIndexOf(ext);

    if (match === -1 || match !== basename.length - ext.length) {
      return basename;
    }

    return basename.slice(0, basename.length - ext.length);
  }

  return basename;
};

exports.dirname = function _dirname(filename) {
  if (!filename) { return '.'; }

  let start = 0;
  let device = '';

  if (IS_WINDOWS) {
    // need to get device in windows
    device = getDevice(filename);

    if (device) { start = device.length; }
  }

  // /a.js///
  let end = filename.length;
  let c = filename[end - 1];

  while (end >= start && c === exports.sep || c === '/') {
    end--;
    c = filename[end - 1];
  }

  let lastSep = -1;

  for (let i = end; i-- > start;) {
    const ch = filename[i];

    if (lastSep === -1 && ch === '/') {
      lastSep = i;
      break;
    }

    if (IS_WINDOWS && lastSep === -1 && ch === '\\') {
      lastSep = i;
      break;
    }
  }

  if (lastSep <= start) {
    if (device) { return device; }
    if (filename[0] === '/' || filename[0] === exports.sep) { return filename[0]; }

    return '.';
  }

  return device + filename.slice(start, lastSep);
};

exports.replace = function(props) {
  if (!props) { props = all; }
  if (!Array.isArray(props)) { props = [props]; }

  props.forEach(function(name) {
    if (exports[name]) { path[name] = exports[name]; }
  });
};
