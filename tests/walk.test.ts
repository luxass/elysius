import { join, normalize } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { WalkEntry } from '../src/walk'
import { walk, walkSync } from '../src/walk'

it('should walk directory with default options', async () => {
  const files: WalkEntry[] = []
  for await (const entry of walk(join(__dirname, 'fixtures'))) {
    files.push(entry)
  }

  expect(files).toHaveLength(8)
  expect(files[0].name).toBe('fixtures')
  expect(files[0].isDirectory).toBe(true)
  expect(files[0].path).toBe(join(__dirname, 'fixtures'))
})

it('expect walk to throw when root is not a directory', async () => {
  await expect(async () => {
    for await (const _ of walk(join(__dirname, 'fixtures', 'package.json'))) {
      // noop
    }
  }).rejects.toThrow(Error(`Error walking path "${normalize(join(__dirname, 'fixtures', 'package.json'))}": ENOTDIR: not a directory, scandir '${normalize(join(__dirname, 'fixtures', 'package.json'))}'`))
})

it('should only walk root directory when disabled includeFiles and includeSymlinks', async () => {
  const files: WalkEntry[] = []
  for await (const entry of walk(join(__dirname, 'fixtures'), {
    includeFiles: false,
    includeSymlinks: false,
  })) {
    files.push(entry)
  }

  expect(files).toHaveLength(4)
  expect(files[0].name).toBe('fixtures')
  expect(files[0].isDirectory).toBe(true)
  expect(files[0].path).toBe(join(__dirname, 'fixtures'))
})

it('should only walk root directory when disabled includeDirs', async () => {
  const files: WalkEntry[] = []
  for await (const entry of walk(join(__dirname, 'fixtures'), {
    includeDirs: false,
  })) {
    files.push(entry)
  }

  expect(files).toHaveLength(4)
  expect(files[3].name).toBe('package.json')
})

it('should stop walking when maxDepth is reached', async () => {
  const files: WalkEntry[] = []
  for await (const entry of walk(join(__dirname, 'fixtures'), {
    maxDepth: 1,
  })) {
    files.push(entry)
  }

  expect(files).toHaveLength(4)
  expect(files).toStrictEqual([
    {
      path: join(__dirname, 'fixtures'),
      name: 'fixtures',
      isFile: false,
      isDirectory: true,
      isSymlink: false,
    },
    {
      path: join(__dirname, 'fixtures', 'a'),
      name: 'a',
      isFile: false,
      isDirectory: true,
      isSymlink: false,
    },
    {
      path: join(__dirname, 'fixtures', 'minions.jpg'),
      isDirectory: false,
      isFile: true,
      isSymlink: false,
      name: 'minions.jpg',
    },
    {
      path: join(__dirname, 'fixtures', 'package.json'),
      isDirectory: false,
      isFile: true,
      isSymlink: false,
      name: 'package.json',
    },
  ])
})

it('should not include symlinks when option is disabled', async () => {
  const files: WalkEntry[] = []
  for await (const entry of walk(join(__dirname, 'fixtures', 'a', 'symlinks'), {
    includeSymlinks: false,
  })) {
    files.push(entry)
  }

  expect(files).toHaveLength(1)
  expect(files[0].name).toBe('symlinks')
  expect(files[0].isDirectory).toBe(true)
  expect(files[0].path).toBe(join(__dirname, 'fixtures', 'a', 'symlinks'))
})

it('should include symlinks by default', async () => {
  const files: WalkEntry[] = []
  for await (const entry of walk(join(__dirname, 'fixtures', 'a', 'symlinks'))) {
    files.push(entry)
  }

  expect(files).toHaveLength(2)
  expect(files[1]).toStrictEqual({
    path: join(__dirname, 'fixtures', 'a', 'symlinks', 'README.md'),
    name: 'README.md',
    isFile: false,
    isDirectory: false,
    isSymlink: true,
  })
})

it('should follow symlinks', async () => {
  const files: WalkEntry[] = []
  for await (const entry of walk(join(__dirname, 'fixtures', 'a', 'symlinks'), {
    followSymlinks: true,
  })) {
    files.push(entry)
  }

  expect(files).toHaveLength(2)
  expect(files[1]).toStrictEqual({
    path: join(__dirname, 'fixtures', 'a', 'symlinks', 'README.md'),
    name: 'README.md',
    isFile: true,
    isDirectory: false,
    isSymlink: false,
  })
})

it('should exclude files', async () => {
  const files: WalkEntry[] = []
  for await (const entry of walk(join(__dirname, 'fixtures'), {
    exclude: [
      /minions\.jpg/,
    ],
  })) {
    files.push(entry)
  }

  expect(files).toHaveLength(7)
  expect(files[0].name).toBe('fixtures')
  expect(files[0].isDirectory).toBe(true)
  expect(files[0].path).toBe(join(__dirname, 'fixtures'))
  expect(files.map((file) => file.name)).not.toContain('minions.jpg')
})

describe('sync', () => {
  it('should walk directory with default options', () => {
    const files: WalkEntry[] = []
    for (const entry of walkSync(join(__dirname, 'fixtures'))) {
      files.push(entry)
    }

    expect(files).toHaveLength(8)
    expect(files[0].name).toBe('fixtures')
    expect(files[0].isDirectory).toBe(true)
    expect(files[0].path).toBe(join(__dirname, 'fixtures'))
  })

  it('expect walk to throw when root is not a directory', () => {
    expect(() => {
      for (const _ of walkSync(join(__dirname, 'fixtures', 'package.json'))) {
        // noop
      }
    }).toThrow(Error(`Error walking path "${normalize(join(__dirname, 'fixtures', 'package.json'))}": ENOTDIR: not a directory, scandir '${normalize(join(__dirname, 'fixtures', 'package.json'))}'`))
  })

  it('should only walk root directory when disabled includeFiles and includeSymlinks', () => {
    const files: WalkEntry[] = []
    for (const entry of walkSync(join(__dirname, 'fixtures'), {
      includeFiles: false,
      includeSymlinks: false,
    })) {
      files.push(entry)
    }

    expect(files).toHaveLength(4)
    expect(files[0].name).toBe('fixtures')
    expect(files[0].isDirectory).toBe(true)
    expect(files[0].path).toBe(join(__dirname, 'fixtures'))
  })

  it('should only walk root directory when disabled includeDirs', () => {
    const files: WalkEntry[] = []
    for (const entry of walkSync(join(__dirname, 'fixtures'), {
      includeDirs: false,
    })) {
      files.push(entry)
    }

    expect(files).toHaveLength(4)
    expect(files[3].name).toBe('package.json')
  })

  it('should stop walking when maxDepth is reached', () => {
    const files: WalkEntry[] = []
    for (const entry of walkSync(join(__dirname, 'fixtures'), {
      maxDepth: 1,
    })) {
      files.push(entry)
    }

    expect(files).toHaveLength(4)
    expect(files).toStrictEqual([
      {
        path: join(__dirname, 'fixtures'),
        name: 'fixtures',
        isFile: false,
        isDirectory: true,
        isSymlink: false,
      },
      {
        path: join(__dirname, 'fixtures', 'a'),
        name: 'a',
        isFile: false,
        isDirectory: true,
        isSymlink: false,
      },
      {
        path: join(__dirname, 'fixtures', 'minions.jpg'),
        isDirectory: false,
        isFile: true,
        isSymlink: false,
        name: 'minions.jpg',
      },
      {
        path: join(__dirname, 'fixtures', 'package.json'),
        isDirectory: false,
        isFile: true,
        isSymlink: false,
        name: 'package.json',
      },
    ])
  })

  it('should not include symlinks when option is disabled', () => {
    const files: WalkEntry[] = []
    for (const entry of walkSync(join(__dirname, 'fixtures', 'a', 'symlinks'), {
      includeSymlinks: false,
    })) {
      files.push(entry)
    }

    expect(files).toHaveLength(1)
    expect(files[0].name).toBe('symlinks')
    expect(files[0].isDirectory).toBe(true)
    expect(files[0].path).toBe(join(__dirname, 'fixtures', 'a', 'symlinks'))
  })

  it('should include symlinks by default', () => {
    const files: WalkEntry[] = []
    for (const entry of walkSync(join(__dirname, 'fixtures', 'a', 'symlinks'))) {
      files.push(entry)
    }

    expect(files).toHaveLength(2)
    expect(files[1]).toStrictEqual({
      path: join(__dirname, 'fixtures', 'a', 'symlinks', 'README.md'),
      name: 'README.md',
      isFile: false,
      isDirectory: false,
      isSymlink: true,
    })
  })

  it('should follow symlinks', () => {
    const files: WalkEntry[] = []
    for (const entry of walkSync(join(__dirname, 'fixtures', 'a', 'symlinks'), {
      followSymlinks: true,
    })) {
      files.push(entry)
    }

    expect(files).toHaveLength(2)
    expect(files[1]).toStrictEqual({
      path: join(__dirname, 'fixtures', 'a', 'symlinks', 'README.md'),
      name: 'README.md',
      isFile: true,
      isDirectory: false,
      isSymlink: false,
    })
  })

  it('should exclude files', () => {
    const files: WalkEntry[] = []
    for (const entry of walkSync(join(__dirname, 'fixtures'), {
      exclude: [
        /minions\.jpg/,
      ],
    })) {
      files.push(entry)
    }

    expect(files).toHaveLength(7)
    expect(files[0].name).toBe('fixtures')
    expect(files[0].isDirectory).toBe(true)
    expect(files[0].path).toBe(join(__dirname, 'fixtures'))
    expect(files.map((file) => file.name)).not.toContain('minions.jpg')
  })
})
