const requestCache = new Map();

export const cachedRequest = async (key, requestFn) => {
  if (requestCache.has(key)) {
    return requestCache.get(key);
  }

  const promise = requestFn()
    .then((res) => {
      requestCache.set(key, Promise.resolve(res));
      return res;
    })
    .catch((err) => {
      requestCache.delete(key);
      throw err;
    });

  requestCache.set(key, promise);
  return promise;
};
