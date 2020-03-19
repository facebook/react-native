import fs from 'fs';
import fse from 'fs-extra';
import fs_path from 'path';
import {pathToFileURL} from 'url';
import {log} from './logger';

export function getDirectoryFromFilePath(path: string): string {
  return fs_path.basename(path);
}

export function getFileNameExtension(path: string): string {
  return fs_path.extname(path);
}

export function resolvePath(base: string, relative: string): string {
  return fs_path.resolve(base, relative);
}

export function isDirectory(path: string) {
  try {
    return fs.lstatSync(path).isDirectory();
  } catch (e) {
    log.error('FS:isDirectory', `${path}::${e}`);
  }
}

export function isRegularFile(path: string) {
  try {
    return fs.lstatSync(path).isFile();
  } catch (e) {
    log.error('FS:isRegularFile', `${path}::${e}`);
  }
}

export function isSymlink(path: string) {
  try {
    return fs.lstatSync(path).isSymbolicLink();
  } catch (e) {
    log.error('FS:isSymlink', `${path}::${e}`);
  }
}

export function getRelativePath(absPath: string, base: string) {
  return fs_path.relative(base, absPath);
}

//
export function writeFile(
  basepath: string,
  relativefilepath: string,
  data: string,
  extension?: string /* Optional extension to be added to the relativefilepath */,
) {
  try {
    // const name2 = 'patch-' + name.replace(/[ &\/\\#,+()$~%.'":*?<>{}]/g, '-');
    const name = fs_path.basename(relativefilepath);
    const relative_dir = fs_path.parse(relativefilepath).dir;

    // Create directory if not exists.
    const absPath1 = fs_path.resolve(basepath, relative_dir);
    if (!fs.existsSync(absPath1)) {
      fse.ensureDirSync(absPath1);
    }

    const absPath2 = fs_path.resolve(
      absPath1,
      extension ? `${name}.${extension}` : name,
    );

    if (fs.existsSync(absPath2)) {
      log.error(
        'FS:writeFile',
        `Trying to write to file which already exists: ${absPath2}`,
      );
    }

    fs.writeFileSync(absPath2, data);
  } catch (e) {
    log.error(
      'FS:writeFile',
      `File Writing Failed::${basepath}::${relativefilepath}::${e}`,
    );
  }
}

// Note :: Assuming the input path is an absolute path.
// And callback gets called with absolute path
export function traverseDirectory(
  rootAbsPath: string,
  relPath: string,
  callbackFile: (path: string, root: string) => void,
  callbackDirectory: (path: string, root: string) => void,
  blackListDirs: string[] = [],
  recursive: boolean = true,
) {
  log.verbose('traverseDirectory', `Entering ${rootAbsPath}${fs_path.sep}${relPath}`);
  const path = resolvePath(rootAbsPath, relPath);
  if (isRegularFile(path)) {
    callbackFile(path, rootAbsPath);
  } else if (isDirectory(path)) {
    const children = fs.readdirSync(path);
    children.forEach((childpath: string) => {
      const absChildPath = fs_path.resolve(path, childpath);
      const relChildPath = relPath + fs_path.sep + childpath;

      // Ignore the '.\' prefix when doing black list comparison
      if (
        blackListDirs.includes(
          relChildPath.startsWith(`.${fs_path.sep}`)
            ? relChildPath.substr(2)
            : relChildPath,
        )
      ) {
        log.verbose(
          'traverseDirectory',
          `Ignoring ${rootAbsPath}${fs_path.sep}${relChildPath} as it's blacklisted.`,
        );
        return;
      }

      callbackDirectory(absChildPath, rootAbsPath);
      if (recursive)
        traverseDirectory(
          rootAbsPath,
          relChildPath,
          callbackFile,
          callbackDirectory,
          blackListDirs,
          recursive,
        );
    });
  } else if (isSymlink(path)) {
    log.error(
      'FS:traverseDirectory',
      `We currently dont support symlinks: ${path}`,
    );
  }
}

// Note :: Lookup a relative path in a give root path
export function lookUpRelativePath(
  path: string,
  relativePath: string,
  callbackOnHit: (path: string) => void,
  callbackOnMiss: (path: string) => void,
) {
  const absChildPath = fs_path.resolve(path, relativePath);
  if (!fs.existsSync(absChildPath)) {
    callbackOnMiss(absChildPath);
  } else {
    callbackOnHit(absChildPath);
  }
}

export function initDirectory(path: string) {
  fse.removeSync(path);
  if (fse.existsSync(path)) {
    log.error(
      'FS:initDirectory',
      `Output directory can't be nuked !! (${path})`,
    );
  }
  fse.ensureDirSync(path);
}

function ensureDirOfPathExists(filePath: string) {
  const dir = fs_path.parse(filePath).dir;
  fse.ensureDirSync(dir);
}

export function copyFile(absSourecPath: string, absDestinationPath: string) {
  ensureDirOfPathExists(absDestinationPath);
  fse.copyFileSync(absSourecPath, absDestinationPath);
}

export function copyFileOverwrite(
  absSourecPath: string,
  absDestinationPath: string,
) {
  ensureDirOfPathExists(absDestinationPath);
  if (!fs.existsSync(absDestinationPath)) {
    log.error(
      'FS:copyFileOverwrite',
      `Trying to overwrite file but the target doesn't already exist (${absDestinationPath})!`,
    );
  }
  fse.copyFileSync(absSourecPath, absDestinationPath);
}

export function copyFile2(
  destBasepath: string,
  destRelativefilepath: string,
  sourcePath: string,
) {
  // Ensure the directory exists.
  const destRelativeDir = fs_path.parse(destRelativefilepath).dir;

  // Create directory if not exists.
  const destAbsDir = fs_path.resolve(destBasepath, destRelativeDir);
  if (!fs.existsSync(destAbsDir)) {
    fse.ensureDirSync(destAbsDir);
  }

  const destAbsPath = fs_path.resolve(destBasepath, destRelativefilepath);
  if (fs.existsSync(destAbsPath)) {
    log.error(
      'FS:copyFile2',
      `Trying to copy binary file but it already exists (${sourcePath})!`,
    );
  }

  fse.copyFileSync(sourcePath, destAbsPath);
}

export function copyFile2Overwrite(
  destBasepath: string,
  destRelativefilepath: string,
  sourcePath: string,
) {
  // Ensure the directory exists.
  const destRelativeDir = fs_path.parse(destRelativefilepath).dir;

  // Create directory if not exists.
  const destAbsDir = fs_path.resolve(destBasepath, destRelativeDir);
  if (!fs.existsSync(destAbsDir)) {
    fse.ensureDirSync(destAbsDir);
  }

  const destAbsPath = fs_path.resolve(destBasepath, destRelativefilepath);
  if (!fs.existsSync(destAbsPath)) {
    log.error(
      'FS:copyFile2Overwrite',
      `Trying to overwrite file but the target doesn't already exist (${destRelativefilepath})!`,
    );
  }

  fse.copyFileSync(sourcePath, destAbsPath);
}
