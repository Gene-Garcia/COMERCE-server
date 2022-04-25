/*
 * A workaround wanting to spread an object field with data in it.
 * Returns a new object where only fields with value are retained
 */
const getNonNullValues = (obj) => {
  let x = {};

  for ([key, val] of Object.entries(obj)) {
    if (val) x[key] = val;
  }

  return x;
};

export { getNonNullValues };
