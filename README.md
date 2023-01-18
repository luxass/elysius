# elysius

<p align="center">
  <a href="https://www.npmjs.com/package/elysius"><img src="https://img.shields.io/npm/v/elysius?style=for-the-badge&color=3FA7D6&label="></a>
<p>

## Install

```bash
pnpm install elysius
```

## Usage

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
