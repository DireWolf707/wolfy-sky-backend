import slugify from "@sindresorhus/slugify"

export default (val) =>
  slugify(val, {
    separator: "_",
    lowercase: true,
    decamelize: false,
    preserveLeadingUnderscore: false,
    preserveTrailingDash: false,
  })
