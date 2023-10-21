# elysius

## ✨ Features

- ESM Support
- Tree Shakeable
- Supports `async` and `sync` functions

## 📦 Installation

```sh
pnpm install elysius
```

## 📚 Usage

```ts
import { find, findSync } from "elysius";

const path = await find("package.json"); // returns `null` if not found
const path = await findSync("package.json"); // returns `null` if not found

const path = await find(["package.json", "tsconfig.json"]); // returns the first found file
const path = await findSync(["package.json", "tsconfig.json"]); // returns the first found file

const path = await find(["package.json", "tsconfig.json"], {
  cwd: "src",
  async test: (path) => {
    const base = basename(file);
    if (base === "package.json") {
      const content = JSON.parse(await readFile(file, "utf-8"));
      return content.version;
    }
    return false;
  }
}); // returns `package.json` if it has a version field

const path = await findSync(["package.json", "tsconfig.json"], {
  cwd: "src",
  test: (path) => {
    const base = basename(file);
    if (base === "package.json") {
      const content = JSON.parse(readFileSync(file, "utf-8"));
      return content.version;
    }
    return false;
  }
}); // returns `package.json` if it has a version field
```

## 💻 Development

- Clone this repository
- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable` (use `npm i -g corepack` for Node.js < 16.10)
- Install dependencies using `pnpm install`
- Run tests using `pnpm dev`

## 📄 License

Published under [MIT License](./LICENSE).
