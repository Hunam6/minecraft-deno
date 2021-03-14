<h1 align='center'><ins>minecraft-deno</ins></h1>
<p align='center'><strong>A Minecraft/Mojang API wrapper for Deno</strong></p>

---

### Example usage

```typescript
import {nameHistory} from 'https://deno.land/x/minecraft/mod.ts'
nameHistory('_Hunam').then(res => console.log(res))
```

**Output:**

```typescript
[
  { name: "R2D2_BB8_64" },
  { name: "king_jump", changedToAt: 2017-03-25T10:04:40.000Z },
  { name: "_Hunam", changedToAt: 2018-08-30T09:23:49.000Z }
]
```

### Documentation

You can view the full documentation on this repository's [wiki](https://github.com/Hunam6/minecraft-deno/wiki).

### Contributing

Hi and welcome! If you want to contribute to this project you can do so by many different ways, add new features, fix bugs, or improve the [documentation](https://github.com/Hunam6/minecraft-deno/wiki).
Just remember to follow the [GitHub Community Guidelines](https://docs.github.com/articles/github-community-guidelines).

### License

This project is licensed under the [MIT license](./LICENSE).
