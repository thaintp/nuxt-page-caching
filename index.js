import path from "path";

import RedisStore from "./lib/RedisStore";
import { serialize, deserialize } from "./lib/serializer";
import getKey from "./lib/getKey";

export default function index({
  getCacheData,
  url = "redis://127.0.0.1:6379",
  prefix = "r-",
  appendHost = true,
  disable = false,
  ignoreConnectionErrors = false,
}) {
  const { nuxt } = this;

  nuxt.hook("render:before", (renderer) => {
    const renderRoute = renderer.renderRoute.bind(renderer);

    renderer.renderRoute = function (route, context) {
      const cacheData = getCacheData ? getCacheData(route, context) : null;
      if (!cacheData || disable) return renderRoute(route, context);

      // eslint-disable-next-line prefer-const
      let { key, expire, renewCache } = cacheData;

      const redisStore = new RedisStore(
        cacheData.url || url,
        false,
        prefix,
        true,
        ignoreConnectionErrors
      );

      function renderAndSetCacheKey() {
        return renderRoute(route, context).then(async function (result) {
          if (!result.error && !result.redirected) {
            await redisStore.write(
              getKey({ appendHost, req: context.req, key }),
              serialize(result),
              expire
            );
          }
          return result;
        });
      }

      return new Promise(async (resolve) => {
        try {
          const cachedResult = await redisStore.read(key);
          if (cachedResult && !renewCache) {
            resolve(deserialize(cachedResult));
          } else {
            resolve(renderAndSetCacheKey());
          }
        } catch {
          resolve(renderRoute(route, context));
        }
      }).finally(() => {
        redisStore.disconnect();
      });
    };
  });

  this.addPlugin({
    fileName: "nuxt-page-caching/plugin.js",
    src: path.resolve(__dirname, "plugin.js"),
    options: {
      url,
      prefix,
      appendHost,
      disable,
      ignoreConnectionErrors,
    },
  });
}

module.exports.meta = require("./package.json");
