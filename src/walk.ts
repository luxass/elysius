/**
 * @module walk
 *
 * Recursively walk through a directory and yield information about each file and directory encountered.
 *
 * @example
 * ```ts
 * import { walk, walkSync } from "elysius";
 *
 * for await (const entry of walk("src")) {
 *   console.log(entry);
 * }
 *
 * const files = Array.fromAsync(walk("src"));
 *
 * for (const entry of walkSync("src")) {
 *   console.log(entry);
 * }
 *
 * const files = Array.from(walkSync("src"));
 * ```
 */
import { readdirSync, realpathSync, statSync } from "node:fs";
import { lstat, readdir, realpath, stat } from "node:fs/promises";
import { basename, join, normalize } from "node:path";

export interface WalkEntry {
  /**
   * The name of the entry.
   *
   * NOTE: This is the name of the file or directory, not the full path.
   */
  name: string;

  /**
   * Full path of the entry.
   */
  path: string;

  /**
   * Whether or not the entry is a file.
   */
  isFile: boolean;

  /**
   * Whether or not the entry is a directory.
   */
  isDirectory: boolean;

  /**
   * Whether or not the entry is a symbolic link.
   */
  isSymlink: boolean;
}

export interface WalkOptions {
  /**
   * The maximum depth to walk through.
   *
   * @default {Number.POSITIVE_INFINITY}
   */
  maxDepth?: number;

  /**
   * Whether to include files in the walk.
   *
   * @default {true}
   */
  includeFiles?: boolean;

  /**
   * Whether to include directories in the walk.
   * @default {true}
   */
  includeDirs?: boolean;

  /**
   * Whether to include symbolic links in the walk.
   *
   * NOTE:
   * This option is only meaningful if `followSymlinks` is set to `false`.
   *
   * @default {true}
   */
  includeSymlinks?: boolean;

  /**
   * Whether to follow symbolic links.
   *
   * @default {false}
   */
  followSymlinks?: boolean;

  /**
   * An array of regular expressions to exclude from the walk.
   *
   * @default {[]}
   */
  exclude?: RegExp[];
}

function shouldIncludePath(
  path: string,
  exclude?: RegExp[],
): boolean {
  if (exclude && exclude.some((pattern): boolean => !!path.match(pattern))) {
    return false;
  }
  return true;
}

/**
 * Recursively walks through a directory and returns an array of file paths.
 * @param {string} dir - The directory to walk through.
 * @param {WalkOptions} options - The options for walking.
 * @returns A promise that resolves to an array of file paths.
 */
export async function* walk(dir: string, options: WalkOptions = {}): AsyncIterableIterator<WalkEntry> {
  const {
    maxDepth = Number.POSITIVE_INFINITY,
    includeFiles = true,
    includeDirs = true,
    includeSymlinks = true,
    followSymlinks = false,
    exclude,
  } = options;

  if (maxDepth < 0) {
    return;
  }
  if (includeDirs && shouldIncludePath(dir, exclude)) {
    const info = await stat(dir);
    yield {
      path: dir,
      name: basename(dir),
      isFile: info.isFile(),
      isDirectory: info.isDirectory(),
      isSymlink: info.isSymbolicLink(),
    };
  }
  if (maxDepth < 1 || !shouldIncludePath(dir, exclude)) {
    return;
  }

  try {
    const entries = await readdir(dir, {
      withFileTypes: true,
      encoding: "utf-8",
    });

    for (const entry of entries) {
      const path = join(dir, entry.name);

      let isDirectory = entry.isDirectory();
      let isFile = entry.isFile();
      let isSymlink = entry.isSymbolicLink();

      if (isSymlink) {
        if (!followSymlinks) {
          if (includeSymlinks && shouldIncludePath(path, exclude)) {
            yield {
              path,
              isDirectory,
              isFile,
              isSymlink,
              name: entry.name,
            };
          }
          continue;
        }
        const realPath = await realpath(path);
        // Caveat emptor: don't assume |path| is not a symlink. realpath()
        // resolves symlinks but another process can replace the file system
        // entity with a different type of entity before we call lstat().
        const stats = await lstat(realPath);
        isDirectory = stats.isDirectory();
        isSymlink = stats.isSymbolicLink();
        isFile = stats.isFile();
      }

      if (isSymlink || isDirectory) {
        yield* walk(path, {
          maxDepth: maxDepth - 1,
          includeFiles,
          includeDirs,
          includeSymlinks,
          followSymlinks,
        });
      } else if (includeFiles && shouldIncludePath(path, exclude)) {
        yield {
          path,
          isDirectory,
          isFile,
          isSymlink,
          name: entry.name,
        };
      }
    }
  } catch (err) {
    throw new Error(`Error walking path "${normalize(dir)}": ${err instanceof Error ? err.message : err}`);
  }
}

/**
 * Recursively walks through a directory and yields information about each file and directory encountered.
 * @param {string} dir - The directory to walk through.
 * @param {WalkOptions} options - Optional configuration options for the walk.
 * @returns An iterable of `WalkEntry` objects representing each file and directory encountered during the walk.
 */
export function* walkSync(dir: string, options: WalkOptions = {}): Iterable<WalkEntry> {
  const {
    maxDepth = Number.POSITIVE_INFINITY,
    includeFiles = true,
    includeDirs = true,
    includeSymlinks = true,
    followSymlinks = false,
    exclude,
  } = options;

  if (maxDepth < 0) {
    return;
  }

  if (includeDirs && shouldIncludePath(dir, exclude)) {
    const info = statSync(dir);
    yield {
      path: dir,
      name: basename(dir),
      isFile: info.isFile(),
      isDirectory: info.isDirectory(),
      isSymlink: info.isSymbolicLink(),
    };
  }

  if (maxDepth < 1 || !shouldIncludePath(dir, exclude)) {
    return;
  }

  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    throw new Error(`Error walking path "${normalize(dir)}": ${err instanceof Error ? err.message : err}`);
  }

  for (const entry of entries) {
    const path = join(dir, entry.name);

    let isDirectory = entry.isDirectory();
    let isFile = entry.isFile();
    let isSymlink = entry.isSymbolicLink();

    if (isSymlink) {
      if (!followSymlinks) {
        if (includeSymlinks && shouldIncludePath(path, exclude)) {
          yield {
            path,
            name: entry.name,
            isFile,
            isDirectory,
            isSymlink,
          };
        }
        continue;
      }
      const realPath = realpathSync(path);
      const stats = statSync(realPath);
      isDirectory = stats.isDirectory();
      isSymlink = stats.isSymbolicLink();
      isFile = stats.isFile();
    }

    if (isSymlink || isDirectory) {
      yield* walkSync(path, {
        maxDepth: maxDepth - 1,
        includeFiles,
        includeDirs,
        includeSymlinks,
        followSymlinks,
      });
    } else if (includeFiles && shouldIncludePath(path, exclude)) {
      yield {
        path,
        name: entry.name,
        isFile,
        isDirectory,
        isSymlink,
      };
    }
  }
}
