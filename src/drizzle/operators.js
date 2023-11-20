export { alias, union, except } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const arrayAgg = (table, nonNullableField) => sql`coalesce(json_agg(${table}) filter (where ${nonNullableField} is not null), '[]')`

export const arrayAggOrder = (table, orderByField, nonNullableField) =>
  sql`coalesce(json_agg(${table} order by ${orderByField} desc) filter (where ${nonNullableField} is not null), '[]')`
