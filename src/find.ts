import { statSync } from "node:fs";
import { stat } from "node:fs/promises";
import { parse, resolve } from "node:path";
import process from "node:process";

/**
 * Represents the options for searching files.
 */
export interface FindOptions {
  /**
   * The directory to start searching from.
   * @default process.cwd()
   */
  cwd?: string;

  /**
   * The path to the directory to stop searching at.
   * @default path.parse(cwd).root
   */
  stop?: string;

  /**
   * A function to test the file.
   * @param {string} file - The path to the file.
   * @returns {boolean | Promise<boolean>} Whether the file is valid.
   *
   * @example
   * ```ts
   * // traverses up until it finds a package.json with a version field
   * const result = await find('package.json', {
   *   async test(file) {
   *     const base = basename(file)
   *     if (base === 'package.json') {
   *       const content = JSON.parse(await readFile(file, 'utf-8'))
   *       return content.version != null
   *     }
   *     return false
   *   },
   * })
   * ```
   */
  test?: (file: string) => boolean | Promise<boolean>;
}

/**
 * Find a file in a directory and its parents.
 * @param {string | string[]} name - The name(s) of the file to find.
 * @param {FindOptions} options - The options to use.
 * @returns {Promise<string | null>} The path to the file or null if it was not found.
 *
 * @example
 * ```
 * import { find } from "elysius";
 *
 * const path = await find("package.json"); // => /home/[REDACTED]/[REDACTED]/package.json
 * ```
 */
export async function find(
  name: string | string[],
  options?: FindOptions,
): Promise<string | null> {
  let dir = resolve(options?.cwd || process.cwd());

  const root = options?.stop || parse(dir).root;
  const fileNames = Array.isArray(name) ? name : [name];

  while (dir !== root) {
    for (const name of fileNames) {
      const file = resolve(dir, name);
      try {
        await stat(file);
        if (!options?.test || (await options.test(file))) return file;
      } catch (e: any) {
        if (e.code !== "ENOENT") {
          throw e;
        }
      }
    }
    dir = parse(dir).dir;
  }
  return null;
}

/**
 * Find a file in a directory and its parents.
 * @param {string | string[]} name - The name(s) of the file to find.
 * @param {FindOptions} options - The options to use.
 * @returns {string | null} The path to the file or null if it was not found.
 *
 * @example
 * ```
 * import { findSync } from "elysius";
 *
 * const path = findSync("package.json"); // => /home/[REDACTED]/[REDACTED]/package.json
 * ```
 */
export function findSync(
  name: string | string[],
  options?: FindOptions,
): string | null {
  let dir = resolve(options?.cwd || process.cwd());
  const root = options?.stop || parse(dir).root;
  const fileNames = Array.isArray(name) ? name : [name];

  while (dir !== root) {
    for (const name of fileNames) {
      const file = resolve(dir, name);
      try {
        statSync(file);
        const test = options?.test || (() => true);
        if (Object.getPrototypeOf(test).constructor.name === "AsyncFunction") {
          throw new TypeError("You are using a async test in sync mode.");
        }

        if (!test || test(file)) return file;
      } catch (e: any) {
        if (e.code !== "ENOENT") {
          throw e;
        }
      }
    }
    dir = parse(dir).dir;
  }
  return null;
}
