/**
 * Type utility functions and generic types
 */

/**
 * Make all properties of T optional recursively
 */
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

/**
 * Make all properties of T required recursively
 */
export type DeepRequired<T> = T extends object
  ? {
      [P in keyof T]-?: DeepRequired<T[P]>;
    }
  : T;

/**
 * Make all properties of T readonly recursively
 */
export type DeepReadonly<T> = T extends object
  ? {
      readonly [P in keyof T]: DeepReadonly<T[P]>;
    }
  : T;

/**
 * Make specific properties of T optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties of T required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Extract non-nullable type
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * Extract nullable properties
 */
export type NullableKeys<T> = {
  [K in keyof T]: null extends T[K] ? K : never;
}[keyof T];

/**
 * Extract non-nullable properties
 */
export type NonNullableKeys<T> = {
  [K in keyof T]: null extends T[K] ? never : K;
}[keyof T];

/**
 * Convert union to intersection
 */
export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

/**
 * Extract keys of specific value type
 */
export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

/**
 * Prettify complex types for better IDE display
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * XOR type - exactly one of the types
 */
export type XOR<T, U> = T | U extends object
  ? (Without<T, U> & U) | (Without<U, T> & T)
  : T | U;

type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

/**
 * Async function type
 */
export type AsyncFunction<T extends any[], R> = (...args: T) => Promise<R>;

/**
 * Extract promise type
 */
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

/**
 * Extract array element type
 */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

/**
 * Mutable version of readonly type
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * Path type for nested object access
 */
export type Path<T> = T extends object
  ? {
      [K in keyof T]: K extends string | number
        ? T[K] extends object
          ? K | `${K}.${Path<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

/**
 * Get value type by path
 */
export type PathValue<T, P extends Path<T>> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Rest extends Path<T[K]>
      ? PathValue<T[K], Rest>
      : never
    : never
  : P extends keyof T
  ? T[P]
  : never;

/**
 * Replace type in object
 */
export type Replace<T, K extends keyof T, V> = Omit<T, K> & { [P in K]: V };

/**
 * Strict extract that ensures U extends T
 */
export type StrictExtract<T, U extends T> = U;

/**
 * Get function arguments type
 */
export type ArgumentsType<T> = T extends (...args: infer A) => any ? A : never;

/**
 * Get function return type (works with async)
 */
export type ReturnType<T> = T extends (...args: any[]) => infer R
  ? R extends Promise<infer U>
    ? U
    : R
  : never;

/**
 * Constructor type
 */
export type Constructor<T = {}> = new (...args: any[]) => T;

/**
 * Type predicate function
 */
export type TypeGuard<T> = (value: unknown) => value is T;

/**
 * Branded type for nominal typing
 */
export type Brand<T, B> = T & { __brand: B };

/**
 * Create opaque type
 */
export type Opaque<T, K> = T & { __opaque: K };

/**
 * JSON-serializable types
 */
export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

/**
 * Remove index signature from type
 */
export type RemoveIndexSignature<T> = {
  [K in keyof T as string extends K
    ? never
    : number extends K
    ? never
    : K]: T[K];
};

/**
 * Extract literal types
 */
export type Literal<T> = T extends string
  ? string extends T
    ? never
    : T
  : T extends number
  ? number extends T
    ? never
    : T
  : T extends boolean
  ? boolean extends T
    ? never
    : T
  : never;

/**
 * Merge two types with second overriding first
 */
export type Merge<T, U> = Omit<T, keyof U> & U;

/**
 * Make specific properties nullable
 */
export type NullableBy<T, K extends keyof T> = Omit<T, K> & {
  [P in K]: T[P] | null;
};

/**
 * Value or factory function
 */
export type ValueOrFactory<T> = T | (() => T);

/**
 * Await all properties of an object
 */
export type AwaitedObject<T> = {
  [K in keyof T]: Awaited<T[K]>;
};

/**
 * Extract methods from a type
 */
export type Methods<T> = {
  [K in keyof T as T[K] extends Function ? K : never]: T[K];
};

/**
 * Extract properties from a type (non-methods)
 */
export type Properties<T> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};