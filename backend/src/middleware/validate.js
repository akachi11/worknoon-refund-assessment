import { ValidationError } from "../errors.js";

export function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(new ValidationError(`Invalid request ${source}.`, result.error.flatten()));
    }
    req[source] = result.data;
    next();
  };
}
