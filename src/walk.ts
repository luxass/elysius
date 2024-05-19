import type { Dirent } from 'node:fs'
import { statSync } from 'node:fs'
import { lstat, readdir, realpath, stat } from 'node:fs/promises'

import { basename, join, normalize, parse, resolve } from 'node:path'
import process from 'node:process'

export interface WalkEntry {
  /**
   * The name of the entry.
   *
   * NOTE: This is the name of the file or directory, not the full path.
   */
  name: string

  /**
   * Full path of the entry.
   */
  path: string

  /**
   * Whether or not the entry is a file.
   */
  isFile: boolean

  /**
   * Whether or not the entry is a directory.
   */
  isDirectory: boolean

  /**
   * Whether or not the entry is a symbolic link.
   */
  isSymlink: boolean
}

export interface WalkOptions {
  /**
   * The maximum depth to walk through.
   *
   * @default {Number.POSITIVE_INFINITY}
   */
  maxDepth?: number

  /**
   * Whether to include files in the walk.
   *
   * @default {true}
   */
  includeFiles?: boolean

  /**
   * Whether to include directories in the walk.
   * @default {true}
   */
  includeDirs?: boolean

  /**
   * Whether to include symbolic links in the walk.
   *
   * NOTE:
   * This option is only meaningful if `followSymlinks` is set to `false`.
   *
   * @default {true}
   */
  includeSymlinks?: boolean

  /**
   * Whether to follow symbolic links.
   *
   * @default {false}
   */
  followSymlinks?: boolean
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
  } = options

  if (maxDepth < 0) {
    return
  }

  if (includeDirs) {
    const info = await stat(dir)
    yield {
      path: dir,
      name: basename(dir),
      isFile: info.isFile(),
      isDirectory: info.isDirectory(),
      isSymlink: info.isSymbolicLink(),
    }
  }

  try {
    const entries = await readdir(dir, {
      withFileTypes: true,
      encoding: 'utf-8',
    })

    for (const entry of entries) {
      const path = join(dir, entry.name)

      if (entry.isSymbolicLink()) {
        if (!followSymlinks) {
          if (includeSymlinks) {
            yield {
              path,
              isDirectory: entry.isDirectory(),
              isFile: entry.isFile(),
              isSymlink: entry.isSymbolicLink(),
              name: entry.name,
            }
          }
          continue
        }
        const realPath = await realpath(path)
        // Caveat emptor: don't assume |path| is not a symlink. realpath()
        // resolves symlinks but another process can replace the file system
        // entity with a different type of entity before we call lstat().
        const { isDirectory, isSymbolicLink } = await lstat(realPath)
        entry.isDirectory = isDirectory
        entry.isSymbolicLink = isSymbolicLink
      }

      if (entry.isSymbolicLink() || entry.isDirectory()) {
        yield * walk(path, {
          maxDepth: maxDepth - 1,
          includeFiles,
          includeDirs,
          includeSymlinks,
          followSymlinks,
        })
      } else if (includeFiles) {
        yield {
          path,
          isDirectory: entry.isDirectory(),
          isFile: entry.isFile(),
          isSymlink: entry.isSymbolicLink(),
          name: entry.name,
        }
      }
    }
  } catch (err) {
    throw new Error(`Error walking path "${normalize(dir)}": ${err instanceof Error ? err.message : err}`)
  }
}
