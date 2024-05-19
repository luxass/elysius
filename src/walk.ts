export interface WalkOptions {
  /**
   * The directory to start searching from.
   * @default process.cwd()
   */
  cwd?: string
}

/**
 * Recursively walks through a directory and returns an array of file paths.
 * @param {string} dir - The directory to walk through.
 * @param {WalkOptions} options - The options for walking.
 * @returns A promise that resolves to an array of file paths.
 */
export async function walk(dir: string, options: WalkOptions): Promise<string[]> {
  return []
}

export function walkSync(dir: string, options: WalkOptions): string[] {
  return []
}

export async function* walkAsync(dir: string): AsyncGenerator<string> {
}
