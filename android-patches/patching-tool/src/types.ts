import program from 'commander';

export interface ICommonOptions extends program.Command {
  gitExecutable: string;
  cleanupRepos: boolean; // Delete all the existing patched. 'gitExecutable' must be specified.

  logFolder: string;
}

export interface IDiffCommandOptions extends ICommonOptions {
  patchName: string; // Name of the folder where the patches will be saved. This folder will be created under the dirty repository.
  diffExecutable: string;
  cleanupExistingPatches: boolean; // Revert all tracked and untracked changes from both repos.
  blacklistDirs: string[]; // These paths will be ignored while recursively traversing the dirty repo.
  blacklistExts: string[];
  whitelistDirs: string[]; // If specified, recursively traversal will start at these directories.
}

export interface IPatchCommandOptions extends ICommonOptions {
  embeddedPatcher: boolean;
  patchExecutable: string;
  patchStore: string;
  reverse: boolean;
  confirm: string;
}

export interface IPatchFileCommandOptions extends ICommonOptions {
  embeddedPatcher: boolean;
  patchExecutable: string;
  reverse: boolean;
}

export type PatchFileFuncType = (
  targetFileAbsPath: string,
  patchFileAbsPath: string,
  patchOptions: IPatchFileCommandOptions,
) => void;
export type PatchRepoFuncType = (
  targetRepoAbsPath: string,
  patchNames: string[],
  patchOptions: IPatchCommandOptions,
) => void;
export type DiffReposFuncType = (
  dirtyRepoAbsPath: string,
  baseRepoAbsPath: string,
  diffOptions: IDiffCommandOptions,
) => void;

export type OnCompletionFuncType = () => void;
