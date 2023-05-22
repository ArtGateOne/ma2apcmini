# pkg-prebuilds

[![npm](https://img.shields.io/npm/v/pkg-prebuilds.svg)](https://www.npmjs.com/package/pkg-prebuilds)
[![npm](https://img.shields.io/npm/dm/pkg-prebuilds.svg)](https://www.npmjs.com/package/pkg-prebuilds)
[![npm](https://img.shields.io/npm/l/pkg-prebuilds.svg)](LICENSE)

An opionated lightweight alternative to [node-gyp-build](https://www.npmjs.com/package/node-gyp-build) & [prebuildify](https://www.npmjs.com/package/prebuildify), that is build tooling agnostic.


## Usage

It is recommended to use this with github-actions to produce your builds. You can see an up-to-date workflow utilising this in [@julusian/jpeg-turbo](https://github.com/Julusian/node-jpeg-turbo/blob/master/.github/workflows/node.yaml)

Firstly, a js file is required to define various configuration of your binary. This is needed in two places, so is recommended to be a simple js file.
The options are defined as:
```
interface Options {
 /**
     * Unique name of the binding. 
     * This must match the output file as specified in CMake/node-gyp
     * Typically this will be the same as the name in your package.json, but you are free to make it different
     */
  name: string,
  /**
   * The node-api versions that are built.
   */
  napi_versions?: number[],
  /**
   * Whether the bindings are labelled with the arm version (eg armv7, arm64v8)
   */
  armv?: boolean,
}
```
The formal definition of the above is also stored in `bindings.d.ts`.

There are a few components to this library as follows.

### pkg-prebuilds-copy

Copy a prebuilt binary into the prebuilds folder.

Example: `pkg-prebuilds-copy --source build/Release/jpeg-turbo.node --name=jpeg-turbo --strip  --napi_version=7 --arch=x64`

This takes a few paramaters to figure out the correct filename:
* `source` - The built file to copy (required)
* `name` - The name of the binding as defined in the options object (required)
* `napi_version` - The node-api version it was built for (required)
* `strip` - Whether to strip the file of debug symbols (default: false)
* `libc` - The libc it was built for (glibc, musl. only applicable to linux) (default: glibc)
* `runtime` - The runtime it was built for (node, electron, nwjs) (default: node)
* `arch` - The architecture it was built for (x64, arm64 etc) (default: current process arch)
* `platform` - The platform it was built for (win32, linux, darwin) (default: current process platform)

### pkg-prebuilds-verify

A simple script to verify if there is a prebuild for the current environment, and exit successfully, or with an error code.  
Intended to be used with `pkg-prebuilds-verify ./binding-options.js || cmake-js ....`

This command listens to the following environment variables as override:
* npm_config_build_from_source
* npm_config_arch
* npm_config_platform
* npm_config_runtime

These variables allow for ensuring the correct version as needed for `electron-builder` or other tools to cross-build.

### require('pkg-prebuilds')

In the most simple form
```
const binding = require("pkg-prebuilds")(
  __dirname,
  require("./binding-options")
);
```
Where `./binding-options.js` is the file exporting the options object.

This is very similar to how `bindings` or `node-gyp-build` operate, but is much more verbose in requiring the options object.


## Why another tool?

`node-gyp-build` is very based around `node-gyp`, and getting support for `cmake-js` stalled many years ago.
Additionally, `node-gyp-build` is clever about detecting the correct file for you, but this does not work well if it gets bundled with `webpack`, `pkg` or alternatives. Because the prebuilds are not named with the package they are for, it is very hard to make them coexist after bundling.

This is written to be simple. It doesnt try to do any magic, it simply copies files into an organised structure and then provides a way of loading the correct one. 
It expects callers to provide any information it may needed, rather than it trying to figure it out. While this is more difficult for developers using this library, it has a minimal cost and helps ensure it will work consistently for all users.


## License

See [LICENSE](LICENSE).

Copyright © Julian Waller. All Rights Reserved.
