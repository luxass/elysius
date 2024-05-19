import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { basename, join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { find, findSync } from '../src/find'

describe('find', () => {
  it('find minions', async () => {
    const result = await find(['minions.jpg', 'package.json'], {
      cwd: join(__dirname, 'fixture', 'a', 'b'),
    })

    expect(result).not.toBe(join(__dirname, 'fixture', 'package.json'))
    expect(result).toBe(join(__dirname, 'fixture', 'minions.jpg'))
  })

  it('find package.json', async () => {
    const result = await find('package.json', {
      cwd: join(__dirname, 'fixture', 'a', 'b'),
    })

    expect(result).toBe(join(__dirname, 'fixture', 'package.json'))
    expect(result).not.toBe(join(__dirname, 'fixture', 'minions.jpg'))
  })

  it('find package.json with key', async () => {
    const result = await find('package.json', {
      cwd: join(__dirname, 'fixture', 'a', 'b'),
      async test(file) {
        const base = basename(file)
        if (base === 'package.json') {
          const content = JSON.parse(await readFile(file, 'utf-8'))
          return content.version
        }
        return false
      },
    })

    expect(result).toBe(join(__dirname, 'fixture', 'package.json'))
  })
})

describe('findSync', () => {
  it('find minions', () => {
    const result = findSync(['minions.jpg', 'package.json'], {
      cwd: join(__dirname, 'fixture', 'a', 'b'),
    })

    expect(result).not.toBe(join(__dirname, 'fixture', 'package.json'))
    expect(result).toBe(join(__dirname, 'fixture', 'minions.jpg'))
  })

  it('find package.json', () => {
    const result = findSync('package.json', {
      cwd: join(__dirname, 'fixture', 'a', 'b'),
    })

    expect(result).toBe(join(__dirname, 'fixture', 'package.json'))
    expect(result).not.toBe(join(__dirname, 'fixture', 'minions.jpg'))
  })

  it('throw error when using async test inside sync', () => {
    const result = () =>
      findSync('package.json', {
        cwd: join(__dirname, 'fixture', 'a', 'b'),
        async test(file) {
          const base = basename(file)
          if (base === 'package.json') {
            const content = JSON.parse(await readFile(file, 'utf-8'))
            return content.version
          }
          return false
        },
      })

    expect(() => result()).toThrowError(
      /^You are using a async test in sync mode.$/,
    )
  })

  it('find package.json with key', () => {
    const result = findSync('package.json', {
      cwd: join(__dirname, 'fixture', 'a', 'b'),
      test(file) {
        const base = basename(file)
        if (base === 'package.json') {
          const content = JSON.parse(readFileSync(file, 'utf-8'))
          return content.version
        }
        return false
      },
    })

    expect(result).toBe(join(__dirname, 'fixture', 'package.json'))
  })
})
