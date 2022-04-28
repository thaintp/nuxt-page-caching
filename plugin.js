import RedisStore from "nuxt-page-caching/lib/RedisStore";
import getKey from "nuxt-page-caching/lib/getKey";

const options=<%= JSON.stringify(options, null, 2) %>;

export default ({ req }, inject) => {
  inject(
    "cacheFetch",
    (
      {
        key,
        expire,
        disable = options.disable,
        url = options.url,
        prefix = options.prefix,
        ignoreConnectionErrors = options.ignoreConnectionErrors,
      },
      requestCallback
    ) => {
      if (disable) {
        return requestCallback();
      }

      const redis = new RedisStore(
        url,
        true,
        prefix,
        process && process.server,
        ignoreConnectionErrors
      );

      return redis.fetch(
        getKey({ appendHost: options.appendHost, req, key }),
        expire,
        requestCallback,
        true
      );
    }
  );
  inject(
    "cacheWrite",
    (
      {
        key,
        expire,
        disable = options.disable,
        url = options.url,
        prefix = options.prefix,
        ignoreConnectionErrors = options.ignoreConnectionErrors,
      },
      value
    ) => {
      if (disable) {
        return new Promise((resolve) => resolve(false));
      }

      const redis = new RedisStore(
        url,
        false,
        prefix,
        process && process.server,
        ignoreConnectionErrors
      );

      try {
        return redis.write(
          getKey({ appendHost: options.appendHost, req, key }),
          value,
          expire
        );
      } catch (e) {
        console.error(e);
        return new Promise((resolve) => resolve(false));
      } finally {
        redis.disconnect();
      }
    }
  );
  inject(
    "cacheRead",
    ({
      key,
      disable = options.disable,
      url = options.url,
      prefix = options.prefix,
      ignoreConnectionErrors = options.ignoreConnectionErrors,
    }) => {
      if (disable) {
        return new Promise((resolve) => resolve(null));
      }

      const redis = new RedisStore(
        url,
        false,
        prefix,
        process && process.server,
        ignoreConnectionErrors
      );

      try {
        return redis.read(getKey({ appendHost: options.appendHost, req, key }));
      } catch (e) {
        console.error(e);
        return new Promise((resolve) => resolve(null));
      } finally {
        redis.disconnect();
      }
    }
  );
};
