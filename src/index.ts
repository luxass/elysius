import { statSync } from "node:fs";
import { stat } from "node:fs/promises";
import { parse, resolve } from "node:path";
import process from "node:process";

export interface Options {
  /**
   * The directory to start searching from.
   * @default process.cwd()
   */
  cwd?: string

  /**
   * The path to the directory to stop searching at.
   * @default path.parse(cwd).root
   */
  stop?: string

  /**
   * Test the file before returning it.
   */
  test?: (file: string) => boolean | Promise<boolean>
}

export async function find(
  name: string | Array<string>,
  options?: Options,
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

export function findSync(
  name: string | Array<string>,
  options?: Options,
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
