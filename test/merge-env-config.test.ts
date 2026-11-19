import { describe, expect, it } from 'vitest'
import { mergeEnvConfig } from '../src/runtime/core'

describe('mergeEnvConfig', () => {
  it('merges layers in priority order and combines nested objects', () => {
    const result = mergeEnvConfig('production', {
      'production.local': { value: 'production local', nested: { productionLocal: true } },
      'local': { value: 'global local', nested: { globalLocal: true } },
      'production': { value: 'production', nested: { production: true } },
      'production.default': { value: 'production default', nested: { productionDefault: true } },
      'default': { value: 'default', nested: { default: true } },
    })

    expect(result).toEqual({
      value: 'production local',
      nested: {
        productionLocal: true,
        globalLocal: true,
        production: true,
        productionDefault: true,
        default: true,
      },
    })
  })

  it('uses only layers belonging to the selected environment', () => {
    const result = mergeEnvConfig('staging', {
      production: { productionOnly: true },
      staging: { selected: true },
      default: { fallback: true },
    })

    expect(result).toEqual({ selected: true, fallback: true })
  })

  it('returns an empty object when no layers are provided', () => {
    expect(mergeEnvConfig('production', {})).toEqual({})
  })
})
