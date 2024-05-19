import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { WalkEntry, WalkOptions } from '../src/walk'
import { walk } from '../src/walk'

it('should walk directory with default options', async () => {
  const files: WalkEntry[] = []
  for await (const entry of walk(join(__dirname, 'fixtures'))) {
    files.push(entry)
  }

  expect(files).toHaveLength(6)
  expect(files[0].name).toBe('fixtures')
  expect(files[0].isDirectory).toBe(true)
  expect(files[0].path).toBe(join(__dirname, 'fixtures'))
})

it('should only walk root directory when disabled includeFiles and includeSymlinks', async () => {
  const files: WalkEntry[] = []
  for await (const entry of walk(join(__dirname, 'fixtures'), {
    includeFiles: false,
    includeSymlinks: false,
  })) {
    files.push(entry)
  }

  expect(files).toHaveLength(3)
  expect(files[0].name).toBe('fixtures')
  expect(files[0].isDirectory).toBe(true)
  expect(files[0].path).toBe(join(__dirname, 'fixtures'))
})
