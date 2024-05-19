import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { find, findSync } from '../src/find'

it('finds a single file without cwd', async () => {
  const result = await find(['minions.jpg', 'package.json'])

  expect(result).toBe(join(__dirname, '..', 'package.json'))
})

it('finds a single file with cwd', async () => {
  const result = await find('package.json', {
    cwd: join(__dirname, 'fixture', 'a', 'b'),
  })

  expect(result).toBe(join(__dirname, 'fixture', 'package.json'))
  expect(result).not.toBe(join(__dirname, 'package.json'))
})

it('expect null when no files found', async () => {
  const result = await find('package.json5')

  expect(result).toBeNull()
})

it('find file with custom test function', async () => {
  const result = await find('package.json', {
    cwd: join(__dirname, 'fixture', 'a', 'b'),
    async test(file) {
      const base = basename(file)
      if (base === 'package.json') {
        const content = JSON.parse(await readFile(file, 'utf-8'))
        return content.version != null
      }
      return false
    },
  })

  expect(result).toBe(join(__dirname, 'fixture', 'package.json'))
})

it('expect find to stop when stop is reached', async () => {
  const result = await find('package.json', {
    cwd: join(__dirname, 'fixture', 'a', 'b'),
    stop: join(__dirname, 'fixture', 'a'),
  })

  expect(result).toBeNull()
})

describe('find sync', () => {
  it('finds a single file without cwd', () => {
    const result = findSync(['minions.jpg', 'package.json'])

    expect(result).toBe(join(__dirname, '..', 'package.json'))
  })

  it('finds a single file with cwd', () => {
    const result = findSync('package.json', {
      cwd: join(__dirname, 'fixture', 'a', 'b'),
    })

    expect(result).toBe(join(__dirname, 'fixture', 'package.json'))
    expect(result).not.toBe(join(__dirname, 'package.json'))
  })

  it('expect null when no files found', () => {
    const result = findSync('package.json5')

    expect(result).toBeNull()
  })

  it('find file with custom test function', () => {
    const result = findSync('package.json', {
      cwd: join(__dirname, 'fixture', 'a', 'b'),
      test(file) {
        const base = basename(file)
        if (base === 'package.json') {
          const content = JSON.parse(readFileSync(file, 'utf-8'))
          return content.version != null
        }
        return false
      },
    })

    expect(result).toBe(join(__dirname, 'fixture', 'package.json'))
  })

  it('throw error when using async test inside sync', () => {
    const result = () =>
      findSync('package.json', {
        cwd: join(__dirname, 'fixture', 'a', 'b'),
        async test(file) {
          const base = basename(file)
          if (base === 'package.json') {
            const content = JSON.parse(await readFile(file, 'utf-8'))
            return content.version != null
          }
          return false
        },
      })

    expect(() => result()).toThrowError(
      /^You are using a async test in sync mode.$/,
    )
  })

  it('expect find to stop when stop is reached', () => {
    const result = findSync('package.json', {
      cwd: join(__dirname, 'fixture', 'a', 'b'),
      stop: join(__dirname, 'fixture', 'a'),
    })

    expect(result).toBeNull()
  })
})
