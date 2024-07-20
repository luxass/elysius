# elysius

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![jsr version][jsr-version-src]][jsr-version-href]

## 📦 Installation

```sh
npm install elysius
```

## 📚 Usage

```ts
import { find, findSync, walk, walkSync } from "elysius";

const path = await find("package.json"); // returns `null` if not found
const path = findSync("package.json"); // returns `null` if not found

const path = await find(["package.json", "tsconfig.json"]); // returns the first found file
const path = findSync(["package.json", "tsconfig.json"]); // returns the first found file

const path = await find(["package.json", "tsconfig.json"], {
  cwd: "src",
  async test(path) {
    const base = basename(file);
    if (base === "package.json") {
      const content = JSON.parse(await readFile(file, "utf-8"));
      return content.version;
    }
    return false;
  }
}); // returns `package.json` if it has a version field

const path = findSync(["package.json", "tsconfig.json"], {
  cwd: "src",
  test(path) {
    const base = basename(file);
    if (base === "package.json") {
      const content = JSON.parse(readFileSync(file, "utf-8"));
      return content.version;
    }
    return false;
  }
}); // returns `package.json` if it has a version field

for await (const entry of walk("src")) {
  console.log(entry); // prints one file at a time
}

const paths = Array.fromAsync(walk("src")); // returns an array of all files in `src`

for (const entry of walkSync("src")) {
  console.log(entry); // prints one file at a time
}

const paths = Array.from(walkSync("src")); // returns an array of all files in `src`
```

## 📄 License

Published under [MIT License](./LICENSE).

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/elysius?style=flat&colorA=18181B&colorB=4169E1
[npm-version-href]: https://npmjs.com/package/elysius
[npm-downloads-src]: https://img.shields.io/npm/dm/elysius?style=flat&colorA=18181B&colorB=4169E1
[npm-downloads-href]: https://npmjs.com/package/elysius
[jsr-version-src]: https://jsr.io/badges/@luxass/elysius?style=flat&labelColor=18181B&logoColor=4169E1
[jsr-version-href]: https://jsr.io/@luxass/elysius
