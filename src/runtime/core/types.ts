type Nullish = null | undefined

// Keep explicitly declared properties on v3 config types with an open string index.
export type NuxtConfKnownFields<Config> = {
  [K in keyof Config as string extends K ? never : number extends K ? never : symbol extends K ? never : K]: Config[K]
}

// Structural approximation of values that should not be merged as plain objects.
type NonPlainObject = Date | RegExp | ((...args: never[]) => unknown) | Iterable<unknown> | PromiseLike<unknown>

// Nullish values fall back to Low. Arrays concatenate high-first, and plain objects
// merge recursively. In other cases, the higher-priority value wins.
// The conditional distributes over High so optional or union values keep each outcome.
type MergeValue<High, Low> = High extends Nullish
  ? Low
  : High extends readonly unknown[]
    ? Low extends readonly unknown[] ? [...High, ...Low] : High
    : High extends object
      ? High extends NonPlainObject ? High
        : Low extends object
          ? Low extends NonPlainObject ? High : MergeConfigFields<High, Low>
          : High
      : High

// A high-priority field only guarantees presence if its type excludes null and undefined.
type RequiredHighKeys<Layer> = {
  [K in keyof Layer]-?: Extract<Nullish, Layer[K]> extends never ? K : never
}[keyof Layer]

// A key missing from a layer behaves like undefined when selecting a value.
type LayerValue<Layer, Key> = Key extends keyof Layer ? Layer[Key] : undefined
type MergeKeys<High, Low> = keyof High | keyof Low

// A required key in the defaults also guarantees presence. Check whether an empty
// object can omit the key, since a required property can still allow undefined.
type RequiredMergeKeys<High, Low> = RequiredHighKeys<High>
  | { [K in keyof Low]-?: Record<never, never> extends Pick<Low, K> ? never : K }[keyof Low]

// Map guaranteed keys separately so the remaining keys retain their optional modifier.
type MergedFields<High, Low> = {
  [K in RequiredMergeKeys<High, Low>]: MergeValue<LayerValue<High, K>, LayerValue<Low, K>>
} & {
  [K in Exclude<MergeKeys<High, Low>, RequiredMergeKeys<High, Low>>]?: MergeValue<LayerValue<High, K>, LayerValue<Low, K>>
}

type MergeConfigFields<High, Low> = {
  [K in keyof MergedFields<High, Low>]: MergedFields<High, Low>[K]
}

/**
 * Merges the accumulated higher priority configuration with the next defaults layer.
 * Apply this type from highest to lowest priority, matching defu's merge order.
 */
export type NuxtConfMerge<High, Low> = MergeConfigFields<NuxtConfKnownFields<High>, NuxtConfKnownFields<Low>>
