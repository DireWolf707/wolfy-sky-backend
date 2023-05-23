export {
  eq,
  ne,
  gt,
  gte,
  lt,
  lte,
  isNull,
  isNotNull,
  inArray,
  notInArray,
  exists,
  notExists,
  between,
  notBetween,
  like,
  notLike,
  ilike,
  notIlike,
  not,
  and,
  or,
  sql,
  asc,
  desc,
} from "drizzle-orm"

import { sql } from "drizzle-orm"

export const arrayAgg = (table, nonNullableField) => sql`coalesce(json_agg(${table}) filter (where ${nonNullableField} is not null), '[]')`
