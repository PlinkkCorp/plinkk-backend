
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Cosmetic
 * 
 */
export type Cosmetic = $Result.DefaultSelection<Prisma.$CosmeticPayload>
/**
 * Model Link
 * 
 */
export type Link = $Result.DefaultSelection<Prisma.$LinkPayload>
/**
 * Model Label
 * 
 */
export type Label = $Result.DefaultSelection<Prisma.$LabelPayload>
/**
 * Model SocialIcon
 * 
 */
export type SocialIcon = $Result.DefaultSelection<Prisma.$SocialIconPayload>
/**
 * Model BackgroundColor
 * 
 */
export type BackgroundColor = $Result.DefaultSelection<Prisma.$BackgroundColorPayload>
/**
 * Model NeonColor
 * 
 */
export type NeonColor = $Result.DefaultSelection<Prisma.$NeonColorPayload>
/**
 * Model Statusbar
 * 
 */
export type Statusbar = $Result.DefaultSelection<Prisma.$StatusbarPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const Role: {
  USER: 'USER',
  PARTNER: 'PARTNER',
  ADMIN: 'ADMIN',
  DEVELOPER: 'DEVELOPER',
  MODERATOR: 'MODERATOR'
};

export type Role = (typeof Role)[keyof typeof Role]

}

export type Role = $Enums.Role

export const Role: typeof $Enums.Role

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.cosmetic`: Exposes CRUD operations for the **Cosmetic** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Cosmetics
    * const cosmetics = await prisma.cosmetic.findMany()
    * ```
    */
  get cosmetic(): Prisma.CosmeticDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.link`: Exposes CRUD operations for the **Link** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Links
    * const links = await prisma.link.findMany()
    * ```
    */
  get link(): Prisma.LinkDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.label`: Exposes CRUD operations for the **Label** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Labels
    * const labels = await prisma.label.findMany()
    * ```
    */
  get label(): Prisma.LabelDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.socialIcon`: Exposes CRUD operations for the **SocialIcon** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SocialIcons
    * const socialIcons = await prisma.socialIcon.findMany()
    * ```
    */
  get socialIcon(): Prisma.SocialIconDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.backgroundColor`: Exposes CRUD operations for the **BackgroundColor** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more BackgroundColors
    * const backgroundColors = await prisma.backgroundColor.findMany()
    * ```
    */
  get backgroundColor(): Prisma.BackgroundColorDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.neonColor`: Exposes CRUD operations for the **NeonColor** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more NeonColors
    * const neonColors = await prisma.neonColor.findMany()
    * ```
    */
  get neonColor(): Prisma.NeonColorDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.statusbar`: Exposes CRUD operations for the **Statusbar** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Statusbars
    * const statusbars = await prisma.statusbar.findMany()
    * ```
    */
  get statusbar(): Prisma.StatusbarDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.16.2
   * Query Engine version: 1c57fdcd7e44b29b9313256c76699e91c3ac3c43
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    Cosmetic: 'Cosmetic',
    Link: 'Link',
    Label: 'Label',
    SocialIcon: 'SocialIcon',
    BackgroundColor: 'BackgroundColor',
    NeonColor: 'NeonColor',
    Statusbar: 'Statusbar'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "user" | "cosmetic" | "link" | "label" | "socialIcon" | "backgroundColor" | "neonColor" | "statusbar"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Cosmetic: {
        payload: Prisma.$CosmeticPayload<ExtArgs>
        fields: Prisma.CosmeticFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CosmeticFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CosmeticPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CosmeticFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CosmeticPayload>
          }
          findFirst: {
            args: Prisma.CosmeticFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CosmeticPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CosmeticFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CosmeticPayload>
          }
          findMany: {
            args: Prisma.CosmeticFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CosmeticPayload>[]
          }
          create: {
            args: Prisma.CosmeticCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CosmeticPayload>
          }
          createMany: {
            args: Prisma.CosmeticCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CosmeticCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CosmeticPayload>[]
          }
          delete: {
            args: Prisma.CosmeticDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CosmeticPayload>
          }
          update: {
            args: Prisma.CosmeticUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CosmeticPayload>
          }
          deleteMany: {
            args: Prisma.CosmeticDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CosmeticUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CosmeticUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CosmeticPayload>[]
          }
          upsert: {
            args: Prisma.CosmeticUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CosmeticPayload>
          }
          aggregate: {
            args: Prisma.CosmeticAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCosmetic>
          }
          groupBy: {
            args: Prisma.CosmeticGroupByArgs<ExtArgs>
            result: $Utils.Optional<CosmeticGroupByOutputType>[]
          }
          count: {
            args: Prisma.CosmeticCountArgs<ExtArgs>
            result: $Utils.Optional<CosmeticCountAggregateOutputType> | number
          }
        }
      }
      Link: {
        payload: Prisma.$LinkPayload<ExtArgs>
        fields: Prisma.LinkFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LinkFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LinkFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkPayload>
          }
          findFirst: {
            args: Prisma.LinkFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LinkFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkPayload>
          }
          findMany: {
            args: Prisma.LinkFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkPayload>[]
          }
          create: {
            args: Prisma.LinkCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkPayload>
          }
          createMany: {
            args: Prisma.LinkCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LinkCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkPayload>[]
          }
          delete: {
            args: Prisma.LinkDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkPayload>
          }
          update: {
            args: Prisma.LinkUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkPayload>
          }
          deleteMany: {
            args: Prisma.LinkDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LinkUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.LinkUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkPayload>[]
          }
          upsert: {
            args: Prisma.LinkUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkPayload>
          }
          aggregate: {
            args: Prisma.LinkAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLink>
          }
          groupBy: {
            args: Prisma.LinkGroupByArgs<ExtArgs>
            result: $Utils.Optional<LinkGroupByOutputType>[]
          }
          count: {
            args: Prisma.LinkCountArgs<ExtArgs>
            result: $Utils.Optional<LinkCountAggregateOutputType> | number
          }
        }
      }
      Label: {
        payload: Prisma.$LabelPayload<ExtArgs>
        fields: Prisma.LabelFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LabelFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LabelPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LabelFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LabelPayload>
          }
          findFirst: {
            args: Prisma.LabelFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LabelPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LabelFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LabelPayload>
          }
          findMany: {
            args: Prisma.LabelFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LabelPayload>[]
          }
          create: {
            args: Prisma.LabelCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LabelPayload>
          }
          createMany: {
            args: Prisma.LabelCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LabelCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LabelPayload>[]
          }
          delete: {
            args: Prisma.LabelDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LabelPayload>
          }
          update: {
            args: Prisma.LabelUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LabelPayload>
          }
          deleteMany: {
            args: Prisma.LabelDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LabelUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.LabelUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LabelPayload>[]
          }
          upsert: {
            args: Prisma.LabelUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LabelPayload>
          }
          aggregate: {
            args: Prisma.LabelAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLabel>
          }
          groupBy: {
            args: Prisma.LabelGroupByArgs<ExtArgs>
            result: $Utils.Optional<LabelGroupByOutputType>[]
          }
          count: {
            args: Prisma.LabelCountArgs<ExtArgs>
            result: $Utils.Optional<LabelCountAggregateOutputType> | number
          }
        }
      }
      SocialIcon: {
        payload: Prisma.$SocialIconPayload<ExtArgs>
        fields: Prisma.SocialIconFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SocialIconFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SocialIconPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SocialIconFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SocialIconPayload>
          }
          findFirst: {
            args: Prisma.SocialIconFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SocialIconPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SocialIconFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SocialIconPayload>
          }
          findMany: {
            args: Prisma.SocialIconFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SocialIconPayload>[]
          }
          create: {
            args: Prisma.SocialIconCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SocialIconPayload>
          }
          createMany: {
            args: Prisma.SocialIconCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SocialIconCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SocialIconPayload>[]
          }
          delete: {
            args: Prisma.SocialIconDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SocialIconPayload>
          }
          update: {
            args: Prisma.SocialIconUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SocialIconPayload>
          }
          deleteMany: {
            args: Prisma.SocialIconDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SocialIconUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SocialIconUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SocialIconPayload>[]
          }
          upsert: {
            args: Prisma.SocialIconUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SocialIconPayload>
          }
          aggregate: {
            args: Prisma.SocialIconAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSocialIcon>
          }
          groupBy: {
            args: Prisma.SocialIconGroupByArgs<ExtArgs>
            result: $Utils.Optional<SocialIconGroupByOutputType>[]
          }
          count: {
            args: Prisma.SocialIconCountArgs<ExtArgs>
            result: $Utils.Optional<SocialIconCountAggregateOutputType> | number
          }
        }
      }
      BackgroundColor: {
        payload: Prisma.$BackgroundColorPayload<ExtArgs>
        fields: Prisma.BackgroundColorFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BackgroundColorFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackgroundColorPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BackgroundColorFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackgroundColorPayload>
          }
          findFirst: {
            args: Prisma.BackgroundColorFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackgroundColorPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BackgroundColorFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackgroundColorPayload>
          }
          findMany: {
            args: Prisma.BackgroundColorFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackgroundColorPayload>[]
          }
          create: {
            args: Prisma.BackgroundColorCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackgroundColorPayload>
          }
          createMany: {
            args: Prisma.BackgroundColorCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.BackgroundColorCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackgroundColorPayload>[]
          }
          delete: {
            args: Prisma.BackgroundColorDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackgroundColorPayload>
          }
          update: {
            args: Prisma.BackgroundColorUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackgroundColorPayload>
          }
          deleteMany: {
            args: Prisma.BackgroundColorDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BackgroundColorUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.BackgroundColorUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackgroundColorPayload>[]
          }
          upsert: {
            args: Prisma.BackgroundColorUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackgroundColorPayload>
          }
          aggregate: {
            args: Prisma.BackgroundColorAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBackgroundColor>
          }
          groupBy: {
            args: Prisma.BackgroundColorGroupByArgs<ExtArgs>
            result: $Utils.Optional<BackgroundColorGroupByOutputType>[]
          }
          count: {
            args: Prisma.BackgroundColorCountArgs<ExtArgs>
            result: $Utils.Optional<BackgroundColorCountAggregateOutputType> | number
          }
        }
      }
      NeonColor: {
        payload: Prisma.$NeonColorPayload<ExtArgs>
        fields: Prisma.NeonColorFieldRefs
        operations: {
          findUnique: {
            args: Prisma.NeonColorFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NeonColorPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.NeonColorFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NeonColorPayload>
          }
          findFirst: {
            args: Prisma.NeonColorFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NeonColorPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.NeonColorFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NeonColorPayload>
          }
          findMany: {
            args: Prisma.NeonColorFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NeonColorPayload>[]
          }
          create: {
            args: Prisma.NeonColorCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NeonColorPayload>
          }
          createMany: {
            args: Prisma.NeonColorCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.NeonColorCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NeonColorPayload>[]
          }
          delete: {
            args: Prisma.NeonColorDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NeonColorPayload>
          }
          update: {
            args: Prisma.NeonColorUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NeonColorPayload>
          }
          deleteMany: {
            args: Prisma.NeonColorDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.NeonColorUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.NeonColorUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NeonColorPayload>[]
          }
          upsert: {
            args: Prisma.NeonColorUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NeonColorPayload>
          }
          aggregate: {
            args: Prisma.NeonColorAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateNeonColor>
          }
          groupBy: {
            args: Prisma.NeonColorGroupByArgs<ExtArgs>
            result: $Utils.Optional<NeonColorGroupByOutputType>[]
          }
          count: {
            args: Prisma.NeonColorCountArgs<ExtArgs>
            result: $Utils.Optional<NeonColorCountAggregateOutputType> | number
          }
        }
      }
      Statusbar: {
        payload: Prisma.$StatusbarPayload<ExtArgs>
        fields: Prisma.StatusbarFieldRefs
        operations: {
          findUnique: {
            args: Prisma.StatusbarFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StatusbarPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.StatusbarFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StatusbarPayload>
          }
          findFirst: {
            args: Prisma.StatusbarFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StatusbarPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.StatusbarFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StatusbarPayload>
          }
          findMany: {
            args: Prisma.StatusbarFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StatusbarPayload>[]
          }
          create: {
            args: Prisma.StatusbarCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StatusbarPayload>
          }
          createMany: {
            args: Prisma.StatusbarCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.StatusbarCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StatusbarPayload>[]
          }
          delete: {
            args: Prisma.StatusbarDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StatusbarPayload>
          }
          update: {
            args: Prisma.StatusbarUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StatusbarPayload>
          }
          deleteMany: {
            args: Prisma.StatusbarDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.StatusbarUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.StatusbarUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StatusbarPayload>[]
          }
          upsert: {
            args: Prisma.StatusbarUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StatusbarPayload>
          }
          aggregate: {
            args: Prisma.StatusbarAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateStatusbar>
          }
          groupBy: {
            args: Prisma.StatusbarGroupByArgs<ExtArgs>
            result: $Utils.Optional<StatusbarGroupByOutputType>[]
          }
          count: {
            args: Prisma.StatusbarCountArgs<ExtArgs>
            result: $Utils.Optional<StatusbarCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    user?: UserOmit
    cosmetic?: CosmeticOmit
    link?: LinkOmit
    label?: LabelOmit
    socialIcon?: SocialIconOmit
    backgroundColor?: BackgroundColorOmit
    neonColor?: NeonColorOmit
    statusbar?: StatusbarOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    links: number
    labels: number
    socialIcons: number
    background: number
    neonColors: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    links?: boolean | UserCountOutputTypeCountLinksArgs
    labels?: boolean | UserCountOutputTypeCountLabelsArgs
    socialIcons?: boolean | UserCountOutputTypeCountSocialIconsArgs
    background?: boolean | UserCountOutputTypeCountBackgroundArgs
    neonColors?: boolean | UserCountOutputTypeCountNeonColorsArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountLinksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LinkWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountLabelsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LabelWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountSocialIconsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SocialIconWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountBackgroundArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BackgroundColorWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountNeonColorsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NeonColorWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserAvgAggregateOutputType = {
    degBackgroundColor: number | null
    neonEnable: number | null
    buttonThemeEnable: number | null
    EnableAnimationArticle: number | null
    EnableAnimationButton: number | null
    EnableAnimationBackground: number | null
    backgroundSize: number | null
    selectedThemeIndex: number | null
    selectedAnimationIndex: number | null
    selectedAnimationButtonIndex: number | null
    selectedAnimationBackgroundIndex: number | null
    animationDurationBackground: number | null
    delayAnimationButton: number | null
    canvaEnable: number | null
    selectedCanvasIndex: number | null
    rankScore: number | null
  }

  export type UserSumAggregateOutputType = {
    degBackgroundColor: number | null
    neonEnable: number | null
    buttonThemeEnable: number | null
    EnableAnimationArticle: number | null
    EnableAnimationButton: number | null
    EnableAnimationBackground: number | null
    backgroundSize: number | null
    selectedThemeIndex: number | null
    selectedAnimationIndex: number | null
    selectedAnimationButtonIndex: number | null
    selectedAnimationBackgroundIndex: number | null
    animationDurationBackground: number | null
    delayAnimationButton: number | null
    canvaEnable: number | null
    selectedCanvasIndex: number | null
    rankScore: number | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    userName: string | null
    password: string | null
    email: string | null
    publicEmail: string | null
    profileLink: string | null
    profileImage: string | null
    profileIcon: string | null
    profileSiteText: string | null
    iconUrl: string | null
    description: string | null
    profileHoverColor: string | null
    degBackgroundColor: number | null
    neonEnable: number | null
    buttonThemeEnable: number | null
    EnableAnimationArticle: number | null
    EnableAnimationButton: number | null
    EnableAnimationBackground: number | null
    backgroundSize: number | null
    selectedThemeIndex: number | null
    selectedAnimationIndex: number | null
    selectedAnimationButtonIndex: number | null
    selectedAnimationBackgroundIndex: number | null
    animationDurationBackground: number | null
    delayAnimationButton: number | null
    canvaEnable: number | null
    selectedCanvasIndex: number | null
    name: string | null
    emailVerified: boolean | null
    image: string | null
    createdAt: Date | null
    updatedAt: Date | null
    role: $Enums.Role | null
    rankScore: number | null
    bumpedAt: Date | null
    bumpExpiresAt: Date | null
    bumpPaidUntil: Date | null
    isPublic: boolean | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    userName: string | null
    password: string | null
    email: string | null
    publicEmail: string | null
    profileLink: string | null
    profileImage: string | null
    profileIcon: string | null
    profileSiteText: string | null
    iconUrl: string | null
    description: string | null
    profileHoverColor: string | null
    degBackgroundColor: number | null
    neonEnable: number | null
    buttonThemeEnable: number | null
    EnableAnimationArticle: number | null
    EnableAnimationButton: number | null
    EnableAnimationBackground: number | null
    backgroundSize: number | null
    selectedThemeIndex: number | null
    selectedAnimationIndex: number | null
    selectedAnimationButtonIndex: number | null
    selectedAnimationBackgroundIndex: number | null
    animationDurationBackground: number | null
    delayAnimationButton: number | null
    canvaEnable: number | null
    selectedCanvasIndex: number | null
    name: string | null
    emailVerified: boolean | null
    image: string | null
    createdAt: Date | null
    updatedAt: Date | null
    role: $Enums.Role | null
    rankScore: number | null
    bumpedAt: Date | null
    bumpExpiresAt: Date | null
    bumpPaidUntil: Date | null
    isPublic: boolean | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    userName: number
    password: number
    email: number
    publicEmail: number
    profileLink: number
    profileImage: number
    profileIcon: number
    profileSiteText: number
    iconUrl: number
    description: number
    profileHoverColor: number
    degBackgroundColor: number
    neonEnable: number
    buttonThemeEnable: number
    EnableAnimationArticle: number
    EnableAnimationButton: number
    EnableAnimationBackground: number
    backgroundSize: number
    selectedThemeIndex: number
    selectedAnimationIndex: number
    selectedAnimationButtonIndex: number
    selectedAnimationBackgroundIndex: number
    animationDurationBackground: number
    delayAnimationButton: number
    canvaEnable: number
    selectedCanvasIndex: number
    name: number
    emailVerified: number
    image: number
    createdAt: number
    updatedAt: number
    role: number
    rankScore: number
    bumpedAt: number
    bumpExpiresAt: number
    bumpPaidUntil: number
    isPublic: number
    _all: number
  }


  export type UserAvgAggregateInputType = {
    degBackgroundColor?: true
    neonEnable?: true
    buttonThemeEnable?: true
    EnableAnimationArticle?: true
    EnableAnimationButton?: true
    EnableAnimationBackground?: true
    backgroundSize?: true
    selectedThemeIndex?: true
    selectedAnimationIndex?: true
    selectedAnimationButtonIndex?: true
    selectedAnimationBackgroundIndex?: true
    animationDurationBackground?: true
    delayAnimationButton?: true
    canvaEnable?: true
    selectedCanvasIndex?: true
    rankScore?: true
  }

  export type UserSumAggregateInputType = {
    degBackgroundColor?: true
    neonEnable?: true
    buttonThemeEnable?: true
    EnableAnimationArticle?: true
    EnableAnimationButton?: true
    EnableAnimationBackground?: true
    backgroundSize?: true
    selectedThemeIndex?: true
    selectedAnimationIndex?: true
    selectedAnimationButtonIndex?: true
    selectedAnimationBackgroundIndex?: true
    animationDurationBackground?: true
    delayAnimationButton?: true
    canvaEnable?: true
    selectedCanvasIndex?: true
    rankScore?: true
  }

  export type UserMinAggregateInputType = {
    id?: true
    userName?: true
    password?: true
    email?: true
    publicEmail?: true
    profileLink?: true
    profileImage?: true
    profileIcon?: true
    profileSiteText?: true
    iconUrl?: true
    description?: true
    profileHoverColor?: true
    degBackgroundColor?: true
    neonEnable?: true
    buttonThemeEnable?: true
    EnableAnimationArticle?: true
    EnableAnimationButton?: true
    EnableAnimationBackground?: true
    backgroundSize?: true
    selectedThemeIndex?: true
    selectedAnimationIndex?: true
    selectedAnimationButtonIndex?: true
    selectedAnimationBackgroundIndex?: true
    animationDurationBackground?: true
    delayAnimationButton?: true
    canvaEnable?: true
    selectedCanvasIndex?: true
    name?: true
    emailVerified?: true
    image?: true
    createdAt?: true
    updatedAt?: true
    role?: true
    rankScore?: true
    bumpedAt?: true
    bumpExpiresAt?: true
    bumpPaidUntil?: true
    isPublic?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    userName?: true
    password?: true
    email?: true
    publicEmail?: true
    profileLink?: true
    profileImage?: true
    profileIcon?: true
    profileSiteText?: true
    iconUrl?: true
    description?: true
    profileHoverColor?: true
    degBackgroundColor?: true
    neonEnable?: true
    buttonThemeEnable?: true
    EnableAnimationArticle?: true
    EnableAnimationButton?: true
    EnableAnimationBackground?: true
    backgroundSize?: true
    selectedThemeIndex?: true
    selectedAnimationIndex?: true
    selectedAnimationButtonIndex?: true
    selectedAnimationBackgroundIndex?: true
    animationDurationBackground?: true
    delayAnimationButton?: true
    canvaEnable?: true
    selectedCanvasIndex?: true
    name?: true
    emailVerified?: true
    image?: true
    createdAt?: true
    updatedAt?: true
    role?: true
    rankScore?: true
    bumpedAt?: true
    bumpExpiresAt?: true
    bumpPaidUntil?: true
    isPublic?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    userName?: true
    password?: true
    email?: true
    publicEmail?: true
    profileLink?: true
    profileImage?: true
    profileIcon?: true
    profileSiteText?: true
    iconUrl?: true
    description?: true
    profileHoverColor?: true
    degBackgroundColor?: true
    neonEnable?: true
    buttonThemeEnable?: true
    EnableAnimationArticle?: true
    EnableAnimationButton?: true
    EnableAnimationBackground?: true
    backgroundSize?: true
    selectedThemeIndex?: true
    selectedAnimationIndex?: true
    selectedAnimationButtonIndex?: true
    selectedAnimationBackgroundIndex?: true
    animationDurationBackground?: true
    delayAnimationButton?: true
    canvaEnable?: true
    selectedCanvasIndex?: true
    name?: true
    emailVerified?: true
    image?: true
    createdAt?: true
    updatedAt?: true
    role?: true
    rankScore?: true
    bumpedAt?: true
    bumpExpiresAt?: true
    bumpPaidUntil?: true
    isPublic?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UserAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UserSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _avg?: UserAvgAggregateInputType
    _sum?: UserSumAggregateInputType
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    userName: string
    password: string
    email: string
    publicEmail: string | null
    profileLink: string | null
    profileImage: string | null
    profileIcon: string | null
    profileSiteText: string | null
    iconUrl: string | null
    description: string | null
    profileHoverColor: string | null
    degBackgroundColor: number | null
    neonEnable: number
    buttonThemeEnable: number
    EnableAnimationArticle: number
    EnableAnimationButton: number
    EnableAnimationBackground: number
    backgroundSize: number | null
    selectedThemeIndex: number | null
    selectedAnimationIndex: number | null
    selectedAnimationButtonIndex: number | null
    selectedAnimationBackgroundIndex: number | null
    animationDurationBackground: number | null
    delayAnimationButton: number | null
    canvaEnable: number
    selectedCanvasIndex: number | null
    name: string
    emailVerified: boolean
    image: string | null
    createdAt: Date
    updatedAt: Date
    role: $Enums.Role
    rankScore: number
    bumpedAt: Date | null
    bumpExpiresAt: Date | null
    bumpPaidUntil: Date | null
    isPublic: boolean
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userName?: boolean
    password?: boolean
    email?: boolean
    publicEmail?: boolean
    profileLink?: boolean
    profileImage?: boolean
    profileIcon?: boolean
    profileSiteText?: boolean
    iconUrl?: boolean
    description?: boolean
    profileHoverColor?: boolean
    degBackgroundColor?: boolean
    neonEnable?: boolean
    buttonThemeEnable?: boolean
    EnableAnimationArticle?: boolean
    EnableAnimationButton?: boolean
    EnableAnimationBackground?: boolean
    backgroundSize?: boolean
    selectedThemeIndex?: boolean
    selectedAnimationIndex?: boolean
    selectedAnimationButtonIndex?: boolean
    selectedAnimationBackgroundIndex?: boolean
    animationDurationBackground?: boolean
    delayAnimationButton?: boolean
    canvaEnable?: boolean
    selectedCanvasIndex?: boolean
    name?: boolean
    emailVerified?: boolean
    image?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    role?: boolean
    rankScore?: boolean
    bumpedAt?: boolean
    bumpExpiresAt?: boolean
    bumpPaidUntil?: boolean
    isPublic?: boolean
    links?: boolean | User$linksArgs<ExtArgs>
    labels?: boolean | User$labelsArgs<ExtArgs>
    socialIcons?: boolean | User$socialIconsArgs<ExtArgs>
    background?: boolean | User$backgroundArgs<ExtArgs>
    neonColors?: boolean | User$neonColorsArgs<ExtArgs>
    statusbar?: boolean | User$statusbarArgs<ExtArgs>
    cosmetics?: boolean | User$cosmeticsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userName?: boolean
    password?: boolean
    email?: boolean
    publicEmail?: boolean
    profileLink?: boolean
    profileImage?: boolean
    profileIcon?: boolean
    profileSiteText?: boolean
    iconUrl?: boolean
    description?: boolean
    profileHoverColor?: boolean
    degBackgroundColor?: boolean
    neonEnable?: boolean
    buttonThemeEnable?: boolean
    EnableAnimationArticle?: boolean
    EnableAnimationButton?: boolean
    EnableAnimationBackground?: boolean
    backgroundSize?: boolean
    selectedThemeIndex?: boolean
    selectedAnimationIndex?: boolean
    selectedAnimationButtonIndex?: boolean
    selectedAnimationBackgroundIndex?: boolean
    animationDurationBackground?: boolean
    delayAnimationButton?: boolean
    canvaEnable?: boolean
    selectedCanvasIndex?: boolean
    name?: boolean
    emailVerified?: boolean
    image?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    role?: boolean
    rankScore?: boolean
    bumpedAt?: boolean
    bumpExpiresAt?: boolean
    bumpPaidUntil?: boolean
    isPublic?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userName?: boolean
    password?: boolean
    email?: boolean
    publicEmail?: boolean
    profileLink?: boolean
    profileImage?: boolean
    profileIcon?: boolean
    profileSiteText?: boolean
    iconUrl?: boolean
    description?: boolean
    profileHoverColor?: boolean
    degBackgroundColor?: boolean
    neonEnable?: boolean
    buttonThemeEnable?: boolean
    EnableAnimationArticle?: boolean
    EnableAnimationButton?: boolean
    EnableAnimationBackground?: boolean
    backgroundSize?: boolean
    selectedThemeIndex?: boolean
    selectedAnimationIndex?: boolean
    selectedAnimationButtonIndex?: boolean
    selectedAnimationBackgroundIndex?: boolean
    animationDurationBackground?: boolean
    delayAnimationButton?: boolean
    canvaEnable?: boolean
    selectedCanvasIndex?: boolean
    name?: boolean
    emailVerified?: boolean
    image?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    role?: boolean
    rankScore?: boolean
    bumpedAt?: boolean
    bumpExpiresAt?: boolean
    bumpPaidUntil?: boolean
    isPublic?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    userName?: boolean
    password?: boolean
    email?: boolean
    publicEmail?: boolean
    profileLink?: boolean
    profileImage?: boolean
    profileIcon?: boolean
    profileSiteText?: boolean
    iconUrl?: boolean
    description?: boolean
    profileHoverColor?: boolean
    degBackgroundColor?: boolean
    neonEnable?: boolean
    buttonThemeEnable?: boolean
    EnableAnimationArticle?: boolean
    EnableAnimationButton?: boolean
    EnableAnimationBackground?: boolean
    backgroundSize?: boolean
    selectedThemeIndex?: boolean
    selectedAnimationIndex?: boolean
    selectedAnimationButtonIndex?: boolean
    selectedAnimationBackgroundIndex?: boolean
    animationDurationBackground?: boolean
    delayAnimationButton?: boolean
    canvaEnable?: boolean
    selectedCanvasIndex?: boolean
    name?: boolean
    emailVerified?: boolean
    image?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    role?: boolean
    rankScore?: boolean
    bumpedAt?: boolean
    bumpExpiresAt?: boolean
    bumpPaidUntil?: boolean
    isPublic?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userName" | "password" | "email" | "publicEmail" | "profileLink" | "profileImage" | "profileIcon" | "profileSiteText" | "iconUrl" | "description" | "profileHoverColor" | "degBackgroundColor" | "neonEnable" | "buttonThemeEnable" | "EnableAnimationArticle" | "EnableAnimationButton" | "EnableAnimationBackground" | "backgroundSize" | "selectedThemeIndex" | "selectedAnimationIndex" | "selectedAnimationButtonIndex" | "selectedAnimationBackgroundIndex" | "animationDurationBackground" | "delayAnimationButton" | "canvaEnable" | "selectedCanvasIndex" | "name" | "emailVerified" | "image" | "createdAt" | "updatedAt" | "role" | "rankScore" | "bumpedAt" | "bumpExpiresAt" | "bumpPaidUntil" | "isPublic", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    links?: boolean | User$linksArgs<ExtArgs>
    labels?: boolean | User$labelsArgs<ExtArgs>
    socialIcons?: boolean | User$socialIconsArgs<ExtArgs>
    background?: boolean | User$backgroundArgs<ExtArgs>
    neonColors?: boolean | User$neonColorsArgs<ExtArgs>
    statusbar?: boolean | User$statusbarArgs<ExtArgs>
    cosmetics?: boolean | User$cosmeticsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type UserIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      links: Prisma.$LinkPayload<ExtArgs>[]
      labels: Prisma.$LabelPayload<ExtArgs>[]
      socialIcons: Prisma.$SocialIconPayload<ExtArgs>[]
      background: Prisma.$BackgroundColorPayload<ExtArgs>[]
      neonColors: Prisma.$NeonColorPayload<ExtArgs>[]
      statusbar: Prisma.$StatusbarPayload<ExtArgs> | null
      cosmetics: Prisma.$CosmeticPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userName: string
      password: string
      email: string
      publicEmail: string | null
      profileLink: string | null
      profileImage: string | null
      profileIcon: string | null
      profileSiteText: string | null
      iconUrl: string | null
      description: string | null
      profileHoverColor: string | null
      degBackgroundColor: number | null
      neonEnable: number
      buttonThemeEnable: number
      EnableAnimationArticle: number
      EnableAnimationButton: number
      EnableAnimationBackground: number
      backgroundSize: number | null
      selectedThemeIndex: number | null
      selectedAnimationIndex: number | null
      selectedAnimationButtonIndex: number | null
      selectedAnimationBackgroundIndex: number | null
      animationDurationBackground: number | null
      delayAnimationButton: number | null
      canvaEnable: number
      selectedCanvasIndex: number | null
      name: string
      emailVerified: boolean
      image: string | null
      createdAt: Date
      updatedAt: Date
      role: $Enums.Role
      rankScore: number
      bumpedAt: Date | null
      bumpExpiresAt: Date | null
      bumpPaidUntil: Date | null
      isPublic: boolean
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    links<T extends User$linksArgs<ExtArgs> = {}>(args?: Subset<T, User$linksArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LinkPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    labels<T extends User$labelsArgs<ExtArgs> = {}>(args?: Subset<T, User$labelsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LabelPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    socialIcons<T extends User$socialIconsArgs<ExtArgs> = {}>(args?: Subset<T, User$socialIconsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SocialIconPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    background<T extends User$backgroundArgs<ExtArgs> = {}>(args?: Subset<T, User$backgroundArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BackgroundColorPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    neonColors<T extends User$neonColorsArgs<ExtArgs> = {}>(args?: Subset<T, User$neonColorsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NeonColorPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    statusbar<T extends User$statusbarArgs<ExtArgs> = {}>(args?: Subset<T, User$statusbarArgs<ExtArgs>>): Prisma__StatusbarClient<$Result.GetResult<Prisma.$StatusbarPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    cosmetics<T extends User$cosmeticsArgs<ExtArgs> = {}>(args?: Subset<T, User$cosmeticsArgs<ExtArgs>>): Prisma__CosmeticClient<$Result.GetResult<Prisma.$CosmeticPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly userName: FieldRef<"User", 'String'>
    readonly password: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly publicEmail: FieldRef<"User", 'String'>
    readonly profileLink: FieldRef<"User", 'String'>
    readonly profileImage: FieldRef<"User", 'String'>
    readonly profileIcon: FieldRef<"User", 'String'>
    readonly profileSiteText: FieldRef<"User", 'String'>
    readonly iconUrl: FieldRef<"User", 'String'>
    readonly description: FieldRef<"User", 'String'>
    readonly profileHoverColor: FieldRef<"User", 'String'>
    readonly degBackgroundColor: FieldRef<"User", 'Int'>
    readonly neonEnable: FieldRef<"User", 'Int'>
    readonly buttonThemeEnable: FieldRef<"User", 'Int'>
    readonly EnableAnimationArticle: FieldRef<"User", 'Int'>
    readonly EnableAnimationButton: FieldRef<"User", 'Int'>
    readonly EnableAnimationBackground: FieldRef<"User", 'Int'>
    readonly backgroundSize: FieldRef<"User", 'Int'>
    readonly selectedThemeIndex: FieldRef<"User", 'Int'>
    readonly selectedAnimationIndex: FieldRef<"User", 'Int'>
    readonly selectedAnimationButtonIndex: FieldRef<"User", 'Int'>
    readonly selectedAnimationBackgroundIndex: FieldRef<"User", 'Int'>
    readonly animationDurationBackground: FieldRef<"User", 'Int'>
    readonly delayAnimationButton: FieldRef<"User", 'Float'>
    readonly canvaEnable: FieldRef<"User", 'Int'>
    readonly selectedCanvasIndex: FieldRef<"User", 'Int'>
    readonly name: FieldRef<"User", 'String'>
    readonly emailVerified: FieldRef<"User", 'Boolean'>
    readonly image: FieldRef<"User", 'String'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
    readonly role: FieldRef<"User", 'Role'>
    readonly rankScore: FieldRef<"User", 'Int'>
    readonly bumpedAt: FieldRef<"User", 'DateTime'>
    readonly bumpExpiresAt: FieldRef<"User", 'DateTime'>
    readonly bumpPaidUntil: FieldRef<"User", 'DateTime'>
    readonly isPublic: FieldRef<"User", 'Boolean'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.links
   */
  export type User$linksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Link
     */
    select?: LinkSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Link
     */
    omit?: LinkOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LinkInclude<ExtArgs> | null
    where?: LinkWhereInput
    orderBy?: LinkOrderByWithRelationInput | LinkOrderByWithRelationInput[]
    cursor?: LinkWhereUniqueInput
    take?: number
    skip?: number
    distinct?: LinkScalarFieldEnum | LinkScalarFieldEnum[]
  }

  /**
   * User.labels
   */
  export type User$labelsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Label
     */
    select?: LabelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Label
     */
    omit?: LabelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LabelInclude<ExtArgs> | null
    where?: LabelWhereInput
    orderBy?: LabelOrderByWithRelationInput | LabelOrderByWithRelationInput[]
    cursor?: LabelWhereUniqueInput
    take?: number
    skip?: number
    distinct?: LabelScalarFieldEnum | LabelScalarFieldEnum[]
  }

  /**
   * User.socialIcons
   */
  export type User$socialIconsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SocialIcon
     */
    select?: SocialIconSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SocialIcon
     */
    omit?: SocialIconOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SocialIconInclude<ExtArgs> | null
    where?: SocialIconWhereInput
    orderBy?: SocialIconOrderByWithRelationInput | SocialIconOrderByWithRelationInput[]
    cursor?: SocialIconWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SocialIconScalarFieldEnum | SocialIconScalarFieldEnum[]
  }

  /**
   * User.background
   */
  export type User$backgroundArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackgroundColor
     */
    select?: BackgroundColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BackgroundColor
     */
    omit?: BackgroundColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BackgroundColorInclude<ExtArgs> | null
    where?: BackgroundColorWhereInput
    orderBy?: BackgroundColorOrderByWithRelationInput | BackgroundColorOrderByWithRelationInput[]
    cursor?: BackgroundColorWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BackgroundColorScalarFieldEnum | BackgroundColorScalarFieldEnum[]
  }

  /**
   * User.neonColors
   */
  export type User$neonColorsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NeonColor
     */
    select?: NeonColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NeonColor
     */
    omit?: NeonColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NeonColorInclude<ExtArgs> | null
    where?: NeonColorWhereInput
    orderBy?: NeonColorOrderByWithRelationInput | NeonColorOrderByWithRelationInput[]
    cursor?: NeonColorWhereUniqueInput
    take?: number
    skip?: number
    distinct?: NeonColorScalarFieldEnum | NeonColorScalarFieldEnum[]
  }

  /**
   * User.statusbar
   */
  export type User$statusbarArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Statusbar
     */
    select?: StatusbarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Statusbar
     */
    omit?: StatusbarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StatusbarInclude<ExtArgs> | null
    where?: StatusbarWhereInput
  }

  /**
   * User.cosmetics
   */
  export type User$cosmeticsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cosmetic
     */
    select?: CosmeticSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cosmetic
     */
    omit?: CosmeticOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CosmeticInclude<ExtArgs> | null
    where?: CosmeticWhereInput
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Cosmetic
   */

  export type AggregateCosmetic = {
    _count: CosmeticCountAggregateOutputType | null
    _avg: CosmeticAvgAggregateOutputType | null
    _sum: CosmeticSumAggregateOutputType | null
    _min: CosmeticMinAggregateOutputType | null
    _max: CosmeticMaxAggregateOutputType | null
  }

  export type CosmeticAvgAggregateOutputType = {
    id: number | null
  }

  export type CosmeticSumAggregateOutputType = {
    id: number | null
  }

  export type CosmeticMinAggregateOutputType = {
    id: number | null
    flair: string | null
    frame: string | null
    theme: string | null
    bannerUrl: string | null
    userId: string | null
  }

  export type CosmeticMaxAggregateOutputType = {
    id: number | null
    flair: string | null
    frame: string | null
    theme: string | null
    bannerUrl: string | null
    userId: string | null
  }

  export type CosmeticCountAggregateOutputType = {
    id: number
    flair: number
    frame: number
    theme: number
    bannerUrl: number
    userId: number
    _all: number
  }


  export type CosmeticAvgAggregateInputType = {
    id?: true
  }

  export type CosmeticSumAggregateInputType = {
    id?: true
  }

  export type CosmeticMinAggregateInputType = {
    id?: true
    flair?: true
    frame?: true
    theme?: true
    bannerUrl?: true
    userId?: true
  }

  export type CosmeticMaxAggregateInputType = {
    id?: true
    flair?: true
    frame?: true
    theme?: true
    bannerUrl?: true
    userId?: true
  }

  export type CosmeticCountAggregateInputType = {
    id?: true
    flair?: true
    frame?: true
    theme?: true
    bannerUrl?: true
    userId?: true
    _all?: true
  }

  export type CosmeticAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Cosmetic to aggregate.
     */
    where?: CosmeticWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Cosmetics to fetch.
     */
    orderBy?: CosmeticOrderByWithRelationInput | CosmeticOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CosmeticWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Cosmetics from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Cosmetics.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Cosmetics
    **/
    _count?: true | CosmeticCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: CosmeticAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: CosmeticSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CosmeticMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CosmeticMaxAggregateInputType
  }

  export type GetCosmeticAggregateType<T extends CosmeticAggregateArgs> = {
        [P in keyof T & keyof AggregateCosmetic]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCosmetic[P]>
      : GetScalarType<T[P], AggregateCosmetic[P]>
  }




  export type CosmeticGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CosmeticWhereInput
    orderBy?: CosmeticOrderByWithAggregationInput | CosmeticOrderByWithAggregationInput[]
    by: CosmeticScalarFieldEnum[] | CosmeticScalarFieldEnum
    having?: CosmeticScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CosmeticCountAggregateInputType | true
    _avg?: CosmeticAvgAggregateInputType
    _sum?: CosmeticSumAggregateInputType
    _min?: CosmeticMinAggregateInputType
    _max?: CosmeticMaxAggregateInputType
  }

  export type CosmeticGroupByOutputType = {
    id: number
    flair: string | null
    frame: string | null
    theme: string | null
    bannerUrl: string | null
    userId: string
    _count: CosmeticCountAggregateOutputType | null
    _avg: CosmeticAvgAggregateOutputType | null
    _sum: CosmeticSumAggregateOutputType | null
    _min: CosmeticMinAggregateOutputType | null
    _max: CosmeticMaxAggregateOutputType | null
  }

  type GetCosmeticGroupByPayload<T extends CosmeticGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CosmeticGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CosmeticGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CosmeticGroupByOutputType[P]>
            : GetScalarType<T[P], CosmeticGroupByOutputType[P]>
        }
      >
    >


  export type CosmeticSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    flair?: boolean
    frame?: boolean
    theme?: boolean
    bannerUrl?: boolean
    userId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["cosmetic"]>

  export type CosmeticSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    flair?: boolean
    frame?: boolean
    theme?: boolean
    bannerUrl?: boolean
    userId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["cosmetic"]>

  export type CosmeticSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    flair?: boolean
    frame?: boolean
    theme?: boolean
    bannerUrl?: boolean
    userId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["cosmetic"]>

  export type CosmeticSelectScalar = {
    id?: boolean
    flair?: boolean
    frame?: boolean
    theme?: boolean
    bannerUrl?: boolean
    userId?: boolean
  }

  export type CosmeticOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "flair" | "frame" | "theme" | "bannerUrl" | "userId", ExtArgs["result"]["cosmetic"]>
  export type CosmeticInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type CosmeticIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type CosmeticIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $CosmeticPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Cosmetic"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      flair: string | null
      frame: string | null
      theme: string | null
      bannerUrl: string | null
      userId: string
    }, ExtArgs["result"]["cosmetic"]>
    composites: {}
  }

  type CosmeticGetPayload<S extends boolean | null | undefined | CosmeticDefaultArgs> = $Result.GetResult<Prisma.$CosmeticPayload, S>

  type CosmeticCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CosmeticFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CosmeticCountAggregateInputType | true
    }

  export interface CosmeticDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Cosmetic'], meta: { name: 'Cosmetic' } }
    /**
     * Find zero or one Cosmetic that matches the filter.
     * @param {CosmeticFindUniqueArgs} args - Arguments to find a Cosmetic
     * @example
     * // Get one Cosmetic
     * const cosmetic = await prisma.cosmetic.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CosmeticFindUniqueArgs>(args: SelectSubset<T, CosmeticFindUniqueArgs<ExtArgs>>): Prisma__CosmeticClient<$Result.GetResult<Prisma.$CosmeticPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Cosmetic that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CosmeticFindUniqueOrThrowArgs} args - Arguments to find a Cosmetic
     * @example
     * // Get one Cosmetic
     * const cosmetic = await prisma.cosmetic.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CosmeticFindUniqueOrThrowArgs>(args: SelectSubset<T, CosmeticFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CosmeticClient<$Result.GetResult<Prisma.$CosmeticPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Cosmetic that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CosmeticFindFirstArgs} args - Arguments to find a Cosmetic
     * @example
     * // Get one Cosmetic
     * const cosmetic = await prisma.cosmetic.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CosmeticFindFirstArgs>(args?: SelectSubset<T, CosmeticFindFirstArgs<ExtArgs>>): Prisma__CosmeticClient<$Result.GetResult<Prisma.$CosmeticPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Cosmetic that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CosmeticFindFirstOrThrowArgs} args - Arguments to find a Cosmetic
     * @example
     * // Get one Cosmetic
     * const cosmetic = await prisma.cosmetic.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CosmeticFindFirstOrThrowArgs>(args?: SelectSubset<T, CosmeticFindFirstOrThrowArgs<ExtArgs>>): Prisma__CosmeticClient<$Result.GetResult<Prisma.$CosmeticPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Cosmetics that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CosmeticFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Cosmetics
     * const cosmetics = await prisma.cosmetic.findMany()
     * 
     * // Get first 10 Cosmetics
     * const cosmetics = await prisma.cosmetic.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const cosmeticWithIdOnly = await prisma.cosmetic.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CosmeticFindManyArgs>(args?: SelectSubset<T, CosmeticFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CosmeticPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Cosmetic.
     * @param {CosmeticCreateArgs} args - Arguments to create a Cosmetic.
     * @example
     * // Create one Cosmetic
     * const Cosmetic = await prisma.cosmetic.create({
     *   data: {
     *     // ... data to create a Cosmetic
     *   }
     * })
     * 
     */
    create<T extends CosmeticCreateArgs>(args: SelectSubset<T, CosmeticCreateArgs<ExtArgs>>): Prisma__CosmeticClient<$Result.GetResult<Prisma.$CosmeticPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Cosmetics.
     * @param {CosmeticCreateManyArgs} args - Arguments to create many Cosmetics.
     * @example
     * // Create many Cosmetics
     * const cosmetic = await prisma.cosmetic.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CosmeticCreateManyArgs>(args?: SelectSubset<T, CosmeticCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Cosmetics and returns the data saved in the database.
     * @param {CosmeticCreateManyAndReturnArgs} args - Arguments to create many Cosmetics.
     * @example
     * // Create many Cosmetics
     * const cosmetic = await prisma.cosmetic.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Cosmetics and only return the `id`
     * const cosmeticWithIdOnly = await prisma.cosmetic.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CosmeticCreateManyAndReturnArgs>(args?: SelectSubset<T, CosmeticCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CosmeticPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Cosmetic.
     * @param {CosmeticDeleteArgs} args - Arguments to delete one Cosmetic.
     * @example
     * // Delete one Cosmetic
     * const Cosmetic = await prisma.cosmetic.delete({
     *   where: {
     *     // ... filter to delete one Cosmetic
     *   }
     * })
     * 
     */
    delete<T extends CosmeticDeleteArgs>(args: SelectSubset<T, CosmeticDeleteArgs<ExtArgs>>): Prisma__CosmeticClient<$Result.GetResult<Prisma.$CosmeticPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Cosmetic.
     * @param {CosmeticUpdateArgs} args - Arguments to update one Cosmetic.
     * @example
     * // Update one Cosmetic
     * const cosmetic = await prisma.cosmetic.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CosmeticUpdateArgs>(args: SelectSubset<T, CosmeticUpdateArgs<ExtArgs>>): Prisma__CosmeticClient<$Result.GetResult<Prisma.$CosmeticPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Cosmetics.
     * @param {CosmeticDeleteManyArgs} args - Arguments to filter Cosmetics to delete.
     * @example
     * // Delete a few Cosmetics
     * const { count } = await prisma.cosmetic.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CosmeticDeleteManyArgs>(args?: SelectSubset<T, CosmeticDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Cosmetics.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CosmeticUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Cosmetics
     * const cosmetic = await prisma.cosmetic.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CosmeticUpdateManyArgs>(args: SelectSubset<T, CosmeticUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Cosmetics and returns the data updated in the database.
     * @param {CosmeticUpdateManyAndReturnArgs} args - Arguments to update many Cosmetics.
     * @example
     * // Update many Cosmetics
     * const cosmetic = await prisma.cosmetic.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Cosmetics and only return the `id`
     * const cosmeticWithIdOnly = await prisma.cosmetic.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CosmeticUpdateManyAndReturnArgs>(args: SelectSubset<T, CosmeticUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CosmeticPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Cosmetic.
     * @param {CosmeticUpsertArgs} args - Arguments to update or create a Cosmetic.
     * @example
     * // Update or create a Cosmetic
     * const cosmetic = await prisma.cosmetic.upsert({
     *   create: {
     *     // ... data to create a Cosmetic
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Cosmetic we want to update
     *   }
     * })
     */
    upsert<T extends CosmeticUpsertArgs>(args: SelectSubset<T, CosmeticUpsertArgs<ExtArgs>>): Prisma__CosmeticClient<$Result.GetResult<Prisma.$CosmeticPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Cosmetics.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CosmeticCountArgs} args - Arguments to filter Cosmetics to count.
     * @example
     * // Count the number of Cosmetics
     * const count = await prisma.cosmetic.count({
     *   where: {
     *     // ... the filter for the Cosmetics we want to count
     *   }
     * })
    **/
    count<T extends CosmeticCountArgs>(
      args?: Subset<T, CosmeticCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CosmeticCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Cosmetic.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CosmeticAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CosmeticAggregateArgs>(args: Subset<T, CosmeticAggregateArgs>): Prisma.PrismaPromise<GetCosmeticAggregateType<T>>

    /**
     * Group by Cosmetic.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CosmeticGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CosmeticGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CosmeticGroupByArgs['orderBy'] }
        : { orderBy?: CosmeticGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CosmeticGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCosmeticGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Cosmetic model
   */
  readonly fields: CosmeticFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Cosmetic.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CosmeticClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Cosmetic model
   */
  interface CosmeticFieldRefs {
    readonly id: FieldRef<"Cosmetic", 'Int'>
    readonly flair: FieldRef<"Cosmetic", 'String'>
    readonly frame: FieldRef<"Cosmetic", 'String'>
    readonly theme: FieldRef<"Cosmetic", 'String'>
    readonly bannerUrl: FieldRef<"Cosmetic", 'String'>
    readonly userId: FieldRef<"Cosmetic", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Cosmetic findUnique
   */
  export type CosmeticFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cosmetic
     */
    select?: CosmeticSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cosmetic
     */
    omit?: CosmeticOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CosmeticInclude<ExtArgs> | null
    /**
     * Filter, which Cosmetic to fetch.
     */
    where: CosmeticWhereUniqueInput
  }

  /**
   * Cosmetic findUniqueOrThrow
   */
  export type CosmeticFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cosmetic
     */
    select?: CosmeticSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cosmetic
     */
    omit?: CosmeticOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CosmeticInclude<ExtArgs> | null
    /**
     * Filter, which Cosmetic to fetch.
     */
    where: CosmeticWhereUniqueInput
  }

  /**
   * Cosmetic findFirst
   */
  export type CosmeticFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cosmetic
     */
    select?: CosmeticSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cosmetic
     */
    omit?: CosmeticOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CosmeticInclude<ExtArgs> | null
    /**
     * Filter, which Cosmetic to fetch.
     */
    where?: CosmeticWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Cosmetics to fetch.
     */
    orderBy?: CosmeticOrderByWithRelationInput | CosmeticOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Cosmetics.
     */
    cursor?: CosmeticWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Cosmetics from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Cosmetics.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Cosmetics.
     */
    distinct?: CosmeticScalarFieldEnum | CosmeticScalarFieldEnum[]
  }

  /**
   * Cosmetic findFirstOrThrow
   */
  export type CosmeticFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cosmetic
     */
    select?: CosmeticSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cosmetic
     */
    omit?: CosmeticOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CosmeticInclude<ExtArgs> | null
    /**
     * Filter, which Cosmetic to fetch.
     */
    where?: CosmeticWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Cosmetics to fetch.
     */
    orderBy?: CosmeticOrderByWithRelationInput | CosmeticOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Cosmetics.
     */
    cursor?: CosmeticWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Cosmetics from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Cosmetics.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Cosmetics.
     */
    distinct?: CosmeticScalarFieldEnum | CosmeticScalarFieldEnum[]
  }

  /**
   * Cosmetic findMany
   */
  export type CosmeticFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cosmetic
     */
    select?: CosmeticSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cosmetic
     */
    omit?: CosmeticOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CosmeticInclude<ExtArgs> | null
    /**
     * Filter, which Cosmetics to fetch.
     */
    where?: CosmeticWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Cosmetics to fetch.
     */
    orderBy?: CosmeticOrderByWithRelationInput | CosmeticOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Cosmetics.
     */
    cursor?: CosmeticWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Cosmetics from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Cosmetics.
     */
    skip?: number
    distinct?: CosmeticScalarFieldEnum | CosmeticScalarFieldEnum[]
  }

  /**
   * Cosmetic create
   */
  export type CosmeticCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cosmetic
     */
    select?: CosmeticSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cosmetic
     */
    omit?: CosmeticOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CosmeticInclude<ExtArgs> | null
    /**
     * The data needed to create a Cosmetic.
     */
    data: XOR<CosmeticCreateInput, CosmeticUncheckedCreateInput>
  }

  /**
   * Cosmetic createMany
   */
  export type CosmeticCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Cosmetics.
     */
    data: CosmeticCreateManyInput | CosmeticCreateManyInput[]
  }

  /**
   * Cosmetic createManyAndReturn
   */
  export type CosmeticCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cosmetic
     */
    select?: CosmeticSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Cosmetic
     */
    omit?: CosmeticOmit<ExtArgs> | null
    /**
     * The data used to create many Cosmetics.
     */
    data: CosmeticCreateManyInput | CosmeticCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CosmeticIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Cosmetic update
   */
  export type CosmeticUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cosmetic
     */
    select?: CosmeticSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cosmetic
     */
    omit?: CosmeticOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CosmeticInclude<ExtArgs> | null
    /**
     * The data needed to update a Cosmetic.
     */
    data: XOR<CosmeticUpdateInput, CosmeticUncheckedUpdateInput>
    /**
     * Choose, which Cosmetic to update.
     */
    where: CosmeticWhereUniqueInput
  }

  /**
   * Cosmetic updateMany
   */
  export type CosmeticUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Cosmetics.
     */
    data: XOR<CosmeticUpdateManyMutationInput, CosmeticUncheckedUpdateManyInput>
    /**
     * Filter which Cosmetics to update
     */
    where?: CosmeticWhereInput
    /**
     * Limit how many Cosmetics to update.
     */
    limit?: number
  }

  /**
   * Cosmetic updateManyAndReturn
   */
  export type CosmeticUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cosmetic
     */
    select?: CosmeticSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Cosmetic
     */
    omit?: CosmeticOmit<ExtArgs> | null
    /**
     * The data used to update Cosmetics.
     */
    data: XOR<CosmeticUpdateManyMutationInput, CosmeticUncheckedUpdateManyInput>
    /**
     * Filter which Cosmetics to update
     */
    where?: CosmeticWhereInput
    /**
     * Limit how many Cosmetics to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CosmeticIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Cosmetic upsert
   */
  export type CosmeticUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cosmetic
     */
    select?: CosmeticSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cosmetic
     */
    omit?: CosmeticOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CosmeticInclude<ExtArgs> | null
    /**
     * The filter to search for the Cosmetic to update in case it exists.
     */
    where: CosmeticWhereUniqueInput
    /**
     * In case the Cosmetic found by the `where` argument doesn't exist, create a new Cosmetic with this data.
     */
    create: XOR<CosmeticCreateInput, CosmeticUncheckedCreateInput>
    /**
     * In case the Cosmetic was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CosmeticUpdateInput, CosmeticUncheckedUpdateInput>
  }

  /**
   * Cosmetic delete
   */
  export type CosmeticDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cosmetic
     */
    select?: CosmeticSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cosmetic
     */
    omit?: CosmeticOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CosmeticInclude<ExtArgs> | null
    /**
     * Filter which Cosmetic to delete.
     */
    where: CosmeticWhereUniqueInput
  }

  /**
   * Cosmetic deleteMany
   */
  export type CosmeticDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Cosmetics to delete
     */
    where?: CosmeticWhereInput
    /**
     * Limit how many Cosmetics to delete.
     */
    limit?: number
  }

  /**
   * Cosmetic without action
   */
  export type CosmeticDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cosmetic
     */
    select?: CosmeticSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cosmetic
     */
    omit?: CosmeticOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CosmeticInclude<ExtArgs> | null
  }


  /**
   * Model Link
   */

  export type AggregateLink = {
    _count: LinkCountAggregateOutputType | null
    _avg: LinkAvgAggregateOutputType | null
    _sum: LinkSumAggregateOutputType | null
    _min: LinkMinAggregateOutputType | null
    _max: LinkMaxAggregateOutputType | null
  }

  export type LinkAvgAggregateOutputType = {
    id: number | null
  }

  export type LinkSumAggregateOutputType = {
    id: number | null
  }

  export type LinkMinAggregateOutputType = {
    id: number | null
    icon: string | null
    url: string | null
    text: string | null
    name: string | null
    description: string | null
    showDescriptionOnHover: boolean | null
    showDescription: boolean | null
    userId: string | null
  }

  export type LinkMaxAggregateOutputType = {
    id: number | null
    icon: string | null
    url: string | null
    text: string | null
    name: string | null
    description: string | null
    showDescriptionOnHover: boolean | null
    showDescription: boolean | null
    userId: string | null
  }

  export type LinkCountAggregateOutputType = {
    id: number
    icon: number
    url: number
    text: number
    name: number
    description: number
    showDescriptionOnHover: number
    showDescription: number
    userId: number
    _all: number
  }


  export type LinkAvgAggregateInputType = {
    id?: true
  }

  export type LinkSumAggregateInputType = {
    id?: true
  }

  export type LinkMinAggregateInputType = {
    id?: true
    icon?: true
    url?: true
    text?: true
    name?: true
    description?: true
    showDescriptionOnHover?: true
    showDescription?: true
    userId?: true
  }

  export type LinkMaxAggregateInputType = {
    id?: true
    icon?: true
    url?: true
    text?: true
    name?: true
    description?: true
    showDescriptionOnHover?: true
    showDescription?: true
    userId?: true
  }

  export type LinkCountAggregateInputType = {
    id?: true
    icon?: true
    url?: true
    text?: true
    name?: true
    description?: true
    showDescriptionOnHover?: true
    showDescription?: true
    userId?: true
    _all?: true
  }

  export type LinkAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Link to aggregate.
     */
    where?: LinkWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Links to fetch.
     */
    orderBy?: LinkOrderByWithRelationInput | LinkOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LinkWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Links from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Links.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Links
    **/
    _count?: true | LinkCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: LinkAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: LinkSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LinkMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LinkMaxAggregateInputType
  }

  export type GetLinkAggregateType<T extends LinkAggregateArgs> = {
        [P in keyof T & keyof AggregateLink]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLink[P]>
      : GetScalarType<T[P], AggregateLink[P]>
  }




  export type LinkGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LinkWhereInput
    orderBy?: LinkOrderByWithAggregationInput | LinkOrderByWithAggregationInput[]
    by: LinkScalarFieldEnum[] | LinkScalarFieldEnum
    having?: LinkScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LinkCountAggregateInputType | true
    _avg?: LinkAvgAggregateInputType
    _sum?: LinkSumAggregateInputType
    _min?: LinkMinAggregateInputType
    _max?: LinkMaxAggregateInputType
  }

  export type LinkGroupByOutputType = {
    id: number
    icon: string | null
    url: string
    text: string | null
    name: string | null
    description: string | null
    showDescriptionOnHover: boolean | null
    showDescription: boolean | null
    userId: string
    _count: LinkCountAggregateOutputType | null
    _avg: LinkAvgAggregateOutputType | null
    _sum: LinkSumAggregateOutputType | null
    _min: LinkMinAggregateOutputType | null
    _max: LinkMaxAggregateOutputType | null
  }

  type GetLinkGroupByPayload<T extends LinkGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LinkGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LinkGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LinkGroupByOutputType[P]>
            : GetScalarType<T[P], LinkGroupByOutputType[P]>
        }
      >
    >


  export type LinkSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    icon?: boolean
    url?: boolean
    text?: boolean
    name?: boolean
    description?: boolean
    showDescriptionOnHover?: boolean
    showDescription?: boolean
    userId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["link"]>

  export type LinkSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    icon?: boolean
    url?: boolean
    text?: boolean
    name?: boolean
    description?: boolean
    showDescriptionOnHover?: boolean
    showDescription?: boolean
    userId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["link"]>

  export type LinkSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    icon?: boolean
    url?: boolean
    text?: boolean
    name?: boolean
    description?: boolean
    showDescriptionOnHover?: boolean
    showDescription?: boolean
    userId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["link"]>

  export type LinkSelectScalar = {
    id?: boolean
    icon?: boolean
    url?: boolean
    text?: boolean
    name?: boolean
    description?: boolean
    showDescriptionOnHover?: boolean
    showDescription?: boolean
    userId?: boolean
  }

  export type LinkOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "icon" | "url" | "text" | "name" | "description" | "showDescriptionOnHover" | "showDescription" | "userId", ExtArgs["result"]["link"]>
  export type LinkInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type LinkIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type LinkIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $LinkPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Link"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      icon: string | null
      url: string
      text: string | null
      name: string | null
      description: string | null
      showDescriptionOnHover: boolean | null
      showDescription: boolean | null
      userId: string
    }, ExtArgs["result"]["link"]>
    composites: {}
  }

  type LinkGetPayload<S extends boolean | null | undefined | LinkDefaultArgs> = $Result.GetResult<Prisma.$LinkPayload, S>

  type LinkCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<LinkFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: LinkCountAggregateInputType | true
    }

  export interface LinkDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Link'], meta: { name: 'Link' } }
    /**
     * Find zero or one Link that matches the filter.
     * @param {LinkFindUniqueArgs} args - Arguments to find a Link
     * @example
     * // Get one Link
     * const link = await prisma.link.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LinkFindUniqueArgs>(args: SelectSubset<T, LinkFindUniqueArgs<ExtArgs>>): Prisma__LinkClient<$Result.GetResult<Prisma.$LinkPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Link that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {LinkFindUniqueOrThrowArgs} args - Arguments to find a Link
     * @example
     * // Get one Link
     * const link = await prisma.link.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LinkFindUniqueOrThrowArgs>(args: SelectSubset<T, LinkFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LinkClient<$Result.GetResult<Prisma.$LinkPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Link that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LinkFindFirstArgs} args - Arguments to find a Link
     * @example
     * // Get one Link
     * const link = await prisma.link.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LinkFindFirstArgs>(args?: SelectSubset<T, LinkFindFirstArgs<ExtArgs>>): Prisma__LinkClient<$Result.GetResult<Prisma.$LinkPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Link that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LinkFindFirstOrThrowArgs} args - Arguments to find a Link
     * @example
     * // Get one Link
     * const link = await prisma.link.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LinkFindFirstOrThrowArgs>(args?: SelectSubset<T, LinkFindFirstOrThrowArgs<ExtArgs>>): Prisma__LinkClient<$Result.GetResult<Prisma.$LinkPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Links that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LinkFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Links
     * const links = await prisma.link.findMany()
     * 
     * // Get first 10 Links
     * const links = await prisma.link.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const linkWithIdOnly = await prisma.link.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LinkFindManyArgs>(args?: SelectSubset<T, LinkFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LinkPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Link.
     * @param {LinkCreateArgs} args - Arguments to create a Link.
     * @example
     * // Create one Link
     * const Link = await prisma.link.create({
     *   data: {
     *     // ... data to create a Link
     *   }
     * })
     * 
     */
    create<T extends LinkCreateArgs>(args: SelectSubset<T, LinkCreateArgs<ExtArgs>>): Prisma__LinkClient<$Result.GetResult<Prisma.$LinkPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Links.
     * @param {LinkCreateManyArgs} args - Arguments to create many Links.
     * @example
     * // Create many Links
     * const link = await prisma.link.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LinkCreateManyArgs>(args?: SelectSubset<T, LinkCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Links and returns the data saved in the database.
     * @param {LinkCreateManyAndReturnArgs} args - Arguments to create many Links.
     * @example
     * // Create many Links
     * const link = await prisma.link.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Links and only return the `id`
     * const linkWithIdOnly = await prisma.link.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LinkCreateManyAndReturnArgs>(args?: SelectSubset<T, LinkCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LinkPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Link.
     * @param {LinkDeleteArgs} args - Arguments to delete one Link.
     * @example
     * // Delete one Link
     * const Link = await prisma.link.delete({
     *   where: {
     *     // ... filter to delete one Link
     *   }
     * })
     * 
     */
    delete<T extends LinkDeleteArgs>(args: SelectSubset<T, LinkDeleteArgs<ExtArgs>>): Prisma__LinkClient<$Result.GetResult<Prisma.$LinkPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Link.
     * @param {LinkUpdateArgs} args - Arguments to update one Link.
     * @example
     * // Update one Link
     * const link = await prisma.link.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LinkUpdateArgs>(args: SelectSubset<T, LinkUpdateArgs<ExtArgs>>): Prisma__LinkClient<$Result.GetResult<Prisma.$LinkPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Links.
     * @param {LinkDeleteManyArgs} args - Arguments to filter Links to delete.
     * @example
     * // Delete a few Links
     * const { count } = await prisma.link.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LinkDeleteManyArgs>(args?: SelectSubset<T, LinkDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Links.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LinkUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Links
     * const link = await prisma.link.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LinkUpdateManyArgs>(args: SelectSubset<T, LinkUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Links and returns the data updated in the database.
     * @param {LinkUpdateManyAndReturnArgs} args - Arguments to update many Links.
     * @example
     * // Update many Links
     * const link = await prisma.link.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Links and only return the `id`
     * const linkWithIdOnly = await prisma.link.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends LinkUpdateManyAndReturnArgs>(args: SelectSubset<T, LinkUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LinkPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Link.
     * @param {LinkUpsertArgs} args - Arguments to update or create a Link.
     * @example
     * // Update or create a Link
     * const link = await prisma.link.upsert({
     *   create: {
     *     // ... data to create a Link
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Link we want to update
     *   }
     * })
     */
    upsert<T extends LinkUpsertArgs>(args: SelectSubset<T, LinkUpsertArgs<ExtArgs>>): Prisma__LinkClient<$Result.GetResult<Prisma.$LinkPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Links.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LinkCountArgs} args - Arguments to filter Links to count.
     * @example
     * // Count the number of Links
     * const count = await prisma.link.count({
     *   where: {
     *     // ... the filter for the Links we want to count
     *   }
     * })
    **/
    count<T extends LinkCountArgs>(
      args?: Subset<T, LinkCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LinkCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Link.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LinkAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends LinkAggregateArgs>(args: Subset<T, LinkAggregateArgs>): Prisma.PrismaPromise<GetLinkAggregateType<T>>

    /**
     * Group by Link.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LinkGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends LinkGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LinkGroupByArgs['orderBy'] }
        : { orderBy?: LinkGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, LinkGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLinkGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Link model
   */
  readonly fields: LinkFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Link.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LinkClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Link model
   */
  interface LinkFieldRefs {
    readonly id: FieldRef<"Link", 'Int'>
    readonly icon: FieldRef<"Link", 'String'>
    readonly url: FieldRef<"Link", 'String'>
    readonly text: FieldRef<"Link", 'String'>
    readonly name: FieldRef<"Link", 'String'>
    readonly description: FieldRef<"Link", 'String'>
    readonly showDescriptionOnHover: FieldRef<"Link", 'Boolean'>
    readonly showDescription: FieldRef<"Link", 'Boolean'>
    readonly userId: FieldRef<"Link", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Link findUnique
   */
  export type LinkFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Link
     */
    select?: LinkSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Link
     */
    omit?: LinkOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LinkInclude<ExtArgs> | null
    /**
     * Filter, which Link to fetch.
     */
    where: LinkWhereUniqueInput
  }

  /**
   * Link findUniqueOrThrow
   */
  export type LinkFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Link
     */
    select?: LinkSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Link
     */
    omit?: LinkOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LinkInclude<ExtArgs> | null
    /**
     * Filter, which Link to fetch.
     */
    where: LinkWhereUniqueInput
  }

  /**
   * Link findFirst
   */
  export type LinkFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Link
     */
    select?: LinkSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Link
     */
    omit?: LinkOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LinkInclude<ExtArgs> | null
    /**
     * Filter, which Link to fetch.
     */
    where?: LinkWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Links to fetch.
     */
    orderBy?: LinkOrderByWithRelationInput | LinkOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Links.
     */
    cursor?: LinkWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Links from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Links.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Links.
     */
    distinct?: LinkScalarFieldEnum | LinkScalarFieldEnum[]
  }

  /**
   * Link findFirstOrThrow
   */
  export type LinkFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Link
     */
    select?: LinkSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Link
     */
    omit?: LinkOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LinkInclude<ExtArgs> | null
    /**
     * Filter, which Link to fetch.
     */
    where?: LinkWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Links to fetch.
     */
    orderBy?: LinkOrderByWithRelationInput | LinkOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Links.
     */
    cursor?: LinkWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Links from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Links.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Links.
     */
    distinct?: LinkScalarFieldEnum | LinkScalarFieldEnum[]
  }

  /**
   * Link findMany
   */
  export type LinkFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Link
     */
    select?: LinkSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Link
     */
    omit?: LinkOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LinkInclude<ExtArgs> | null
    /**
     * Filter, which Links to fetch.
     */
    where?: LinkWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Links to fetch.
     */
    orderBy?: LinkOrderByWithRelationInput | LinkOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Links.
     */
    cursor?: LinkWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Links from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Links.
     */
    skip?: number
    distinct?: LinkScalarFieldEnum | LinkScalarFieldEnum[]
  }

  /**
   * Link create
   */
  export type LinkCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Link
     */
    select?: LinkSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Link
     */
    omit?: LinkOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LinkInclude<ExtArgs> | null
    /**
     * The data needed to create a Link.
     */
    data: XOR<LinkCreateInput, LinkUncheckedCreateInput>
  }

  /**
   * Link createMany
   */
  export type LinkCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Links.
     */
    data: LinkCreateManyInput | LinkCreateManyInput[]
  }

  /**
   * Link createManyAndReturn
   */
  export type LinkCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Link
     */
    select?: LinkSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Link
     */
    omit?: LinkOmit<ExtArgs> | null
    /**
     * The data used to create many Links.
     */
    data: LinkCreateManyInput | LinkCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LinkIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Link update
   */
  export type LinkUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Link
     */
    select?: LinkSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Link
     */
    omit?: LinkOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LinkInclude<ExtArgs> | null
    /**
     * The data needed to update a Link.
     */
    data: XOR<LinkUpdateInput, LinkUncheckedUpdateInput>
    /**
     * Choose, which Link to update.
     */
    where: LinkWhereUniqueInput
  }

  /**
   * Link updateMany
   */
  export type LinkUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Links.
     */
    data: XOR<LinkUpdateManyMutationInput, LinkUncheckedUpdateManyInput>
    /**
     * Filter which Links to update
     */
    where?: LinkWhereInput
    /**
     * Limit how many Links to update.
     */
    limit?: number
  }

  /**
   * Link updateManyAndReturn
   */
  export type LinkUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Link
     */
    select?: LinkSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Link
     */
    omit?: LinkOmit<ExtArgs> | null
    /**
     * The data used to update Links.
     */
    data: XOR<LinkUpdateManyMutationInput, LinkUncheckedUpdateManyInput>
    /**
     * Filter which Links to update
     */
    where?: LinkWhereInput
    /**
     * Limit how many Links to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LinkIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Link upsert
   */
  export type LinkUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Link
     */
    select?: LinkSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Link
     */
    omit?: LinkOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LinkInclude<ExtArgs> | null
    /**
     * The filter to search for the Link to update in case it exists.
     */
    where: LinkWhereUniqueInput
    /**
     * In case the Link found by the `where` argument doesn't exist, create a new Link with this data.
     */
    create: XOR<LinkCreateInput, LinkUncheckedCreateInput>
    /**
     * In case the Link was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LinkUpdateInput, LinkUncheckedUpdateInput>
  }

  /**
   * Link delete
   */
  export type LinkDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Link
     */
    select?: LinkSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Link
     */
    omit?: LinkOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LinkInclude<ExtArgs> | null
    /**
     * Filter which Link to delete.
     */
    where: LinkWhereUniqueInput
  }

  /**
   * Link deleteMany
   */
  export type LinkDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Links to delete
     */
    where?: LinkWhereInput
    /**
     * Limit how many Links to delete.
     */
    limit?: number
  }

  /**
   * Link without action
   */
  export type LinkDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Link
     */
    select?: LinkSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Link
     */
    omit?: LinkOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LinkInclude<ExtArgs> | null
  }


  /**
   * Model Label
   */

  export type AggregateLabel = {
    _count: LabelCountAggregateOutputType | null
    _avg: LabelAvgAggregateOutputType | null
    _sum: LabelSumAggregateOutputType | null
    _min: LabelMinAggregateOutputType | null
    _max: LabelMaxAggregateOutputType | null
  }

  export type LabelAvgAggregateOutputType = {
    id: number | null
  }

  export type LabelSumAggregateOutputType = {
    id: number | null
  }

  export type LabelMinAggregateOutputType = {
    id: number | null
    data: string | null
    color: string | null
    fontColor: string | null
    userId: string | null
  }

  export type LabelMaxAggregateOutputType = {
    id: number | null
    data: string | null
    color: string | null
    fontColor: string | null
    userId: string | null
  }

  export type LabelCountAggregateOutputType = {
    id: number
    data: number
    color: number
    fontColor: number
    userId: number
    _all: number
  }


  export type LabelAvgAggregateInputType = {
    id?: true
  }

  export type LabelSumAggregateInputType = {
    id?: true
  }

  export type LabelMinAggregateInputType = {
    id?: true
    data?: true
    color?: true
    fontColor?: true
    userId?: true
  }

  export type LabelMaxAggregateInputType = {
    id?: true
    data?: true
    color?: true
    fontColor?: true
    userId?: true
  }

  export type LabelCountAggregateInputType = {
    id?: true
    data?: true
    color?: true
    fontColor?: true
    userId?: true
    _all?: true
  }

  export type LabelAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Label to aggregate.
     */
    where?: LabelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Labels to fetch.
     */
    orderBy?: LabelOrderByWithRelationInput | LabelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LabelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Labels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Labels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Labels
    **/
    _count?: true | LabelCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: LabelAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: LabelSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LabelMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LabelMaxAggregateInputType
  }

  export type GetLabelAggregateType<T extends LabelAggregateArgs> = {
        [P in keyof T & keyof AggregateLabel]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLabel[P]>
      : GetScalarType<T[P], AggregateLabel[P]>
  }




  export type LabelGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LabelWhereInput
    orderBy?: LabelOrderByWithAggregationInput | LabelOrderByWithAggregationInput[]
    by: LabelScalarFieldEnum[] | LabelScalarFieldEnum
    having?: LabelScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LabelCountAggregateInputType | true
    _avg?: LabelAvgAggregateInputType
    _sum?: LabelSumAggregateInputType
    _min?: LabelMinAggregateInputType
    _max?: LabelMaxAggregateInputType
  }

  export type LabelGroupByOutputType = {
    id: number
    data: string
    color: string
    fontColor: string
    userId: string
    _count: LabelCountAggregateOutputType | null
    _avg: LabelAvgAggregateOutputType | null
    _sum: LabelSumAggregateOutputType | null
    _min: LabelMinAggregateOutputType | null
    _max: LabelMaxAggregateOutputType | null
  }

  type GetLabelGroupByPayload<T extends LabelGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LabelGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LabelGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LabelGroupByOutputType[P]>
            : GetScalarType<T[P], LabelGroupByOutputType[P]>
        }
      >
    >


  export type LabelSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    data?: boolean
    color?: boolean
    fontColor?: boolean
    userId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["label"]>

  export type LabelSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    data?: boolean
    color?: boolean
    fontColor?: boolean
    userId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["label"]>

  export type LabelSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    data?: boolean
    color?: boolean
    fontColor?: boolean
    userId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["label"]>

  export type LabelSelectScalar = {
    id?: boolean
    data?: boolean
    color?: boolean
    fontColor?: boolean
    userId?: boolean
  }

  export type LabelOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "data" | "color" | "fontColor" | "userId", ExtArgs["result"]["label"]>
  export type LabelInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type LabelIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type LabelIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $LabelPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Label"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      data: string
      color: string
      fontColor: string
      userId: string
    }, ExtArgs["result"]["label"]>
    composites: {}
  }

  type LabelGetPayload<S extends boolean | null | undefined | LabelDefaultArgs> = $Result.GetResult<Prisma.$LabelPayload, S>

  type LabelCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<LabelFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: LabelCountAggregateInputType | true
    }

  export interface LabelDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Label'], meta: { name: 'Label' } }
    /**
     * Find zero or one Label that matches the filter.
     * @param {LabelFindUniqueArgs} args - Arguments to find a Label
     * @example
     * // Get one Label
     * const label = await prisma.label.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LabelFindUniqueArgs>(args: SelectSubset<T, LabelFindUniqueArgs<ExtArgs>>): Prisma__LabelClient<$Result.GetResult<Prisma.$LabelPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Label that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {LabelFindUniqueOrThrowArgs} args - Arguments to find a Label
     * @example
     * // Get one Label
     * const label = await prisma.label.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LabelFindUniqueOrThrowArgs>(args: SelectSubset<T, LabelFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LabelClient<$Result.GetResult<Prisma.$LabelPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Label that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LabelFindFirstArgs} args - Arguments to find a Label
     * @example
     * // Get one Label
     * const label = await prisma.label.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LabelFindFirstArgs>(args?: SelectSubset<T, LabelFindFirstArgs<ExtArgs>>): Prisma__LabelClient<$Result.GetResult<Prisma.$LabelPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Label that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LabelFindFirstOrThrowArgs} args - Arguments to find a Label
     * @example
     * // Get one Label
     * const label = await prisma.label.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LabelFindFirstOrThrowArgs>(args?: SelectSubset<T, LabelFindFirstOrThrowArgs<ExtArgs>>): Prisma__LabelClient<$Result.GetResult<Prisma.$LabelPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Labels that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LabelFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Labels
     * const labels = await prisma.label.findMany()
     * 
     * // Get first 10 Labels
     * const labels = await prisma.label.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const labelWithIdOnly = await prisma.label.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LabelFindManyArgs>(args?: SelectSubset<T, LabelFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LabelPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Label.
     * @param {LabelCreateArgs} args - Arguments to create a Label.
     * @example
     * // Create one Label
     * const Label = await prisma.label.create({
     *   data: {
     *     // ... data to create a Label
     *   }
     * })
     * 
     */
    create<T extends LabelCreateArgs>(args: SelectSubset<T, LabelCreateArgs<ExtArgs>>): Prisma__LabelClient<$Result.GetResult<Prisma.$LabelPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Labels.
     * @param {LabelCreateManyArgs} args - Arguments to create many Labels.
     * @example
     * // Create many Labels
     * const label = await prisma.label.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LabelCreateManyArgs>(args?: SelectSubset<T, LabelCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Labels and returns the data saved in the database.
     * @param {LabelCreateManyAndReturnArgs} args - Arguments to create many Labels.
     * @example
     * // Create many Labels
     * const label = await prisma.label.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Labels and only return the `id`
     * const labelWithIdOnly = await prisma.label.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LabelCreateManyAndReturnArgs>(args?: SelectSubset<T, LabelCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LabelPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Label.
     * @param {LabelDeleteArgs} args - Arguments to delete one Label.
     * @example
     * // Delete one Label
     * const Label = await prisma.label.delete({
     *   where: {
     *     // ... filter to delete one Label
     *   }
     * })
     * 
     */
    delete<T extends LabelDeleteArgs>(args: SelectSubset<T, LabelDeleteArgs<ExtArgs>>): Prisma__LabelClient<$Result.GetResult<Prisma.$LabelPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Label.
     * @param {LabelUpdateArgs} args - Arguments to update one Label.
     * @example
     * // Update one Label
     * const label = await prisma.label.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LabelUpdateArgs>(args: SelectSubset<T, LabelUpdateArgs<ExtArgs>>): Prisma__LabelClient<$Result.GetResult<Prisma.$LabelPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Labels.
     * @param {LabelDeleteManyArgs} args - Arguments to filter Labels to delete.
     * @example
     * // Delete a few Labels
     * const { count } = await prisma.label.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LabelDeleteManyArgs>(args?: SelectSubset<T, LabelDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Labels.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LabelUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Labels
     * const label = await prisma.label.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LabelUpdateManyArgs>(args: SelectSubset<T, LabelUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Labels and returns the data updated in the database.
     * @param {LabelUpdateManyAndReturnArgs} args - Arguments to update many Labels.
     * @example
     * // Update many Labels
     * const label = await prisma.label.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Labels and only return the `id`
     * const labelWithIdOnly = await prisma.label.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends LabelUpdateManyAndReturnArgs>(args: SelectSubset<T, LabelUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LabelPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Label.
     * @param {LabelUpsertArgs} args - Arguments to update or create a Label.
     * @example
     * // Update or create a Label
     * const label = await prisma.label.upsert({
     *   create: {
     *     // ... data to create a Label
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Label we want to update
     *   }
     * })
     */
    upsert<T extends LabelUpsertArgs>(args: SelectSubset<T, LabelUpsertArgs<ExtArgs>>): Prisma__LabelClient<$Result.GetResult<Prisma.$LabelPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Labels.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LabelCountArgs} args - Arguments to filter Labels to count.
     * @example
     * // Count the number of Labels
     * const count = await prisma.label.count({
     *   where: {
     *     // ... the filter for the Labels we want to count
     *   }
     * })
    **/
    count<T extends LabelCountArgs>(
      args?: Subset<T, LabelCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LabelCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Label.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LabelAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends LabelAggregateArgs>(args: Subset<T, LabelAggregateArgs>): Prisma.PrismaPromise<GetLabelAggregateType<T>>

    /**
     * Group by Label.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LabelGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends LabelGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LabelGroupByArgs['orderBy'] }
        : { orderBy?: LabelGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, LabelGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLabelGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Label model
   */
  readonly fields: LabelFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Label.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LabelClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Label model
   */
  interface LabelFieldRefs {
    readonly id: FieldRef<"Label", 'Int'>
    readonly data: FieldRef<"Label", 'String'>
    readonly color: FieldRef<"Label", 'String'>
    readonly fontColor: FieldRef<"Label", 'String'>
    readonly userId: FieldRef<"Label", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Label findUnique
   */
  export type LabelFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Label
     */
    select?: LabelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Label
     */
    omit?: LabelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LabelInclude<ExtArgs> | null
    /**
     * Filter, which Label to fetch.
     */
    where: LabelWhereUniqueInput
  }

  /**
   * Label findUniqueOrThrow
   */
  export type LabelFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Label
     */
    select?: LabelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Label
     */
    omit?: LabelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LabelInclude<ExtArgs> | null
    /**
     * Filter, which Label to fetch.
     */
    where: LabelWhereUniqueInput
  }

  /**
   * Label findFirst
   */
  export type LabelFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Label
     */
    select?: LabelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Label
     */
    omit?: LabelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LabelInclude<ExtArgs> | null
    /**
     * Filter, which Label to fetch.
     */
    where?: LabelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Labels to fetch.
     */
    orderBy?: LabelOrderByWithRelationInput | LabelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Labels.
     */
    cursor?: LabelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Labels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Labels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Labels.
     */
    distinct?: LabelScalarFieldEnum | LabelScalarFieldEnum[]
  }

  /**
   * Label findFirstOrThrow
   */
  export type LabelFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Label
     */
    select?: LabelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Label
     */
    omit?: LabelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LabelInclude<ExtArgs> | null
    /**
     * Filter, which Label to fetch.
     */
    where?: LabelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Labels to fetch.
     */
    orderBy?: LabelOrderByWithRelationInput | LabelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Labels.
     */
    cursor?: LabelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Labels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Labels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Labels.
     */
    distinct?: LabelScalarFieldEnum | LabelScalarFieldEnum[]
  }

  /**
   * Label findMany
   */
  export type LabelFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Label
     */
    select?: LabelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Label
     */
    omit?: LabelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LabelInclude<ExtArgs> | null
    /**
     * Filter, which Labels to fetch.
     */
    where?: LabelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Labels to fetch.
     */
    orderBy?: LabelOrderByWithRelationInput | LabelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Labels.
     */
    cursor?: LabelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Labels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Labels.
     */
    skip?: number
    distinct?: LabelScalarFieldEnum | LabelScalarFieldEnum[]
  }

  /**
   * Label create
   */
  export type LabelCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Label
     */
    select?: LabelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Label
     */
    omit?: LabelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LabelInclude<ExtArgs> | null
    /**
     * The data needed to create a Label.
     */
    data: XOR<LabelCreateInput, LabelUncheckedCreateInput>
  }

  /**
   * Label createMany
   */
  export type LabelCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Labels.
     */
    data: LabelCreateManyInput | LabelCreateManyInput[]
  }

  /**
   * Label createManyAndReturn
   */
  export type LabelCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Label
     */
    select?: LabelSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Label
     */
    omit?: LabelOmit<ExtArgs> | null
    /**
     * The data used to create many Labels.
     */
    data: LabelCreateManyInput | LabelCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LabelIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Label update
   */
  export type LabelUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Label
     */
    select?: LabelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Label
     */
    omit?: LabelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LabelInclude<ExtArgs> | null
    /**
     * The data needed to update a Label.
     */
    data: XOR<LabelUpdateInput, LabelUncheckedUpdateInput>
    /**
     * Choose, which Label to update.
     */
    where: LabelWhereUniqueInput
  }

  /**
   * Label updateMany
   */
  export type LabelUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Labels.
     */
    data: XOR<LabelUpdateManyMutationInput, LabelUncheckedUpdateManyInput>
    /**
     * Filter which Labels to update
     */
    where?: LabelWhereInput
    /**
     * Limit how many Labels to update.
     */
    limit?: number
  }

  /**
   * Label updateManyAndReturn
   */
  export type LabelUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Label
     */
    select?: LabelSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Label
     */
    omit?: LabelOmit<ExtArgs> | null
    /**
     * The data used to update Labels.
     */
    data: XOR<LabelUpdateManyMutationInput, LabelUncheckedUpdateManyInput>
    /**
     * Filter which Labels to update
     */
    where?: LabelWhereInput
    /**
     * Limit how many Labels to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LabelIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Label upsert
   */
  export type LabelUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Label
     */
    select?: LabelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Label
     */
    omit?: LabelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LabelInclude<ExtArgs> | null
    /**
     * The filter to search for the Label to update in case it exists.
     */
    where: LabelWhereUniqueInput
    /**
     * In case the Label found by the `where` argument doesn't exist, create a new Label with this data.
     */
    create: XOR<LabelCreateInput, LabelUncheckedCreateInput>
    /**
     * In case the Label was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LabelUpdateInput, LabelUncheckedUpdateInput>
  }

  /**
   * Label delete
   */
  export type LabelDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Label
     */
    select?: LabelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Label
     */
    omit?: LabelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LabelInclude<ExtArgs> | null
    /**
     * Filter which Label to delete.
     */
    where: LabelWhereUniqueInput
  }

  /**
   * Label deleteMany
   */
  export type LabelDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Labels to delete
     */
    where?: LabelWhereInput
    /**
     * Limit how many Labels to delete.
     */
    limit?: number
  }

  /**
   * Label without action
   */
  export type LabelDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Label
     */
    select?: LabelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Label
     */
    omit?: LabelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LabelInclude<ExtArgs> | null
  }


  /**
   * Model SocialIcon
   */

  export type AggregateSocialIcon = {
    _count: SocialIconCountAggregateOutputType | null
    _avg: SocialIconAvgAggregateOutputType | null
    _sum: SocialIconSumAggregateOutputType | null
    _min: SocialIconMinAggregateOutputType | null
    _max: SocialIconMaxAggregateOutputType | null
  }

  export type SocialIconAvgAggregateOutputType = {
    id: number | null
  }

  export type SocialIconSumAggregateOutputType = {
    id: number | null
  }

  export type SocialIconMinAggregateOutputType = {
    id: number | null
    url: string | null
    icon: string | null
    userId: string | null
  }

  export type SocialIconMaxAggregateOutputType = {
    id: number | null
    url: string | null
    icon: string | null
    userId: string | null
  }

  export type SocialIconCountAggregateOutputType = {
    id: number
    url: number
    icon: number
    userId: number
    _all: number
  }


  export type SocialIconAvgAggregateInputType = {
    id?: true
  }

  export type SocialIconSumAggregateInputType = {
    id?: true
  }

  export type SocialIconMinAggregateInputType = {
    id?: true
    url?: true
    icon?: true
    userId?: true
  }

  export type SocialIconMaxAggregateInputType = {
    id?: true
    url?: true
    icon?: true
    userId?: true
  }

  export type SocialIconCountAggregateInputType = {
    id?: true
    url?: true
    icon?: true
    userId?: true
    _all?: true
  }

  export type SocialIconAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SocialIcon to aggregate.
     */
    where?: SocialIconWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SocialIcons to fetch.
     */
    orderBy?: SocialIconOrderByWithRelationInput | SocialIconOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SocialIconWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SocialIcons from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SocialIcons.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SocialIcons
    **/
    _count?: true | SocialIconCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SocialIconAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SocialIconSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SocialIconMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SocialIconMaxAggregateInputType
  }

  export type GetSocialIconAggregateType<T extends SocialIconAggregateArgs> = {
        [P in keyof T & keyof AggregateSocialIcon]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSocialIcon[P]>
      : GetScalarType<T[P], AggregateSocialIcon[P]>
  }




  export type SocialIconGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SocialIconWhereInput
    orderBy?: SocialIconOrderByWithAggregationInput | SocialIconOrderByWithAggregationInput[]
    by: SocialIconScalarFieldEnum[] | SocialIconScalarFieldEnum
    having?: SocialIconScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SocialIconCountAggregateInputType | true
    _avg?: SocialIconAvgAggregateInputType
    _sum?: SocialIconSumAggregateInputType
    _min?: SocialIconMinAggregateInputType
    _max?: SocialIconMaxAggregateInputType
  }

  export type SocialIconGroupByOutputType = {
    id: number
    url: string
    icon: string
    userId: string
    _count: SocialIconCountAggregateOutputType | null
    _avg: SocialIconAvgAggregateOutputType | null
    _sum: SocialIconSumAggregateOutputType | null
    _min: SocialIconMinAggregateOutputType | null
    _max: SocialIconMaxAggregateOutputType | null
  }

  type GetSocialIconGroupByPayload<T extends SocialIconGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SocialIconGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SocialIconGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SocialIconGroupByOutputType[P]>
            : GetScalarType<T[P], SocialIconGroupByOutputType[P]>
        }
      >
    >


  export type SocialIconSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    url?: boolean
    icon?: boolean
    userId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["socialIcon"]>

  export type SocialIconSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    url?: boolean
    icon?: boolean
    userId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["socialIcon"]>

  export type SocialIconSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    url?: boolean
    icon?: boolean
    userId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["socialIcon"]>

  export type SocialIconSelectScalar = {
    id?: boolean
    url?: boolean
    icon?: boolean
    userId?: boolean
  }

  export type SocialIconOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "url" | "icon" | "userId", ExtArgs["result"]["socialIcon"]>
  export type SocialIconInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type SocialIconIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type SocialIconIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $SocialIconPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SocialIcon"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      url: string
      icon: string
      userId: string
    }, ExtArgs["result"]["socialIcon"]>
    composites: {}
  }

  type SocialIconGetPayload<S extends boolean | null | undefined | SocialIconDefaultArgs> = $Result.GetResult<Prisma.$SocialIconPayload, S>

  type SocialIconCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SocialIconFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SocialIconCountAggregateInputType | true
    }

  export interface SocialIconDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SocialIcon'], meta: { name: 'SocialIcon' } }
    /**
     * Find zero or one SocialIcon that matches the filter.
     * @param {SocialIconFindUniqueArgs} args - Arguments to find a SocialIcon
     * @example
     * // Get one SocialIcon
     * const socialIcon = await prisma.socialIcon.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SocialIconFindUniqueArgs>(args: SelectSubset<T, SocialIconFindUniqueArgs<ExtArgs>>): Prisma__SocialIconClient<$Result.GetResult<Prisma.$SocialIconPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one SocialIcon that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SocialIconFindUniqueOrThrowArgs} args - Arguments to find a SocialIcon
     * @example
     * // Get one SocialIcon
     * const socialIcon = await prisma.socialIcon.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SocialIconFindUniqueOrThrowArgs>(args: SelectSubset<T, SocialIconFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SocialIconClient<$Result.GetResult<Prisma.$SocialIconPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SocialIcon that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SocialIconFindFirstArgs} args - Arguments to find a SocialIcon
     * @example
     * // Get one SocialIcon
     * const socialIcon = await prisma.socialIcon.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SocialIconFindFirstArgs>(args?: SelectSubset<T, SocialIconFindFirstArgs<ExtArgs>>): Prisma__SocialIconClient<$Result.GetResult<Prisma.$SocialIconPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SocialIcon that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SocialIconFindFirstOrThrowArgs} args - Arguments to find a SocialIcon
     * @example
     * // Get one SocialIcon
     * const socialIcon = await prisma.socialIcon.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SocialIconFindFirstOrThrowArgs>(args?: SelectSubset<T, SocialIconFindFirstOrThrowArgs<ExtArgs>>): Prisma__SocialIconClient<$Result.GetResult<Prisma.$SocialIconPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more SocialIcons that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SocialIconFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SocialIcons
     * const socialIcons = await prisma.socialIcon.findMany()
     * 
     * // Get first 10 SocialIcons
     * const socialIcons = await prisma.socialIcon.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const socialIconWithIdOnly = await prisma.socialIcon.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SocialIconFindManyArgs>(args?: SelectSubset<T, SocialIconFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SocialIconPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a SocialIcon.
     * @param {SocialIconCreateArgs} args - Arguments to create a SocialIcon.
     * @example
     * // Create one SocialIcon
     * const SocialIcon = await prisma.socialIcon.create({
     *   data: {
     *     // ... data to create a SocialIcon
     *   }
     * })
     * 
     */
    create<T extends SocialIconCreateArgs>(args: SelectSubset<T, SocialIconCreateArgs<ExtArgs>>): Prisma__SocialIconClient<$Result.GetResult<Prisma.$SocialIconPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many SocialIcons.
     * @param {SocialIconCreateManyArgs} args - Arguments to create many SocialIcons.
     * @example
     * // Create many SocialIcons
     * const socialIcon = await prisma.socialIcon.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SocialIconCreateManyArgs>(args?: SelectSubset<T, SocialIconCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SocialIcons and returns the data saved in the database.
     * @param {SocialIconCreateManyAndReturnArgs} args - Arguments to create many SocialIcons.
     * @example
     * // Create many SocialIcons
     * const socialIcon = await prisma.socialIcon.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SocialIcons and only return the `id`
     * const socialIconWithIdOnly = await prisma.socialIcon.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SocialIconCreateManyAndReturnArgs>(args?: SelectSubset<T, SocialIconCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SocialIconPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a SocialIcon.
     * @param {SocialIconDeleteArgs} args - Arguments to delete one SocialIcon.
     * @example
     * // Delete one SocialIcon
     * const SocialIcon = await prisma.socialIcon.delete({
     *   where: {
     *     // ... filter to delete one SocialIcon
     *   }
     * })
     * 
     */
    delete<T extends SocialIconDeleteArgs>(args: SelectSubset<T, SocialIconDeleteArgs<ExtArgs>>): Prisma__SocialIconClient<$Result.GetResult<Prisma.$SocialIconPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one SocialIcon.
     * @param {SocialIconUpdateArgs} args - Arguments to update one SocialIcon.
     * @example
     * // Update one SocialIcon
     * const socialIcon = await prisma.socialIcon.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SocialIconUpdateArgs>(args: SelectSubset<T, SocialIconUpdateArgs<ExtArgs>>): Prisma__SocialIconClient<$Result.GetResult<Prisma.$SocialIconPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more SocialIcons.
     * @param {SocialIconDeleteManyArgs} args - Arguments to filter SocialIcons to delete.
     * @example
     * // Delete a few SocialIcons
     * const { count } = await prisma.socialIcon.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SocialIconDeleteManyArgs>(args?: SelectSubset<T, SocialIconDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SocialIcons.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SocialIconUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SocialIcons
     * const socialIcon = await prisma.socialIcon.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SocialIconUpdateManyArgs>(args: SelectSubset<T, SocialIconUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SocialIcons and returns the data updated in the database.
     * @param {SocialIconUpdateManyAndReturnArgs} args - Arguments to update many SocialIcons.
     * @example
     * // Update many SocialIcons
     * const socialIcon = await prisma.socialIcon.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SocialIcons and only return the `id`
     * const socialIconWithIdOnly = await prisma.socialIcon.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SocialIconUpdateManyAndReturnArgs>(args: SelectSubset<T, SocialIconUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SocialIconPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one SocialIcon.
     * @param {SocialIconUpsertArgs} args - Arguments to update or create a SocialIcon.
     * @example
     * // Update or create a SocialIcon
     * const socialIcon = await prisma.socialIcon.upsert({
     *   create: {
     *     // ... data to create a SocialIcon
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SocialIcon we want to update
     *   }
     * })
     */
    upsert<T extends SocialIconUpsertArgs>(args: SelectSubset<T, SocialIconUpsertArgs<ExtArgs>>): Prisma__SocialIconClient<$Result.GetResult<Prisma.$SocialIconPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of SocialIcons.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SocialIconCountArgs} args - Arguments to filter SocialIcons to count.
     * @example
     * // Count the number of SocialIcons
     * const count = await prisma.socialIcon.count({
     *   where: {
     *     // ... the filter for the SocialIcons we want to count
     *   }
     * })
    **/
    count<T extends SocialIconCountArgs>(
      args?: Subset<T, SocialIconCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SocialIconCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SocialIcon.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SocialIconAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SocialIconAggregateArgs>(args: Subset<T, SocialIconAggregateArgs>): Prisma.PrismaPromise<GetSocialIconAggregateType<T>>

    /**
     * Group by SocialIcon.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SocialIconGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SocialIconGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SocialIconGroupByArgs['orderBy'] }
        : { orderBy?: SocialIconGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SocialIconGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSocialIconGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SocialIcon model
   */
  readonly fields: SocialIconFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SocialIcon.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SocialIconClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SocialIcon model
   */
  interface SocialIconFieldRefs {
    readonly id: FieldRef<"SocialIcon", 'Int'>
    readonly url: FieldRef<"SocialIcon", 'String'>
    readonly icon: FieldRef<"SocialIcon", 'String'>
    readonly userId: FieldRef<"SocialIcon", 'String'>
  }
    

  // Custom InputTypes
  /**
   * SocialIcon findUnique
   */
  export type SocialIconFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SocialIcon
     */
    select?: SocialIconSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SocialIcon
     */
    omit?: SocialIconOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SocialIconInclude<ExtArgs> | null
    /**
     * Filter, which SocialIcon to fetch.
     */
    where: SocialIconWhereUniqueInput
  }

  /**
   * SocialIcon findUniqueOrThrow
   */
  export type SocialIconFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SocialIcon
     */
    select?: SocialIconSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SocialIcon
     */
    omit?: SocialIconOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SocialIconInclude<ExtArgs> | null
    /**
     * Filter, which SocialIcon to fetch.
     */
    where: SocialIconWhereUniqueInput
  }

  /**
   * SocialIcon findFirst
   */
  export type SocialIconFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SocialIcon
     */
    select?: SocialIconSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SocialIcon
     */
    omit?: SocialIconOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SocialIconInclude<ExtArgs> | null
    /**
     * Filter, which SocialIcon to fetch.
     */
    where?: SocialIconWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SocialIcons to fetch.
     */
    orderBy?: SocialIconOrderByWithRelationInput | SocialIconOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SocialIcons.
     */
    cursor?: SocialIconWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SocialIcons from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SocialIcons.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SocialIcons.
     */
    distinct?: SocialIconScalarFieldEnum | SocialIconScalarFieldEnum[]
  }

  /**
   * SocialIcon findFirstOrThrow
   */
  export type SocialIconFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SocialIcon
     */
    select?: SocialIconSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SocialIcon
     */
    omit?: SocialIconOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SocialIconInclude<ExtArgs> | null
    /**
     * Filter, which SocialIcon to fetch.
     */
    where?: SocialIconWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SocialIcons to fetch.
     */
    orderBy?: SocialIconOrderByWithRelationInput | SocialIconOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SocialIcons.
     */
    cursor?: SocialIconWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SocialIcons from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SocialIcons.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SocialIcons.
     */
    distinct?: SocialIconScalarFieldEnum | SocialIconScalarFieldEnum[]
  }

  /**
   * SocialIcon findMany
   */
  export type SocialIconFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SocialIcon
     */
    select?: SocialIconSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SocialIcon
     */
    omit?: SocialIconOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SocialIconInclude<ExtArgs> | null
    /**
     * Filter, which SocialIcons to fetch.
     */
    where?: SocialIconWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SocialIcons to fetch.
     */
    orderBy?: SocialIconOrderByWithRelationInput | SocialIconOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SocialIcons.
     */
    cursor?: SocialIconWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SocialIcons from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SocialIcons.
     */
    skip?: number
    distinct?: SocialIconScalarFieldEnum | SocialIconScalarFieldEnum[]
  }

  /**
   * SocialIcon create
   */
  export type SocialIconCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SocialIcon
     */
    select?: SocialIconSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SocialIcon
     */
    omit?: SocialIconOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SocialIconInclude<ExtArgs> | null
    /**
     * The data needed to create a SocialIcon.
     */
    data: XOR<SocialIconCreateInput, SocialIconUncheckedCreateInput>
  }

  /**
   * SocialIcon createMany
   */
  export type SocialIconCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SocialIcons.
     */
    data: SocialIconCreateManyInput | SocialIconCreateManyInput[]
  }

  /**
   * SocialIcon createManyAndReturn
   */
  export type SocialIconCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SocialIcon
     */
    select?: SocialIconSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SocialIcon
     */
    omit?: SocialIconOmit<ExtArgs> | null
    /**
     * The data used to create many SocialIcons.
     */
    data: SocialIconCreateManyInput | SocialIconCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SocialIconIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * SocialIcon update
   */
  export type SocialIconUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SocialIcon
     */
    select?: SocialIconSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SocialIcon
     */
    omit?: SocialIconOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SocialIconInclude<ExtArgs> | null
    /**
     * The data needed to update a SocialIcon.
     */
    data: XOR<SocialIconUpdateInput, SocialIconUncheckedUpdateInput>
    /**
     * Choose, which SocialIcon to update.
     */
    where: SocialIconWhereUniqueInput
  }

  /**
   * SocialIcon updateMany
   */
  export type SocialIconUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SocialIcons.
     */
    data: XOR<SocialIconUpdateManyMutationInput, SocialIconUncheckedUpdateManyInput>
    /**
     * Filter which SocialIcons to update
     */
    where?: SocialIconWhereInput
    /**
     * Limit how many SocialIcons to update.
     */
    limit?: number
  }

  /**
   * SocialIcon updateManyAndReturn
   */
  export type SocialIconUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SocialIcon
     */
    select?: SocialIconSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SocialIcon
     */
    omit?: SocialIconOmit<ExtArgs> | null
    /**
     * The data used to update SocialIcons.
     */
    data: XOR<SocialIconUpdateManyMutationInput, SocialIconUncheckedUpdateManyInput>
    /**
     * Filter which SocialIcons to update
     */
    where?: SocialIconWhereInput
    /**
     * Limit how many SocialIcons to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SocialIconIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * SocialIcon upsert
   */
  export type SocialIconUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SocialIcon
     */
    select?: SocialIconSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SocialIcon
     */
    omit?: SocialIconOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SocialIconInclude<ExtArgs> | null
    /**
     * The filter to search for the SocialIcon to update in case it exists.
     */
    where: SocialIconWhereUniqueInput
    /**
     * In case the SocialIcon found by the `where` argument doesn't exist, create a new SocialIcon with this data.
     */
    create: XOR<SocialIconCreateInput, SocialIconUncheckedCreateInput>
    /**
     * In case the SocialIcon was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SocialIconUpdateInput, SocialIconUncheckedUpdateInput>
  }

  /**
   * SocialIcon delete
   */
  export type SocialIconDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SocialIcon
     */
    select?: SocialIconSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SocialIcon
     */
    omit?: SocialIconOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SocialIconInclude<ExtArgs> | null
    /**
     * Filter which SocialIcon to delete.
     */
    where: SocialIconWhereUniqueInput
  }

  /**
   * SocialIcon deleteMany
   */
  export type SocialIconDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SocialIcons to delete
     */
    where?: SocialIconWhereInput
    /**
     * Limit how many SocialIcons to delete.
     */
    limit?: number
  }

  /**
   * SocialIcon without action
   */
  export type SocialIconDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SocialIcon
     */
    select?: SocialIconSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SocialIcon
     */
    omit?: SocialIconOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SocialIconInclude<ExtArgs> | null
  }


  /**
   * Model BackgroundColor
   */

  export type AggregateBackgroundColor = {
    _count: BackgroundColorCountAggregateOutputType | null
    _avg: BackgroundColorAvgAggregateOutputType | null
    _sum: BackgroundColorSumAggregateOutputType | null
    _min: BackgroundColorMinAggregateOutputType | null
    _max: BackgroundColorMaxAggregateOutputType | null
  }

  export type BackgroundColorAvgAggregateOutputType = {
    id: number | null
  }

  export type BackgroundColorSumAggregateOutputType = {
    id: number | null
  }

  export type BackgroundColorMinAggregateOutputType = {
    id: number | null
    color: string | null
    userId: string | null
  }

  export type BackgroundColorMaxAggregateOutputType = {
    id: number | null
    color: string | null
    userId: string | null
  }

  export type BackgroundColorCountAggregateOutputType = {
    id: number
    color: number
    userId: number
    _all: number
  }


  export type BackgroundColorAvgAggregateInputType = {
    id?: true
  }

  export type BackgroundColorSumAggregateInputType = {
    id?: true
  }

  export type BackgroundColorMinAggregateInputType = {
    id?: true
    color?: true
    userId?: true
  }

  export type BackgroundColorMaxAggregateInputType = {
    id?: true
    color?: true
    userId?: true
  }

  export type BackgroundColorCountAggregateInputType = {
    id?: true
    color?: true
    userId?: true
    _all?: true
  }

  export type BackgroundColorAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BackgroundColor to aggregate.
     */
    where?: BackgroundColorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BackgroundColors to fetch.
     */
    orderBy?: BackgroundColorOrderByWithRelationInput | BackgroundColorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BackgroundColorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BackgroundColors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BackgroundColors.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned BackgroundColors
    **/
    _count?: true | BackgroundColorCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: BackgroundColorAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: BackgroundColorSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BackgroundColorMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BackgroundColorMaxAggregateInputType
  }

  export type GetBackgroundColorAggregateType<T extends BackgroundColorAggregateArgs> = {
        [P in keyof T & keyof AggregateBackgroundColor]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBackgroundColor[P]>
      : GetScalarType<T[P], AggregateBackgroundColor[P]>
  }




  export type BackgroundColorGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BackgroundColorWhereInput
    orderBy?: BackgroundColorOrderByWithAggregationInput | BackgroundColorOrderByWithAggregationInput[]
    by: BackgroundColorScalarFieldEnum[] | BackgroundColorScalarFieldEnum
    having?: BackgroundColorScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BackgroundColorCountAggregateInputType | true
    _avg?: BackgroundColorAvgAggregateInputType
    _sum?: BackgroundColorSumAggregateInputType
    _min?: BackgroundColorMinAggregateInputType
    _max?: BackgroundColorMaxAggregateInputType
  }

  export type BackgroundColorGroupByOutputType = {
    id: number
    color: string
    userId: string
    _count: BackgroundColorCountAggregateOutputType | null
    _avg: BackgroundColorAvgAggregateOutputType | null
    _sum: BackgroundColorSumAggregateOutputType | null
    _min: BackgroundColorMinAggregateOutputType | null
    _max: BackgroundColorMaxAggregateOutputType | null
  }

  type GetBackgroundColorGroupByPayload<T extends BackgroundColorGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BackgroundColorGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BackgroundColorGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BackgroundColorGroupByOutputType[P]>
            : GetScalarType<T[P], BackgroundColorGroupByOutputType[P]>
        }
      >
    >


  export type BackgroundColorSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    color?: boolean
    userId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["backgroundColor"]>

  export type BackgroundColorSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    color?: boolean
    userId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["backgroundColor"]>

  export type BackgroundColorSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    color?: boolean
    userId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["backgroundColor"]>

  export type BackgroundColorSelectScalar = {
    id?: boolean
    color?: boolean
    userId?: boolean
  }

  export type BackgroundColorOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "color" | "userId", ExtArgs["result"]["backgroundColor"]>
  export type BackgroundColorInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type BackgroundColorIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type BackgroundColorIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $BackgroundColorPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "BackgroundColor"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      color: string
      userId: string
    }, ExtArgs["result"]["backgroundColor"]>
    composites: {}
  }

  type BackgroundColorGetPayload<S extends boolean | null | undefined | BackgroundColorDefaultArgs> = $Result.GetResult<Prisma.$BackgroundColorPayload, S>

  type BackgroundColorCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<BackgroundColorFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: BackgroundColorCountAggregateInputType | true
    }

  export interface BackgroundColorDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['BackgroundColor'], meta: { name: 'BackgroundColor' } }
    /**
     * Find zero or one BackgroundColor that matches the filter.
     * @param {BackgroundColorFindUniqueArgs} args - Arguments to find a BackgroundColor
     * @example
     * // Get one BackgroundColor
     * const backgroundColor = await prisma.backgroundColor.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BackgroundColorFindUniqueArgs>(args: SelectSubset<T, BackgroundColorFindUniqueArgs<ExtArgs>>): Prisma__BackgroundColorClient<$Result.GetResult<Prisma.$BackgroundColorPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one BackgroundColor that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {BackgroundColorFindUniqueOrThrowArgs} args - Arguments to find a BackgroundColor
     * @example
     * // Get one BackgroundColor
     * const backgroundColor = await prisma.backgroundColor.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BackgroundColorFindUniqueOrThrowArgs>(args: SelectSubset<T, BackgroundColorFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BackgroundColorClient<$Result.GetResult<Prisma.$BackgroundColorPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first BackgroundColor that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BackgroundColorFindFirstArgs} args - Arguments to find a BackgroundColor
     * @example
     * // Get one BackgroundColor
     * const backgroundColor = await prisma.backgroundColor.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BackgroundColorFindFirstArgs>(args?: SelectSubset<T, BackgroundColorFindFirstArgs<ExtArgs>>): Prisma__BackgroundColorClient<$Result.GetResult<Prisma.$BackgroundColorPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first BackgroundColor that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BackgroundColorFindFirstOrThrowArgs} args - Arguments to find a BackgroundColor
     * @example
     * // Get one BackgroundColor
     * const backgroundColor = await prisma.backgroundColor.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BackgroundColorFindFirstOrThrowArgs>(args?: SelectSubset<T, BackgroundColorFindFirstOrThrowArgs<ExtArgs>>): Prisma__BackgroundColorClient<$Result.GetResult<Prisma.$BackgroundColorPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more BackgroundColors that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BackgroundColorFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all BackgroundColors
     * const backgroundColors = await prisma.backgroundColor.findMany()
     * 
     * // Get first 10 BackgroundColors
     * const backgroundColors = await prisma.backgroundColor.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const backgroundColorWithIdOnly = await prisma.backgroundColor.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends BackgroundColorFindManyArgs>(args?: SelectSubset<T, BackgroundColorFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BackgroundColorPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a BackgroundColor.
     * @param {BackgroundColorCreateArgs} args - Arguments to create a BackgroundColor.
     * @example
     * // Create one BackgroundColor
     * const BackgroundColor = await prisma.backgroundColor.create({
     *   data: {
     *     // ... data to create a BackgroundColor
     *   }
     * })
     * 
     */
    create<T extends BackgroundColorCreateArgs>(args: SelectSubset<T, BackgroundColorCreateArgs<ExtArgs>>): Prisma__BackgroundColorClient<$Result.GetResult<Prisma.$BackgroundColorPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many BackgroundColors.
     * @param {BackgroundColorCreateManyArgs} args - Arguments to create many BackgroundColors.
     * @example
     * // Create many BackgroundColors
     * const backgroundColor = await prisma.backgroundColor.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BackgroundColorCreateManyArgs>(args?: SelectSubset<T, BackgroundColorCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many BackgroundColors and returns the data saved in the database.
     * @param {BackgroundColorCreateManyAndReturnArgs} args - Arguments to create many BackgroundColors.
     * @example
     * // Create many BackgroundColors
     * const backgroundColor = await prisma.backgroundColor.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many BackgroundColors and only return the `id`
     * const backgroundColorWithIdOnly = await prisma.backgroundColor.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends BackgroundColorCreateManyAndReturnArgs>(args?: SelectSubset<T, BackgroundColorCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BackgroundColorPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a BackgroundColor.
     * @param {BackgroundColorDeleteArgs} args - Arguments to delete one BackgroundColor.
     * @example
     * // Delete one BackgroundColor
     * const BackgroundColor = await prisma.backgroundColor.delete({
     *   where: {
     *     // ... filter to delete one BackgroundColor
     *   }
     * })
     * 
     */
    delete<T extends BackgroundColorDeleteArgs>(args: SelectSubset<T, BackgroundColorDeleteArgs<ExtArgs>>): Prisma__BackgroundColorClient<$Result.GetResult<Prisma.$BackgroundColorPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one BackgroundColor.
     * @param {BackgroundColorUpdateArgs} args - Arguments to update one BackgroundColor.
     * @example
     * // Update one BackgroundColor
     * const backgroundColor = await prisma.backgroundColor.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BackgroundColorUpdateArgs>(args: SelectSubset<T, BackgroundColorUpdateArgs<ExtArgs>>): Prisma__BackgroundColorClient<$Result.GetResult<Prisma.$BackgroundColorPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more BackgroundColors.
     * @param {BackgroundColorDeleteManyArgs} args - Arguments to filter BackgroundColors to delete.
     * @example
     * // Delete a few BackgroundColors
     * const { count } = await prisma.backgroundColor.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BackgroundColorDeleteManyArgs>(args?: SelectSubset<T, BackgroundColorDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more BackgroundColors.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BackgroundColorUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many BackgroundColors
     * const backgroundColor = await prisma.backgroundColor.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BackgroundColorUpdateManyArgs>(args: SelectSubset<T, BackgroundColorUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more BackgroundColors and returns the data updated in the database.
     * @param {BackgroundColorUpdateManyAndReturnArgs} args - Arguments to update many BackgroundColors.
     * @example
     * // Update many BackgroundColors
     * const backgroundColor = await prisma.backgroundColor.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more BackgroundColors and only return the `id`
     * const backgroundColorWithIdOnly = await prisma.backgroundColor.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends BackgroundColorUpdateManyAndReturnArgs>(args: SelectSubset<T, BackgroundColorUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BackgroundColorPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one BackgroundColor.
     * @param {BackgroundColorUpsertArgs} args - Arguments to update or create a BackgroundColor.
     * @example
     * // Update or create a BackgroundColor
     * const backgroundColor = await prisma.backgroundColor.upsert({
     *   create: {
     *     // ... data to create a BackgroundColor
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the BackgroundColor we want to update
     *   }
     * })
     */
    upsert<T extends BackgroundColorUpsertArgs>(args: SelectSubset<T, BackgroundColorUpsertArgs<ExtArgs>>): Prisma__BackgroundColorClient<$Result.GetResult<Prisma.$BackgroundColorPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of BackgroundColors.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BackgroundColorCountArgs} args - Arguments to filter BackgroundColors to count.
     * @example
     * // Count the number of BackgroundColors
     * const count = await prisma.backgroundColor.count({
     *   where: {
     *     // ... the filter for the BackgroundColors we want to count
     *   }
     * })
    **/
    count<T extends BackgroundColorCountArgs>(
      args?: Subset<T, BackgroundColorCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BackgroundColorCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a BackgroundColor.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BackgroundColorAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends BackgroundColorAggregateArgs>(args: Subset<T, BackgroundColorAggregateArgs>): Prisma.PrismaPromise<GetBackgroundColorAggregateType<T>>

    /**
     * Group by BackgroundColor.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BackgroundColorGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends BackgroundColorGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BackgroundColorGroupByArgs['orderBy'] }
        : { orderBy?: BackgroundColorGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, BackgroundColorGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBackgroundColorGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the BackgroundColor model
   */
  readonly fields: BackgroundColorFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for BackgroundColor.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BackgroundColorClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the BackgroundColor model
   */
  interface BackgroundColorFieldRefs {
    readonly id: FieldRef<"BackgroundColor", 'Int'>
    readonly color: FieldRef<"BackgroundColor", 'String'>
    readonly userId: FieldRef<"BackgroundColor", 'String'>
  }
    

  // Custom InputTypes
  /**
   * BackgroundColor findUnique
   */
  export type BackgroundColorFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackgroundColor
     */
    select?: BackgroundColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BackgroundColor
     */
    omit?: BackgroundColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BackgroundColorInclude<ExtArgs> | null
    /**
     * Filter, which BackgroundColor to fetch.
     */
    where: BackgroundColorWhereUniqueInput
  }

  /**
   * BackgroundColor findUniqueOrThrow
   */
  export type BackgroundColorFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackgroundColor
     */
    select?: BackgroundColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BackgroundColor
     */
    omit?: BackgroundColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BackgroundColorInclude<ExtArgs> | null
    /**
     * Filter, which BackgroundColor to fetch.
     */
    where: BackgroundColorWhereUniqueInput
  }

  /**
   * BackgroundColor findFirst
   */
  export type BackgroundColorFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackgroundColor
     */
    select?: BackgroundColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BackgroundColor
     */
    omit?: BackgroundColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BackgroundColorInclude<ExtArgs> | null
    /**
     * Filter, which BackgroundColor to fetch.
     */
    where?: BackgroundColorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BackgroundColors to fetch.
     */
    orderBy?: BackgroundColorOrderByWithRelationInput | BackgroundColorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BackgroundColors.
     */
    cursor?: BackgroundColorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BackgroundColors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BackgroundColors.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BackgroundColors.
     */
    distinct?: BackgroundColorScalarFieldEnum | BackgroundColorScalarFieldEnum[]
  }

  /**
   * BackgroundColor findFirstOrThrow
   */
  export type BackgroundColorFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackgroundColor
     */
    select?: BackgroundColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BackgroundColor
     */
    omit?: BackgroundColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BackgroundColorInclude<ExtArgs> | null
    /**
     * Filter, which BackgroundColor to fetch.
     */
    where?: BackgroundColorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BackgroundColors to fetch.
     */
    orderBy?: BackgroundColorOrderByWithRelationInput | BackgroundColorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BackgroundColors.
     */
    cursor?: BackgroundColorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BackgroundColors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BackgroundColors.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BackgroundColors.
     */
    distinct?: BackgroundColorScalarFieldEnum | BackgroundColorScalarFieldEnum[]
  }

  /**
   * BackgroundColor findMany
   */
  export type BackgroundColorFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackgroundColor
     */
    select?: BackgroundColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BackgroundColor
     */
    omit?: BackgroundColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BackgroundColorInclude<ExtArgs> | null
    /**
     * Filter, which BackgroundColors to fetch.
     */
    where?: BackgroundColorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BackgroundColors to fetch.
     */
    orderBy?: BackgroundColorOrderByWithRelationInput | BackgroundColorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing BackgroundColors.
     */
    cursor?: BackgroundColorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BackgroundColors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BackgroundColors.
     */
    skip?: number
    distinct?: BackgroundColorScalarFieldEnum | BackgroundColorScalarFieldEnum[]
  }

  /**
   * BackgroundColor create
   */
  export type BackgroundColorCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackgroundColor
     */
    select?: BackgroundColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BackgroundColor
     */
    omit?: BackgroundColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BackgroundColorInclude<ExtArgs> | null
    /**
     * The data needed to create a BackgroundColor.
     */
    data: XOR<BackgroundColorCreateInput, BackgroundColorUncheckedCreateInput>
  }

  /**
   * BackgroundColor createMany
   */
  export type BackgroundColorCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many BackgroundColors.
     */
    data: BackgroundColorCreateManyInput | BackgroundColorCreateManyInput[]
  }

  /**
   * BackgroundColor createManyAndReturn
   */
  export type BackgroundColorCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackgroundColor
     */
    select?: BackgroundColorSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the BackgroundColor
     */
    omit?: BackgroundColorOmit<ExtArgs> | null
    /**
     * The data used to create many BackgroundColors.
     */
    data: BackgroundColorCreateManyInput | BackgroundColorCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BackgroundColorIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * BackgroundColor update
   */
  export type BackgroundColorUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackgroundColor
     */
    select?: BackgroundColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BackgroundColor
     */
    omit?: BackgroundColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BackgroundColorInclude<ExtArgs> | null
    /**
     * The data needed to update a BackgroundColor.
     */
    data: XOR<BackgroundColorUpdateInput, BackgroundColorUncheckedUpdateInput>
    /**
     * Choose, which BackgroundColor to update.
     */
    where: BackgroundColorWhereUniqueInput
  }

  /**
   * BackgroundColor updateMany
   */
  export type BackgroundColorUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update BackgroundColors.
     */
    data: XOR<BackgroundColorUpdateManyMutationInput, BackgroundColorUncheckedUpdateManyInput>
    /**
     * Filter which BackgroundColors to update
     */
    where?: BackgroundColorWhereInput
    /**
     * Limit how many BackgroundColors to update.
     */
    limit?: number
  }

  /**
   * BackgroundColor updateManyAndReturn
   */
  export type BackgroundColorUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackgroundColor
     */
    select?: BackgroundColorSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the BackgroundColor
     */
    omit?: BackgroundColorOmit<ExtArgs> | null
    /**
     * The data used to update BackgroundColors.
     */
    data: XOR<BackgroundColorUpdateManyMutationInput, BackgroundColorUncheckedUpdateManyInput>
    /**
     * Filter which BackgroundColors to update
     */
    where?: BackgroundColorWhereInput
    /**
     * Limit how many BackgroundColors to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BackgroundColorIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * BackgroundColor upsert
   */
  export type BackgroundColorUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackgroundColor
     */
    select?: BackgroundColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BackgroundColor
     */
    omit?: BackgroundColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BackgroundColorInclude<ExtArgs> | null
    /**
     * The filter to search for the BackgroundColor to update in case it exists.
     */
    where: BackgroundColorWhereUniqueInput
    /**
     * In case the BackgroundColor found by the `where` argument doesn't exist, create a new BackgroundColor with this data.
     */
    create: XOR<BackgroundColorCreateInput, BackgroundColorUncheckedCreateInput>
    /**
     * In case the BackgroundColor was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BackgroundColorUpdateInput, BackgroundColorUncheckedUpdateInput>
  }

  /**
   * BackgroundColor delete
   */
  export type BackgroundColorDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackgroundColor
     */
    select?: BackgroundColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BackgroundColor
     */
    omit?: BackgroundColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BackgroundColorInclude<ExtArgs> | null
    /**
     * Filter which BackgroundColor to delete.
     */
    where: BackgroundColorWhereUniqueInput
  }

  /**
   * BackgroundColor deleteMany
   */
  export type BackgroundColorDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BackgroundColors to delete
     */
    where?: BackgroundColorWhereInput
    /**
     * Limit how many BackgroundColors to delete.
     */
    limit?: number
  }

  /**
   * BackgroundColor without action
   */
  export type BackgroundColorDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackgroundColor
     */
    select?: BackgroundColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BackgroundColor
     */
    omit?: BackgroundColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BackgroundColorInclude<ExtArgs> | null
  }


  /**
   * Model NeonColor
   */

  export type AggregateNeonColor = {
    _count: NeonColorCountAggregateOutputType | null
    _avg: NeonColorAvgAggregateOutputType | null
    _sum: NeonColorSumAggregateOutputType | null
    _min: NeonColorMinAggregateOutputType | null
    _max: NeonColorMaxAggregateOutputType | null
  }

  export type NeonColorAvgAggregateOutputType = {
    id: number | null
  }

  export type NeonColorSumAggregateOutputType = {
    id: number | null
  }

  export type NeonColorMinAggregateOutputType = {
    id: number | null
    color: string | null
    userId: string | null
  }

  export type NeonColorMaxAggregateOutputType = {
    id: number | null
    color: string | null
    userId: string | null
  }

  export type NeonColorCountAggregateOutputType = {
    id: number
    color: number
    userId: number
    _all: number
  }


  export type NeonColorAvgAggregateInputType = {
    id?: true
  }

  export type NeonColorSumAggregateInputType = {
    id?: true
  }

  export type NeonColorMinAggregateInputType = {
    id?: true
    color?: true
    userId?: true
  }

  export type NeonColorMaxAggregateInputType = {
    id?: true
    color?: true
    userId?: true
  }

  export type NeonColorCountAggregateInputType = {
    id?: true
    color?: true
    userId?: true
    _all?: true
  }

  export type NeonColorAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which NeonColor to aggregate.
     */
    where?: NeonColorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of NeonColors to fetch.
     */
    orderBy?: NeonColorOrderByWithRelationInput | NeonColorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: NeonColorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` NeonColors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` NeonColors.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned NeonColors
    **/
    _count?: true | NeonColorCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: NeonColorAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: NeonColorSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: NeonColorMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: NeonColorMaxAggregateInputType
  }

  export type GetNeonColorAggregateType<T extends NeonColorAggregateArgs> = {
        [P in keyof T & keyof AggregateNeonColor]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateNeonColor[P]>
      : GetScalarType<T[P], AggregateNeonColor[P]>
  }




  export type NeonColorGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NeonColorWhereInput
    orderBy?: NeonColorOrderByWithAggregationInput | NeonColorOrderByWithAggregationInput[]
    by: NeonColorScalarFieldEnum[] | NeonColorScalarFieldEnum
    having?: NeonColorScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: NeonColorCountAggregateInputType | true
    _avg?: NeonColorAvgAggregateInputType
    _sum?: NeonColorSumAggregateInputType
    _min?: NeonColorMinAggregateInputType
    _max?: NeonColorMaxAggregateInputType
  }

  export type NeonColorGroupByOutputType = {
    id: number
    color: string
    userId: string
    _count: NeonColorCountAggregateOutputType | null
    _avg: NeonColorAvgAggregateOutputType | null
    _sum: NeonColorSumAggregateOutputType | null
    _min: NeonColorMinAggregateOutputType | null
    _max: NeonColorMaxAggregateOutputType | null
  }

  type GetNeonColorGroupByPayload<T extends NeonColorGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<NeonColorGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof NeonColorGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], NeonColorGroupByOutputType[P]>
            : GetScalarType<T[P], NeonColorGroupByOutputType[P]>
        }
      >
    >


  export type NeonColorSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    color?: boolean
    userId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["neonColor"]>

  export type NeonColorSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    color?: boolean
    userId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["neonColor"]>

  export type NeonColorSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    color?: boolean
    userId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["neonColor"]>

  export type NeonColorSelectScalar = {
    id?: boolean
    color?: boolean
    userId?: boolean
  }

  export type NeonColorOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "color" | "userId", ExtArgs["result"]["neonColor"]>
  export type NeonColorInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type NeonColorIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type NeonColorIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $NeonColorPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "NeonColor"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      color: string
      userId: string
    }, ExtArgs["result"]["neonColor"]>
    composites: {}
  }

  type NeonColorGetPayload<S extends boolean | null | undefined | NeonColorDefaultArgs> = $Result.GetResult<Prisma.$NeonColorPayload, S>

  type NeonColorCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<NeonColorFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: NeonColorCountAggregateInputType | true
    }

  export interface NeonColorDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['NeonColor'], meta: { name: 'NeonColor' } }
    /**
     * Find zero or one NeonColor that matches the filter.
     * @param {NeonColorFindUniqueArgs} args - Arguments to find a NeonColor
     * @example
     * // Get one NeonColor
     * const neonColor = await prisma.neonColor.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends NeonColorFindUniqueArgs>(args: SelectSubset<T, NeonColorFindUniqueArgs<ExtArgs>>): Prisma__NeonColorClient<$Result.GetResult<Prisma.$NeonColorPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one NeonColor that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {NeonColorFindUniqueOrThrowArgs} args - Arguments to find a NeonColor
     * @example
     * // Get one NeonColor
     * const neonColor = await prisma.neonColor.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends NeonColorFindUniqueOrThrowArgs>(args: SelectSubset<T, NeonColorFindUniqueOrThrowArgs<ExtArgs>>): Prisma__NeonColorClient<$Result.GetResult<Prisma.$NeonColorPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first NeonColor that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NeonColorFindFirstArgs} args - Arguments to find a NeonColor
     * @example
     * // Get one NeonColor
     * const neonColor = await prisma.neonColor.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends NeonColorFindFirstArgs>(args?: SelectSubset<T, NeonColorFindFirstArgs<ExtArgs>>): Prisma__NeonColorClient<$Result.GetResult<Prisma.$NeonColorPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first NeonColor that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NeonColorFindFirstOrThrowArgs} args - Arguments to find a NeonColor
     * @example
     * // Get one NeonColor
     * const neonColor = await prisma.neonColor.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends NeonColorFindFirstOrThrowArgs>(args?: SelectSubset<T, NeonColorFindFirstOrThrowArgs<ExtArgs>>): Prisma__NeonColorClient<$Result.GetResult<Prisma.$NeonColorPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more NeonColors that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NeonColorFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all NeonColors
     * const neonColors = await prisma.neonColor.findMany()
     * 
     * // Get first 10 NeonColors
     * const neonColors = await prisma.neonColor.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const neonColorWithIdOnly = await prisma.neonColor.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends NeonColorFindManyArgs>(args?: SelectSubset<T, NeonColorFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NeonColorPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a NeonColor.
     * @param {NeonColorCreateArgs} args - Arguments to create a NeonColor.
     * @example
     * // Create one NeonColor
     * const NeonColor = await prisma.neonColor.create({
     *   data: {
     *     // ... data to create a NeonColor
     *   }
     * })
     * 
     */
    create<T extends NeonColorCreateArgs>(args: SelectSubset<T, NeonColorCreateArgs<ExtArgs>>): Prisma__NeonColorClient<$Result.GetResult<Prisma.$NeonColorPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many NeonColors.
     * @param {NeonColorCreateManyArgs} args - Arguments to create many NeonColors.
     * @example
     * // Create many NeonColors
     * const neonColor = await prisma.neonColor.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends NeonColorCreateManyArgs>(args?: SelectSubset<T, NeonColorCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many NeonColors and returns the data saved in the database.
     * @param {NeonColorCreateManyAndReturnArgs} args - Arguments to create many NeonColors.
     * @example
     * // Create many NeonColors
     * const neonColor = await prisma.neonColor.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many NeonColors and only return the `id`
     * const neonColorWithIdOnly = await prisma.neonColor.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends NeonColorCreateManyAndReturnArgs>(args?: SelectSubset<T, NeonColorCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NeonColorPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a NeonColor.
     * @param {NeonColorDeleteArgs} args - Arguments to delete one NeonColor.
     * @example
     * // Delete one NeonColor
     * const NeonColor = await prisma.neonColor.delete({
     *   where: {
     *     // ... filter to delete one NeonColor
     *   }
     * })
     * 
     */
    delete<T extends NeonColorDeleteArgs>(args: SelectSubset<T, NeonColorDeleteArgs<ExtArgs>>): Prisma__NeonColorClient<$Result.GetResult<Prisma.$NeonColorPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one NeonColor.
     * @param {NeonColorUpdateArgs} args - Arguments to update one NeonColor.
     * @example
     * // Update one NeonColor
     * const neonColor = await prisma.neonColor.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends NeonColorUpdateArgs>(args: SelectSubset<T, NeonColorUpdateArgs<ExtArgs>>): Prisma__NeonColorClient<$Result.GetResult<Prisma.$NeonColorPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more NeonColors.
     * @param {NeonColorDeleteManyArgs} args - Arguments to filter NeonColors to delete.
     * @example
     * // Delete a few NeonColors
     * const { count } = await prisma.neonColor.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends NeonColorDeleteManyArgs>(args?: SelectSubset<T, NeonColorDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more NeonColors.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NeonColorUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many NeonColors
     * const neonColor = await prisma.neonColor.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends NeonColorUpdateManyArgs>(args: SelectSubset<T, NeonColorUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more NeonColors and returns the data updated in the database.
     * @param {NeonColorUpdateManyAndReturnArgs} args - Arguments to update many NeonColors.
     * @example
     * // Update many NeonColors
     * const neonColor = await prisma.neonColor.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more NeonColors and only return the `id`
     * const neonColorWithIdOnly = await prisma.neonColor.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends NeonColorUpdateManyAndReturnArgs>(args: SelectSubset<T, NeonColorUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NeonColorPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one NeonColor.
     * @param {NeonColorUpsertArgs} args - Arguments to update or create a NeonColor.
     * @example
     * // Update or create a NeonColor
     * const neonColor = await prisma.neonColor.upsert({
     *   create: {
     *     // ... data to create a NeonColor
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the NeonColor we want to update
     *   }
     * })
     */
    upsert<T extends NeonColorUpsertArgs>(args: SelectSubset<T, NeonColorUpsertArgs<ExtArgs>>): Prisma__NeonColorClient<$Result.GetResult<Prisma.$NeonColorPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of NeonColors.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NeonColorCountArgs} args - Arguments to filter NeonColors to count.
     * @example
     * // Count the number of NeonColors
     * const count = await prisma.neonColor.count({
     *   where: {
     *     // ... the filter for the NeonColors we want to count
     *   }
     * })
    **/
    count<T extends NeonColorCountArgs>(
      args?: Subset<T, NeonColorCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], NeonColorCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a NeonColor.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NeonColorAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends NeonColorAggregateArgs>(args: Subset<T, NeonColorAggregateArgs>): Prisma.PrismaPromise<GetNeonColorAggregateType<T>>

    /**
     * Group by NeonColor.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NeonColorGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends NeonColorGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: NeonColorGroupByArgs['orderBy'] }
        : { orderBy?: NeonColorGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, NeonColorGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetNeonColorGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the NeonColor model
   */
  readonly fields: NeonColorFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for NeonColor.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__NeonColorClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the NeonColor model
   */
  interface NeonColorFieldRefs {
    readonly id: FieldRef<"NeonColor", 'Int'>
    readonly color: FieldRef<"NeonColor", 'String'>
    readonly userId: FieldRef<"NeonColor", 'String'>
  }
    

  // Custom InputTypes
  /**
   * NeonColor findUnique
   */
  export type NeonColorFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NeonColor
     */
    select?: NeonColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NeonColor
     */
    omit?: NeonColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NeonColorInclude<ExtArgs> | null
    /**
     * Filter, which NeonColor to fetch.
     */
    where: NeonColorWhereUniqueInput
  }

  /**
   * NeonColor findUniqueOrThrow
   */
  export type NeonColorFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NeonColor
     */
    select?: NeonColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NeonColor
     */
    omit?: NeonColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NeonColorInclude<ExtArgs> | null
    /**
     * Filter, which NeonColor to fetch.
     */
    where: NeonColorWhereUniqueInput
  }

  /**
   * NeonColor findFirst
   */
  export type NeonColorFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NeonColor
     */
    select?: NeonColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NeonColor
     */
    omit?: NeonColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NeonColorInclude<ExtArgs> | null
    /**
     * Filter, which NeonColor to fetch.
     */
    where?: NeonColorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of NeonColors to fetch.
     */
    orderBy?: NeonColorOrderByWithRelationInput | NeonColorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for NeonColors.
     */
    cursor?: NeonColorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` NeonColors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` NeonColors.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of NeonColors.
     */
    distinct?: NeonColorScalarFieldEnum | NeonColorScalarFieldEnum[]
  }

  /**
   * NeonColor findFirstOrThrow
   */
  export type NeonColorFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NeonColor
     */
    select?: NeonColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NeonColor
     */
    omit?: NeonColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NeonColorInclude<ExtArgs> | null
    /**
     * Filter, which NeonColor to fetch.
     */
    where?: NeonColorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of NeonColors to fetch.
     */
    orderBy?: NeonColorOrderByWithRelationInput | NeonColorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for NeonColors.
     */
    cursor?: NeonColorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` NeonColors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` NeonColors.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of NeonColors.
     */
    distinct?: NeonColorScalarFieldEnum | NeonColorScalarFieldEnum[]
  }

  /**
   * NeonColor findMany
   */
  export type NeonColorFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NeonColor
     */
    select?: NeonColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NeonColor
     */
    omit?: NeonColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NeonColorInclude<ExtArgs> | null
    /**
     * Filter, which NeonColors to fetch.
     */
    where?: NeonColorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of NeonColors to fetch.
     */
    orderBy?: NeonColorOrderByWithRelationInput | NeonColorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing NeonColors.
     */
    cursor?: NeonColorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` NeonColors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` NeonColors.
     */
    skip?: number
    distinct?: NeonColorScalarFieldEnum | NeonColorScalarFieldEnum[]
  }

  /**
   * NeonColor create
   */
  export type NeonColorCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NeonColor
     */
    select?: NeonColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NeonColor
     */
    omit?: NeonColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NeonColorInclude<ExtArgs> | null
    /**
     * The data needed to create a NeonColor.
     */
    data: XOR<NeonColorCreateInput, NeonColorUncheckedCreateInput>
  }

  /**
   * NeonColor createMany
   */
  export type NeonColorCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many NeonColors.
     */
    data: NeonColorCreateManyInput | NeonColorCreateManyInput[]
  }

  /**
   * NeonColor createManyAndReturn
   */
  export type NeonColorCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NeonColor
     */
    select?: NeonColorSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the NeonColor
     */
    omit?: NeonColorOmit<ExtArgs> | null
    /**
     * The data used to create many NeonColors.
     */
    data: NeonColorCreateManyInput | NeonColorCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NeonColorIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * NeonColor update
   */
  export type NeonColorUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NeonColor
     */
    select?: NeonColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NeonColor
     */
    omit?: NeonColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NeonColorInclude<ExtArgs> | null
    /**
     * The data needed to update a NeonColor.
     */
    data: XOR<NeonColorUpdateInput, NeonColorUncheckedUpdateInput>
    /**
     * Choose, which NeonColor to update.
     */
    where: NeonColorWhereUniqueInput
  }

  /**
   * NeonColor updateMany
   */
  export type NeonColorUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update NeonColors.
     */
    data: XOR<NeonColorUpdateManyMutationInput, NeonColorUncheckedUpdateManyInput>
    /**
     * Filter which NeonColors to update
     */
    where?: NeonColorWhereInput
    /**
     * Limit how many NeonColors to update.
     */
    limit?: number
  }

  /**
   * NeonColor updateManyAndReturn
   */
  export type NeonColorUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NeonColor
     */
    select?: NeonColorSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the NeonColor
     */
    omit?: NeonColorOmit<ExtArgs> | null
    /**
     * The data used to update NeonColors.
     */
    data: XOR<NeonColorUpdateManyMutationInput, NeonColorUncheckedUpdateManyInput>
    /**
     * Filter which NeonColors to update
     */
    where?: NeonColorWhereInput
    /**
     * Limit how many NeonColors to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NeonColorIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * NeonColor upsert
   */
  export type NeonColorUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NeonColor
     */
    select?: NeonColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NeonColor
     */
    omit?: NeonColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NeonColorInclude<ExtArgs> | null
    /**
     * The filter to search for the NeonColor to update in case it exists.
     */
    where: NeonColorWhereUniqueInput
    /**
     * In case the NeonColor found by the `where` argument doesn't exist, create a new NeonColor with this data.
     */
    create: XOR<NeonColorCreateInput, NeonColorUncheckedCreateInput>
    /**
     * In case the NeonColor was found with the provided `where` argument, update it with this data.
     */
    update: XOR<NeonColorUpdateInput, NeonColorUncheckedUpdateInput>
  }

  /**
   * NeonColor delete
   */
  export type NeonColorDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NeonColor
     */
    select?: NeonColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NeonColor
     */
    omit?: NeonColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NeonColorInclude<ExtArgs> | null
    /**
     * Filter which NeonColor to delete.
     */
    where: NeonColorWhereUniqueInput
  }

  /**
   * NeonColor deleteMany
   */
  export type NeonColorDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which NeonColors to delete
     */
    where?: NeonColorWhereInput
    /**
     * Limit how many NeonColors to delete.
     */
    limit?: number
  }

  /**
   * NeonColor without action
   */
  export type NeonColorDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NeonColor
     */
    select?: NeonColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NeonColor
     */
    omit?: NeonColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NeonColorInclude<ExtArgs> | null
  }


  /**
   * Model Statusbar
   */

  export type AggregateStatusbar = {
    _count: StatusbarCountAggregateOutputType | null
    _avg: StatusbarAvgAggregateOutputType | null
    _sum: StatusbarSumAggregateOutputType | null
    _min: StatusbarMinAggregateOutputType | null
    _max: StatusbarMaxAggregateOutputType | null
  }

  export type StatusbarAvgAggregateOutputType = {
    id: number | null
    fontTextColor: number | null
  }

  export type StatusbarSumAggregateOutputType = {
    id: number | null
    fontTextColor: number | null
  }

  export type StatusbarMinAggregateOutputType = {
    id: number | null
    text: string | null
    colorBg: string | null
    colorText: string | null
    fontTextColor: number | null
    statusText: string | null
    userId: string | null
  }

  export type StatusbarMaxAggregateOutputType = {
    id: number | null
    text: string | null
    colorBg: string | null
    colorText: string | null
    fontTextColor: number | null
    statusText: string | null
    userId: string | null
  }

  export type StatusbarCountAggregateOutputType = {
    id: number
    text: number
    colorBg: number
    colorText: number
    fontTextColor: number
    statusText: number
    userId: number
    _all: number
  }


  export type StatusbarAvgAggregateInputType = {
    id?: true
    fontTextColor?: true
  }

  export type StatusbarSumAggregateInputType = {
    id?: true
    fontTextColor?: true
  }

  export type StatusbarMinAggregateInputType = {
    id?: true
    text?: true
    colorBg?: true
    colorText?: true
    fontTextColor?: true
    statusText?: true
    userId?: true
  }

  export type StatusbarMaxAggregateInputType = {
    id?: true
    text?: true
    colorBg?: true
    colorText?: true
    fontTextColor?: true
    statusText?: true
    userId?: true
  }

  export type StatusbarCountAggregateInputType = {
    id?: true
    text?: true
    colorBg?: true
    colorText?: true
    fontTextColor?: true
    statusText?: true
    userId?: true
    _all?: true
  }

  export type StatusbarAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Statusbar to aggregate.
     */
    where?: StatusbarWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Statusbars to fetch.
     */
    orderBy?: StatusbarOrderByWithRelationInput | StatusbarOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: StatusbarWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Statusbars from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Statusbars.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Statusbars
    **/
    _count?: true | StatusbarCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: StatusbarAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: StatusbarSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: StatusbarMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: StatusbarMaxAggregateInputType
  }

  export type GetStatusbarAggregateType<T extends StatusbarAggregateArgs> = {
        [P in keyof T & keyof AggregateStatusbar]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateStatusbar[P]>
      : GetScalarType<T[P], AggregateStatusbar[P]>
  }




  export type StatusbarGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StatusbarWhereInput
    orderBy?: StatusbarOrderByWithAggregationInput | StatusbarOrderByWithAggregationInput[]
    by: StatusbarScalarFieldEnum[] | StatusbarScalarFieldEnum
    having?: StatusbarScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: StatusbarCountAggregateInputType | true
    _avg?: StatusbarAvgAggregateInputType
    _sum?: StatusbarSumAggregateInputType
    _min?: StatusbarMinAggregateInputType
    _max?: StatusbarMaxAggregateInputType
  }

  export type StatusbarGroupByOutputType = {
    id: number
    text: string | null
    colorBg: string | null
    colorText: string | null
    fontTextColor: number | null
    statusText: string | null
    userId: string
    _count: StatusbarCountAggregateOutputType | null
    _avg: StatusbarAvgAggregateOutputType | null
    _sum: StatusbarSumAggregateOutputType | null
    _min: StatusbarMinAggregateOutputType | null
    _max: StatusbarMaxAggregateOutputType | null
  }

  type GetStatusbarGroupByPayload<T extends StatusbarGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<StatusbarGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof StatusbarGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], StatusbarGroupByOutputType[P]>
            : GetScalarType<T[P], StatusbarGroupByOutputType[P]>
        }
      >
    >


  export type StatusbarSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    text?: boolean
    colorBg?: boolean
    colorText?: boolean
    fontTextColor?: boolean
    statusText?: boolean
    userId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["statusbar"]>

  export type StatusbarSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    text?: boolean
    colorBg?: boolean
    colorText?: boolean
    fontTextColor?: boolean
    statusText?: boolean
    userId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["statusbar"]>

  export type StatusbarSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    text?: boolean
    colorBg?: boolean
    colorText?: boolean
    fontTextColor?: boolean
    statusText?: boolean
    userId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["statusbar"]>

  export type StatusbarSelectScalar = {
    id?: boolean
    text?: boolean
    colorBg?: boolean
    colorText?: boolean
    fontTextColor?: boolean
    statusText?: boolean
    userId?: boolean
  }

  export type StatusbarOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "text" | "colorBg" | "colorText" | "fontTextColor" | "statusText" | "userId", ExtArgs["result"]["statusbar"]>
  export type StatusbarInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type StatusbarIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type StatusbarIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $StatusbarPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Statusbar"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      text: string | null
      colorBg: string | null
      colorText: string | null
      fontTextColor: number | null
      statusText: string | null
      userId: string
    }, ExtArgs["result"]["statusbar"]>
    composites: {}
  }

  type StatusbarGetPayload<S extends boolean | null | undefined | StatusbarDefaultArgs> = $Result.GetResult<Prisma.$StatusbarPayload, S>

  type StatusbarCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<StatusbarFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: StatusbarCountAggregateInputType | true
    }

  export interface StatusbarDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Statusbar'], meta: { name: 'Statusbar' } }
    /**
     * Find zero or one Statusbar that matches the filter.
     * @param {StatusbarFindUniqueArgs} args - Arguments to find a Statusbar
     * @example
     * // Get one Statusbar
     * const statusbar = await prisma.statusbar.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends StatusbarFindUniqueArgs>(args: SelectSubset<T, StatusbarFindUniqueArgs<ExtArgs>>): Prisma__StatusbarClient<$Result.GetResult<Prisma.$StatusbarPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Statusbar that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {StatusbarFindUniqueOrThrowArgs} args - Arguments to find a Statusbar
     * @example
     * // Get one Statusbar
     * const statusbar = await prisma.statusbar.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends StatusbarFindUniqueOrThrowArgs>(args: SelectSubset<T, StatusbarFindUniqueOrThrowArgs<ExtArgs>>): Prisma__StatusbarClient<$Result.GetResult<Prisma.$StatusbarPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Statusbar that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StatusbarFindFirstArgs} args - Arguments to find a Statusbar
     * @example
     * // Get one Statusbar
     * const statusbar = await prisma.statusbar.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends StatusbarFindFirstArgs>(args?: SelectSubset<T, StatusbarFindFirstArgs<ExtArgs>>): Prisma__StatusbarClient<$Result.GetResult<Prisma.$StatusbarPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Statusbar that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StatusbarFindFirstOrThrowArgs} args - Arguments to find a Statusbar
     * @example
     * // Get one Statusbar
     * const statusbar = await prisma.statusbar.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends StatusbarFindFirstOrThrowArgs>(args?: SelectSubset<T, StatusbarFindFirstOrThrowArgs<ExtArgs>>): Prisma__StatusbarClient<$Result.GetResult<Prisma.$StatusbarPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Statusbars that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StatusbarFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Statusbars
     * const statusbars = await prisma.statusbar.findMany()
     * 
     * // Get first 10 Statusbars
     * const statusbars = await prisma.statusbar.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const statusbarWithIdOnly = await prisma.statusbar.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends StatusbarFindManyArgs>(args?: SelectSubset<T, StatusbarFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StatusbarPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Statusbar.
     * @param {StatusbarCreateArgs} args - Arguments to create a Statusbar.
     * @example
     * // Create one Statusbar
     * const Statusbar = await prisma.statusbar.create({
     *   data: {
     *     // ... data to create a Statusbar
     *   }
     * })
     * 
     */
    create<T extends StatusbarCreateArgs>(args: SelectSubset<T, StatusbarCreateArgs<ExtArgs>>): Prisma__StatusbarClient<$Result.GetResult<Prisma.$StatusbarPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Statusbars.
     * @param {StatusbarCreateManyArgs} args - Arguments to create many Statusbars.
     * @example
     * // Create many Statusbars
     * const statusbar = await prisma.statusbar.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends StatusbarCreateManyArgs>(args?: SelectSubset<T, StatusbarCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Statusbars and returns the data saved in the database.
     * @param {StatusbarCreateManyAndReturnArgs} args - Arguments to create many Statusbars.
     * @example
     * // Create many Statusbars
     * const statusbar = await prisma.statusbar.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Statusbars and only return the `id`
     * const statusbarWithIdOnly = await prisma.statusbar.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends StatusbarCreateManyAndReturnArgs>(args?: SelectSubset<T, StatusbarCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StatusbarPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Statusbar.
     * @param {StatusbarDeleteArgs} args - Arguments to delete one Statusbar.
     * @example
     * // Delete one Statusbar
     * const Statusbar = await prisma.statusbar.delete({
     *   where: {
     *     // ... filter to delete one Statusbar
     *   }
     * })
     * 
     */
    delete<T extends StatusbarDeleteArgs>(args: SelectSubset<T, StatusbarDeleteArgs<ExtArgs>>): Prisma__StatusbarClient<$Result.GetResult<Prisma.$StatusbarPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Statusbar.
     * @param {StatusbarUpdateArgs} args - Arguments to update one Statusbar.
     * @example
     * // Update one Statusbar
     * const statusbar = await prisma.statusbar.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends StatusbarUpdateArgs>(args: SelectSubset<T, StatusbarUpdateArgs<ExtArgs>>): Prisma__StatusbarClient<$Result.GetResult<Prisma.$StatusbarPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Statusbars.
     * @param {StatusbarDeleteManyArgs} args - Arguments to filter Statusbars to delete.
     * @example
     * // Delete a few Statusbars
     * const { count } = await prisma.statusbar.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends StatusbarDeleteManyArgs>(args?: SelectSubset<T, StatusbarDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Statusbars.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StatusbarUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Statusbars
     * const statusbar = await prisma.statusbar.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends StatusbarUpdateManyArgs>(args: SelectSubset<T, StatusbarUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Statusbars and returns the data updated in the database.
     * @param {StatusbarUpdateManyAndReturnArgs} args - Arguments to update many Statusbars.
     * @example
     * // Update many Statusbars
     * const statusbar = await prisma.statusbar.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Statusbars and only return the `id`
     * const statusbarWithIdOnly = await prisma.statusbar.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends StatusbarUpdateManyAndReturnArgs>(args: SelectSubset<T, StatusbarUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StatusbarPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Statusbar.
     * @param {StatusbarUpsertArgs} args - Arguments to update or create a Statusbar.
     * @example
     * // Update or create a Statusbar
     * const statusbar = await prisma.statusbar.upsert({
     *   create: {
     *     // ... data to create a Statusbar
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Statusbar we want to update
     *   }
     * })
     */
    upsert<T extends StatusbarUpsertArgs>(args: SelectSubset<T, StatusbarUpsertArgs<ExtArgs>>): Prisma__StatusbarClient<$Result.GetResult<Prisma.$StatusbarPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Statusbars.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StatusbarCountArgs} args - Arguments to filter Statusbars to count.
     * @example
     * // Count the number of Statusbars
     * const count = await prisma.statusbar.count({
     *   where: {
     *     // ... the filter for the Statusbars we want to count
     *   }
     * })
    **/
    count<T extends StatusbarCountArgs>(
      args?: Subset<T, StatusbarCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], StatusbarCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Statusbar.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StatusbarAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends StatusbarAggregateArgs>(args: Subset<T, StatusbarAggregateArgs>): Prisma.PrismaPromise<GetStatusbarAggregateType<T>>

    /**
     * Group by Statusbar.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StatusbarGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends StatusbarGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: StatusbarGroupByArgs['orderBy'] }
        : { orderBy?: StatusbarGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, StatusbarGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetStatusbarGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Statusbar model
   */
  readonly fields: StatusbarFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Statusbar.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__StatusbarClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Statusbar model
   */
  interface StatusbarFieldRefs {
    readonly id: FieldRef<"Statusbar", 'Int'>
    readonly text: FieldRef<"Statusbar", 'String'>
    readonly colorBg: FieldRef<"Statusbar", 'String'>
    readonly colorText: FieldRef<"Statusbar", 'String'>
    readonly fontTextColor: FieldRef<"Statusbar", 'Int'>
    readonly statusText: FieldRef<"Statusbar", 'String'>
    readonly userId: FieldRef<"Statusbar", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Statusbar findUnique
   */
  export type StatusbarFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Statusbar
     */
    select?: StatusbarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Statusbar
     */
    omit?: StatusbarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StatusbarInclude<ExtArgs> | null
    /**
     * Filter, which Statusbar to fetch.
     */
    where: StatusbarWhereUniqueInput
  }

  /**
   * Statusbar findUniqueOrThrow
   */
  export type StatusbarFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Statusbar
     */
    select?: StatusbarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Statusbar
     */
    omit?: StatusbarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StatusbarInclude<ExtArgs> | null
    /**
     * Filter, which Statusbar to fetch.
     */
    where: StatusbarWhereUniqueInput
  }

  /**
   * Statusbar findFirst
   */
  export type StatusbarFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Statusbar
     */
    select?: StatusbarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Statusbar
     */
    omit?: StatusbarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StatusbarInclude<ExtArgs> | null
    /**
     * Filter, which Statusbar to fetch.
     */
    where?: StatusbarWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Statusbars to fetch.
     */
    orderBy?: StatusbarOrderByWithRelationInput | StatusbarOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Statusbars.
     */
    cursor?: StatusbarWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Statusbars from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Statusbars.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Statusbars.
     */
    distinct?: StatusbarScalarFieldEnum | StatusbarScalarFieldEnum[]
  }

  /**
   * Statusbar findFirstOrThrow
   */
  export type StatusbarFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Statusbar
     */
    select?: StatusbarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Statusbar
     */
    omit?: StatusbarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StatusbarInclude<ExtArgs> | null
    /**
     * Filter, which Statusbar to fetch.
     */
    where?: StatusbarWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Statusbars to fetch.
     */
    orderBy?: StatusbarOrderByWithRelationInput | StatusbarOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Statusbars.
     */
    cursor?: StatusbarWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Statusbars from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Statusbars.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Statusbars.
     */
    distinct?: StatusbarScalarFieldEnum | StatusbarScalarFieldEnum[]
  }

  /**
   * Statusbar findMany
   */
  export type StatusbarFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Statusbar
     */
    select?: StatusbarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Statusbar
     */
    omit?: StatusbarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StatusbarInclude<ExtArgs> | null
    /**
     * Filter, which Statusbars to fetch.
     */
    where?: StatusbarWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Statusbars to fetch.
     */
    orderBy?: StatusbarOrderByWithRelationInput | StatusbarOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Statusbars.
     */
    cursor?: StatusbarWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Statusbars from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Statusbars.
     */
    skip?: number
    distinct?: StatusbarScalarFieldEnum | StatusbarScalarFieldEnum[]
  }

  /**
   * Statusbar create
   */
  export type StatusbarCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Statusbar
     */
    select?: StatusbarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Statusbar
     */
    omit?: StatusbarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StatusbarInclude<ExtArgs> | null
    /**
     * The data needed to create a Statusbar.
     */
    data: XOR<StatusbarCreateInput, StatusbarUncheckedCreateInput>
  }

  /**
   * Statusbar createMany
   */
  export type StatusbarCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Statusbars.
     */
    data: StatusbarCreateManyInput | StatusbarCreateManyInput[]
  }

  /**
   * Statusbar createManyAndReturn
   */
  export type StatusbarCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Statusbar
     */
    select?: StatusbarSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Statusbar
     */
    omit?: StatusbarOmit<ExtArgs> | null
    /**
     * The data used to create many Statusbars.
     */
    data: StatusbarCreateManyInput | StatusbarCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StatusbarIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Statusbar update
   */
  export type StatusbarUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Statusbar
     */
    select?: StatusbarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Statusbar
     */
    omit?: StatusbarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StatusbarInclude<ExtArgs> | null
    /**
     * The data needed to update a Statusbar.
     */
    data: XOR<StatusbarUpdateInput, StatusbarUncheckedUpdateInput>
    /**
     * Choose, which Statusbar to update.
     */
    where: StatusbarWhereUniqueInput
  }

  /**
   * Statusbar updateMany
   */
  export type StatusbarUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Statusbars.
     */
    data: XOR<StatusbarUpdateManyMutationInput, StatusbarUncheckedUpdateManyInput>
    /**
     * Filter which Statusbars to update
     */
    where?: StatusbarWhereInput
    /**
     * Limit how many Statusbars to update.
     */
    limit?: number
  }

  /**
   * Statusbar updateManyAndReturn
   */
  export type StatusbarUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Statusbar
     */
    select?: StatusbarSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Statusbar
     */
    omit?: StatusbarOmit<ExtArgs> | null
    /**
     * The data used to update Statusbars.
     */
    data: XOR<StatusbarUpdateManyMutationInput, StatusbarUncheckedUpdateManyInput>
    /**
     * Filter which Statusbars to update
     */
    where?: StatusbarWhereInput
    /**
     * Limit how many Statusbars to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StatusbarIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Statusbar upsert
   */
  export type StatusbarUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Statusbar
     */
    select?: StatusbarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Statusbar
     */
    omit?: StatusbarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StatusbarInclude<ExtArgs> | null
    /**
     * The filter to search for the Statusbar to update in case it exists.
     */
    where: StatusbarWhereUniqueInput
    /**
     * In case the Statusbar found by the `where` argument doesn't exist, create a new Statusbar with this data.
     */
    create: XOR<StatusbarCreateInput, StatusbarUncheckedCreateInput>
    /**
     * In case the Statusbar was found with the provided `where` argument, update it with this data.
     */
    update: XOR<StatusbarUpdateInput, StatusbarUncheckedUpdateInput>
  }

  /**
   * Statusbar delete
   */
  export type StatusbarDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Statusbar
     */
    select?: StatusbarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Statusbar
     */
    omit?: StatusbarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StatusbarInclude<ExtArgs> | null
    /**
     * Filter which Statusbar to delete.
     */
    where: StatusbarWhereUniqueInput
  }

  /**
   * Statusbar deleteMany
   */
  export type StatusbarDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Statusbars to delete
     */
    where?: StatusbarWhereInput
    /**
     * Limit how many Statusbars to delete.
     */
    limit?: number
  }

  /**
   * Statusbar without action
   */
  export type StatusbarDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Statusbar
     */
    select?: StatusbarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Statusbar
     */
    omit?: StatusbarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StatusbarInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    userName: 'userName',
    password: 'password',
    email: 'email',
    publicEmail: 'publicEmail',
    profileLink: 'profileLink',
    profileImage: 'profileImage',
    profileIcon: 'profileIcon',
    profileSiteText: 'profileSiteText',
    iconUrl: 'iconUrl',
    description: 'description',
    profileHoverColor: 'profileHoverColor',
    degBackgroundColor: 'degBackgroundColor',
    neonEnable: 'neonEnable',
    buttonThemeEnable: 'buttonThemeEnable',
    EnableAnimationArticle: 'EnableAnimationArticle',
    EnableAnimationButton: 'EnableAnimationButton',
    EnableAnimationBackground: 'EnableAnimationBackground',
    backgroundSize: 'backgroundSize',
    selectedThemeIndex: 'selectedThemeIndex',
    selectedAnimationIndex: 'selectedAnimationIndex',
    selectedAnimationButtonIndex: 'selectedAnimationButtonIndex',
    selectedAnimationBackgroundIndex: 'selectedAnimationBackgroundIndex',
    animationDurationBackground: 'animationDurationBackground',
    delayAnimationButton: 'delayAnimationButton',
    canvaEnable: 'canvaEnable',
    selectedCanvasIndex: 'selectedCanvasIndex',
    name: 'name',
    emailVerified: 'emailVerified',
    image: 'image',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    role: 'role',
    rankScore: 'rankScore',
    bumpedAt: 'bumpedAt',
    bumpExpiresAt: 'bumpExpiresAt',
    bumpPaidUntil: 'bumpPaidUntil',
    isPublic: 'isPublic'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const CosmeticScalarFieldEnum: {
    id: 'id',
    flair: 'flair',
    frame: 'frame',
    theme: 'theme',
    bannerUrl: 'bannerUrl',
    userId: 'userId'
  };

  export type CosmeticScalarFieldEnum = (typeof CosmeticScalarFieldEnum)[keyof typeof CosmeticScalarFieldEnum]


  export const LinkScalarFieldEnum: {
    id: 'id',
    icon: 'icon',
    url: 'url',
    text: 'text',
    name: 'name',
    description: 'description',
    showDescriptionOnHover: 'showDescriptionOnHover',
    showDescription: 'showDescription',
    userId: 'userId'
  };

  export type LinkScalarFieldEnum = (typeof LinkScalarFieldEnum)[keyof typeof LinkScalarFieldEnum]


  export const LabelScalarFieldEnum: {
    id: 'id',
    data: 'data',
    color: 'color',
    fontColor: 'fontColor',
    userId: 'userId'
  };

  export type LabelScalarFieldEnum = (typeof LabelScalarFieldEnum)[keyof typeof LabelScalarFieldEnum]


  export const SocialIconScalarFieldEnum: {
    id: 'id',
    url: 'url',
    icon: 'icon',
    userId: 'userId'
  };

  export type SocialIconScalarFieldEnum = (typeof SocialIconScalarFieldEnum)[keyof typeof SocialIconScalarFieldEnum]


  export const BackgroundColorScalarFieldEnum: {
    id: 'id',
    color: 'color',
    userId: 'userId'
  };

  export type BackgroundColorScalarFieldEnum = (typeof BackgroundColorScalarFieldEnum)[keyof typeof BackgroundColorScalarFieldEnum]


  export const NeonColorScalarFieldEnum: {
    id: 'id',
    color: 'color',
    userId: 'userId'
  };

  export type NeonColorScalarFieldEnum = (typeof NeonColorScalarFieldEnum)[keyof typeof NeonColorScalarFieldEnum]


  export const StatusbarScalarFieldEnum: {
    id: 'id',
    text: 'text',
    colorBg: 'colorBg',
    colorText: 'colorText',
    fontTextColor: 'fontTextColor',
    statusText: 'statusText',
    userId: 'userId'
  };

  export type StatusbarScalarFieldEnum = (typeof StatusbarScalarFieldEnum)[keyof typeof StatusbarScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'Role'
   */
  export type EnumRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Role'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    userName?: StringFilter<"User"> | string
    password?: StringFilter<"User"> | string
    email?: StringFilter<"User"> | string
    publicEmail?: StringNullableFilter<"User"> | string | null
    profileLink?: StringNullableFilter<"User"> | string | null
    profileImage?: StringNullableFilter<"User"> | string | null
    profileIcon?: StringNullableFilter<"User"> | string | null
    profileSiteText?: StringNullableFilter<"User"> | string | null
    iconUrl?: StringNullableFilter<"User"> | string | null
    description?: StringNullableFilter<"User"> | string | null
    profileHoverColor?: StringNullableFilter<"User"> | string | null
    degBackgroundColor?: IntNullableFilter<"User"> | number | null
    neonEnable?: IntFilter<"User"> | number
    buttonThemeEnable?: IntFilter<"User"> | number
    EnableAnimationArticle?: IntFilter<"User"> | number
    EnableAnimationButton?: IntFilter<"User"> | number
    EnableAnimationBackground?: IntFilter<"User"> | number
    backgroundSize?: IntNullableFilter<"User"> | number | null
    selectedThemeIndex?: IntNullableFilter<"User"> | number | null
    selectedAnimationIndex?: IntNullableFilter<"User"> | number | null
    selectedAnimationButtonIndex?: IntNullableFilter<"User"> | number | null
    selectedAnimationBackgroundIndex?: IntNullableFilter<"User"> | number | null
    animationDurationBackground?: IntNullableFilter<"User"> | number | null
    delayAnimationButton?: FloatNullableFilter<"User"> | number | null
    canvaEnable?: IntFilter<"User"> | number
    selectedCanvasIndex?: IntNullableFilter<"User"> | number | null
    name?: StringFilter<"User"> | string
    emailVerified?: BoolFilter<"User"> | boolean
    image?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    role?: EnumRoleFilter<"User"> | $Enums.Role
    rankScore?: IntFilter<"User"> | number
    bumpedAt?: DateTimeNullableFilter<"User"> | Date | string | null
    bumpExpiresAt?: DateTimeNullableFilter<"User"> | Date | string | null
    bumpPaidUntil?: DateTimeNullableFilter<"User"> | Date | string | null
    isPublic?: BoolFilter<"User"> | boolean
    links?: LinkListRelationFilter
    labels?: LabelListRelationFilter
    socialIcons?: SocialIconListRelationFilter
    background?: BackgroundColorListRelationFilter
    neonColors?: NeonColorListRelationFilter
    statusbar?: XOR<StatusbarNullableScalarRelationFilter, StatusbarWhereInput> | null
    cosmetics?: XOR<CosmeticNullableScalarRelationFilter, CosmeticWhereInput> | null
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    userName?: SortOrder
    password?: SortOrder
    email?: SortOrder
    publicEmail?: SortOrderInput | SortOrder
    profileLink?: SortOrderInput | SortOrder
    profileImage?: SortOrderInput | SortOrder
    profileIcon?: SortOrderInput | SortOrder
    profileSiteText?: SortOrderInput | SortOrder
    iconUrl?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    profileHoverColor?: SortOrderInput | SortOrder
    degBackgroundColor?: SortOrderInput | SortOrder
    neonEnable?: SortOrder
    buttonThemeEnable?: SortOrder
    EnableAnimationArticle?: SortOrder
    EnableAnimationButton?: SortOrder
    EnableAnimationBackground?: SortOrder
    backgroundSize?: SortOrderInput | SortOrder
    selectedThemeIndex?: SortOrderInput | SortOrder
    selectedAnimationIndex?: SortOrderInput | SortOrder
    selectedAnimationButtonIndex?: SortOrderInput | SortOrder
    selectedAnimationBackgroundIndex?: SortOrderInput | SortOrder
    animationDurationBackground?: SortOrderInput | SortOrder
    delayAnimationButton?: SortOrderInput | SortOrder
    canvaEnable?: SortOrder
    selectedCanvasIndex?: SortOrderInput | SortOrder
    name?: SortOrder
    emailVerified?: SortOrder
    image?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    role?: SortOrder
    rankScore?: SortOrder
    bumpedAt?: SortOrderInput | SortOrder
    bumpExpiresAt?: SortOrderInput | SortOrder
    bumpPaidUntil?: SortOrderInput | SortOrder
    isPublic?: SortOrder
    links?: LinkOrderByRelationAggregateInput
    labels?: LabelOrderByRelationAggregateInput
    socialIcons?: SocialIconOrderByRelationAggregateInput
    background?: BackgroundColorOrderByRelationAggregateInput
    neonColors?: NeonColorOrderByRelationAggregateInput
    statusbar?: StatusbarOrderByWithRelationInput
    cosmetics?: CosmeticOrderByWithRelationInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    userName?: StringFilter<"User"> | string
    password?: StringFilter<"User"> | string
    publicEmail?: StringNullableFilter<"User"> | string | null
    profileLink?: StringNullableFilter<"User"> | string | null
    profileImage?: StringNullableFilter<"User"> | string | null
    profileIcon?: StringNullableFilter<"User"> | string | null
    profileSiteText?: StringNullableFilter<"User"> | string | null
    iconUrl?: StringNullableFilter<"User"> | string | null
    description?: StringNullableFilter<"User"> | string | null
    profileHoverColor?: StringNullableFilter<"User"> | string | null
    degBackgroundColor?: IntNullableFilter<"User"> | number | null
    neonEnable?: IntFilter<"User"> | number
    buttonThemeEnable?: IntFilter<"User"> | number
    EnableAnimationArticle?: IntFilter<"User"> | number
    EnableAnimationButton?: IntFilter<"User"> | number
    EnableAnimationBackground?: IntFilter<"User"> | number
    backgroundSize?: IntNullableFilter<"User"> | number | null
    selectedThemeIndex?: IntNullableFilter<"User"> | number | null
    selectedAnimationIndex?: IntNullableFilter<"User"> | number | null
    selectedAnimationButtonIndex?: IntNullableFilter<"User"> | number | null
    selectedAnimationBackgroundIndex?: IntNullableFilter<"User"> | number | null
    animationDurationBackground?: IntNullableFilter<"User"> | number | null
    delayAnimationButton?: FloatNullableFilter<"User"> | number | null
    canvaEnable?: IntFilter<"User"> | number
    selectedCanvasIndex?: IntNullableFilter<"User"> | number | null
    name?: StringFilter<"User"> | string
    emailVerified?: BoolFilter<"User"> | boolean
    image?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    role?: EnumRoleFilter<"User"> | $Enums.Role
    rankScore?: IntFilter<"User"> | number
    bumpedAt?: DateTimeNullableFilter<"User"> | Date | string | null
    bumpExpiresAt?: DateTimeNullableFilter<"User"> | Date | string | null
    bumpPaidUntil?: DateTimeNullableFilter<"User"> | Date | string | null
    isPublic?: BoolFilter<"User"> | boolean
    links?: LinkListRelationFilter
    labels?: LabelListRelationFilter
    socialIcons?: SocialIconListRelationFilter
    background?: BackgroundColorListRelationFilter
    neonColors?: NeonColorListRelationFilter
    statusbar?: XOR<StatusbarNullableScalarRelationFilter, StatusbarWhereInput> | null
    cosmetics?: XOR<CosmeticNullableScalarRelationFilter, CosmeticWhereInput> | null
  }, "id" | "id" | "email">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    userName?: SortOrder
    password?: SortOrder
    email?: SortOrder
    publicEmail?: SortOrderInput | SortOrder
    profileLink?: SortOrderInput | SortOrder
    profileImage?: SortOrderInput | SortOrder
    profileIcon?: SortOrderInput | SortOrder
    profileSiteText?: SortOrderInput | SortOrder
    iconUrl?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    profileHoverColor?: SortOrderInput | SortOrder
    degBackgroundColor?: SortOrderInput | SortOrder
    neonEnable?: SortOrder
    buttonThemeEnable?: SortOrder
    EnableAnimationArticle?: SortOrder
    EnableAnimationButton?: SortOrder
    EnableAnimationBackground?: SortOrder
    backgroundSize?: SortOrderInput | SortOrder
    selectedThemeIndex?: SortOrderInput | SortOrder
    selectedAnimationIndex?: SortOrderInput | SortOrder
    selectedAnimationButtonIndex?: SortOrderInput | SortOrder
    selectedAnimationBackgroundIndex?: SortOrderInput | SortOrder
    animationDurationBackground?: SortOrderInput | SortOrder
    delayAnimationButton?: SortOrderInput | SortOrder
    canvaEnable?: SortOrder
    selectedCanvasIndex?: SortOrderInput | SortOrder
    name?: SortOrder
    emailVerified?: SortOrder
    image?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    role?: SortOrder
    rankScore?: SortOrder
    bumpedAt?: SortOrderInput | SortOrder
    bumpExpiresAt?: SortOrderInput | SortOrder
    bumpPaidUntil?: SortOrderInput | SortOrder
    isPublic?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _avg?: UserAvgOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
    _sum?: UserSumOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    userName?: StringWithAggregatesFilter<"User"> | string
    password?: StringWithAggregatesFilter<"User"> | string
    email?: StringWithAggregatesFilter<"User"> | string
    publicEmail?: StringNullableWithAggregatesFilter<"User"> | string | null
    profileLink?: StringNullableWithAggregatesFilter<"User"> | string | null
    profileImage?: StringNullableWithAggregatesFilter<"User"> | string | null
    profileIcon?: StringNullableWithAggregatesFilter<"User"> | string | null
    profileSiteText?: StringNullableWithAggregatesFilter<"User"> | string | null
    iconUrl?: StringNullableWithAggregatesFilter<"User"> | string | null
    description?: StringNullableWithAggregatesFilter<"User"> | string | null
    profileHoverColor?: StringNullableWithAggregatesFilter<"User"> | string | null
    degBackgroundColor?: IntNullableWithAggregatesFilter<"User"> | number | null
    neonEnable?: IntWithAggregatesFilter<"User"> | number
    buttonThemeEnable?: IntWithAggregatesFilter<"User"> | number
    EnableAnimationArticle?: IntWithAggregatesFilter<"User"> | number
    EnableAnimationButton?: IntWithAggregatesFilter<"User"> | number
    EnableAnimationBackground?: IntWithAggregatesFilter<"User"> | number
    backgroundSize?: IntNullableWithAggregatesFilter<"User"> | number | null
    selectedThemeIndex?: IntNullableWithAggregatesFilter<"User"> | number | null
    selectedAnimationIndex?: IntNullableWithAggregatesFilter<"User"> | number | null
    selectedAnimationButtonIndex?: IntNullableWithAggregatesFilter<"User"> | number | null
    selectedAnimationBackgroundIndex?: IntNullableWithAggregatesFilter<"User"> | number | null
    animationDurationBackground?: IntNullableWithAggregatesFilter<"User"> | number | null
    delayAnimationButton?: FloatNullableWithAggregatesFilter<"User"> | number | null
    canvaEnable?: IntWithAggregatesFilter<"User"> | number
    selectedCanvasIndex?: IntNullableWithAggregatesFilter<"User"> | number | null
    name?: StringWithAggregatesFilter<"User"> | string
    emailVerified?: BoolWithAggregatesFilter<"User"> | boolean
    image?: StringNullableWithAggregatesFilter<"User"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    role?: EnumRoleWithAggregatesFilter<"User"> | $Enums.Role
    rankScore?: IntWithAggregatesFilter<"User"> | number
    bumpedAt?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
    bumpExpiresAt?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
    bumpPaidUntil?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
    isPublic?: BoolWithAggregatesFilter<"User"> | boolean
  }

  export type CosmeticWhereInput = {
    AND?: CosmeticWhereInput | CosmeticWhereInput[]
    OR?: CosmeticWhereInput[]
    NOT?: CosmeticWhereInput | CosmeticWhereInput[]
    id?: IntFilter<"Cosmetic"> | number
    flair?: StringNullableFilter<"Cosmetic"> | string | null
    frame?: StringNullableFilter<"Cosmetic"> | string | null
    theme?: StringNullableFilter<"Cosmetic"> | string | null
    bannerUrl?: StringNullableFilter<"Cosmetic"> | string | null
    userId?: StringFilter<"Cosmetic"> | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type CosmeticOrderByWithRelationInput = {
    id?: SortOrder
    flair?: SortOrderInput | SortOrder
    frame?: SortOrderInput | SortOrder
    theme?: SortOrderInput | SortOrder
    bannerUrl?: SortOrderInput | SortOrder
    userId?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type CosmeticWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    userId?: string
    AND?: CosmeticWhereInput | CosmeticWhereInput[]
    OR?: CosmeticWhereInput[]
    NOT?: CosmeticWhereInput | CosmeticWhereInput[]
    flair?: StringNullableFilter<"Cosmetic"> | string | null
    frame?: StringNullableFilter<"Cosmetic"> | string | null
    theme?: StringNullableFilter<"Cosmetic"> | string | null
    bannerUrl?: StringNullableFilter<"Cosmetic"> | string | null
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "userId">

  export type CosmeticOrderByWithAggregationInput = {
    id?: SortOrder
    flair?: SortOrderInput | SortOrder
    frame?: SortOrderInput | SortOrder
    theme?: SortOrderInput | SortOrder
    bannerUrl?: SortOrderInput | SortOrder
    userId?: SortOrder
    _count?: CosmeticCountOrderByAggregateInput
    _avg?: CosmeticAvgOrderByAggregateInput
    _max?: CosmeticMaxOrderByAggregateInput
    _min?: CosmeticMinOrderByAggregateInput
    _sum?: CosmeticSumOrderByAggregateInput
  }

  export type CosmeticScalarWhereWithAggregatesInput = {
    AND?: CosmeticScalarWhereWithAggregatesInput | CosmeticScalarWhereWithAggregatesInput[]
    OR?: CosmeticScalarWhereWithAggregatesInput[]
    NOT?: CosmeticScalarWhereWithAggregatesInput | CosmeticScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Cosmetic"> | number
    flair?: StringNullableWithAggregatesFilter<"Cosmetic"> | string | null
    frame?: StringNullableWithAggregatesFilter<"Cosmetic"> | string | null
    theme?: StringNullableWithAggregatesFilter<"Cosmetic"> | string | null
    bannerUrl?: StringNullableWithAggregatesFilter<"Cosmetic"> | string | null
    userId?: StringWithAggregatesFilter<"Cosmetic"> | string
  }

  export type LinkWhereInput = {
    AND?: LinkWhereInput | LinkWhereInput[]
    OR?: LinkWhereInput[]
    NOT?: LinkWhereInput | LinkWhereInput[]
    id?: IntFilter<"Link"> | number
    icon?: StringNullableFilter<"Link"> | string | null
    url?: StringFilter<"Link"> | string
    text?: StringNullableFilter<"Link"> | string | null
    name?: StringNullableFilter<"Link"> | string | null
    description?: StringNullableFilter<"Link"> | string | null
    showDescriptionOnHover?: BoolNullableFilter<"Link"> | boolean | null
    showDescription?: BoolNullableFilter<"Link"> | boolean | null
    userId?: StringFilter<"Link"> | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type LinkOrderByWithRelationInput = {
    id?: SortOrder
    icon?: SortOrderInput | SortOrder
    url?: SortOrder
    text?: SortOrderInput | SortOrder
    name?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    showDescriptionOnHover?: SortOrderInput | SortOrder
    showDescription?: SortOrderInput | SortOrder
    userId?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type LinkWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: LinkWhereInput | LinkWhereInput[]
    OR?: LinkWhereInput[]
    NOT?: LinkWhereInput | LinkWhereInput[]
    icon?: StringNullableFilter<"Link"> | string | null
    url?: StringFilter<"Link"> | string
    text?: StringNullableFilter<"Link"> | string | null
    name?: StringNullableFilter<"Link"> | string | null
    description?: StringNullableFilter<"Link"> | string | null
    showDescriptionOnHover?: BoolNullableFilter<"Link"> | boolean | null
    showDescription?: BoolNullableFilter<"Link"> | boolean | null
    userId?: StringFilter<"Link"> | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type LinkOrderByWithAggregationInput = {
    id?: SortOrder
    icon?: SortOrderInput | SortOrder
    url?: SortOrder
    text?: SortOrderInput | SortOrder
    name?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    showDescriptionOnHover?: SortOrderInput | SortOrder
    showDescription?: SortOrderInput | SortOrder
    userId?: SortOrder
    _count?: LinkCountOrderByAggregateInput
    _avg?: LinkAvgOrderByAggregateInput
    _max?: LinkMaxOrderByAggregateInput
    _min?: LinkMinOrderByAggregateInput
    _sum?: LinkSumOrderByAggregateInput
  }

  export type LinkScalarWhereWithAggregatesInput = {
    AND?: LinkScalarWhereWithAggregatesInput | LinkScalarWhereWithAggregatesInput[]
    OR?: LinkScalarWhereWithAggregatesInput[]
    NOT?: LinkScalarWhereWithAggregatesInput | LinkScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Link"> | number
    icon?: StringNullableWithAggregatesFilter<"Link"> | string | null
    url?: StringWithAggregatesFilter<"Link"> | string
    text?: StringNullableWithAggregatesFilter<"Link"> | string | null
    name?: StringNullableWithAggregatesFilter<"Link"> | string | null
    description?: StringNullableWithAggregatesFilter<"Link"> | string | null
    showDescriptionOnHover?: BoolNullableWithAggregatesFilter<"Link"> | boolean | null
    showDescription?: BoolNullableWithAggregatesFilter<"Link"> | boolean | null
    userId?: StringWithAggregatesFilter<"Link"> | string
  }

  export type LabelWhereInput = {
    AND?: LabelWhereInput | LabelWhereInput[]
    OR?: LabelWhereInput[]
    NOT?: LabelWhereInput | LabelWhereInput[]
    id?: IntFilter<"Label"> | number
    data?: StringFilter<"Label"> | string
    color?: StringFilter<"Label"> | string
    fontColor?: StringFilter<"Label"> | string
    userId?: StringFilter<"Label"> | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type LabelOrderByWithRelationInput = {
    id?: SortOrder
    data?: SortOrder
    color?: SortOrder
    fontColor?: SortOrder
    userId?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type LabelWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: LabelWhereInput | LabelWhereInput[]
    OR?: LabelWhereInput[]
    NOT?: LabelWhereInput | LabelWhereInput[]
    data?: StringFilter<"Label"> | string
    color?: StringFilter<"Label"> | string
    fontColor?: StringFilter<"Label"> | string
    userId?: StringFilter<"Label"> | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type LabelOrderByWithAggregationInput = {
    id?: SortOrder
    data?: SortOrder
    color?: SortOrder
    fontColor?: SortOrder
    userId?: SortOrder
    _count?: LabelCountOrderByAggregateInput
    _avg?: LabelAvgOrderByAggregateInput
    _max?: LabelMaxOrderByAggregateInput
    _min?: LabelMinOrderByAggregateInput
    _sum?: LabelSumOrderByAggregateInput
  }

  export type LabelScalarWhereWithAggregatesInput = {
    AND?: LabelScalarWhereWithAggregatesInput | LabelScalarWhereWithAggregatesInput[]
    OR?: LabelScalarWhereWithAggregatesInput[]
    NOT?: LabelScalarWhereWithAggregatesInput | LabelScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Label"> | number
    data?: StringWithAggregatesFilter<"Label"> | string
    color?: StringWithAggregatesFilter<"Label"> | string
    fontColor?: StringWithAggregatesFilter<"Label"> | string
    userId?: StringWithAggregatesFilter<"Label"> | string
  }

  export type SocialIconWhereInput = {
    AND?: SocialIconWhereInput | SocialIconWhereInput[]
    OR?: SocialIconWhereInput[]
    NOT?: SocialIconWhereInput | SocialIconWhereInput[]
    id?: IntFilter<"SocialIcon"> | number
    url?: StringFilter<"SocialIcon"> | string
    icon?: StringFilter<"SocialIcon"> | string
    userId?: StringFilter<"SocialIcon"> | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type SocialIconOrderByWithRelationInput = {
    id?: SortOrder
    url?: SortOrder
    icon?: SortOrder
    userId?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type SocialIconWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: SocialIconWhereInput | SocialIconWhereInput[]
    OR?: SocialIconWhereInput[]
    NOT?: SocialIconWhereInput | SocialIconWhereInput[]
    url?: StringFilter<"SocialIcon"> | string
    icon?: StringFilter<"SocialIcon"> | string
    userId?: StringFilter<"SocialIcon"> | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type SocialIconOrderByWithAggregationInput = {
    id?: SortOrder
    url?: SortOrder
    icon?: SortOrder
    userId?: SortOrder
    _count?: SocialIconCountOrderByAggregateInput
    _avg?: SocialIconAvgOrderByAggregateInput
    _max?: SocialIconMaxOrderByAggregateInput
    _min?: SocialIconMinOrderByAggregateInput
    _sum?: SocialIconSumOrderByAggregateInput
  }

  export type SocialIconScalarWhereWithAggregatesInput = {
    AND?: SocialIconScalarWhereWithAggregatesInput | SocialIconScalarWhereWithAggregatesInput[]
    OR?: SocialIconScalarWhereWithAggregatesInput[]
    NOT?: SocialIconScalarWhereWithAggregatesInput | SocialIconScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"SocialIcon"> | number
    url?: StringWithAggregatesFilter<"SocialIcon"> | string
    icon?: StringWithAggregatesFilter<"SocialIcon"> | string
    userId?: StringWithAggregatesFilter<"SocialIcon"> | string
  }

  export type BackgroundColorWhereInput = {
    AND?: BackgroundColorWhereInput | BackgroundColorWhereInput[]
    OR?: BackgroundColorWhereInput[]
    NOT?: BackgroundColorWhereInput | BackgroundColorWhereInput[]
    id?: IntFilter<"BackgroundColor"> | number
    color?: StringFilter<"BackgroundColor"> | string
    userId?: StringFilter<"BackgroundColor"> | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type BackgroundColorOrderByWithRelationInput = {
    id?: SortOrder
    color?: SortOrder
    userId?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type BackgroundColorWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: BackgroundColorWhereInput | BackgroundColorWhereInput[]
    OR?: BackgroundColorWhereInput[]
    NOT?: BackgroundColorWhereInput | BackgroundColorWhereInput[]
    color?: StringFilter<"BackgroundColor"> | string
    userId?: StringFilter<"BackgroundColor"> | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type BackgroundColorOrderByWithAggregationInput = {
    id?: SortOrder
    color?: SortOrder
    userId?: SortOrder
    _count?: BackgroundColorCountOrderByAggregateInput
    _avg?: BackgroundColorAvgOrderByAggregateInput
    _max?: BackgroundColorMaxOrderByAggregateInput
    _min?: BackgroundColorMinOrderByAggregateInput
    _sum?: BackgroundColorSumOrderByAggregateInput
  }

  export type BackgroundColorScalarWhereWithAggregatesInput = {
    AND?: BackgroundColorScalarWhereWithAggregatesInput | BackgroundColorScalarWhereWithAggregatesInput[]
    OR?: BackgroundColorScalarWhereWithAggregatesInput[]
    NOT?: BackgroundColorScalarWhereWithAggregatesInput | BackgroundColorScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"BackgroundColor"> | number
    color?: StringWithAggregatesFilter<"BackgroundColor"> | string
    userId?: StringWithAggregatesFilter<"BackgroundColor"> | string
  }

  export type NeonColorWhereInput = {
    AND?: NeonColorWhereInput | NeonColorWhereInput[]
    OR?: NeonColorWhereInput[]
    NOT?: NeonColorWhereInput | NeonColorWhereInput[]
    id?: IntFilter<"NeonColor"> | number
    color?: StringFilter<"NeonColor"> | string
    userId?: StringFilter<"NeonColor"> | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type NeonColorOrderByWithRelationInput = {
    id?: SortOrder
    color?: SortOrder
    userId?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type NeonColorWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: NeonColorWhereInput | NeonColorWhereInput[]
    OR?: NeonColorWhereInput[]
    NOT?: NeonColorWhereInput | NeonColorWhereInput[]
    color?: StringFilter<"NeonColor"> | string
    userId?: StringFilter<"NeonColor"> | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type NeonColorOrderByWithAggregationInput = {
    id?: SortOrder
    color?: SortOrder
    userId?: SortOrder
    _count?: NeonColorCountOrderByAggregateInput
    _avg?: NeonColorAvgOrderByAggregateInput
    _max?: NeonColorMaxOrderByAggregateInput
    _min?: NeonColorMinOrderByAggregateInput
    _sum?: NeonColorSumOrderByAggregateInput
  }

  export type NeonColorScalarWhereWithAggregatesInput = {
    AND?: NeonColorScalarWhereWithAggregatesInput | NeonColorScalarWhereWithAggregatesInput[]
    OR?: NeonColorScalarWhereWithAggregatesInput[]
    NOT?: NeonColorScalarWhereWithAggregatesInput | NeonColorScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"NeonColor"> | number
    color?: StringWithAggregatesFilter<"NeonColor"> | string
    userId?: StringWithAggregatesFilter<"NeonColor"> | string
  }

  export type StatusbarWhereInput = {
    AND?: StatusbarWhereInput | StatusbarWhereInput[]
    OR?: StatusbarWhereInput[]
    NOT?: StatusbarWhereInput | StatusbarWhereInput[]
    id?: IntFilter<"Statusbar"> | number
    text?: StringNullableFilter<"Statusbar"> | string | null
    colorBg?: StringNullableFilter<"Statusbar"> | string | null
    colorText?: StringNullableFilter<"Statusbar"> | string | null
    fontTextColor?: IntNullableFilter<"Statusbar"> | number | null
    statusText?: StringNullableFilter<"Statusbar"> | string | null
    userId?: StringFilter<"Statusbar"> | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type StatusbarOrderByWithRelationInput = {
    id?: SortOrder
    text?: SortOrderInput | SortOrder
    colorBg?: SortOrderInput | SortOrder
    colorText?: SortOrderInput | SortOrder
    fontTextColor?: SortOrderInput | SortOrder
    statusText?: SortOrderInput | SortOrder
    userId?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type StatusbarWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    userId?: string
    AND?: StatusbarWhereInput | StatusbarWhereInput[]
    OR?: StatusbarWhereInput[]
    NOT?: StatusbarWhereInput | StatusbarWhereInput[]
    text?: StringNullableFilter<"Statusbar"> | string | null
    colorBg?: StringNullableFilter<"Statusbar"> | string | null
    colorText?: StringNullableFilter<"Statusbar"> | string | null
    fontTextColor?: IntNullableFilter<"Statusbar"> | number | null
    statusText?: StringNullableFilter<"Statusbar"> | string | null
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "userId">

  export type StatusbarOrderByWithAggregationInput = {
    id?: SortOrder
    text?: SortOrderInput | SortOrder
    colorBg?: SortOrderInput | SortOrder
    colorText?: SortOrderInput | SortOrder
    fontTextColor?: SortOrderInput | SortOrder
    statusText?: SortOrderInput | SortOrder
    userId?: SortOrder
    _count?: StatusbarCountOrderByAggregateInput
    _avg?: StatusbarAvgOrderByAggregateInput
    _max?: StatusbarMaxOrderByAggregateInput
    _min?: StatusbarMinOrderByAggregateInput
    _sum?: StatusbarSumOrderByAggregateInput
  }

  export type StatusbarScalarWhereWithAggregatesInput = {
    AND?: StatusbarScalarWhereWithAggregatesInput | StatusbarScalarWhereWithAggregatesInput[]
    OR?: StatusbarScalarWhereWithAggregatesInput[]
    NOT?: StatusbarScalarWhereWithAggregatesInput | StatusbarScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Statusbar"> | number
    text?: StringNullableWithAggregatesFilter<"Statusbar"> | string | null
    colorBg?: StringNullableWithAggregatesFilter<"Statusbar"> | string | null
    colorText?: StringNullableWithAggregatesFilter<"Statusbar"> | string | null
    fontTextColor?: IntNullableWithAggregatesFilter<"Statusbar"> | number | null
    statusText?: StringNullableWithAggregatesFilter<"Statusbar"> | string | null
    userId?: StringWithAggregatesFilter<"Statusbar"> | string
  }

  export type UserCreateInput = {
    id: string
    userName: string
    password: string
    email: string
    publicEmail?: string | null
    profileLink?: string | null
    profileImage?: string | null
    profileIcon?: string | null
    profileSiteText?: string | null
    iconUrl?: string | null
    description?: string | null
    profileHoverColor?: string | null
    degBackgroundColor?: number | null
    neonEnable?: number
    buttonThemeEnable?: number
    EnableAnimationArticle?: number
    EnableAnimationButton?: number
    EnableAnimationBackground?: number
    backgroundSize?: number | null
    selectedThemeIndex?: number | null
    selectedAnimationIndex?: number | null
    selectedAnimationButtonIndex?: number | null
    selectedAnimationBackgroundIndex?: number | null
    animationDurationBackground?: number | null
    delayAnimationButton?: number | null
    canvaEnable?: number
    selectedCanvasIndex?: number | null
    name: string
    emailVerified?: boolean
    image?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    role?: $Enums.Role
    rankScore?: number
    bumpedAt?: Date | string | null
    bumpExpiresAt?: Date | string | null
    bumpPaidUntil?: Date | string | null
    isPublic?: boolean
    links?: LinkCreateNestedManyWithoutUserInput
    labels?: LabelCreateNestedManyWithoutUserInput
    socialIcons?: SocialIconCreateNestedManyWithoutUserInput
    background?: BackgroundColorCreateNestedManyWithoutUserInput
    neonColors?: NeonColorCreateNestedManyWithoutUserInput
    statusbar?: StatusbarCreateNestedOneWithoutUserInput
    cosmetics?: CosmeticCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id: string
    userName: string
    password: string
    email: string
    publicEmail?: string | null
    profileLink?: string | null
    profileImage?: string | null
    profileIcon?: string | null
    profileSiteText?: string | null
    iconUrl?: string | null
    description?: string | null
    profileHoverColor?: string | null
    degBackgroundColor?: number | null
    neonEnable?: number
    buttonThemeEnable?: number
    EnableAnimationArticle?: number
    EnableAnimationButton?: number
    EnableAnimationBackground?: number
    backgroundSize?: number | null
    selectedThemeIndex?: number | null
    selectedAnimationIndex?: number | null
    selectedAnimationButtonIndex?: number | null
    selectedAnimationBackgroundIndex?: number | null
    animationDurationBackground?: number | null
    delayAnimationButton?: number | null
    canvaEnable?: number
    selectedCanvasIndex?: number | null
    name: string
    emailVerified?: boolean
    image?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    role?: $Enums.Role
    rankScore?: number
    bumpedAt?: Date | string | null
    bumpExpiresAt?: Date | string | null
    bumpPaidUntil?: Date | string | null
    isPublic?: boolean
    links?: LinkUncheckedCreateNestedManyWithoutUserInput
    labels?: LabelUncheckedCreateNestedManyWithoutUserInput
    socialIcons?: SocialIconUncheckedCreateNestedManyWithoutUserInput
    background?: BackgroundColorUncheckedCreateNestedManyWithoutUserInput
    neonColors?: NeonColorUncheckedCreateNestedManyWithoutUserInput
    statusbar?: StatusbarUncheckedCreateNestedOneWithoutUserInput
    cosmetics?: CosmeticUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userName?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    publicEmail?: NullableStringFieldUpdateOperationsInput | string | null
    profileLink?: NullableStringFieldUpdateOperationsInput | string | null
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    profileIcon?: NullableStringFieldUpdateOperationsInput | string | null
    profileSiteText?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    profileHoverColor?: NullableStringFieldUpdateOperationsInput | string | null
    degBackgroundColor?: NullableIntFieldUpdateOperationsInput | number | null
    neonEnable?: IntFieldUpdateOperationsInput | number
    buttonThemeEnable?: IntFieldUpdateOperationsInput | number
    EnableAnimationArticle?: IntFieldUpdateOperationsInput | number
    EnableAnimationButton?: IntFieldUpdateOperationsInput | number
    EnableAnimationBackground?: IntFieldUpdateOperationsInput | number
    backgroundSize?: NullableIntFieldUpdateOperationsInput | number | null
    selectedThemeIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationButtonIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationBackgroundIndex?: NullableIntFieldUpdateOperationsInput | number | null
    animationDurationBackground?: NullableIntFieldUpdateOperationsInput | number | null
    delayAnimationButton?: NullableFloatFieldUpdateOperationsInput | number | null
    canvaEnable?: IntFieldUpdateOperationsInput | number
    selectedCanvasIndex?: NullableIntFieldUpdateOperationsInput | number | null
    name?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    rankScore?: IntFieldUpdateOperationsInput | number
    bumpedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpPaidUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    links?: LinkUpdateManyWithoutUserNestedInput
    labels?: LabelUpdateManyWithoutUserNestedInput
    socialIcons?: SocialIconUpdateManyWithoutUserNestedInput
    background?: BackgroundColorUpdateManyWithoutUserNestedInput
    neonColors?: NeonColorUpdateManyWithoutUserNestedInput
    statusbar?: StatusbarUpdateOneWithoutUserNestedInput
    cosmetics?: CosmeticUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userName?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    publicEmail?: NullableStringFieldUpdateOperationsInput | string | null
    profileLink?: NullableStringFieldUpdateOperationsInput | string | null
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    profileIcon?: NullableStringFieldUpdateOperationsInput | string | null
    profileSiteText?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    profileHoverColor?: NullableStringFieldUpdateOperationsInput | string | null
    degBackgroundColor?: NullableIntFieldUpdateOperationsInput | number | null
    neonEnable?: IntFieldUpdateOperationsInput | number
    buttonThemeEnable?: IntFieldUpdateOperationsInput | number
    EnableAnimationArticle?: IntFieldUpdateOperationsInput | number
    EnableAnimationButton?: IntFieldUpdateOperationsInput | number
    EnableAnimationBackground?: IntFieldUpdateOperationsInput | number
    backgroundSize?: NullableIntFieldUpdateOperationsInput | number | null
    selectedThemeIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationButtonIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationBackgroundIndex?: NullableIntFieldUpdateOperationsInput | number | null
    animationDurationBackground?: NullableIntFieldUpdateOperationsInput | number | null
    delayAnimationButton?: NullableFloatFieldUpdateOperationsInput | number | null
    canvaEnable?: IntFieldUpdateOperationsInput | number
    selectedCanvasIndex?: NullableIntFieldUpdateOperationsInput | number | null
    name?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    rankScore?: IntFieldUpdateOperationsInput | number
    bumpedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpPaidUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    links?: LinkUncheckedUpdateManyWithoutUserNestedInput
    labels?: LabelUncheckedUpdateManyWithoutUserNestedInput
    socialIcons?: SocialIconUncheckedUpdateManyWithoutUserNestedInput
    background?: BackgroundColorUncheckedUpdateManyWithoutUserNestedInput
    neonColors?: NeonColorUncheckedUpdateManyWithoutUserNestedInput
    statusbar?: StatusbarUncheckedUpdateOneWithoutUserNestedInput
    cosmetics?: CosmeticUncheckedUpdateOneWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id: string
    userName: string
    password: string
    email: string
    publicEmail?: string | null
    profileLink?: string | null
    profileImage?: string | null
    profileIcon?: string | null
    profileSiteText?: string | null
    iconUrl?: string | null
    description?: string | null
    profileHoverColor?: string | null
    degBackgroundColor?: number | null
    neonEnable?: number
    buttonThemeEnable?: number
    EnableAnimationArticle?: number
    EnableAnimationButton?: number
    EnableAnimationBackground?: number
    backgroundSize?: number | null
    selectedThemeIndex?: number | null
    selectedAnimationIndex?: number | null
    selectedAnimationButtonIndex?: number | null
    selectedAnimationBackgroundIndex?: number | null
    animationDurationBackground?: number | null
    delayAnimationButton?: number | null
    canvaEnable?: number
    selectedCanvasIndex?: number | null
    name: string
    emailVerified?: boolean
    image?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    role?: $Enums.Role
    rankScore?: number
    bumpedAt?: Date | string | null
    bumpExpiresAt?: Date | string | null
    bumpPaidUntil?: Date | string | null
    isPublic?: boolean
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    userName?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    publicEmail?: NullableStringFieldUpdateOperationsInput | string | null
    profileLink?: NullableStringFieldUpdateOperationsInput | string | null
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    profileIcon?: NullableStringFieldUpdateOperationsInput | string | null
    profileSiteText?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    profileHoverColor?: NullableStringFieldUpdateOperationsInput | string | null
    degBackgroundColor?: NullableIntFieldUpdateOperationsInput | number | null
    neonEnable?: IntFieldUpdateOperationsInput | number
    buttonThemeEnable?: IntFieldUpdateOperationsInput | number
    EnableAnimationArticle?: IntFieldUpdateOperationsInput | number
    EnableAnimationButton?: IntFieldUpdateOperationsInput | number
    EnableAnimationBackground?: IntFieldUpdateOperationsInput | number
    backgroundSize?: NullableIntFieldUpdateOperationsInput | number | null
    selectedThemeIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationButtonIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationBackgroundIndex?: NullableIntFieldUpdateOperationsInput | number | null
    animationDurationBackground?: NullableIntFieldUpdateOperationsInput | number | null
    delayAnimationButton?: NullableFloatFieldUpdateOperationsInput | number | null
    canvaEnable?: IntFieldUpdateOperationsInput | number
    selectedCanvasIndex?: NullableIntFieldUpdateOperationsInput | number | null
    name?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    rankScore?: IntFieldUpdateOperationsInput | number
    bumpedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpPaidUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isPublic?: BoolFieldUpdateOperationsInput | boolean
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userName?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    publicEmail?: NullableStringFieldUpdateOperationsInput | string | null
    profileLink?: NullableStringFieldUpdateOperationsInput | string | null
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    profileIcon?: NullableStringFieldUpdateOperationsInput | string | null
    profileSiteText?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    profileHoverColor?: NullableStringFieldUpdateOperationsInput | string | null
    degBackgroundColor?: NullableIntFieldUpdateOperationsInput | number | null
    neonEnable?: IntFieldUpdateOperationsInput | number
    buttonThemeEnable?: IntFieldUpdateOperationsInput | number
    EnableAnimationArticle?: IntFieldUpdateOperationsInput | number
    EnableAnimationButton?: IntFieldUpdateOperationsInput | number
    EnableAnimationBackground?: IntFieldUpdateOperationsInput | number
    backgroundSize?: NullableIntFieldUpdateOperationsInput | number | null
    selectedThemeIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationButtonIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationBackgroundIndex?: NullableIntFieldUpdateOperationsInput | number | null
    animationDurationBackground?: NullableIntFieldUpdateOperationsInput | number | null
    delayAnimationButton?: NullableFloatFieldUpdateOperationsInput | number | null
    canvaEnable?: IntFieldUpdateOperationsInput | number
    selectedCanvasIndex?: NullableIntFieldUpdateOperationsInput | number | null
    name?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    rankScore?: IntFieldUpdateOperationsInput | number
    bumpedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpPaidUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isPublic?: BoolFieldUpdateOperationsInput | boolean
  }

  export type CosmeticCreateInput = {
    flair?: string | null
    frame?: string | null
    theme?: string | null
    bannerUrl?: string | null
    user: UserCreateNestedOneWithoutCosmeticsInput
  }

  export type CosmeticUncheckedCreateInput = {
    id?: number
    flair?: string | null
    frame?: string | null
    theme?: string | null
    bannerUrl?: string | null
    userId: string
  }

  export type CosmeticUpdateInput = {
    flair?: NullableStringFieldUpdateOperationsInput | string | null
    frame?: NullableStringFieldUpdateOperationsInput | string | null
    theme?: NullableStringFieldUpdateOperationsInput | string | null
    bannerUrl?: NullableStringFieldUpdateOperationsInput | string | null
    user?: UserUpdateOneRequiredWithoutCosmeticsNestedInput
  }

  export type CosmeticUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    flair?: NullableStringFieldUpdateOperationsInput | string | null
    frame?: NullableStringFieldUpdateOperationsInput | string | null
    theme?: NullableStringFieldUpdateOperationsInput | string | null
    bannerUrl?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type CosmeticCreateManyInput = {
    id?: number
    flair?: string | null
    frame?: string | null
    theme?: string | null
    bannerUrl?: string | null
    userId: string
  }

  export type CosmeticUpdateManyMutationInput = {
    flair?: NullableStringFieldUpdateOperationsInput | string | null
    frame?: NullableStringFieldUpdateOperationsInput | string | null
    theme?: NullableStringFieldUpdateOperationsInput | string | null
    bannerUrl?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type CosmeticUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    flair?: NullableStringFieldUpdateOperationsInput | string | null
    frame?: NullableStringFieldUpdateOperationsInput | string | null
    theme?: NullableStringFieldUpdateOperationsInput | string | null
    bannerUrl?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type LinkCreateInput = {
    icon?: string | null
    url?: string
    text?: string | null
    name?: string | null
    description?: string | null
    showDescriptionOnHover?: boolean | null
    showDescription?: boolean | null
    user: UserCreateNestedOneWithoutLinksInput
  }

  export type LinkUncheckedCreateInput = {
    id?: number
    icon?: string | null
    url?: string
    text?: string | null
    name?: string | null
    description?: string | null
    showDescriptionOnHover?: boolean | null
    showDescription?: boolean | null
    userId: string
  }

  export type LinkUpdateInput = {
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    url?: StringFieldUpdateOperationsInput | string
    text?: NullableStringFieldUpdateOperationsInput | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    showDescriptionOnHover?: NullableBoolFieldUpdateOperationsInput | boolean | null
    showDescription?: NullableBoolFieldUpdateOperationsInput | boolean | null
    user?: UserUpdateOneRequiredWithoutLinksNestedInput
  }

  export type LinkUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    url?: StringFieldUpdateOperationsInput | string
    text?: NullableStringFieldUpdateOperationsInput | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    showDescriptionOnHover?: NullableBoolFieldUpdateOperationsInput | boolean | null
    showDescription?: NullableBoolFieldUpdateOperationsInput | boolean | null
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type LinkCreateManyInput = {
    id?: number
    icon?: string | null
    url?: string
    text?: string | null
    name?: string | null
    description?: string | null
    showDescriptionOnHover?: boolean | null
    showDescription?: boolean | null
    userId: string
  }

  export type LinkUpdateManyMutationInput = {
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    url?: StringFieldUpdateOperationsInput | string
    text?: NullableStringFieldUpdateOperationsInput | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    showDescriptionOnHover?: NullableBoolFieldUpdateOperationsInput | boolean | null
    showDescription?: NullableBoolFieldUpdateOperationsInput | boolean | null
  }

  export type LinkUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    url?: StringFieldUpdateOperationsInput | string
    text?: NullableStringFieldUpdateOperationsInput | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    showDescriptionOnHover?: NullableBoolFieldUpdateOperationsInput | boolean | null
    showDescription?: NullableBoolFieldUpdateOperationsInput | boolean | null
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type LabelCreateInput = {
    data?: string
    color?: string
    fontColor?: string
    user: UserCreateNestedOneWithoutLabelsInput
  }

  export type LabelUncheckedCreateInput = {
    id?: number
    data?: string
    color?: string
    fontColor?: string
    userId: string
  }

  export type LabelUpdateInput = {
    data?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    fontColor?: StringFieldUpdateOperationsInput | string
    user?: UserUpdateOneRequiredWithoutLabelsNestedInput
  }

  export type LabelUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    data?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    fontColor?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type LabelCreateManyInput = {
    id?: number
    data?: string
    color?: string
    fontColor?: string
    userId: string
  }

  export type LabelUpdateManyMutationInput = {
    data?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    fontColor?: StringFieldUpdateOperationsInput | string
  }

  export type LabelUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    data?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    fontColor?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type SocialIconCreateInput = {
    url?: string
    icon?: string
    user: UserCreateNestedOneWithoutSocialIconsInput
  }

  export type SocialIconUncheckedCreateInput = {
    id?: number
    url?: string
    icon?: string
    userId: string
  }

  export type SocialIconUpdateInput = {
    url?: StringFieldUpdateOperationsInput | string
    icon?: StringFieldUpdateOperationsInput | string
    user?: UserUpdateOneRequiredWithoutSocialIconsNestedInput
  }

  export type SocialIconUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    url?: StringFieldUpdateOperationsInput | string
    icon?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type SocialIconCreateManyInput = {
    id?: number
    url?: string
    icon?: string
    userId: string
  }

  export type SocialIconUpdateManyMutationInput = {
    url?: StringFieldUpdateOperationsInput | string
    icon?: StringFieldUpdateOperationsInput | string
  }

  export type SocialIconUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    url?: StringFieldUpdateOperationsInput | string
    icon?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type BackgroundColorCreateInput = {
    color?: string
    user: UserCreateNestedOneWithoutBackgroundInput
  }

  export type BackgroundColorUncheckedCreateInput = {
    id?: number
    color?: string
    userId: string
  }

  export type BackgroundColorUpdateInput = {
    color?: StringFieldUpdateOperationsInput | string
    user?: UserUpdateOneRequiredWithoutBackgroundNestedInput
  }

  export type BackgroundColorUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    color?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type BackgroundColorCreateManyInput = {
    id?: number
    color?: string
    userId: string
  }

  export type BackgroundColorUpdateManyMutationInput = {
    color?: StringFieldUpdateOperationsInput | string
  }

  export type BackgroundColorUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    color?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type NeonColorCreateInput = {
    color?: string
    user: UserCreateNestedOneWithoutNeonColorsInput
  }

  export type NeonColorUncheckedCreateInput = {
    id?: number
    color?: string
    userId: string
  }

  export type NeonColorUpdateInput = {
    color?: StringFieldUpdateOperationsInput | string
    user?: UserUpdateOneRequiredWithoutNeonColorsNestedInput
  }

  export type NeonColorUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    color?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type NeonColorCreateManyInput = {
    id?: number
    color?: string
    userId: string
  }

  export type NeonColorUpdateManyMutationInput = {
    color?: StringFieldUpdateOperationsInput | string
  }

  export type NeonColorUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    color?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type StatusbarCreateInput = {
    text?: string | null
    colorBg?: string | null
    colorText?: string | null
    fontTextColor?: number | null
    statusText?: string | null
    user: UserCreateNestedOneWithoutStatusbarInput
  }

  export type StatusbarUncheckedCreateInput = {
    id?: number
    text?: string | null
    colorBg?: string | null
    colorText?: string | null
    fontTextColor?: number | null
    statusText?: string | null
    userId: string
  }

  export type StatusbarUpdateInput = {
    text?: NullableStringFieldUpdateOperationsInput | string | null
    colorBg?: NullableStringFieldUpdateOperationsInput | string | null
    colorText?: NullableStringFieldUpdateOperationsInput | string | null
    fontTextColor?: NullableIntFieldUpdateOperationsInput | number | null
    statusText?: NullableStringFieldUpdateOperationsInput | string | null
    user?: UserUpdateOneRequiredWithoutStatusbarNestedInput
  }

  export type StatusbarUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    text?: NullableStringFieldUpdateOperationsInput | string | null
    colorBg?: NullableStringFieldUpdateOperationsInput | string | null
    colorText?: NullableStringFieldUpdateOperationsInput | string | null
    fontTextColor?: NullableIntFieldUpdateOperationsInput | number | null
    statusText?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type StatusbarCreateManyInput = {
    id?: number
    text?: string | null
    colorBg?: string | null
    colorText?: string | null
    fontTextColor?: number | null
    statusText?: string | null
    userId: string
  }

  export type StatusbarUpdateManyMutationInput = {
    text?: NullableStringFieldUpdateOperationsInput | string | null
    colorBg?: NullableStringFieldUpdateOperationsInput | string | null
    colorText?: NullableStringFieldUpdateOperationsInput | string | null
    fontTextColor?: NullableIntFieldUpdateOperationsInput | number | null
    statusText?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type StatusbarUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    text?: NullableStringFieldUpdateOperationsInput | string | null
    colorBg?: NullableStringFieldUpdateOperationsInput | string | null
    colorText?: NullableStringFieldUpdateOperationsInput | string | null
    fontTextColor?: NullableIntFieldUpdateOperationsInput | number | null
    statusText?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type EnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[]
    notIn?: $Enums.Role[]
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type LinkListRelationFilter = {
    every?: LinkWhereInput
    some?: LinkWhereInput
    none?: LinkWhereInput
  }

  export type LabelListRelationFilter = {
    every?: LabelWhereInput
    some?: LabelWhereInput
    none?: LabelWhereInput
  }

  export type SocialIconListRelationFilter = {
    every?: SocialIconWhereInput
    some?: SocialIconWhereInput
    none?: SocialIconWhereInput
  }

  export type BackgroundColorListRelationFilter = {
    every?: BackgroundColorWhereInput
    some?: BackgroundColorWhereInput
    none?: BackgroundColorWhereInput
  }

  export type NeonColorListRelationFilter = {
    every?: NeonColorWhereInput
    some?: NeonColorWhereInput
    none?: NeonColorWhereInput
  }

  export type StatusbarNullableScalarRelationFilter = {
    is?: StatusbarWhereInput | null
    isNot?: StatusbarWhereInput | null
  }

  export type CosmeticNullableScalarRelationFilter = {
    is?: CosmeticWhereInput | null
    isNot?: CosmeticWhereInput | null
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type LinkOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type LabelOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SocialIconOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type BackgroundColorOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type NeonColorOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    userName?: SortOrder
    password?: SortOrder
    email?: SortOrder
    publicEmail?: SortOrder
    profileLink?: SortOrder
    profileImage?: SortOrder
    profileIcon?: SortOrder
    profileSiteText?: SortOrder
    iconUrl?: SortOrder
    description?: SortOrder
    profileHoverColor?: SortOrder
    degBackgroundColor?: SortOrder
    neonEnable?: SortOrder
    buttonThemeEnable?: SortOrder
    EnableAnimationArticle?: SortOrder
    EnableAnimationButton?: SortOrder
    EnableAnimationBackground?: SortOrder
    backgroundSize?: SortOrder
    selectedThemeIndex?: SortOrder
    selectedAnimationIndex?: SortOrder
    selectedAnimationButtonIndex?: SortOrder
    selectedAnimationBackgroundIndex?: SortOrder
    animationDurationBackground?: SortOrder
    delayAnimationButton?: SortOrder
    canvaEnable?: SortOrder
    selectedCanvasIndex?: SortOrder
    name?: SortOrder
    emailVerified?: SortOrder
    image?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    role?: SortOrder
    rankScore?: SortOrder
    bumpedAt?: SortOrder
    bumpExpiresAt?: SortOrder
    bumpPaidUntil?: SortOrder
    isPublic?: SortOrder
  }

  export type UserAvgOrderByAggregateInput = {
    degBackgroundColor?: SortOrder
    neonEnable?: SortOrder
    buttonThemeEnable?: SortOrder
    EnableAnimationArticle?: SortOrder
    EnableAnimationButton?: SortOrder
    EnableAnimationBackground?: SortOrder
    backgroundSize?: SortOrder
    selectedThemeIndex?: SortOrder
    selectedAnimationIndex?: SortOrder
    selectedAnimationButtonIndex?: SortOrder
    selectedAnimationBackgroundIndex?: SortOrder
    animationDurationBackground?: SortOrder
    delayAnimationButton?: SortOrder
    canvaEnable?: SortOrder
    selectedCanvasIndex?: SortOrder
    rankScore?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    userName?: SortOrder
    password?: SortOrder
    email?: SortOrder
    publicEmail?: SortOrder
    profileLink?: SortOrder
    profileImage?: SortOrder
    profileIcon?: SortOrder
    profileSiteText?: SortOrder
    iconUrl?: SortOrder
    description?: SortOrder
    profileHoverColor?: SortOrder
    degBackgroundColor?: SortOrder
    neonEnable?: SortOrder
    buttonThemeEnable?: SortOrder
    EnableAnimationArticle?: SortOrder
    EnableAnimationButton?: SortOrder
    EnableAnimationBackground?: SortOrder
    backgroundSize?: SortOrder
    selectedThemeIndex?: SortOrder
    selectedAnimationIndex?: SortOrder
    selectedAnimationButtonIndex?: SortOrder
    selectedAnimationBackgroundIndex?: SortOrder
    animationDurationBackground?: SortOrder
    delayAnimationButton?: SortOrder
    canvaEnable?: SortOrder
    selectedCanvasIndex?: SortOrder
    name?: SortOrder
    emailVerified?: SortOrder
    image?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    role?: SortOrder
    rankScore?: SortOrder
    bumpedAt?: SortOrder
    bumpExpiresAt?: SortOrder
    bumpPaidUntil?: SortOrder
    isPublic?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    userName?: SortOrder
    password?: SortOrder
    email?: SortOrder
    publicEmail?: SortOrder
    profileLink?: SortOrder
    profileImage?: SortOrder
    profileIcon?: SortOrder
    profileSiteText?: SortOrder
    iconUrl?: SortOrder
    description?: SortOrder
    profileHoverColor?: SortOrder
    degBackgroundColor?: SortOrder
    neonEnable?: SortOrder
    buttonThemeEnable?: SortOrder
    EnableAnimationArticle?: SortOrder
    EnableAnimationButton?: SortOrder
    EnableAnimationBackground?: SortOrder
    backgroundSize?: SortOrder
    selectedThemeIndex?: SortOrder
    selectedAnimationIndex?: SortOrder
    selectedAnimationButtonIndex?: SortOrder
    selectedAnimationBackgroundIndex?: SortOrder
    animationDurationBackground?: SortOrder
    delayAnimationButton?: SortOrder
    canvaEnable?: SortOrder
    selectedCanvasIndex?: SortOrder
    name?: SortOrder
    emailVerified?: SortOrder
    image?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    role?: SortOrder
    rankScore?: SortOrder
    bumpedAt?: SortOrder
    bumpExpiresAt?: SortOrder
    bumpPaidUntil?: SortOrder
    isPublic?: SortOrder
  }

  export type UserSumOrderByAggregateInput = {
    degBackgroundColor?: SortOrder
    neonEnable?: SortOrder
    buttonThemeEnable?: SortOrder
    EnableAnimationArticle?: SortOrder
    EnableAnimationButton?: SortOrder
    EnableAnimationBackground?: SortOrder
    backgroundSize?: SortOrder
    selectedThemeIndex?: SortOrder
    selectedAnimationIndex?: SortOrder
    selectedAnimationButtonIndex?: SortOrder
    selectedAnimationBackgroundIndex?: SortOrder
    animationDurationBackground?: SortOrder
    delayAnimationButton?: SortOrder
    canvaEnable?: SortOrder
    selectedCanvasIndex?: SortOrder
    rankScore?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type EnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[]
    notIn?: $Enums.Role[]
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type CosmeticCountOrderByAggregateInput = {
    id?: SortOrder
    flair?: SortOrder
    frame?: SortOrder
    theme?: SortOrder
    bannerUrl?: SortOrder
    userId?: SortOrder
  }

  export type CosmeticAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type CosmeticMaxOrderByAggregateInput = {
    id?: SortOrder
    flair?: SortOrder
    frame?: SortOrder
    theme?: SortOrder
    bannerUrl?: SortOrder
    userId?: SortOrder
  }

  export type CosmeticMinOrderByAggregateInput = {
    id?: SortOrder
    flair?: SortOrder
    frame?: SortOrder
    theme?: SortOrder
    bannerUrl?: SortOrder
    userId?: SortOrder
  }

  export type CosmeticSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type BoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
  }

  export type LinkCountOrderByAggregateInput = {
    id?: SortOrder
    icon?: SortOrder
    url?: SortOrder
    text?: SortOrder
    name?: SortOrder
    description?: SortOrder
    showDescriptionOnHover?: SortOrder
    showDescription?: SortOrder
    userId?: SortOrder
  }

  export type LinkAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type LinkMaxOrderByAggregateInput = {
    id?: SortOrder
    icon?: SortOrder
    url?: SortOrder
    text?: SortOrder
    name?: SortOrder
    description?: SortOrder
    showDescriptionOnHover?: SortOrder
    showDescription?: SortOrder
    userId?: SortOrder
  }

  export type LinkMinOrderByAggregateInput = {
    id?: SortOrder
    icon?: SortOrder
    url?: SortOrder
    text?: SortOrder
    name?: SortOrder
    description?: SortOrder
    showDescriptionOnHover?: SortOrder
    showDescription?: SortOrder
    userId?: SortOrder
  }

  export type LinkSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type BoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBoolNullableFilter<$PrismaModel>
    _max?: NestedBoolNullableFilter<$PrismaModel>
  }

  export type LabelCountOrderByAggregateInput = {
    id?: SortOrder
    data?: SortOrder
    color?: SortOrder
    fontColor?: SortOrder
    userId?: SortOrder
  }

  export type LabelAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type LabelMaxOrderByAggregateInput = {
    id?: SortOrder
    data?: SortOrder
    color?: SortOrder
    fontColor?: SortOrder
    userId?: SortOrder
  }

  export type LabelMinOrderByAggregateInput = {
    id?: SortOrder
    data?: SortOrder
    color?: SortOrder
    fontColor?: SortOrder
    userId?: SortOrder
  }

  export type LabelSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type SocialIconCountOrderByAggregateInput = {
    id?: SortOrder
    url?: SortOrder
    icon?: SortOrder
    userId?: SortOrder
  }

  export type SocialIconAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type SocialIconMaxOrderByAggregateInput = {
    id?: SortOrder
    url?: SortOrder
    icon?: SortOrder
    userId?: SortOrder
  }

  export type SocialIconMinOrderByAggregateInput = {
    id?: SortOrder
    url?: SortOrder
    icon?: SortOrder
    userId?: SortOrder
  }

  export type SocialIconSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type BackgroundColorCountOrderByAggregateInput = {
    id?: SortOrder
    color?: SortOrder
    userId?: SortOrder
  }

  export type BackgroundColorAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type BackgroundColorMaxOrderByAggregateInput = {
    id?: SortOrder
    color?: SortOrder
    userId?: SortOrder
  }

  export type BackgroundColorMinOrderByAggregateInput = {
    id?: SortOrder
    color?: SortOrder
    userId?: SortOrder
  }

  export type BackgroundColorSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type NeonColorCountOrderByAggregateInput = {
    id?: SortOrder
    color?: SortOrder
    userId?: SortOrder
  }

  export type NeonColorAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type NeonColorMaxOrderByAggregateInput = {
    id?: SortOrder
    color?: SortOrder
    userId?: SortOrder
  }

  export type NeonColorMinOrderByAggregateInput = {
    id?: SortOrder
    color?: SortOrder
    userId?: SortOrder
  }

  export type NeonColorSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type StatusbarCountOrderByAggregateInput = {
    id?: SortOrder
    text?: SortOrder
    colorBg?: SortOrder
    colorText?: SortOrder
    fontTextColor?: SortOrder
    statusText?: SortOrder
    userId?: SortOrder
  }

  export type StatusbarAvgOrderByAggregateInput = {
    id?: SortOrder
    fontTextColor?: SortOrder
  }

  export type StatusbarMaxOrderByAggregateInput = {
    id?: SortOrder
    text?: SortOrder
    colorBg?: SortOrder
    colorText?: SortOrder
    fontTextColor?: SortOrder
    statusText?: SortOrder
    userId?: SortOrder
  }

  export type StatusbarMinOrderByAggregateInput = {
    id?: SortOrder
    text?: SortOrder
    colorBg?: SortOrder
    colorText?: SortOrder
    fontTextColor?: SortOrder
    statusText?: SortOrder
    userId?: SortOrder
  }

  export type StatusbarSumOrderByAggregateInput = {
    id?: SortOrder
    fontTextColor?: SortOrder
  }

  export type LinkCreateNestedManyWithoutUserInput = {
    create?: XOR<LinkCreateWithoutUserInput, LinkUncheckedCreateWithoutUserInput> | LinkCreateWithoutUserInput[] | LinkUncheckedCreateWithoutUserInput[]
    connectOrCreate?: LinkCreateOrConnectWithoutUserInput | LinkCreateOrConnectWithoutUserInput[]
    createMany?: LinkCreateManyUserInputEnvelope
    connect?: LinkWhereUniqueInput | LinkWhereUniqueInput[]
  }

  export type LabelCreateNestedManyWithoutUserInput = {
    create?: XOR<LabelCreateWithoutUserInput, LabelUncheckedCreateWithoutUserInput> | LabelCreateWithoutUserInput[] | LabelUncheckedCreateWithoutUserInput[]
    connectOrCreate?: LabelCreateOrConnectWithoutUserInput | LabelCreateOrConnectWithoutUserInput[]
    createMany?: LabelCreateManyUserInputEnvelope
    connect?: LabelWhereUniqueInput | LabelWhereUniqueInput[]
  }

  export type SocialIconCreateNestedManyWithoutUserInput = {
    create?: XOR<SocialIconCreateWithoutUserInput, SocialIconUncheckedCreateWithoutUserInput> | SocialIconCreateWithoutUserInput[] | SocialIconUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SocialIconCreateOrConnectWithoutUserInput | SocialIconCreateOrConnectWithoutUserInput[]
    createMany?: SocialIconCreateManyUserInputEnvelope
    connect?: SocialIconWhereUniqueInput | SocialIconWhereUniqueInput[]
  }

  export type BackgroundColorCreateNestedManyWithoutUserInput = {
    create?: XOR<BackgroundColorCreateWithoutUserInput, BackgroundColorUncheckedCreateWithoutUserInput> | BackgroundColorCreateWithoutUserInput[] | BackgroundColorUncheckedCreateWithoutUserInput[]
    connectOrCreate?: BackgroundColorCreateOrConnectWithoutUserInput | BackgroundColorCreateOrConnectWithoutUserInput[]
    createMany?: BackgroundColorCreateManyUserInputEnvelope
    connect?: BackgroundColorWhereUniqueInput | BackgroundColorWhereUniqueInput[]
  }

  export type NeonColorCreateNestedManyWithoutUserInput = {
    create?: XOR<NeonColorCreateWithoutUserInput, NeonColorUncheckedCreateWithoutUserInput> | NeonColorCreateWithoutUserInput[] | NeonColorUncheckedCreateWithoutUserInput[]
    connectOrCreate?: NeonColorCreateOrConnectWithoutUserInput | NeonColorCreateOrConnectWithoutUserInput[]
    createMany?: NeonColorCreateManyUserInputEnvelope
    connect?: NeonColorWhereUniqueInput | NeonColorWhereUniqueInput[]
  }

  export type StatusbarCreateNestedOneWithoutUserInput = {
    create?: XOR<StatusbarCreateWithoutUserInput, StatusbarUncheckedCreateWithoutUserInput>
    connectOrCreate?: StatusbarCreateOrConnectWithoutUserInput
    connect?: StatusbarWhereUniqueInput
  }

  export type CosmeticCreateNestedOneWithoutUserInput = {
    create?: XOR<CosmeticCreateWithoutUserInput, CosmeticUncheckedCreateWithoutUserInput>
    connectOrCreate?: CosmeticCreateOrConnectWithoutUserInput
    connect?: CosmeticWhereUniqueInput
  }

  export type LinkUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<LinkCreateWithoutUserInput, LinkUncheckedCreateWithoutUserInput> | LinkCreateWithoutUserInput[] | LinkUncheckedCreateWithoutUserInput[]
    connectOrCreate?: LinkCreateOrConnectWithoutUserInput | LinkCreateOrConnectWithoutUserInput[]
    createMany?: LinkCreateManyUserInputEnvelope
    connect?: LinkWhereUniqueInput | LinkWhereUniqueInput[]
  }

  export type LabelUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<LabelCreateWithoutUserInput, LabelUncheckedCreateWithoutUserInput> | LabelCreateWithoutUserInput[] | LabelUncheckedCreateWithoutUserInput[]
    connectOrCreate?: LabelCreateOrConnectWithoutUserInput | LabelCreateOrConnectWithoutUserInput[]
    createMany?: LabelCreateManyUserInputEnvelope
    connect?: LabelWhereUniqueInput | LabelWhereUniqueInput[]
  }

  export type SocialIconUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<SocialIconCreateWithoutUserInput, SocialIconUncheckedCreateWithoutUserInput> | SocialIconCreateWithoutUserInput[] | SocialIconUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SocialIconCreateOrConnectWithoutUserInput | SocialIconCreateOrConnectWithoutUserInput[]
    createMany?: SocialIconCreateManyUserInputEnvelope
    connect?: SocialIconWhereUniqueInput | SocialIconWhereUniqueInput[]
  }

  export type BackgroundColorUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<BackgroundColorCreateWithoutUserInput, BackgroundColorUncheckedCreateWithoutUserInput> | BackgroundColorCreateWithoutUserInput[] | BackgroundColorUncheckedCreateWithoutUserInput[]
    connectOrCreate?: BackgroundColorCreateOrConnectWithoutUserInput | BackgroundColorCreateOrConnectWithoutUserInput[]
    createMany?: BackgroundColorCreateManyUserInputEnvelope
    connect?: BackgroundColorWhereUniqueInput | BackgroundColorWhereUniqueInput[]
  }

  export type NeonColorUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<NeonColorCreateWithoutUserInput, NeonColorUncheckedCreateWithoutUserInput> | NeonColorCreateWithoutUserInput[] | NeonColorUncheckedCreateWithoutUserInput[]
    connectOrCreate?: NeonColorCreateOrConnectWithoutUserInput | NeonColorCreateOrConnectWithoutUserInput[]
    createMany?: NeonColorCreateManyUserInputEnvelope
    connect?: NeonColorWhereUniqueInput | NeonColorWhereUniqueInput[]
  }

  export type StatusbarUncheckedCreateNestedOneWithoutUserInput = {
    create?: XOR<StatusbarCreateWithoutUserInput, StatusbarUncheckedCreateWithoutUserInput>
    connectOrCreate?: StatusbarCreateOrConnectWithoutUserInput
    connect?: StatusbarWhereUniqueInput
  }

  export type CosmeticUncheckedCreateNestedOneWithoutUserInput = {
    create?: XOR<CosmeticCreateWithoutUserInput, CosmeticUncheckedCreateWithoutUserInput>
    connectOrCreate?: CosmeticCreateOrConnectWithoutUserInput
    connect?: CosmeticWhereUniqueInput
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type EnumRoleFieldUpdateOperationsInput = {
    set?: $Enums.Role
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type LinkUpdateManyWithoutUserNestedInput = {
    create?: XOR<LinkCreateWithoutUserInput, LinkUncheckedCreateWithoutUserInput> | LinkCreateWithoutUserInput[] | LinkUncheckedCreateWithoutUserInput[]
    connectOrCreate?: LinkCreateOrConnectWithoutUserInput | LinkCreateOrConnectWithoutUserInput[]
    upsert?: LinkUpsertWithWhereUniqueWithoutUserInput | LinkUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: LinkCreateManyUserInputEnvelope
    set?: LinkWhereUniqueInput | LinkWhereUniqueInput[]
    disconnect?: LinkWhereUniqueInput | LinkWhereUniqueInput[]
    delete?: LinkWhereUniqueInput | LinkWhereUniqueInput[]
    connect?: LinkWhereUniqueInput | LinkWhereUniqueInput[]
    update?: LinkUpdateWithWhereUniqueWithoutUserInput | LinkUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: LinkUpdateManyWithWhereWithoutUserInput | LinkUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: LinkScalarWhereInput | LinkScalarWhereInput[]
  }

  export type LabelUpdateManyWithoutUserNestedInput = {
    create?: XOR<LabelCreateWithoutUserInput, LabelUncheckedCreateWithoutUserInput> | LabelCreateWithoutUserInput[] | LabelUncheckedCreateWithoutUserInput[]
    connectOrCreate?: LabelCreateOrConnectWithoutUserInput | LabelCreateOrConnectWithoutUserInput[]
    upsert?: LabelUpsertWithWhereUniqueWithoutUserInput | LabelUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: LabelCreateManyUserInputEnvelope
    set?: LabelWhereUniqueInput | LabelWhereUniqueInput[]
    disconnect?: LabelWhereUniqueInput | LabelWhereUniqueInput[]
    delete?: LabelWhereUniqueInput | LabelWhereUniqueInput[]
    connect?: LabelWhereUniqueInput | LabelWhereUniqueInput[]
    update?: LabelUpdateWithWhereUniqueWithoutUserInput | LabelUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: LabelUpdateManyWithWhereWithoutUserInput | LabelUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: LabelScalarWhereInput | LabelScalarWhereInput[]
  }

  export type SocialIconUpdateManyWithoutUserNestedInput = {
    create?: XOR<SocialIconCreateWithoutUserInput, SocialIconUncheckedCreateWithoutUserInput> | SocialIconCreateWithoutUserInput[] | SocialIconUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SocialIconCreateOrConnectWithoutUserInput | SocialIconCreateOrConnectWithoutUserInput[]
    upsert?: SocialIconUpsertWithWhereUniqueWithoutUserInput | SocialIconUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: SocialIconCreateManyUserInputEnvelope
    set?: SocialIconWhereUniqueInput | SocialIconWhereUniqueInput[]
    disconnect?: SocialIconWhereUniqueInput | SocialIconWhereUniqueInput[]
    delete?: SocialIconWhereUniqueInput | SocialIconWhereUniqueInput[]
    connect?: SocialIconWhereUniqueInput | SocialIconWhereUniqueInput[]
    update?: SocialIconUpdateWithWhereUniqueWithoutUserInput | SocialIconUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: SocialIconUpdateManyWithWhereWithoutUserInput | SocialIconUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: SocialIconScalarWhereInput | SocialIconScalarWhereInput[]
  }

  export type BackgroundColorUpdateManyWithoutUserNestedInput = {
    create?: XOR<BackgroundColorCreateWithoutUserInput, BackgroundColorUncheckedCreateWithoutUserInput> | BackgroundColorCreateWithoutUserInput[] | BackgroundColorUncheckedCreateWithoutUserInput[]
    connectOrCreate?: BackgroundColorCreateOrConnectWithoutUserInput | BackgroundColorCreateOrConnectWithoutUserInput[]
    upsert?: BackgroundColorUpsertWithWhereUniqueWithoutUserInput | BackgroundColorUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: BackgroundColorCreateManyUserInputEnvelope
    set?: BackgroundColorWhereUniqueInput | BackgroundColorWhereUniqueInput[]
    disconnect?: BackgroundColorWhereUniqueInput | BackgroundColorWhereUniqueInput[]
    delete?: BackgroundColorWhereUniqueInput | BackgroundColorWhereUniqueInput[]
    connect?: BackgroundColorWhereUniqueInput | BackgroundColorWhereUniqueInput[]
    update?: BackgroundColorUpdateWithWhereUniqueWithoutUserInput | BackgroundColorUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: BackgroundColorUpdateManyWithWhereWithoutUserInput | BackgroundColorUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: BackgroundColorScalarWhereInput | BackgroundColorScalarWhereInput[]
  }

  export type NeonColorUpdateManyWithoutUserNestedInput = {
    create?: XOR<NeonColorCreateWithoutUserInput, NeonColorUncheckedCreateWithoutUserInput> | NeonColorCreateWithoutUserInput[] | NeonColorUncheckedCreateWithoutUserInput[]
    connectOrCreate?: NeonColorCreateOrConnectWithoutUserInput | NeonColorCreateOrConnectWithoutUserInput[]
    upsert?: NeonColorUpsertWithWhereUniqueWithoutUserInput | NeonColorUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: NeonColorCreateManyUserInputEnvelope
    set?: NeonColorWhereUniqueInput | NeonColorWhereUniqueInput[]
    disconnect?: NeonColorWhereUniqueInput | NeonColorWhereUniqueInput[]
    delete?: NeonColorWhereUniqueInput | NeonColorWhereUniqueInput[]
    connect?: NeonColorWhereUniqueInput | NeonColorWhereUniqueInput[]
    update?: NeonColorUpdateWithWhereUniqueWithoutUserInput | NeonColorUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: NeonColorUpdateManyWithWhereWithoutUserInput | NeonColorUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: NeonColorScalarWhereInput | NeonColorScalarWhereInput[]
  }

  export type StatusbarUpdateOneWithoutUserNestedInput = {
    create?: XOR<StatusbarCreateWithoutUserInput, StatusbarUncheckedCreateWithoutUserInput>
    connectOrCreate?: StatusbarCreateOrConnectWithoutUserInput
    upsert?: StatusbarUpsertWithoutUserInput
    disconnect?: StatusbarWhereInput | boolean
    delete?: StatusbarWhereInput | boolean
    connect?: StatusbarWhereUniqueInput
    update?: XOR<XOR<StatusbarUpdateToOneWithWhereWithoutUserInput, StatusbarUpdateWithoutUserInput>, StatusbarUncheckedUpdateWithoutUserInput>
  }

  export type CosmeticUpdateOneWithoutUserNestedInput = {
    create?: XOR<CosmeticCreateWithoutUserInput, CosmeticUncheckedCreateWithoutUserInput>
    connectOrCreate?: CosmeticCreateOrConnectWithoutUserInput
    upsert?: CosmeticUpsertWithoutUserInput
    disconnect?: CosmeticWhereInput | boolean
    delete?: CosmeticWhereInput | boolean
    connect?: CosmeticWhereUniqueInput
    update?: XOR<XOR<CosmeticUpdateToOneWithWhereWithoutUserInput, CosmeticUpdateWithoutUserInput>, CosmeticUncheckedUpdateWithoutUserInput>
  }

  export type LinkUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<LinkCreateWithoutUserInput, LinkUncheckedCreateWithoutUserInput> | LinkCreateWithoutUserInput[] | LinkUncheckedCreateWithoutUserInput[]
    connectOrCreate?: LinkCreateOrConnectWithoutUserInput | LinkCreateOrConnectWithoutUserInput[]
    upsert?: LinkUpsertWithWhereUniqueWithoutUserInput | LinkUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: LinkCreateManyUserInputEnvelope
    set?: LinkWhereUniqueInput | LinkWhereUniqueInput[]
    disconnect?: LinkWhereUniqueInput | LinkWhereUniqueInput[]
    delete?: LinkWhereUniqueInput | LinkWhereUniqueInput[]
    connect?: LinkWhereUniqueInput | LinkWhereUniqueInput[]
    update?: LinkUpdateWithWhereUniqueWithoutUserInput | LinkUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: LinkUpdateManyWithWhereWithoutUserInput | LinkUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: LinkScalarWhereInput | LinkScalarWhereInput[]
  }

  export type LabelUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<LabelCreateWithoutUserInput, LabelUncheckedCreateWithoutUserInput> | LabelCreateWithoutUserInput[] | LabelUncheckedCreateWithoutUserInput[]
    connectOrCreate?: LabelCreateOrConnectWithoutUserInput | LabelCreateOrConnectWithoutUserInput[]
    upsert?: LabelUpsertWithWhereUniqueWithoutUserInput | LabelUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: LabelCreateManyUserInputEnvelope
    set?: LabelWhereUniqueInput | LabelWhereUniqueInput[]
    disconnect?: LabelWhereUniqueInput | LabelWhereUniqueInput[]
    delete?: LabelWhereUniqueInput | LabelWhereUniqueInput[]
    connect?: LabelWhereUniqueInput | LabelWhereUniqueInput[]
    update?: LabelUpdateWithWhereUniqueWithoutUserInput | LabelUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: LabelUpdateManyWithWhereWithoutUserInput | LabelUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: LabelScalarWhereInput | LabelScalarWhereInput[]
  }

  export type SocialIconUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<SocialIconCreateWithoutUserInput, SocialIconUncheckedCreateWithoutUserInput> | SocialIconCreateWithoutUserInput[] | SocialIconUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SocialIconCreateOrConnectWithoutUserInput | SocialIconCreateOrConnectWithoutUserInput[]
    upsert?: SocialIconUpsertWithWhereUniqueWithoutUserInput | SocialIconUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: SocialIconCreateManyUserInputEnvelope
    set?: SocialIconWhereUniqueInput | SocialIconWhereUniqueInput[]
    disconnect?: SocialIconWhereUniqueInput | SocialIconWhereUniqueInput[]
    delete?: SocialIconWhereUniqueInput | SocialIconWhereUniqueInput[]
    connect?: SocialIconWhereUniqueInput | SocialIconWhereUniqueInput[]
    update?: SocialIconUpdateWithWhereUniqueWithoutUserInput | SocialIconUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: SocialIconUpdateManyWithWhereWithoutUserInput | SocialIconUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: SocialIconScalarWhereInput | SocialIconScalarWhereInput[]
  }

  export type BackgroundColorUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<BackgroundColorCreateWithoutUserInput, BackgroundColorUncheckedCreateWithoutUserInput> | BackgroundColorCreateWithoutUserInput[] | BackgroundColorUncheckedCreateWithoutUserInput[]
    connectOrCreate?: BackgroundColorCreateOrConnectWithoutUserInput | BackgroundColorCreateOrConnectWithoutUserInput[]
    upsert?: BackgroundColorUpsertWithWhereUniqueWithoutUserInput | BackgroundColorUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: BackgroundColorCreateManyUserInputEnvelope
    set?: BackgroundColorWhereUniqueInput | BackgroundColorWhereUniqueInput[]
    disconnect?: BackgroundColorWhereUniqueInput | BackgroundColorWhereUniqueInput[]
    delete?: BackgroundColorWhereUniqueInput | BackgroundColorWhereUniqueInput[]
    connect?: BackgroundColorWhereUniqueInput | BackgroundColorWhereUniqueInput[]
    update?: BackgroundColorUpdateWithWhereUniqueWithoutUserInput | BackgroundColorUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: BackgroundColorUpdateManyWithWhereWithoutUserInput | BackgroundColorUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: BackgroundColorScalarWhereInput | BackgroundColorScalarWhereInput[]
  }

  export type NeonColorUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<NeonColorCreateWithoutUserInput, NeonColorUncheckedCreateWithoutUserInput> | NeonColorCreateWithoutUserInput[] | NeonColorUncheckedCreateWithoutUserInput[]
    connectOrCreate?: NeonColorCreateOrConnectWithoutUserInput | NeonColorCreateOrConnectWithoutUserInput[]
    upsert?: NeonColorUpsertWithWhereUniqueWithoutUserInput | NeonColorUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: NeonColorCreateManyUserInputEnvelope
    set?: NeonColorWhereUniqueInput | NeonColorWhereUniqueInput[]
    disconnect?: NeonColorWhereUniqueInput | NeonColorWhereUniqueInput[]
    delete?: NeonColorWhereUniqueInput | NeonColorWhereUniqueInput[]
    connect?: NeonColorWhereUniqueInput | NeonColorWhereUniqueInput[]
    update?: NeonColorUpdateWithWhereUniqueWithoutUserInput | NeonColorUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: NeonColorUpdateManyWithWhereWithoutUserInput | NeonColorUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: NeonColorScalarWhereInput | NeonColorScalarWhereInput[]
  }

  export type StatusbarUncheckedUpdateOneWithoutUserNestedInput = {
    create?: XOR<StatusbarCreateWithoutUserInput, StatusbarUncheckedCreateWithoutUserInput>
    connectOrCreate?: StatusbarCreateOrConnectWithoutUserInput
    upsert?: StatusbarUpsertWithoutUserInput
    disconnect?: StatusbarWhereInput | boolean
    delete?: StatusbarWhereInput | boolean
    connect?: StatusbarWhereUniqueInput
    update?: XOR<XOR<StatusbarUpdateToOneWithWhereWithoutUserInput, StatusbarUpdateWithoutUserInput>, StatusbarUncheckedUpdateWithoutUserInput>
  }

  export type CosmeticUncheckedUpdateOneWithoutUserNestedInput = {
    create?: XOR<CosmeticCreateWithoutUserInput, CosmeticUncheckedCreateWithoutUserInput>
    connectOrCreate?: CosmeticCreateOrConnectWithoutUserInput
    upsert?: CosmeticUpsertWithoutUserInput
    disconnect?: CosmeticWhereInput | boolean
    delete?: CosmeticWhereInput | boolean
    connect?: CosmeticWhereUniqueInput
    update?: XOR<XOR<CosmeticUpdateToOneWithWhereWithoutUserInput, CosmeticUpdateWithoutUserInput>, CosmeticUncheckedUpdateWithoutUserInput>
  }

  export type UserCreateNestedOneWithoutCosmeticsInput = {
    create?: XOR<UserCreateWithoutCosmeticsInput, UserUncheckedCreateWithoutCosmeticsInput>
    connectOrCreate?: UserCreateOrConnectWithoutCosmeticsInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutCosmeticsNestedInput = {
    create?: XOR<UserCreateWithoutCosmeticsInput, UserUncheckedCreateWithoutCosmeticsInput>
    connectOrCreate?: UserCreateOrConnectWithoutCosmeticsInput
    upsert?: UserUpsertWithoutCosmeticsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutCosmeticsInput, UserUpdateWithoutCosmeticsInput>, UserUncheckedUpdateWithoutCosmeticsInput>
  }

  export type UserCreateNestedOneWithoutLinksInput = {
    create?: XOR<UserCreateWithoutLinksInput, UserUncheckedCreateWithoutLinksInput>
    connectOrCreate?: UserCreateOrConnectWithoutLinksInput
    connect?: UserWhereUniqueInput
  }

  export type NullableBoolFieldUpdateOperationsInput = {
    set?: boolean | null
  }

  export type UserUpdateOneRequiredWithoutLinksNestedInput = {
    create?: XOR<UserCreateWithoutLinksInput, UserUncheckedCreateWithoutLinksInput>
    connectOrCreate?: UserCreateOrConnectWithoutLinksInput
    upsert?: UserUpsertWithoutLinksInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutLinksInput, UserUpdateWithoutLinksInput>, UserUncheckedUpdateWithoutLinksInput>
  }

  export type UserCreateNestedOneWithoutLabelsInput = {
    create?: XOR<UserCreateWithoutLabelsInput, UserUncheckedCreateWithoutLabelsInput>
    connectOrCreate?: UserCreateOrConnectWithoutLabelsInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutLabelsNestedInput = {
    create?: XOR<UserCreateWithoutLabelsInput, UserUncheckedCreateWithoutLabelsInput>
    connectOrCreate?: UserCreateOrConnectWithoutLabelsInput
    upsert?: UserUpsertWithoutLabelsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutLabelsInput, UserUpdateWithoutLabelsInput>, UserUncheckedUpdateWithoutLabelsInput>
  }

  export type UserCreateNestedOneWithoutSocialIconsInput = {
    create?: XOR<UserCreateWithoutSocialIconsInput, UserUncheckedCreateWithoutSocialIconsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSocialIconsInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutSocialIconsNestedInput = {
    create?: XOR<UserCreateWithoutSocialIconsInput, UserUncheckedCreateWithoutSocialIconsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSocialIconsInput
    upsert?: UserUpsertWithoutSocialIconsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutSocialIconsInput, UserUpdateWithoutSocialIconsInput>, UserUncheckedUpdateWithoutSocialIconsInput>
  }

  export type UserCreateNestedOneWithoutBackgroundInput = {
    create?: XOR<UserCreateWithoutBackgroundInput, UserUncheckedCreateWithoutBackgroundInput>
    connectOrCreate?: UserCreateOrConnectWithoutBackgroundInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutBackgroundNestedInput = {
    create?: XOR<UserCreateWithoutBackgroundInput, UserUncheckedCreateWithoutBackgroundInput>
    connectOrCreate?: UserCreateOrConnectWithoutBackgroundInput
    upsert?: UserUpsertWithoutBackgroundInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutBackgroundInput, UserUpdateWithoutBackgroundInput>, UserUncheckedUpdateWithoutBackgroundInput>
  }

  export type UserCreateNestedOneWithoutNeonColorsInput = {
    create?: XOR<UserCreateWithoutNeonColorsInput, UserUncheckedCreateWithoutNeonColorsInput>
    connectOrCreate?: UserCreateOrConnectWithoutNeonColorsInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutNeonColorsNestedInput = {
    create?: XOR<UserCreateWithoutNeonColorsInput, UserUncheckedCreateWithoutNeonColorsInput>
    connectOrCreate?: UserCreateOrConnectWithoutNeonColorsInput
    upsert?: UserUpsertWithoutNeonColorsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutNeonColorsInput, UserUpdateWithoutNeonColorsInput>, UserUncheckedUpdateWithoutNeonColorsInput>
  }

  export type UserCreateNestedOneWithoutStatusbarInput = {
    create?: XOR<UserCreateWithoutStatusbarInput, UserUncheckedCreateWithoutStatusbarInput>
    connectOrCreate?: UserCreateOrConnectWithoutStatusbarInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutStatusbarNestedInput = {
    create?: XOR<UserCreateWithoutStatusbarInput, UserUncheckedCreateWithoutStatusbarInput>
    connectOrCreate?: UserCreateOrConnectWithoutStatusbarInput
    upsert?: UserUpsertWithoutStatusbarInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutStatusbarInput, UserUpdateWithoutStatusbarInput>, UserUncheckedUpdateWithoutStatusbarInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedEnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[]
    notIn?: $Enums.Role[]
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[]
    notIn?: $Enums.Role[]
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedBoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
  }

  export type NestedBoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBoolNullableFilter<$PrismaModel>
    _max?: NestedBoolNullableFilter<$PrismaModel>
  }

  export type LinkCreateWithoutUserInput = {
    icon?: string | null
    url?: string
    text?: string | null
    name?: string | null
    description?: string | null
    showDescriptionOnHover?: boolean | null
    showDescription?: boolean | null
  }

  export type LinkUncheckedCreateWithoutUserInput = {
    id?: number
    icon?: string | null
    url?: string
    text?: string | null
    name?: string | null
    description?: string | null
    showDescriptionOnHover?: boolean | null
    showDescription?: boolean | null
  }

  export type LinkCreateOrConnectWithoutUserInput = {
    where: LinkWhereUniqueInput
    create: XOR<LinkCreateWithoutUserInput, LinkUncheckedCreateWithoutUserInput>
  }

  export type LinkCreateManyUserInputEnvelope = {
    data: LinkCreateManyUserInput | LinkCreateManyUserInput[]
  }

  export type LabelCreateWithoutUserInput = {
    data?: string
    color?: string
    fontColor?: string
  }

  export type LabelUncheckedCreateWithoutUserInput = {
    id?: number
    data?: string
    color?: string
    fontColor?: string
  }

  export type LabelCreateOrConnectWithoutUserInput = {
    where: LabelWhereUniqueInput
    create: XOR<LabelCreateWithoutUserInput, LabelUncheckedCreateWithoutUserInput>
  }

  export type LabelCreateManyUserInputEnvelope = {
    data: LabelCreateManyUserInput | LabelCreateManyUserInput[]
  }

  export type SocialIconCreateWithoutUserInput = {
    url?: string
    icon?: string
  }

  export type SocialIconUncheckedCreateWithoutUserInput = {
    id?: number
    url?: string
    icon?: string
  }

  export type SocialIconCreateOrConnectWithoutUserInput = {
    where: SocialIconWhereUniqueInput
    create: XOR<SocialIconCreateWithoutUserInput, SocialIconUncheckedCreateWithoutUserInput>
  }

  export type SocialIconCreateManyUserInputEnvelope = {
    data: SocialIconCreateManyUserInput | SocialIconCreateManyUserInput[]
  }

  export type BackgroundColorCreateWithoutUserInput = {
    color?: string
  }

  export type BackgroundColorUncheckedCreateWithoutUserInput = {
    id?: number
    color?: string
  }

  export type BackgroundColorCreateOrConnectWithoutUserInput = {
    where: BackgroundColorWhereUniqueInput
    create: XOR<BackgroundColorCreateWithoutUserInput, BackgroundColorUncheckedCreateWithoutUserInput>
  }

  export type BackgroundColorCreateManyUserInputEnvelope = {
    data: BackgroundColorCreateManyUserInput | BackgroundColorCreateManyUserInput[]
  }

  export type NeonColorCreateWithoutUserInput = {
    color?: string
  }

  export type NeonColorUncheckedCreateWithoutUserInput = {
    id?: number
    color?: string
  }

  export type NeonColorCreateOrConnectWithoutUserInput = {
    where: NeonColorWhereUniqueInput
    create: XOR<NeonColorCreateWithoutUserInput, NeonColorUncheckedCreateWithoutUserInput>
  }

  export type NeonColorCreateManyUserInputEnvelope = {
    data: NeonColorCreateManyUserInput | NeonColorCreateManyUserInput[]
  }

  export type StatusbarCreateWithoutUserInput = {
    text?: string | null
    colorBg?: string | null
    colorText?: string | null
    fontTextColor?: number | null
    statusText?: string | null
  }

  export type StatusbarUncheckedCreateWithoutUserInput = {
    id?: number
    text?: string | null
    colorBg?: string | null
    colorText?: string | null
    fontTextColor?: number | null
    statusText?: string | null
  }

  export type StatusbarCreateOrConnectWithoutUserInput = {
    where: StatusbarWhereUniqueInput
    create: XOR<StatusbarCreateWithoutUserInput, StatusbarUncheckedCreateWithoutUserInput>
  }

  export type CosmeticCreateWithoutUserInput = {
    flair?: string | null
    frame?: string | null
    theme?: string | null
    bannerUrl?: string | null
  }

  export type CosmeticUncheckedCreateWithoutUserInput = {
    id?: number
    flair?: string | null
    frame?: string | null
    theme?: string | null
    bannerUrl?: string | null
  }

  export type CosmeticCreateOrConnectWithoutUserInput = {
    where: CosmeticWhereUniqueInput
    create: XOR<CosmeticCreateWithoutUserInput, CosmeticUncheckedCreateWithoutUserInput>
  }

  export type LinkUpsertWithWhereUniqueWithoutUserInput = {
    where: LinkWhereUniqueInput
    update: XOR<LinkUpdateWithoutUserInput, LinkUncheckedUpdateWithoutUserInput>
    create: XOR<LinkCreateWithoutUserInput, LinkUncheckedCreateWithoutUserInput>
  }

  export type LinkUpdateWithWhereUniqueWithoutUserInput = {
    where: LinkWhereUniqueInput
    data: XOR<LinkUpdateWithoutUserInput, LinkUncheckedUpdateWithoutUserInput>
  }

  export type LinkUpdateManyWithWhereWithoutUserInput = {
    where: LinkScalarWhereInput
    data: XOR<LinkUpdateManyMutationInput, LinkUncheckedUpdateManyWithoutUserInput>
  }

  export type LinkScalarWhereInput = {
    AND?: LinkScalarWhereInput | LinkScalarWhereInput[]
    OR?: LinkScalarWhereInput[]
    NOT?: LinkScalarWhereInput | LinkScalarWhereInput[]
    id?: IntFilter<"Link"> | number
    icon?: StringNullableFilter<"Link"> | string | null
    url?: StringFilter<"Link"> | string
    text?: StringNullableFilter<"Link"> | string | null
    name?: StringNullableFilter<"Link"> | string | null
    description?: StringNullableFilter<"Link"> | string | null
    showDescriptionOnHover?: BoolNullableFilter<"Link"> | boolean | null
    showDescription?: BoolNullableFilter<"Link"> | boolean | null
    userId?: StringFilter<"Link"> | string
  }

  export type LabelUpsertWithWhereUniqueWithoutUserInput = {
    where: LabelWhereUniqueInput
    update: XOR<LabelUpdateWithoutUserInput, LabelUncheckedUpdateWithoutUserInput>
    create: XOR<LabelCreateWithoutUserInput, LabelUncheckedCreateWithoutUserInput>
  }

  export type LabelUpdateWithWhereUniqueWithoutUserInput = {
    where: LabelWhereUniqueInput
    data: XOR<LabelUpdateWithoutUserInput, LabelUncheckedUpdateWithoutUserInput>
  }

  export type LabelUpdateManyWithWhereWithoutUserInput = {
    where: LabelScalarWhereInput
    data: XOR<LabelUpdateManyMutationInput, LabelUncheckedUpdateManyWithoutUserInput>
  }

  export type LabelScalarWhereInput = {
    AND?: LabelScalarWhereInput | LabelScalarWhereInput[]
    OR?: LabelScalarWhereInput[]
    NOT?: LabelScalarWhereInput | LabelScalarWhereInput[]
    id?: IntFilter<"Label"> | number
    data?: StringFilter<"Label"> | string
    color?: StringFilter<"Label"> | string
    fontColor?: StringFilter<"Label"> | string
    userId?: StringFilter<"Label"> | string
  }

  export type SocialIconUpsertWithWhereUniqueWithoutUserInput = {
    where: SocialIconWhereUniqueInput
    update: XOR<SocialIconUpdateWithoutUserInput, SocialIconUncheckedUpdateWithoutUserInput>
    create: XOR<SocialIconCreateWithoutUserInput, SocialIconUncheckedCreateWithoutUserInput>
  }

  export type SocialIconUpdateWithWhereUniqueWithoutUserInput = {
    where: SocialIconWhereUniqueInput
    data: XOR<SocialIconUpdateWithoutUserInput, SocialIconUncheckedUpdateWithoutUserInput>
  }

  export type SocialIconUpdateManyWithWhereWithoutUserInput = {
    where: SocialIconScalarWhereInput
    data: XOR<SocialIconUpdateManyMutationInput, SocialIconUncheckedUpdateManyWithoutUserInput>
  }

  export type SocialIconScalarWhereInput = {
    AND?: SocialIconScalarWhereInput | SocialIconScalarWhereInput[]
    OR?: SocialIconScalarWhereInput[]
    NOT?: SocialIconScalarWhereInput | SocialIconScalarWhereInput[]
    id?: IntFilter<"SocialIcon"> | number
    url?: StringFilter<"SocialIcon"> | string
    icon?: StringFilter<"SocialIcon"> | string
    userId?: StringFilter<"SocialIcon"> | string
  }

  export type BackgroundColorUpsertWithWhereUniqueWithoutUserInput = {
    where: BackgroundColorWhereUniqueInput
    update: XOR<BackgroundColorUpdateWithoutUserInput, BackgroundColorUncheckedUpdateWithoutUserInput>
    create: XOR<BackgroundColorCreateWithoutUserInput, BackgroundColorUncheckedCreateWithoutUserInput>
  }

  export type BackgroundColorUpdateWithWhereUniqueWithoutUserInput = {
    where: BackgroundColorWhereUniqueInput
    data: XOR<BackgroundColorUpdateWithoutUserInput, BackgroundColorUncheckedUpdateWithoutUserInput>
  }

  export type BackgroundColorUpdateManyWithWhereWithoutUserInput = {
    where: BackgroundColorScalarWhereInput
    data: XOR<BackgroundColorUpdateManyMutationInput, BackgroundColorUncheckedUpdateManyWithoutUserInput>
  }

  export type BackgroundColorScalarWhereInput = {
    AND?: BackgroundColorScalarWhereInput | BackgroundColorScalarWhereInput[]
    OR?: BackgroundColorScalarWhereInput[]
    NOT?: BackgroundColorScalarWhereInput | BackgroundColorScalarWhereInput[]
    id?: IntFilter<"BackgroundColor"> | number
    color?: StringFilter<"BackgroundColor"> | string
    userId?: StringFilter<"BackgroundColor"> | string
  }

  export type NeonColorUpsertWithWhereUniqueWithoutUserInput = {
    where: NeonColorWhereUniqueInput
    update: XOR<NeonColorUpdateWithoutUserInput, NeonColorUncheckedUpdateWithoutUserInput>
    create: XOR<NeonColorCreateWithoutUserInput, NeonColorUncheckedCreateWithoutUserInput>
  }

  export type NeonColorUpdateWithWhereUniqueWithoutUserInput = {
    where: NeonColorWhereUniqueInput
    data: XOR<NeonColorUpdateWithoutUserInput, NeonColorUncheckedUpdateWithoutUserInput>
  }

  export type NeonColorUpdateManyWithWhereWithoutUserInput = {
    where: NeonColorScalarWhereInput
    data: XOR<NeonColorUpdateManyMutationInput, NeonColorUncheckedUpdateManyWithoutUserInput>
  }

  export type NeonColorScalarWhereInput = {
    AND?: NeonColorScalarWhereInput | NeonColorScalarWhereInput[]
    OR?: NeonColorScalarWhereInput[]
    NOT?: NeonColorScalarWhereInput | NeonColorScalarWhereInput[]
    id?: IntFilter<"NeonColor"> | number
    color?: StringFilter<"NeonColor"> | string
    userId?: StringFilter<"NeonColor"> | string
  }

  export type StatusbarUpsertWithoutUserInput = {
    update: XOR<StatusbarUpdateWithoutUserInput, StatusbarUncheckedUpdateWithoutUserInput>
    create: XOR<StatusbarCreateWithoutUserInput, StatusbarUncheckedCreateWithoutUserInput>
    where?: StatusbarWhereInput
  }

  export type StatusbarUpdateToOneWithWhereWithoutUserInput = {
    where?: StatusbarWhereInput
    data: XOR<StatusbarUpdateWithoutUserInput, StatusbarUncheckedUpdateWithoutUserInput>
  }

  export type StatusbarUpdateWithoutUserInput = {
    text?: NullableStringFieldUpdateOperationsInput | string | null
    colorBg?: NullableStringFieldUpdateOperationsInput | string | null
    colorText?: NullableStringFieldUpdateOperationsInput | string | null
    fontTextColor?: NullableIntFieldUpdateOperationsInput | number | null
    statusText?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type StatusbarUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    text?: NullableStringFieldUpdateOperationsInput | string | null
    colorBg?: NullableStringFieldUpdateOperationsInput | string | null
    colorText?: NullableStringFieldUpdateOperationsInput | string | null
    fontTextColor?: NullableIntFieldUpdateOperationsInput | number | null
    statusText?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type CosmeticUpsertWithoutUserInput = {
    update: XOR<CosmeticUpdateWithoutUserInput, CosmeticUncheckedUpdateWithoutUserInput>
    create: XOR<CosmeticCreateWithoutUserInput, CosmeticUncheckedCreateWithoutUserInput>
    where?: CosmeticWhereInput
  }

  export type CosmeticUpdateToOneWithWhereWithoutUserInput = {
    where?: CosmeticWhereInput
    data: XOR<CosmeticUpdateWithoutUserInput, CosmeticUncheckedUpdateWithoutUserInput>
  }

  export type CosmeticUpdateWithoutUserInput = {
    flair?: NullableStringFieldUpdateOperationsInput | string | null
    frame?: NullableStringFieldUpdateOperationsInput | string | null
    theme?: NullableStringFieldUpdateOperationsInput | string | null
    bannerUrl?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type CosmeticUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    flair?: NullableStringFieldUpdateOperationsInput | string | null
    frame?: NullableStringFieldUpdateOperationsInput | string | null
    theme?: NullableStringFieldUpdateOperationsInput | string | null
    bannerUrl?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type UserCreateWithoutCosmeticsInput = {
    id: string
    userName: string
    password: string
    email: string
    publicEmail?: string | null
    profileLink?: string | null
    profileImage?: string | null
    profileIcon?: string | null
    profileSiteText?: string | null
    iconUrl?: string | null
    description?: string | null
    profileHoverColor?: string | null
    degBackgroundColor?: number | null
    neonEnable?: number
    buttonThemeEnable?: number
    EnableAnimationArticle?: number
    EnableAnimationButton?: number
    EnableAnimationBackground?: number
    backgroundSize?: number | null
    selectedThemeIndex?: number | null
    selectedAnimationIndex?: number | null
    selectedAnimationButtonIndex?: number | null
    selectedAnimationBackgroundIndex?: number | null
    animationDurationBackground?: number | null
    delayAnimationButton?: number | null
    canvaEnable?: number
    selectedCanvasIndex?: number | null
    name: string
    emailVerified?: boolean
    image?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    role?: $Enums.Role
    rankScore?: number
    bumpedAt?: Date | string | null
    bumpExpiresAt?: Date | string | null
    bumpPaidUntil?: Date | string | null
    isPublic?: boolean
    links?: LinkCreateNestedManyWithoutUserInput
    labels?: LabelCreateNestedManyWithoutUserInput
    socialIcons?: SocialIconCreateNestedManyWithoutUserInput
    background?: BackgroundColorCreateNestedManyWithoutUserInput
    neonColors?: NeonColorCreateNestedManyWithoutUserInput
    statusbar?: StatusbarCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutCosmeticsInput = {
    id: string
    userName: string
    password: string
    email: string
    publicEmail?: string | null
    profileLink?: string | null
    profileImage?: string | null
    profileIcon?: string | null
    profileSiteText?: string | null
    iconUrl?: string | null
    description?: string | null
    profileHoverColor?: string | null
    degBackgroundColor?: number | null
    neonEnable?: number
    buttonThemeEnable?: number
    EnableAnimationArticle?: number
    EnableAnimationButton?: number
    EnableAnimationBackground?: number
    backgroundSize?: number | null
    selectedThemeIndex?: number | null
    selectedAnimationIndex?: number | null
    selectedAnimationButtonIndex?: number | null
    selectedAnimationBackgroundIndex?: number | null
    animationDurationBackground?: number | null
    delayAnimationButton?: number | null
    canvaEnable?: number
    selectedCanvasIndex?: number | null
    name: string
    emailVerified?: boolean
    image?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    role?: $Enums.Role
    rankScore?: number
    bumpedAt?: Date | string | null
    bumpExpiresAt?: Date | string | null
    bumpPaidUntil?: Date | string | null
    isPublic?: boolean
    links?: LinkUncheckedCreateNestedManyWithoutUserInput
    labels?: LabelUncheckedCreateNestedManyWithoutUserInput
    socialIcons?: SocialIconUncheckedCreateNestedManyWithoutUserInput
    background?: BackgroundColorUncheckedCreateNestedManyWithoutUserInput
    neonColors?: NeonColorUncheckedCreateNestedManyWithoutUserInput
    statusbar?: StatusbarUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutCosmeticsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutCosmeticsInput, UserUncheckedCreateWithoutCosmeticsInput>
  }

  export type UserUpsertWithoutCosmeticsInput = {
    update: XOR<UserUpdateWithoutCosmeticsInput, UserUncheckedUpdateWithoutCosmeticsInput>
    create: XOR<UserCreateWithoutCosmeticsInput, UserUncheckedCreateWithoutCosmeticsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutCosmeticsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutCosmeticsInput, UserUncheckedUpdateWithoutCosmeticsInput>
  }

  export type UserUpdateWithoutCosmeticsInput = {
    id?: StringFieldUpdateOperationsInput | string
    userName?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    publicEmail?: NullableStringFieldUpdateOperationsInput | string | null
    profileLink?: NullableStringFieldUpdateOperationsInput | string | null
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    profileIcon?: NullableStringFieldUpdateOperationsInput | string | null
    profileSiteText?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    profileHoverColor?: NullableStringFieldUpdateOperationsInput | string | null
    degBackgroundColor?: NullableIntFieldUpdateOperationsInput | number | null
    neonEnable?: IntFieldUpdateOperationsInput | number
    buttonThemeEnable?: IntFieldUpdateOperationsInput | number
    EnableAnimationArticle?: IntFieldUpdateOperationsInput | number
    EnableAnimationButton?: IntFieldUpdateOperationsInput | number
    EnableAnimationBackground?: IntFieldUpdateOperationsInput | number
    backgroundSize?: NullableIntFieldUpdateOperationsInput | number | null
    selectedThemeIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationButtonIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationBackgroundIndex?: NullableIntFieldUpdateOperationsInput | number | null
    animationDurationBackground?: NullableIntFieldUpdateOperationsInput | number | null
    delayAnimationButton?: NullableFloatFieldUpdateOperationsInput | number | null
    canvaEnable?: IntFieldUpdateOperationsInput | number
    selectedCanvasIndex?: NullableIntFieldUpdateOperationsInput | number | null
    name?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    rankScore?: IntFieldUpdateOperationsInput | number
    bumpedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpPaidUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    links?: LinkUpdateManyWithoutUserNestedInput
    labels?: LabelUpdateManyWithoutUserNestedInput
    socialIcons?: SocialIconUpdateManyWithoutUserNestedInput
    background?: BackgroundColorUpdateManyWithoutUserNestedInput
    neonColors?: NeonColorUpdateManyWithoutUserNestedInput
    statusbar?: StatusbarUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutCosmeticsInput = {
    id?: StringFieldUpdateOperationsInput | string
    userName?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    publicEmail?: NullableStringFieldUpdateOperationsInput | string | null
    profileLink?: NullableStringFieldUpdateOperationsInput | string | null
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    profileIcon?: NullableStringFieldUpdateOperationsInput | string | null
    profileSiteText?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    profileHoverColor?: NullableStringFieldUpdateOperationsInput | string | null
    degBackgroundColor?: NullableIntFieldUpdateOperationsInput | number | null
    neonEnable?: IntFieldUpdateOperationsInput | number
    buttonThemeEnable?: IntFieldUpdateOperationsInput | number
    EnableAnimationArticle?: IntFieldUpdateOperationsInput | number
    EnableAnimationButton?: IntFieldUpdateOperationsInput | number
    EnableAnimationBackground?: IntFieldUpdateOperationsInput | number
    backgroundSize?: NullableIntFieldUpdateOperationsInput | number | null
    selectedThemeIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationButtonIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationBackgroundIndex?: NullableIntFieldUpdateOperationsInput | number | null
    animationDurationBackground?: NullableIntFieldUpdateOperationsInput | number | null
    delayAnimationButton?: NullableFloatFieldUpdateOperationsInput | number | null
    canvaEnable?: IntFieldUpdateOperationsInput | number
    selectedCanvasIndex?: NullableIntFieldUpdateOperationsInput | number | null
    name?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    rankScore?: IntFieldUpdateOperationsInput | number
    bumpedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpPaidUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    links?: LinkUncheckedUpdateManyWithoutUserNestedInput
    labels?: LabelUncheckedUpdateManyWithoutUserNestedInput
    socialIcons?: SocialIconUncheckedUpdateManyWithoutUserNestedInput
    background?: BackgroundColorUncheckedUpdateManyWithoutUserNestedInput
    neonColors?: NeonColorUncheckedUpdateManyWithoutUserNestedInput
    statusbar?: StatusbarUncheckedUpdateOneWithoutUserNestedInput
  }

  export type UserCreateWithoutLinksInput = {
    id: string
    userName: string
    password: string
    email: string
    publicEmail?: string | null
    profileLink?: string | null
    profileImage?: string | null
    profileIcon?: string | null
    profileSiteText?: string | null
    iconUrl?: string | null
    description?: string | null
    profileHoverColor?: string | null
    degBackgroundColor?: number | null
    neonEnable?: number
    buttonThemeEnable?: number
    EnableAnimationArticle?: number
    EnableAnimationButton?: number
    EnableAnimationBackground?: number
    backgroundSize?: number | null
    selectedThemeIndex?: number | null
    selectedAnimationIndex?: number | null
    selectedAnimationButtonIndex?: number | null
    selectedAnimationBackgroundIndex?: number | null
    animationDurationBackground?: number | null
    delayAnimationButton?: number | null
    canvaEnable?: number
    selectedCanvasIndex?: number | null
    name: string
    emailVerified?: boolean
    image?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    role?: $Enums.Role
    rankScore?: number
    bumpedAt?: Date | string | null
    bumpExpiresAt?: Date | string | null
    bumpPaidUntil?: Date | string | null
    isPublic?: boolean
    labels?: LabelCreateNestedManyWithoutUserInput
    socialIcons?: SocialIconCreateNestedManyWithoutUserInput
    background?: BackgroundColorCreateNestedManyWithoutUserInput
    neonColors?: NeonColorCreateNestedManyWithoutUserInput
    statusbar?: StatusbarCreateNestedOneWithoutUserInput
    cosmetics?: CosmeticCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutLinksInput = {
    id: string
    userName: string
    password: string
    email: string
    publicEmail?: string | null
    profileLink?: string | null
    profileImage?: string | null
    profileIcon?: string | null
    profileSiteText?: string | null
    iconUrl?: string | null
    description?: string | null
    profileHoverColor?: string | null
    degBackgroundColor?: number | null
    neonEnable?: number
    buttonThemeEnable?: number
    EnableAnimationArticle?: number
    EnableAnimationButton?: number
    EnableAnimationBackground?: number
    backgroundSize?: number | null
    selectedThemeIndex?: number | null
    selectedAnimationIndex?: number | null
    selectedAnimationButtonIndex?: number | null
    selectedAnimationBackgroundIndex?: number | null
    animationDurationBackground?: number | null
    delayAnimationButton?: number | null
    canvaEnable?: number
    selectedCanvasIndex?: number | null
    name: string
    emailVerified?: boolean
    image?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    role?: $Enums.Role
    rankScore?: number
    bumpedAt?: Date | string | null
    bumpExpiresAt?: Date | string | null
    bumpPaidUntil?: Date | string | null
    isPublic?: boolean
    labels?: LabelUncheckedCreateNestedManyWithoutUserInput
    socialIcons?: SocialIconUncheckedCreateNestedManyWithoutUserInput
    background?: BackgroundColorUncheckedCreateNestedManyWithoutUserInput
    neonColors?: NeonColorUncheckedCreateNestedManyWithoutUserInput
    statusbar?: StatusbarUncheckedCreateNestedOneWithoutUserInput
    cosmetics?: CosmeticUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutLinksInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutLinksInput, UserUncheckedCreateWithoutLinksInput>
  }

  export type UserUpsertWithoutLinksInput = {
    update: XOR<UserUpdateWithoutLinksInput, UserUncheckedUpdateWithoutLinksInput>
    create: XOR<UserCreateWithoutLinksInput, UserUncheckedCreateWithoutLinksInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutLinksInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutLinksInput, UserUncheckedUpdateWithoutLinksInput>
  }

  export type UserUpdateWithoutLinksInput = {
    id?: StringFieldUpdateOperationsInput | string
    userName?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    publicEmail?: NullableStringFieldUpdateOperationsInput | string | null
    profileLink?: NullableStringFieldUpdateOperationsInput | string | null
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    profileIcon?: NullableStringFieldUpdateOperationsInput | string | null
    profileSiteText?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    profileHoverColor?: NullableStringFieldUpdateOperationsInput | string | null
    degBackgroundColor?: NullableIntFieldUpdateOperationsInput | number | null
    neonEnable?: IntFieldUpdateOperationsInput | number
    buttonThemeEnable?: IntFieldUpdateOperationsInput | number
    EnableAnimationArticle?: IntFieldUpdateOperationsInput | number
    EnableAnimationButton?: IntFieldUpdateOperationsInput | number
    EnableAnimationBackground?: IntFieldUpdateOperationsInput | number
    backgroundSize?: NullableIntFieldUpdateOperationsInput | number | null
    selectedThemeIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationButtonIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationBackgroundIndex?: NullableIntFieldUpdateOperationsInput | number | null
    animationDurationBackground?: NullableIntFieldUpdateOperationsInput | number | null
    delayAnimationButton?: NullableFloatFieldUpdateOperationsInput | number | null
    canvaEnable?: IntFieldUpdateOperationsInput | number
    selectedCanvasIndex?: NullableIntFieldUpdateOperationsInput | number | null
    name?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    rankScore?: IntFieldUpdateOperationsInput | number
    bumpedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpPaidUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    labels?: LabelUpdateManyWithoutUserNestedInput
    socialIcons?: SocialIconUpdateManyWithoutUserNestedInput
    background?: BackgroundColorUpdateManyWithoutUserNestedInput
    neonColors?: NeonColorUpdateManyWithoutUserNestedInput
    statusbar?: StatusbarUpdateOneWithoutUserNestedInput
    cosmetics?: CosmeticUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutLinksInput = {
    id?: StringFieldUpdateOperationsInput | string
    userName?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    publicEmail?: NullableStringFieldUpdateOperationsInput | string | null
    profileLink?: NullableStringFieldUpdateOperationsInput | string | null
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    profileIcon?: NullableStringFieldUpdateOperationsInput | string | null
    profileSiteText?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    profileHoverColor?: NullableStringFieldUpdateOperationsInput | string | null
    degBackgroundColor?: NullableIntFieldUpdateOperationsInput | number | null
    neonEnable?: IntFieldUpdateOperationsInput | number
    buttonThemeEnable?: IntFieldUpdateOperationsInput | number
    EnableAnimationArticle?: IntFieldUpdateOperationsInput | number
    EnableAnimationButton?: IntFieldUpdateOperationsInput | number
    EnableAnimationBackground?: IntFieldUpdateOperationsInput | number
    backgroundSize?: NullableIntFieldUpdateOperationsInput | number | null
    selectedThemeIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationButtonIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationBackgroundIndex?: NullableIntFieldUpdateOperationsInput | number | null
    animationDurationBackground?: NullableIntFieldUpdateOperationsInput | number | null
    delayAnimationButton?: NullableFloatFieldUpdateOperationsInput | number | null
    canvaEnable?: IntFieldUpdateOperationsInput | number
    selectedCanvasIndex?: NullableIntFieldUpdateOperationsInput | number | null
    name?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    rankScore?: IntFieldUpdateOperationsInput | number
    bumpedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpPaidUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    labels?: LabelUncheckedUpdateManyWithoutUserNestedInput
    socialIcons?: SocialIconUncheckedUpdateManyWithoutUserNestedInput
    background?: BackgroundColorUncheckedUpdateManyWithoutUserNestedInput
    neonColors?: NeonColorUncheckedUpdateManyWithoutUserNestedInput
    statusbar?: StatusbarUncheckedUpdateOneWithoutUserNestedInput
    cosmetics?: CosmeticUncheckedUpdateOneWithoutUserNestedInput
  }

  export type UserCreateWithoutLabelsInput = {
    id: string
    userName: string
    password: string
    email: string
    publicEmail?: string | null
    profileLink?: string | null
    profileImage?: string | null
    profileIcon?: string | null
    profileSiteText?: string | null
    iconUrl?: string | null
    description?: string | null
    profileHoverColor?: string | null
    degBackgroundColor?: number | null
    neonEnable?: number
    buttonThemeEnable?: number
    EnableAnimationArticle?: number
    EnableAnimationButton?: number
    EnableAnimationBackground?: number
    backgroundSize?: number | null
    selectedThemeIndex?: number | null
    selectedAnimationIndex?: number | null
    selectedAnimationButtonIndex?: number | null
    selectedAnimationBackgroundIndex?: number | null
    animationDurationBackground?: number | null
    delayAnimationButton?: number | null
    canvaEnable?: number
    selectedCanvasIndex?: number | null
    name: string
    emailVerified?: boolean
    image?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    role?: $Enums.Role
    rankScore?: number
    bumpedAt?: Date | string | null
    bumpExpiresAt?: Date | string | null
    bumpPaidUntil?: Date | string | null
    isPublic?: boolean
    links?: LinkCreateNestedManyWithoutUserInput
    socialIcons?: SocialIconCreateNestedManyWithoutUserInput
    background?: BackgroundColorCreateNestedManyWithoutUserInput
    neonColors?: NeonColorCreateNestedManyWithoutUserInput
    statusbar?: StatusbarCreateNestedOneWithoutUserInput
    cosmetics?: CosmeticCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutLabelsInput = {
    id: string
    userName: string
    password: string
    email: string
    publicEmail?: string | null
    profileLink?: string | null
    profileImage?: string | null
    profileIcon?: string | null
    profileSiteText?: string | null
    iconUrl?: string | null
    description?: string | null
    profileHoverColor?: string | null
    degBackgroundColor?: number | null
    neonEnable?: number
    buttonThemeEnable?: number
    EnableAnimationArticle?: number
    EnableAnimationButton?: number
    EnableAnimationBackground?: number
    backgroundSize?: number | null
    selectedThemeIndex?: number | null
    selectedAnimationIndex?: number | null
    selectedAnimationButtonIndex?: number | null
    selectedAnimationBackgroundIndex?: number | null
    animationDurationBackground?: number | null
    delayAnimationButton?: number | null
    canvaEnable?: number
    selectedCanvasIndex?: number | null
    name: string
    emailVerified?: boolean
    image?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    role?: $Enums.Role
    rankScore?: number
    bumpedAt?: Date | string | null
    bumpExpiresAt?: Date | string | null
    bumpPaidUntil?: Date | string | null
    isPublic?: boolean
    links?: LinkUncheckedCreateNestedManyWithoutUserInput
    socialIcons?: SocialIconUncheckedCreateNestedManyWithoutUserInput
    background?: BackgroundColorUncheckedCreateNestedManyWithoutUserInput
    neonColors?: NeonColorUncheckedCreateNestedManyWithoutUserInput
    statusbar?: StatusbarUncheckedCreateNestedOneWithoutUserInput
    cosmetics?: CosmeticUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutLabelsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutLabelsInput, UserUncheckedCreateWithoutLabelsInput>
  }

  export type UserUpsertWithoutLabelsInput = {
    update: XOR<UserUpdateWithoutLabelsInput, UserUncheckedUpdateWithoutLabelsInput>
    create: XOR<UserCreateWithoutLabelsInput, UserUncheckedCreateWithoutLabelsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutLabelsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutLabelsInput, UserUncheckedUpdateWithoutLabelsInput>
  }

  export type UserUpdateWithoutLabelsInput = {
    id?: StringFieldUpdateOperationsInput | string
    userName?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    publicEmail?: NullableStringFieldUpdateOperationsInput | string | null
    profileLink?: NullableStringFieldUpdateOperationsInput | string | null
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    profileIcon?: NullableStringFieldUpdateOperationsInput | string | null
    profileSiteText?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    profileHoverColor?: NullableStringFieldUpdateOperationsInput | string | null
    degBackgroundColor?: NullableIntFieldUpdateOperationsInput | number | null
    neonEnable?: IntFieldUpdateOperationsInput | number
    buttonThemeEnable?: IntFieldUpdateOperationsInput | number
    EnableAnimationArticle?: IntFieldUpdateOperationsInput | number
    EnableAnimationButton?: IntFieldUpdateOperationsInput | number
    EnableAnimationBackground?: IntFieldUpdateOperationsInput | number
    backgroundSize?: NullableIntFieldUpdateOperationsInput | number | null
    selectedThemeIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationButtonIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationBackgroundIndex?: NullableIntFieldUpdateOperationsInput | number | null
    animationDurationBackground?: NullableIntFieldUpdateOperationsInput | number | null
    delayAnimationButton?: NullableFloatFieldUpdateOperationsInput | number | null
    canvaEnable?: IntFieldUpdateOperationsInput | number
    selectedCanvasIndex?: NullableIntFieldUpdateOperationsInput | number | null
    name?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    rankScore?: IntFieldUpdateOperationsInput | number
    bumpedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpPaidUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    links?: LinkUpdateManyWithoutUserNestedInput
    socialIcons?: SocialIconUpdateManyWithoutUserNestedInput
    background?: BackgroundColorUpdateManyWithoutUserNestedInput
    neonColors?: NeonColorUpdateManyWithoutUserNestedInput
    statusbar?: StatusbarUpdateOneWithoutUserNestedInput
    cosmetics?: CosmeticUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutLabelsInput = {
    id?: StringFieldUpdateOperationsInput | string
    userName?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    publicEmail?: NullableStringFieldUpdateOperationsInput | string | null
    profileLink?: NullableStringFieldUpdateOperationsInput | string | null
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    profileIcon?: NullableStringFieldUpdateOperationsInput | string | null
    profileSiteText?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    profileHoverColor?: NullableStringFieldUpdateOperationsInput | string | null
    degBackgroundColor?: NullableIntFieldUpdateOperationsInput | number | null
    neonEnable?: IntFieldUpdateOperationsInput | number
    buttonThemeEnable?: IntFieldUpdateOperationsInput | number
    EnableAnimationArticle?: IntFieldUpdateOperationsInput | number
    EnableAnimationButton?: IntFieldUpdateOperationsInput | number
    EnableAnimationBackground?: IntFieldUpdateOperationsInput | number
    backgroundSize?: NullableIntFieldUpdateOperationsInput | number | null
    selectedThemeIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationButtonIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationBackgroundIndex?: NullableIntFieldUpdateOperationsInput | number | null
    animationDurationBackground?: NullableIntFieldUpdateOperationsInput | number | null
    delayAnimationButton?: NullableFloatFieldUpdateOperationsInput | number | null
    canvaEnable?: IntFieldUpdateOperationsInput | number
    selectedCanvasIndex?: NullableIntFieldUpdateOperationsInput | number | null
    name?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    rankScore?: IntFieldUpdateOperationsInput | number
    bumpedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpPaidUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    links?: LinkUncheckedUpdateManyWithoutUserNestedInput
    socialIcons?: SocialIconUncheckedUpdateManyWithoutUserNestedInput
    background?: BackgroundColorUncheckedUpdateManyWithoutUserNestedInput
    neonColors?: NeonColorUncheckedUpdateManyWithoutUserNestedInput
    statusbar?: StatusbarUncheckedUpdateOneWithoutUserNestedInput
    cosmetics?: CosmeticUncheckedUpdateOneWithoutUserNestedInput
  }

  export type UserCreateWithoutSocialIconsInput = {
    id: string
    userName: string
    password: string
    email: string
    publicEmail?: string | null
    profileLink?: string | null
    profileImage?: string | null
    profileIcon?: string | null
    profileSiteText?: string | null
    iconUrl?: string | null
    description?: string | null
    profileHoverColor?: string | null
    degBackgroundColor?: number | null
    neonEnable?: number
    buttonThemeEnable?: number
    EnableAnimationArticle?: number
    EnableAnimationButton?: number
    EnableAnimationBackground?: number
    backgroundSize?: number | null
    selectedThemeIndex?: number | null
    selectedAnimationIndex?: number | null
    selectedAnimationButtonIndex?: number | null
    selectedAnimationBackgroundIndex?: number | null
    animationDurationBackground?: number | null
    delayAnimationButton?: number | null
    canvaEnable?: number
    selectedCanvasIndex?: number | null
    name: string
    emailVerified?: boolean
    image?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    role?: $Enums.Role
    rankScore?: number
    bumpedAt?: Date | string | null
    bumpExpiresAt?: Date | string | null
    bumpPaidUntil?: Date | string | null
    isPublic?: boolean
    links?: LinkCreateNestedManyWithoutUserInput
    labels?: LabelCreateNestedManyWithoutUserInput
    background?: BackgroundColorCreateNestedManyWithoutUserInput
    neonColors?: NeonColorCreateNestedManyWithoutUserInput
    statusbar?: StatusbarCreateNestedOneWithoutUserInput
    cosmetics?: CosmeticCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutSocialIconsInput = {
    id: string
    userName: string
    password: string
    email: string
    publicEmail?: string | null
    profileLink?: string | null
    profileImage?: string | null
    profileIcon?: string | null
    profileSiteText?: string | null
    iconUrl?: string | null
    description?: string | null
    profileHoverColor?: string | null
    degBackgroundColor?: number | null
    neonEnable?: number
    buttonThemeEnable?: number
    EnableAnimationArticle?: number
    EnableAnimationButton?: number
    EnableAnimationBackground?: number
    backgroundSize?: number | null
    selectedThemeIndex?: number | null
    selectedAnimationIndex?: number | null
    selectedAnimationButtonIndex?: number | null
    selectedAnimationBackgroundIndex?: number | null
    animationDurationBackground?: number | null
    delayAnimationButton?: number | null
    canvaEnable?: number
    selectedCanvasIndex?: number | null
    name: string
    emailVerified?: boolean
    image?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    role?: $Enums.Role
    rankScore?: number
    bumpedAt?: Date | string | null
    bumpExpiresAt?: Date | string | null
    bumpPaidUntil?: Date | string | null
    isPublic?: boolean
    links?: LinkUncheckedCreateNestedManyWithoutUserInput
    labels?: LabelUncheckedCreateNestedManyWithoutUserInput
    background?: BackgroundColorUncheckedCreateNestedManyWithoutUserInput
    neonColors?: NeonColorUncheckedCreateNestedManyWithoutUserInput
    statusbar?: StatusbarUncheckedCreateNestedOneWithoutUserInput
    cosmetics?: CosmeticUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutSocialIconsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutSocialIconsInput, UserUncheckedCreateWithoutSocialIconsInput>
  }

  export type UserUpsertWithoutSocialIconsInput = {
    update: XOR<UserUpdateWithoutSocialIconsInput, UserUncheckedUpdateWithoutSocialIconsInput>
    create: XOR<UserCreateWithoutSocialIconsInput, UserUncheckedCreateWithoutSocialIconsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutSocialIconsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutSocialIconsInput, UserUncheckedUpdateWithoutSocialIconsInput>
  }

  export type UserUpdateWithoutSocialIconsInput = {
    id?: StringFieldUpdateOperationsInput | string
    userName?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    publicEmail?: NullableStringFieldUpdateOperationsInput | string | null
    profileLink?: NullableStringFieldUpdateOperationsInput | string | null
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    profileIcon?: NullableStringFieldUpdateOperationsInput | string | null
    profileSiteText?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    profileHoverColor?: NullableStringFieldUpdateOperationsInput | string | null
    degBackgroundColor?: NullableIntFieldUpdateOperationsInput | number | null
    neonEnable?: IntFieldUpdateOperationsInput | number
    buttonThemeEnable?: IntFieldUpdateOperationsInput | number
    EnableAnimationArticle?: IntFieldUpdateOperationsInput | number
    EnableAnimationButton?: IntFieldUpdateOperationsInput | number
    EnableAnimationBackground?: IntFieldUpdateOperationsInput | number
    backgroundSize?: NullableIntFieldUpdateOperationsInput | number | null
    selectedThemeIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationButtonIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationBackgroundIndex?: NullableIntFieldUpdateOperationsInput | number | null
    animationDurationBackground?: NullableIntFieldUpdateOperationsInput | number | null
    delayAnimationButton?: NullableFloatFieldUpdateOperationsInput | number | null
    canvaEnable?: IntFieldUpdateOperationsInput | number
    selectedCanvasIndex?: NullableIntFieldUpdateOperationsInput | number | null
    name?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    rankScore?: IntFieldUpdateOperationsInput | number
    bumpedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpPaidUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    links?: LinkUpdateManyWithoutUserNestedInput
    labels?: LabelUpdateManyWithoutUserNestedInput
    background?: BackgroundColorUpdateManyWithoutUserNestedInput
    neonColors?: NeonColorUpdateManyWithoutUserNestedInput
    statusbar?: StatusbarUpdateOneWithoutUserNestedInput
    cosmetics?: CosmeticUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutSocialIconsInput = {
    id?: StringFieldUpdateOperationsInput | string
    userName?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    publicEmail?: NullableStringFieldUpdateOperationsInput | string | null
    profileLink?: NullableStringFieldUpdateOperationsInput | string | null
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    profileIcon?: NullableStringFieldUpdateOperationsInput | string | null
    profileSiteText?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    profileHoverColor?: NullableStringFieldUpdateOperationsInput | string | null
    degBackgroundColor?: NullableIntFieldUpdateOperationsInput | number | null
    neonEnable?: IntFieldUpdateOperationsInput | number
    buttonThemeEnable?: IntFieldUpdateOperationsInput | number
    EnableAnimationArticle?: IntFieldUpdateOperationsInput | number
    EnableAnimationButton?: IntFieldUpdateOperationsInput | number
    EnableAnimationBackground?: IntFieldUpdateOperationsInput | number
    backgroundSize?: NullableIntFieldUpdateOperationsInput | number | null
    selectedThemeIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationButtonIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationBackgroundIndex?: NullableIntFieldUpdateOperationsInput | number | null
    animationDurationBackground?: NullableIntFieldUpdateOperationsInput | number | null
    delayAnimationButton?: NullableFloatFieldUpdateOperationsInput | number | null
    canvaEnable?: IntFieldUpdateOperationsInput | number
    selectedCanvasIndex?: NullableIntFieldUpdateOperationsInput | number | null
    name?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    rankScore?: IntFieldUpdateOperationsInput | number
    bumpedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpPaidUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    links?: LinkUncheckedUpdateManyWithoutUserNestedInput
    labels?: LabelUncheckedUpdateManyWithoutUserNestedInput
    background?: BackgroundColorUncheckedUpdateManyWithoutUserNestedInput
    neonColors?: NeonColorUncheckedUpdateManyWithoutUserNestedInput
    statusbar?: StatusbarUncheckedUpdateOneWithoutUserNestedInput
    cosmetics?: CosmeticUncheckedUpdateOneWithoutUserNestedInput
  }

  export type UserCreateWithoutBackgroundInput = {
    id: string
    userName: string
    password: string
    email: string
    publicEmail?: string | null
    profileLink?: string | null
    profileImage?: string | null
    profileIcon?: string | null
    profileSiteText?: string | null
    iconUrl?: string | null
    description?: string | null
    profileHoverColor?: string | null
    degBackgroundColor?: number | null
    neonEnable?: number
    buttonThemeEnable?: number
    EnableAnimationArticle?: number
    EnableAnimationButton?: number
    EnableAnimationBackground?: number
    backgroundSize?: number | null
    selectedThemeIndex?: number | null
    selectedAnimationIndex?: number | null
    selectedAnimationButtonIndex?: number | null
    selectedAnimationBackgroundIndex?: number | null
    animationDurationBackground?: number | null
    delayAnimationButton?: number | null
    canvaEnable?: number
    selectedCanvasIndex?: number | null
    name: string
    emailVerified?: boolean
    image?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    role?: $Enums.Role
    rankScore?: number
    bumpedAt?: Date | string | null
    bumpExpiresAt?: Date | string | null
    bumpPaidUntil?: Date | string | null
    isPublic?: boolean
    links?: LinkCreateNestedManyWithoutUserInput
    labels?: LabelCreateNestedManyWithoutUserInput
    socialIcons?: SocialIconCreateNestedManyWithoutUserInput
    neonColors?: NeonColorCreateNestedManyWithoutUserInput
    statusbar?: StatusbarCreateNestedOneWithoutUserInput
    cosmetics?: CosmeticCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutBackgroundInput = {
    id: string
    userName: string
    password: string
    email: string
    publicEmail?: string | null
    profileLink?: string | null
    profileImage?: string | null
    profileIcon?: string | null
    profileSiteText?: string | null
    iconUrl?: string | null
    description?: string | null
    profileHoverColor?: string | null
    degBackgroundColor?: number | null
    neonEnable?: number
    buttonThemeEnable?: number
    EnableAnimationArticle?: number
    EnableAnimationButton?: number
    EnableAnimationBackground?: number
    backgroundSize?: number | null
    selectedThemeIndex?: number | null
    selectedAnimationIndex?: number | null
    selectedAnimationButtonIndex?: number | null
    selectedAnimationBackgroundIndex?: number | null
    animationDurationBackground?: number | null
    delayAnimationButton?: number | null
    canvaEnable?: number
    selectedCanvasIndex?: number | null
    name: string
    emailVerified?: boolean
    image?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    role?: $Enums.Role
    rankScore?: number
    bumpedAt?: Date | string | null
    bumpExpiresAt?: Date | string | null
    bumpPaidUntil?: Date | string | null
    isPublic?: boolean
    links?: LinkUncheckedCreateNestedManyWithoutUserInput
    labels?: LabelUncheckedCreateNestedManyWithoutUserInput
    socialIcons?: SocialIconUncheckedCreateNestedManyWithoutUserInput
    neonColors?: NeonColorUncheckedCreateNestedManyWithoutUserInput
    statusbar?: StatusbarUncheckedCreateNestedOneWithoutUserInput
    cosmetics?: CosmeticUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutBackgroundInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutBackgroundInput, UserUncheckedCreateWithoutBackgroundInput>
  }

  export type UserUpsertWithoutBackgroundInput = {
    update: XOR<UserUpdateWithoutBackgroundInput, UserUncheckedUpdateWithoutBackgroundInput>
    create: XOR<UserCreateWithoutBackgroundInput, UserUncheckedCreateWithoutBackgroundInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutBackgroundInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutBackgroundInput, UserUncheckedUpdateWithoutBackgroundInput>
  }

  export type UserUpdateWithoutBackgroundInput = {
    id?: StringFieldUpdateOperationsInput | string
    userName?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    publicEmail?: NullableStringFieldUpdateOperationsInput | string | null
    profileLink?: NullableStringFieldUpdateOperationsInput | string | null
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    profileIcon?: NullableStringFieldUpdateOperationsInput | string | null
    profileSiteText?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    profileHoverColor?: NullableStringFieldUpdateOperationsInput | string | null
    degBackgroundColor?: NullableIntFieldUpdateOperationsInput | number | null
    neonEnable?: IntFieldUpdateOperationsInput | number
    buttonThemeEnable?: IntFieldUpdateOperationsInput | number
    EnableAnimationArticle?: IntFieldUpdateOperationsInput | number
    EnableAnimationButton?: IntFieldUpdateOperationsInput | number
    EnableAnimationBackground?: IntFieldUpdateOperationsInput | number
    backgroundSize?: NullableIntFieldUpdateOperationsInput | number | null
    selectedThemeIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationButtonIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationBackgroundIndex?: NullableIntFieldUpdateOperationsInput | number | null
    animationDurationBackground?: NullableIntFieldUpdateOperationsInput | number | null
    delayAnimationButton?: NullableFloatFieldUpdateOperationsInput | number | null
    canvaEnable?: IntFieldUpdateOperationsInput | number
    selectedCanvasIndex?: NullableIntFieldUpdateOperationsInput | number | null
    name?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    rankScore?: IntFieldUpdateOperationsInput | number
    bumpedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpPaidUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    links?: LinkUpdateManyWithoutUserNestedInput
    labels?: LabelUpdateManyWithoutUserNestedInput
    socialIcons?: SocialIconUpdateManyWithoutUserNestedInput
    neonColors?: NeonColorUpdateManyWithoutUserNestedInput
    statusbar?: StatusbarUpdateOneWithoutUserNestedInput
    cosmetics?: CosmeticUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutBackgroundInput = {
    id?: StringFieldUpdateOperationsInput | string
    userName?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    publicEmail?: NullableStringFieldUpdateOperationsInput | string | null
    profileLink?: NullableStringFieldUpdateOperationsInput | string | null
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    profileIcon?: NullableStringFieldUpdateOperationsInput | string | null
    profileSiteText?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    profileHoverColor?: NullableStringFieldUpdateOperationsInput | string | null
    degBackgroundColor?: NullableIntFieldUpdateOperationsInput | number | null
    neonEnable?: IntFieldUpdateOperationsInput | number
    buttonThemeEnable?: IntFieldUpdateOperationsInput | number
    EnableAnimationArticle?: IntFieldUpdateOperationsInput | number
    EnableAnimationButton?: IntFieldUpdateOperationsInput | number
    EnableAnimationBackground?: IntFieldUpdateOperationsInput | number
    backgroundSize?: NullableIntFieldUpdateOperationsInput | number | null
    selectedThemeIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationButtonIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationBackgroundIndex?: NullableIntFieldUpdateOperationsInput | number | null
    animationDurationBackground?: NullableIntFieldUpdateOperationsInput | number | null
    delayAnimationButton?: NullableFloatFieldUpdateOperationsInput | number | null
    canvaEnable?: IntFieldUpdateOperationsInput | number
    selectedCanvasIndex?: NullableIntFieldUpdateOperationsInput | number | null
    name?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    rankScore?: IntFieldUpdateOperationsInput | number
    bumpedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpPaidUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    links?: LinkUncheckedUpdateManyWithoutUserNestedInput
    labels?: LabelUncheckedUpdateManyWithoutUserNestedInput
    socialIcons?: SocialIconUncheckedUpdateManyWithoutUserNestedInput
    neonColors?: NeonColorUncheckedUpdateManyWithoutUserNestedInput
    statusbar?: StatusbarUncheckedUpdateOneWithoutUserNestedInput
    cosmetics?: CosmeticUncheckedUpdateOneWithoutUserNestedInput
  }

  export type UserCreateWithoutNeonColorsInput = {
    id: string
    userName: string
    password: string
    email: string
    publicEmail?: string | null
    profileLink?: string | null
    profileImage?: string | null
    profileIcon?: string | null
    profileSiteText?: string | null
    iconUrl?: string | null
    description?: string | null
    profileHoverColor?: string | null
    degBackgroundColor?: number | null
    neonEnable?: number
    buttonThemeEnable?: number
    EnableAnimationArticle?: number
    EnableAnimationButton?: number
    EnableAnimationBackground?: number
    backgroundSize?: number | null
    selectedThemeIndex?: number | null
    selectedAnimationIndex?: number | null
    selectedAnimationButtonIndex?: number | null
    selectedAnimationBackgroundIndex?: number | null
    animationDurationBackground?: number | null
    delayAnimationButton?: number | null
    canvaEnable?: number
    selectedCanvasIndex?: number | null
    name: string
    emailVerified?: boolean
    image?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    role?: $Enums.Role
    rankScore?: number
    bumpedAt?: Date | string | null
    bumpExpiresAt?: Date | string | null
    bumpPaidUntil?: Date | string | null
    isPublic?: boolean
    links?: LinkCreateNestedManyWithoutUserInput
    labels?: LabelCreateNestedManyWithoutUserInput
    socialIcons?: SocialIconCreateNestedManyWithoutUserInput
    background?: BackgroundColorCreateNestedManyWithoutUserInput
    statusbar?: StatusbarCreateNestedOneWithoutUserInput
    cosmetics?: CosmeticCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutNeonColorsInput = {
    id: string
    userName: string
    password: string
    email: string
    publicEmail?: string | null
    profileLink?: string | null
    profileImage?: string | null
    profileIcon?: string | null
    profileSiteText?: string | null
    iconUrl?: string | null
    description?: string | null
    profileHoverColor?: string | null
    degBackgroundColor?: number | null
    neonEnable?: number
    buttonThemeEnable?: number
    EnableAnimationArticle?: number
    EnableAnimationButton?: number
    EnableAnimationBackground?: number
    backgroundSize?: number | null
    selectedThemeIndex?: number | null
    selectedAnimationIndex?: number | null
    selectedAnimationButtonIndex?: number | null
    selectedAnimationBackgroundIndex?: number | null
    animationDurationBackground?: number | null
    delayAnimationButton?: number | null
    canvaEnable?: number
    selectedCanvasIndex?: number | null
    name: string
    emailVerified?: boolean
    image?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    role?: $Enums.Role
    rankScore?: number
    bumpedAt?: Date | string | null
    bumpExpiresAt?: Date | string | null
    bumpPaidUntil?: Date | string | null
    isPublic?: boolean
    links?: LinkUncheckedCreateNestedManyWithoutUserInput
    labels?: LabelUncheckedCreateNestedManyWithoutUserInput
    socialIcons?: SocialIconUncheckedCreateNestedManyWithoutUserInput
    background?: BackgroundColorUncheckedCreateNestedManyWithoutUserInput
    statusbar?: StatusbarUncheckedCreateNestedOneWithoutUserInput
    cosmetics?: CosmeticUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutNeonColorsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutNeonColorsInput, UserUncheckedCreateWithoutNeonColorsInput>
  }

  export type UserUpsertWithoutNeonColorsInput = {
    update: XOR<UserUpdateWithoutNeonColorsInput, UserUncheckedUpdateWithoutNeonColorsInput>
    create: XOR<UserCreateWithoutNeonColorsInput, UserUncheckedCreateWithoutNeonColorsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutNeonColorsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutNeonColorsInput, UserUncheckedUpdateWithoutNeonColorsInput>
  }

  export type UserUpdateWithoutNeonColorsInput = {
    id?: StringFieldUpdateOperationsInput | string
    userName?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    publicEmail?: NullableStringFieldUpdateOperationsInput | string | null
    profileLink?: NullableStringFieldUpdateOperationsInput | string | null
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    profileIcon?: NullableStringFieldUpdateOperationsInput | string | null
    profileSiteText?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    profileHoverColor?: NullableStringFieldUpdateOperationsInput | string | null
    degBackgroundColor?: NullableIntFieldUpdateOperationsInput | number | null
    neonEnable?: IntFieldUpdateOperationsInput | number
    buttonThemeEnable?: IntFieldUpdateOperationsInput | number
    EnableAnimationArticle?: IntFieldUpdateOperationsInput | number
    EnableAnimationButton?: IntFieldUpdateOperationsInput | number
    EnableAnimationBackground?: IntFieldUpdateOperationsInput | number
    backgroundSize?: NullableIntFieldUpdateOperationsInput | number | null
    selectedThemeIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationButtonIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationBackgroundIndex?: NullableIntFieldUpdateOperationsInput | number | null
    animationDurationBackground?: NullableIntFieldUpdateOperationsInput | number | null
    delayAnimationButton?: NullableFloatFieldUpdateOperationsInput | number | null
    canvaEnable?: IntFieldUpdateOperationsInput | number
    selectedCanvasIndex?: NullableIntFieldUpdateOperationsInput | number | null
    name?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    rankScore?: IntFieldUpdateOperationsInput | number
    bumpedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpPaidUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    links?: LinkUpdateManyWithoutUserNestedInput
    labels?: LabelUpdateManyWithoutUserNestedInput
    socialIcons?: SocialIconUpdateManyWithoutUserNestedInput
    background?: BackgroundColorUpdateManyWithoutUserNestedInput
    statusbar?: StatusbarUpdateOneWithoutUserNestedInput
    cosmetics?: CosmeticUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutNeonColorsInput = {
    id?: StringFieldUpdateOperationsInput | string
    userName?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    publicEmail?: NullableStringFieldUpdateOperationsInput | string | null
    profileLink?: NullableStringFieldUpdateOperationsInput | string | null
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    profileIcon?: NullableStringFieldUpdateOperationsInput | string | null
    profileSiteText?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    profileHoverColor?: NullableStringFieldUpdateOperationsInput | string | null
    degBackgroundColor?: NullableIntFieldUpdateOperationsInput | number | null
    neonEnable?: IntFieldUpdateOperationsInput | number
    buttonThemeEnable?: IntFieldUpdateOperationsInput | number
    EnableAnimationArticle?: IntFieldUpdateOperationsInput | number
    EnableAnimationButton?: IntFieldUpdateOperationsInput | number
    EnableAnimationBackground?: IntFieldUpdateOperationsInput | number
    backgroundSize?: NullableIntFieldUpdateOperationsInput | number | null
    selectedThemeIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationButtonIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationBackgroundIndex?: NullableIntFieldUpdateOperationsInput | number | null
    animationDurationBackground?: NullableIntFieldUpdateOperationsInput | number | null
    delayAnimationButton?: NullableFloatFieldUpdateOperationsInput | number | null
    canvaEnable?: IntFieldUpdateOperationsInput | number
    selectedCanvasIndex?: NullableIntFieldUpdateOperationsInput | number | null
    name?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    rankScore?: IntFieldUpdateOperationsInput | number
    bumpedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpPaidUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    links?: LinkUncheckedUpdateManyWithoutUserNestedInput
    labels?: LabelUncheckedUpdateManyWithoutUserNestedInput
    socialIcons?: SocialIconUncheckedUpdateManyWithoutUserNestedInput
    background?: BackgroundColorUncheckedUpdateManyWithoutUserNestedInput
    statusbar?: StatusbarUncheckedUpdateOneWithoutUserNestedInput
    cosmetics?: CosmeticUncheckedUpdateOneWithoutUserNestedInput
  }

  export type UserCreateWithoutStatusbarInput = {
    id: string
    userName: string
    password: string
    email: string
    publicEmail?: string | null
    profileLink?: string | null
    profileImage?: string | null
    profileIcon?: string | null
    profileSiteText?: string | null
    iconUrl?: string | null
    description?: string | null
    profileHoverColor?: string | null
    degBackgroundColor?: number | null
    neonEnable?: number
    buttonThemeEnable?: number
    EnableAnimationArticle?: number
    EnableAnimationButton?: number
    EnableAnimationBackground?: number
    backgroundSize?: number | null
    selectedThemeIndex?: number | null
    selectedAnimationIndex?: number | null
    selectedAnimationButtonIndex?: number | null
    selectedAnimationBackgroundIndex?: number | null
    animationDurationBackground?: number | null
    delayAnimationButton?: number | null
    canvaEnable?: number
    selectedCanvasIndex?: number | null
    name: string
    emailVerified?: boolean
    image?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    role?: $Enums.Role
    rankScore?: number
    bumpedAt?: Date | string | null
    bumpExpiresAt?: Date | string | null
    bumpPaidUntil?: Date | string | null
    isPublic?: boolean
    links?: LinkCreateNestedManyWithoutUserInput
    labels?: LabelCreateNestedManyWithoutUserInput
    socialIcons?: SocialIconCreateNestedManyWithoutUserInput
    background?: BackgroundColorCreateNestedManyWithoutUserInput
    neonColors?: NeonColorCreateNestedManyWithoutUserInput
    cosmetics?: CosmeticCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutStatusbarInput = {
    id: string
    userName: string
    password: string
    email: string
    publicEmail?: string | null
    profileLink?: string | null
    profileImage?: string | null
    profileIcon?: string | null
    profileSiteText?: string | null
    iconUrl?: string | null
    description?: string | null
    profileHoverColor?: string | null
    degBackgroundColor?: number | null
    neonEnable?: number
    buttonThemeEnable?: number
    EnableAnimationArticle?: number
    EnableAnimationButton?: number
    EnableAnimationBackground?: number
    backgroundSize?: number | null
    selectedThemeIndex?: number | null
    selectedAnimationIndex?: number | null
    selectedAnimationButtonIndex?: number | null
    selectedAnimationBackgroundIndex?: number | null
    animationDurationBackground?: number | null
    delayAnimationButton?: number | null
    canvaEnable?: number
    selectedCanvasIndex?: number | null
    name: string
    emailVerified?: boolean
    image?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    role?: $Enums.Role
    rankScore?: number
    bumpedAt?: Date | string | null
    bumpExpiresAt?: Date | string | null
    bumpPaidUntil?: Date | string | null
    isPublic?: boolean
    links?: LinkUncheckedCreateNestedManyWithoutUserInput
    labels?: LabelUncheckedCreateNestedManyWithoutUserInput
    socialIcons?: SocialIconUncheckedCreateNestedManyWithoutUserInput
    background?: BackgroundColorUncheckedCreateNestedManyWithoutUserInput
    neonColors?: NeonColorUncheckedCreateNestedManyWithoutUserInput
    cosmetics?: CosmeticUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutStatusbarInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutStatusbarInput, UserUncheckedCreateWithoutStatusbarInput>
  }

  export type UserUpsertWithoutStatusbarInput = {
    update: XOR<UserUpdateWithoutStatusbarInput, UserUncheckedUpdateWithoutStatusbarInput>
    create: XOR<UserCreateWithoutStatusbarInput, UserUncheckedCreateWithoutStatusbarInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutStatusbarInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutStatusbarInput, UserUncheckedUpdateWithoutStatusbarInput>
  }

  export type UserUpdateWithoutStatusbarInput = {
    id?: StringFieldUpdateOperationsInput | string
    userName?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    publicEmail?: NullableStringFieldUpdateOperationsInput | string | null
    profileLink?: NullableStringFieldUpdateOperationsInput | string | null
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    profileIcon?: NullableStringFieldUpdateOperationsInput | string | null
    profileSiteText?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    profileHoverColor?: NullableStringFieldUpdateOperationsInput | string | null
    degBackgroundColor?: NullableIntFieldUpdateOperationsInput | number | null
    neonEnable?: IntFieldUpdateOperationsInput | number
    buttonThemeEnable?: IntFieldUpdateOperationsInput | number
    EnableAnimationArticle?: IntFieldUpdateOperationsInput | number
    EnableAnimationButton?: IntFieldUpdateOperationsInput | number
    EnableAnimationBackground?: IntFieldUpdateOperationsInput | number
    backgroundSize?: NullableIntFieldUpdateOperationsInput | number | null
    selectedThemeIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationButtonIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationBackgroundIndex?: NullableIntFieldUpdateOperationsInput | number | null
    animationDurationBackground?: NullableIntFieldUpdateOperationsInput | number | null
    delayAnimationButton?: NullableFloatFieldUpdateOperationsInput | number | null
    canvaEnable?: IntFieldUpdateOperationsInput | number
    selectedCanvasIndex?: NullableIntFieldUpdateOperationsInput | number | null
    name?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    rankScore?: IntFieldUpdateOperationsInput | number
    bumpedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpPaidUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    links?: LinkUpdateManyWithoutUserNestedInput
    labels?: LabelUpdateManyWithoutUserNestedInput
    socialIcons?: SocialIconUpdateManyWithoutUserNestedInput
    background?: BackgroundColorUpdateManyWithoutUserNestedInput
    neonColors?: NeonColorUpdateManyWithoutUserNestedInput
    cosmetics?: CosmeticUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutStatusbarInput = {
    id?: StringFieldUpdateOperationsInput | string
    userName?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    publicEmail?: NullableStringFieldUpdateOperationsInput | string | null
    profileLink?: NullableStringFieldUpdateOperationsInput | string | null
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    profileIcon?: NullableStringFieldUpdateOperationsInput | string | null
    profileSiteText?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    profileHoverColor?: NullableStringFieldUpdateOperationsInput | string | null
    degBackgroundColor?: NullableIntFieldUpdateOperationsInput | number | null
    neonEnable?: IntFieldUpdateOperationsInput | number
    buttonThemeEnable?: IntFieldUpdateOperationsInput | number
    EnableAnimationArticle?: IntFieldUpdateOperationsInput | number
    EnableAnimationButton?: IntFieldUpdateOperationsInput | number
    EnableAnimationBackground?: IntFieldUpdateOperationsInput | number
    backgroundSize?: NullableIntFieldUpdateOperationsInput | number | null
    selectedThemeIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationButtonIndex?: NullableIntFieldUpdateOperationsInput | number | null
    selectedAnimationBackgroundIndex?: NullableIntFieldUpdateOperationsInput | number | null
    animationDurationBackground?: NullableIntFieldUpdateOperationsInput | number | null
    delayAnimationButton?: NullableFloatFieldUpdateOperationsInput | number | null
    canvaEnable?: IntFieldUpdateOperationsInput | number
    selectedCanvasIndex?: NullableIntFieldUpdateOperationsInput | number | null
    name?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    rankScore?: IntFieldUpdateOperationsInput | number
    bumpedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bumpPaidUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    links?: LinkUncheckedUpdateManyWithoutUserNestedInput
    labels?: LabelUncheckedUpdateManyWithoutUserNestedInput
    socialIcons?: SocialIconUncheckedUpdateManyWithoutUserNestedInput
    background?: BackgroundColorUncheckedUpdateManyWithoutUserNestedInput
    neonColors?: NeonColorUncheckedUpdateManyWithoutUserNestedInput
    cosmetics?: CosmeticUncheckedUpdateOneWithoutUserNestedInput
  }

  export type LinkCreateManyUserInput = {
    id?: number
    icon?: string | null
    url?: string
    text?: string | null
    name?: string | null
    description?: string | null
    showDescriptionOnHover?: boolean | null
    showDescription?: boolean | null
  }

  export type LabelCreateManyUserInput = {
    id?: number
    data?: string
    color?: string
    fontColor?: string
  }

  export type SocialIconCreateManyUserInput = {
    id?: number
    url?: string
    icon?: string
  }

  export type BackgroundColorCreateManyUserInput = {
    id?: number
    color?: string
  }

  export type NeonColorCreateManyUserInput = {
    id?: number
    color?: string
  }

  export type LinkUpdateWithoutUserInput = {
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    url?: StringFieldUpdateOperationsInput | string
    text?: NullableStringFieldUpdateOperationsInput | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    showDescriptionOnHover?: NullableBoolFieldUpdateOperationsInput | boolean | null
    showDescription?: NullableBoolFieldUpdateOperationsInput | boolean | null
  }

  export type LinkUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    url?: StringFieldUpdateOperationsInput | string
    text?: NullableStringFieldUpdateOperationsInput | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    showDescriptionOnHover?: NullableBoolFieldUpdateOperationsInput | boolean | null
    showDescription?: NullableBoolFieldUpdateOperationsInput | boolean | null
  }

  export type LinkUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    url?: StringFieldUpdateOperationsInput | string
    text?: NullableStringFieldUpdateOperationsInput | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    showDescriptionOnHover?: NullableBoolFieldUpdateOperationsInput | boolean | null
    showDescription?: NullableBoolFieldUpdateOperationsInput | boolean | null
  }

  export type LabelUpdateWithoutUserInput = {
    data?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    fontColor?: StringFieldUpdateOperationsInput | string
  }

  export type LabelUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    data?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    fontColor?: StringFieldUpdateOperationsInput | string
  }

  export type LabelUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    data?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    fontColor?: StringFieldUpdateOperationsInput | string
  }

  export type SocialIconUpdateWithoutUserInput = {
    url?: StringFieldUpdateOperationsInput | string
    icon?: StringFieldUpdateOperationsInput | string
  }

  export type SocialIconUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    url?: StringFieldUpdateOperationsInput | string
    icon?: StringFieldUpdateOperationsInput | string
  }

  export type SocialIconUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    url?: StringFieldUpdateOperationsInput | string
    icon?: StringFieldUpdateOperationsInput | string
  }

  export type BackgroundColorUpdateWithoutUserInput = {
    color?: StringFieldUpdateOperationsInput | string
  }

  export type BackgroundColorUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    color?: StringFieldUpdateOperationsInput | string
  }

  export type BackgroundColorUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    color?: StringFieldUpdateOperationsInput | string
  }

  export type NeonColorUpdateWithoutUserInput = {
    color?: StringFieldUpdateOperationsInput | string
  }

  export type NeonColorUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    color?: StringFieldUpdateOperationsInput | string
  }

  export type NeonColorUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    color?: StringFieldUpdateOperationsInput | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}