## Installation

```bash
yarn add nuxt-page-caching
```

## Usage

First of all config redis to your machine
if you are using ubuntu there is a good video here is the link:
https://www.youtube.com/watch?v=gNPgaBugCWk

```javascript
// nuxt.config.js

modules: [
  [
    "nuxt-page-caching",
    {
      disable: false,
      appendHost: true,
      ignoreConnectionErrors: false, //it's better to be true in production
      prefix: "r-",
      url: "redis://127.0.0.1:6379",
      getCacheData(route, context) {
        if (route !== "/") {
          return false;
        }
        return {
          key: "my-home-page",
          expire: 60 * 60,
          renewCache: route.includes("nocache=1"),
        }; // 1 hour
      },
    },
  ],
];
```

## Options

| Property               | Type     | Required? | Description                                                                         |
| :--------------------- | :------- | :-------- | :---------------------------------------------------------------------------------- |
| disable                | boolean  | no        | default is `true` you can disable all module features                               |
| appendHost             | boolean  | no        | default is `true` append host to the key                                            |
| ignoreConnectionErrors | boolean  | no        | default is `false` ignore connection errors and render data as normal               |
| prefix                 | string   | no        | default is `r-` it's redis prefix key                                               |
| url                    | string   | no        | default is `redis://127.0.0.1:6379` url for redis connection                        |
| getCacheData           | function | yes       | should return `getCacheDataResponse`, if return `false` the page will not be cached |

## getCacheDataResponse

| Property   | Type    | Required? | Description                                                                                                            |
| :--------- | :------ | :-------- | :--------------------------------------------------------------------------------------------------------------------- |
| key        | string  | no        | redis cache key, default is `empty`                                                                                    |
| expire     | number  | no        | redis cache exp time in seconds                                                                                        |
| renewCache | boolean | no        | set to `true` if don't want to render cached data, also set newest data to redis for others to use, default is `false` |
| url        | string  | no        | redis uri, to save data to other redis server, default is `empty`                                                      |

## Caveat

**Important security warning** : don't load secret keys such as user credential on the server for cached pages.
_this is because they will cache for all users!_

### Side note

If during test process in your local machine your page start rerender over and over it is not a big deal that is because package changed nuxt render function
to solve that open a route not include cache in your browser **until build process done**

## API request caching

```javascript
asyncData(ctx) {
    return ctx.$cacheFetch({ key: 'myApiKey', expire: 60 * 2 }, () => {
      console.log('my callback called*******')
      return ctx.$axios.$get('https://jsonplaceholder.typicode.com/todos/1')
    })
  }
```

Explain:

- `nuxt-page-caching` inject a plugin `cacheFetch` this is a function with two parameters:

  1. The first one get an object include `key` and `expire` for redis
  2. The second parameter is a callback function should return your normal request as a promise

- `cacheFetch` method will check if the process is in the server then check key in redis, if key exist return data from redis if not call your callback as normal
- This method useful for consistent requests such as menu

## Caveat

Callback function should return a valid json for `JSON.stringify` method

## Features

- Easy to use
- Cache whole page in the redis
- Separate expire time for each page
- API request cache

## More control

To save a page to another redis server just return
`{key:string, expire:number, url:"my new url"}`
inside `getCacheData` method

Also, it is possible for `catchFetch` method here is full object you can pass
`{ key, expire, disable, url, prefix, ignoreConnectionErrors}`

For write and read directly you can use two injected methods:

`const data = await $cacheRead({ key:'yourKey' })`

Data is `null` if key is not exist

`const flag = await $cacheWrite({ key, expire: 60*60*24 }, 'your content')`

Flag is `false` if can not write

> You have to make sure process is in the server for `cacheRead` and `cacheWrite` methods

## Security warning

> You should use private redis server, if you are using a public redis server with a password be aware your password will bundle in client and leaks
