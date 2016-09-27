/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

/*
 * original author: dead_horse <dead_horse@qq.com>
 * ported by: yaycmyk <evan@yaycmyk.com>
 */

jest.dontMock('../fastpath');
const fp = () => require('../fastpath');

describe('fast-path', () => {
  const actual_platform = process.platform;
  const invalidInputTests = [
    true,
    false,
    7,
    null,
    {},
    undefined,
    [],
    NaN,
    () => {},
  ];

  const getErrorMessage = (fnName, test, expected, actual) => {
    return [
      `fastpath.${fnName}('${test}')`,
      `expect=${JSON.stringify(expected)}`,
      `actual=${JSON.stringify(actual)}`,
    ].join('\n');
  };

  beforeEach(function() {
    jest.resetModules();
    process.platform = 'linux';
  });

  afterEach(function() {
    process.platform = actual_platform;
  });

  describe('basename', () => {
    it('should resolve given paths', () => {
      process.platform = actual_platform;

      expect(fp().basename(__filename)).toEqual('fastpath-test.js');
      expect(fp().basename(__filename, '.js')).toEqual('fastpath-test');
      expect(fp().basename('')).toEqual('');
      expect(fp().basename('/dir/basename.ext')).toEqual('basename.ext');
      expect(fp().basename('/basename.ext')).toEqual('basename.ext');
      expect(fp().basename('basename.ext')).toEqual('basename.ext');
      expect(fp().basename('basename.ext/')).toEqual('basename.ext');
      expect(fp().basename('basename.ext//')).toEqual('basename.ext');
    });

    it('should handle backslashes properly (win32)', () => {
      process.platform = 'win32';

      expect(fp().basename('\\dir\\basename.ext')).toEqual('basename.ext');
      expect(fp().basename('\\basename.ext')).toEqual('basename.ext');
      expect(fp().basename('basename.ext')).toEqual('basename.ext');
      expect(fp().basename('basename.ext\\')).toEqual('basename.ext');
      expect(fp().basename('basename.ext\\\\')).toEqual('basename.ext');
    });

    it('should handle backslashes properly (posix)', () => {
      expect(fp().basename('\\dir\\basename.ext')).toEqual('\\dir\\basename.ext');
      expect(fp().basename('\\basename.ext')).toEqual('\\basename.ext');
      expect(fp().basename('basename.ext')).toEqual('basename.ext');
      expect(fp().basename('basename.ext\\')).toEqual('basename.ext\\');
      expect(fp().basename('basename.ext\\\\')).toEqual('basename.ext\\\\');
    });

    it('should handle control characters (posix)', () => {
      // POSIX filenames may include control characters
      // c.f. http://www.dwheeler.com/essays/fixing-unix-linux-filenames.html
      const name = 'Icon' + String.fromCharCode(13);
      expect(fp().basename('/a/b/' + name)).toEqual(name);
    });
  });

  describe('extname', () => {
    it('should extract the extension from a path', () => {
      process.platform = actual_platform;

      expect(fp().extname(__filename)).toEqual('.js');
      expect(fp().extname('')).toEqual('');
      expect(fp().extname('/path/to/file')).toEqual('');
      expect(fp().extname('/path/to/file.ext')).toEqual('.ext');
      expect(fp().extname('/path.to/file.ext')).toEqual('.ext');
      expect(fp().extname('/path.to/file')).toEqual('');
      expect(fp().extname('/path.to/.file')).toEqual('');
      expect(fp().extname('/path.to/.file.ext')).toEqual('.ext');
      expect(fp().extname('/path/to/f.ext')).toEqual('.ext');
      expect(fp().extname('/path/to/..ext')).toEqual('.ext');
      expect(fp().extname('file')).toEqual('');
      expect(fp().extname('file.ext')).toEqual('.ext');
      expect(fp().extname('.file')).toEqual('');
      expect(fp().extname('.file.ext')).toEqual('.ext');
      expect(fp().extname('/file')).toEqual('');
      expect(fp().extname('/file.ext')).toEqual('.ext');
      expect(fp().extname('/.file')).toEqual('');
      expect(fp().extname('/.file.ext')).toEqual('.ext');
      expect(fp().extname('.path/file.ext')).toEqual('.ext');
      expect(fp().extname('file.ext.ext')).toEqual('.ext');
      expect(fp().extname('file.')).toEqual('.');
      expect(fp().extname('.')).toEqual('');
      expect(fp().extname('./')).toEqual('');
      expect(fp().extname('.file.ext')).toEqual('.ext');
      expect(fp().extname('.file')).toEqual('');
      expect(fp().extname('.file.')).toEqual('.');
      expect(fp().extname('.file..')).toEqual('.');
      expect(fp().extname('..')).toEqual('');
      expect(fp().extname('../')).toEqual('');
      expect(fp().extname('..file.ext')).toEqual('.ext');
      expect(fp().extname('..file')).toEqual('.file');
      expect(fp().extname('..file.')).toEqual('.');
      expect(fp().extname('..file..')).toEqual('.');
      expect(fp().extname('...')).toEqual('.');
      expect(fp().extname('...ext')).toEqual('.ext');
      expect(fp().extname('....')).toEqual('.');
      expect(fp().extname('file.ext/')).toEqual('.ext');
      expect(fp().extname('file.ext//')).toEqual('.ext');
      expect(fp().extname('file/')).toEqual('');
      expect(fp().extname('file//')).toEqual('');
      expect(fp().extname('file./')).toEqual('.');
      expect(fp().extname('file.//')).toEqual('.');
    });

    it('should handle path backslashes (win32)', () => {
      process.platform = 'win32';

      // On windows, backspace is a path separator.
      expect(fp().extname('.\\')).toEqual('');
      expect(fp().extname('..\\')).toEqual('');
      expect(fp().extname('file.ext\\')).toEqual('.ext');
      expect(fp().extname('file.ext\\\\')).toEqual('.ext');
      expect(fp().extname('file\\')).toEqual('');
      expect(fp().extname('file\\\\')).toEqual('');
      expect(fp().extname('file.\\')).toEqual('.');
      expect(fp().extname('file.\\\\')).toEqual('.');
    });

    it('should handle path backslashes (posix)', () => {
      // On unix, backspace is a valid name component like any other character.
      expect(fp().extname('.\\')).toEqual('');
      expect(fp().extname('..\\')).toEqual('.\\');
      expect(fp().extname('file.ext\\')).toEqual('.ext\\');
      expect(fp().extname('file.ext\\\\')).toEqual('.ext\\\\');
      expect(fp().extname('file\\')).toEqual('');
      expect(fp().extname('file\\\\')).toEqual('');
      expect(fp().extname('file.\\')).toEqual('.\\');
      expect(fp().extname('file.\\\\')).toEqual('.\\\\');
    });
  });

  describe('dirname', () => {
    it('should isolate the directory name from a path (posix)', () => {
      expect(fp().dirname('/a/b/')).toEqual('/a');
      expect(fp().dirname('/a/b')).toEqual('/a');
      expect(fp().dirname('/a')).toEqual('/');
      expect(fp().dirname('')).toEqual('.');
      expect(fp().dirname('/')).toEqual('/');
      expect(fp().dirname('////')).toEqual('/');
    });

    it('should isolate the directory name from a path (win32)', () => {
      process.platform = 'win32';

      expect(fp().dirname('C:\\')).toEqual('C:\\');
      expect(fp().dirname('c:\\')).toEqual('c:\\');
      expect(fp().dirname('c:\\foo')).toEqual('c:\\');
      expect(fp().dirname('c:\\foo\\')).toEqual('c:\\');
      expect(fp().dirname('c:\\foo\\bar')).toEqual('c:\\foo');
      expect(fp().dirname('c:\\foo\\bar\\')).toEqual('c:\\foo');
      expect(fp().dirname('c:\\foo\\bar\\baz')).toEqual('c:\\foo\\bar');
      expect(fp().dirname('\\')).toEqual('\\');
      expect(fp().dirname('\\foo')).toEqual('\\');
      expect(fp().dirname('\\foo\\')).toEqual('\\');
      expect(fp().dirname('\\foo\\bar')).toEqual('\\foo');
      expect(fp().dirname('\\foo\\bar\\')).toEqual('\\foo');
      expect(fp().dirname('\\foo\\bar\\baz')).toEqual('\\foo\\bar');
      expect(fp().dirname('c:')).toEqual('c:');
      expect(fp().dirname('c:foo')).toEqual('c:');
      expect(fp().dirname('c:foo\\')).toEqual('c:');
      expect(fp().dirname('c:foo\\bar')).toEqual('c:foo');
      expect(fp().dirname('c:foo\\bar\\')).toEqual('c:foo');
      expect(fp().dirname('c:foo\\bar\\baz')).toEqual('c:foo\\bar');
      expect(fp().dirname('\\\\unc\\share')).toEqual('\\\\unc\\share');
      expect(fp().dirname('\\\\unc\\share\\foo')).toEqual('\\\\unc\\share\\');
      expect(fp().dirname('\\\\unc\\share\\foo\\')).toEqual('\\\\unc\\share\\');
      expect(fp().dirname('\\\\unc\\share\\foo\\bar')).toEqual('\\\\unc\\share\\foo');
      expect(fp().dirname('\\\\unc\\share\\foo\\bar\\')).toEqual('\\\\unc\\share\\foo');
      expect(fp().dirname('\\\\unc\\share\\foo\\bar\\baz')).toEqual('\\\\unc\\share\\foo\\bar');
    });
  });

  describe('join', () => {
    const posixJoinTests = [
      // arguments                      result
      [['.', 'x/b', '..', '/b/c.js'],   'x/b/c.js'],
      [['/.', 'x/b', '..', '/b/c.js'],  '/x/b/c.js'],
      [['/foo', '../../../bar'],        '/bar'],
      [['foo', '../../../bar'],         '../../bar'],
      [['foo/', '../../../bar'],        '../../bar'],
      [['foo/x', '../../../bar'],       '../bar'],
      [['foo/x', './bar'],              'foo/x/bar'],
      [['foo/x/', './bar'],             'foo/x/bar'],
      [['foo/x/', '.', 'bar'],          'foo/x/bar'],
      [['./'],                          './'],
      [['.', './'],                     './'],
      [['.', '.', '.'],                 '.'],
      [['.', './', '.'],                '.'],
      [['.', '/./', '.'],               '.'],
      [['.', '/////./', '.'],           '.'],
      [['.'],                           '.'],
      [['', '.'],                       '.'],
      [['', 'foo'],                     'foo'],
      [['foo', '/bar'],                 'foo/bar'],
      [['', '/foo'],                    '/foo'],
      [['', '', '/foo'],                '/foo'],
      [['', '', 'foo'],                 'foo'],
      [['foo', ''],                     'foo'],
      [['foo/', ''],                    'foo/'],
      [['foo', '', '/bar'],             'foo/bar'],
      [['./', '..', '/foo'],            '../foo'],
      [['./', '..', '..', '/foo'],      '../../foo'],
      [['.', '..', '..', '/foo'],       '../../foo'],
      [['', '..', '..', '/foo'],        '../../foo'],
      [['/'],                           '/'],
      [['/', '.'],                      '/'],
      [['/', '..'],                     '/'],
      [['/', '..', '..'],               '/'],
      [[''],                            '.'],
      [['', ''],                        '.'],
      [[' /foo'],                       ' /foo'],
      [[' ', 'foo'],                    ' /foo'],
      [[' ', '.'],                      ' '],
      [[' ', '/'],                      ' /'],
      [[' ', ''],                       ' '],
      [['/', 'foo'],                    '/foo'],
      [['/', '/foo'],                   '/foo'],
      [['/', '//foo'],                  '/foo'],
      [['/', '', '/foo'],               '/foo'],
      [['', '/', 'foo'],                '/foo'],
      [['', '/', '/foo'],               '/foo'],
    ];

    const win32JoinTests = posixJoinTests.concat([
      // UNC path expected
      [['//foo/bar'], '//foo/bar/'],
      [['\\/foo/bar'], '//foo/bar/'],
      [['\\\\foo/bar'], '//foo/bar/'],
      // UNC path expected - server and share separate
      [['//foo', 'bar'], '//foo/bar/'],
      [['//foo/', 'bar'], '//foo/bar/'],
      [['//foo', '/bar'], '//foo/bar/'],
      // UNC path expected - questionable
      [['//foo', '', 'bar'], '//foo/bar/'],
      [['//foo/', '', 'bar'], '//foo/bar/'],
      [['//foo/', '', '/bar'], '//foo/bar/'],
      // UNC path expected - even more questionable
      [['', '//foo', 'bar'], '//foo/bar/'],
      [['', '//foo/', 'bar'], '//foo/bar/'],
      [['', '//foo/', '/bar'], '//foo/bar/'],
      // No UNC path expected (no double slash in first component)
      [['\\', 'foo/bar'], '/foo/bar'],
      [['\\', '/foo/bar'], '/foo/bar'],
      [['', '/', '/foo/bar'], '/foo/bar'],
      // No UNC path expected (no non-slashes in first component - questionable)
      [['//', 'foo/bar'], '/foo/bar'],
      [['//', '/foo/bar'], '/foo/bar'],
      [['\\\\', '/', '/foo/bar'], '/foo/bar'],
      [['//'], '/'],
      // No UNC path expected (share name missing - questionable).
      [['//foo'], '/foo'],
      [['//foo/'], '/foo/'],
      [['//foo', '/'], '/foo/'],
      [['//foo', '', '/'], '/foo/'],
      // No UNC path expected (too many leading slashes - questionable)
      [['///foo/bar'], '/foo/bar'],
      [['////foo', 'bar'], '/foo/bar'],
      [['\\\\\\/foo/bar'], '/foo/bar'],
      // Drive-relative vs drive-absolute paths. This merely describes the
      // status quo, rather than being obviously right
      [['C:'], 'C:.'],
      [['c:'], 'c:.'],
      [['c:.'], 'c:.'],
      [['c:', ''], 'c:.'],
      [['', 'c:'], 'c:.'],
      [['c:.', '/'], 'c:./'],
      [['c:.', 'file'], 'c:file'],
      [['c:', '/'], 'c:/'],
      [['c:', 'file'], 'c:/file'],
    ]);

    it('should join the paths correctly (posix)', () => {
      posixJoinTests.forEach((test) => {
        const actual = fp().join(...test[0]);
        const expected = test[1];

        expect(actual).toEqual(expected, getErrorMessage('join',
          test[0].map(JSON.stringify).join(','),
          expected,
          actual,
        ));
      });
    });

    it('should join the paths correctly (win32)', () => {
      process.platform = 'win32';

      win32JoinTests.forEach((test) => {
        const actual = fp().join(...test[0]);
        const expected = test[1].replace(/\//g, '\\');

        expect(actual).toEqual(expected, getErrorMessage('join',
          test[0].map(JSON.stringify).join(','),
          expected,
          actual,
        ));
      });
    });

    it('should throw for invalid input', () => {
      invalidInputTests.forEach((test) => {
        expect(() => fp().join(test)).toThrow();
      });
    });
  });

  describe('normalize', () => {
    it('should return a valid path (posix)', () => {
      expect(fp().normalize('./fixtures///b/../b/c.js')).toEqual('fixtures/b/c.js');
      expect(fp().normalize('/foo/../../../bar')).toEqual('/bar');
      expect(fp().normalize('a//b//../b')).toEqual('a/b');
      expect(fp().normalize('a//b//./c')).toEqual('a/b/c');
      expect(fp().normalize('a//b//.')).toEqual('a/b');
    });

    it('should return a valid path (win32)', () => {
      process.platform = 'win32';
      expect(fp().normalize('./fixtures///b/../b/c.js')).toEqual('fixtures\\b\\c.js');
      expect(fp().normalize('/foo/../../../bar')).toEqual('\\bar');
      expect(fp().normalize('a//b//../b')).toEqual('a\\b');
      expect(fp().normalize('a//b//./c')).toEqual('a\\b\\c');
      expect(fp().normalize('a//b//.')).toEqual('a\\b');
      expect(fp().normalize('//server/share/dir/file.ext')).toEqual('\\\\server\\share\\dir\\file.ext');
    });
  });

  describe('resolve', () => {
    const win32ResolveTests = [
      // arguments                                    result
      [['C:/blah\\blah', 'D:/games', 'C:../a'], 'C:\\blah\\a'],
      [['c:/blah\\blah', 'd:/games', 'c:../a'], 'c:\\blah\\a'],
      [['c:/ignore', 'd:\\a/b\\c/d', '\\e.exe'], 'd:\\e.exe'],
      [['c:/ignore', 'c:/some/file'], 'c:\\some\\file'],
      [['d:/ignore', 'd:some/dir//'], 'd:\\ignore\\some\\dir'],
      [['//server/share', '..', 'relative\\'], '\\\\server\\share\\relative'],
      [['c:/', '//'], 'c:\\'],
      [['c:/', '//dir'], 'c:\\dir'],
      [['c:/', '//server/share'], '\\\\server\\share\\'],
      [['c:/', '//server//share'], '\\\\server\\share\\'],
      [['c:/', '///some//dir'], 'c:\\some\\dir'],
    ];

    const posixResolveTests = [
      // arguments                   result
      [['/var/lib', '../', 'file/'], '/var/file'],
      [['/var/lib', '/../', 'file/'], '/file'],
      [['/some/dir', '.', '/absolute/'], '/absolute'],
    ];

    it('should resolve the current working directory', () => {
      process.platform = actual_platform;

      const actual = fp().resolve('.');
      const expected = process.cwd();

      expect(actual).toEqual(expected, getErrorMessage('resolve', '.', expected, actual));
    });

    it('should resolve paths (posix)', () => {
      posixResolveTests.forEach((test) => {
        const actual = fp().resolve(...test[0]);
        const expected = test[1];

        expect(actual).toEqual(expected, getErrorMessage('resolve', test, expected, actual));
      });
    });

    it('should resolve paths (win32)', () => {
      process.platform = 'win32';

      win32ResolveTests.forEach((test) => {
        const actual = fp().resolve(...test[0]);
        const expected = test[1];

        expect(actual).toEqual(expected, getErrorMessage('resolve', test, expected, actual));
      });
    });

    it('should throw for invalid input', () => {
      invalidInputTests.forEach((test) => {
        expect(() => fp().resolve(test)).toThrow();
      });
    });
  });

  describe('isAbsolute', () => {
    it('should work (posix)', () => {
      expect(fp().isAbsolute('/home/foo')).toEqual(true);
      expect(fp().isAbsolute('/home/foo/..')).toEqual(true);
      expect(fp().isAbsolute('bar/')).toEqual(false);
      expect(fp().isAbsolute('./baz')).toEqual(false);
    });

    it('should work (win32)', () => {
      process.platform = 'win32';
      expect(fp().isAbsolute('//server/file')).toEqual(true);
      expect(fp().isAbsolute('\\\\server\\file')).toEqual(true);
      expect(fp().isAbsolute('C:/Users/')).toEqual(true);
      expect(fp().isAbsolute('C:\\Users\\')).toEqual(true);
      expect(fp().isAbsolute('C:cwd/another')).toEqual(false);
      expect(fp().isAbsolute('C:cwd\\another')).toEqual(false);
      expect(fp().isAbsolute('directory/directory')).toEqual(false);
      expect(fp().isAbsolute('directory\\directory')).toEqual(false);
    });
  });

  describe('relative', () => {
    const win32RelativeTests = [
      // arguments                     result
      ['C:/blah\\blah', 'D:/games', 'D:\\games'],
      ['c:/blah\\blah', 'd:/games', 'd:\\games'],
      ['c:/aaaa/bbbb', 'c:/aaaa', '..'],
      ['c:/aaaa/bbbb', 'c:/cccc', '..\\..\\cccc'],
      ['c:/aaaa/bbbb', 'c:/aaaa/bbbb', ''],
      ['c:/aaaa/bbbb', 'c:/aaaa/cccc', '..\\cccc'],
      ['c:/aaaa/', 'c:/aaaa/cccc', 'cccc'],
      ['c:/', 'c:\\aaaa\\bbbb', 'aaaa\\bbbb'],
      ['c:/aaaa/bbbb', 'd:\\', 'd:\\'],
    ];

    const posixRelativeTests = [
      // arguments                    result
      ['/var/lib', '/var', '..'],
      ['/var/lib', '/bin', '../../bin'],
      ['/var/lib', '/var/lib', ''],
      ['/var/lib', '/var/apache', '../apache'],
      ['/var/', '/var/lib', 'lib'],
      ['/', '/var/lib', 'var/lib'],
    ];

    it('should work (posix)', () => {
      posixRelativeTests.forEach((test) => {
        const actual = fp().relative(test[0], test[1]);
        const expected = test[2];

        expect(actual).toEqual(expected, getErrorMessage('relative',
          test.slice(0, 2).map(JSON.stringify).join(','),
          expected,
          actual,
        ));
      });
    });

    it('should work (win32)', () => {
      process.platform = 'win32';

      win32RelativeTests.forEach((test) => {
        const actual = fp().relative(test[0], test[1]);
        const expected = test[2];

        expect(actual).toEqual(expected, getErrorMessage('relative',
          test.slice(0, 2).map(JSON.stringify).join(','),
          expected,
          actual,
        ));
      });
    });
  });

  describe('(static export) sep', () => {
    it('should be a backslash (win32)', () => {
      process.platform = 'win32';

      expect(fp().sep).toEqual('\\');
    });

    it('should be a forward slash (posix)', () => {
      expect(fp().sep).toEqual('/');
    });
  });

  describe('(static export) delimiter', () => {
    it('should be a semicolon (win32)', () => {
      process.platform = 'win32';
      expect(fp().delimiter).toEqual(';');
    });

    it('should be a colon (posix)', () => {
      expect(fp().delimiter).toEqual(':');
    });
  });
});
