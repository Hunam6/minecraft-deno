<h1 align='center'><ins>minecraft-deno</ins></h1>
<p align='center'><strong>A Minecraft/Mojang API wrapper for Deno</strong></p>

---

### Example usage

```typescript
import {nameHistory, login, setSkin} from 'https://deno.land/x/minecraft/mod.ts'
nameHistory('_Hunam').then(res => console.log(res))
login('my e-mail', 'my password')
  .then(sec => setSkin(sec, 'http://textures.minecraft.net/texture/a1b811ea2c2691d2e8c5e125b8d2e8d579b70592d0067ab27325445c40e4867c'))
```

**Output:**

```typescript
[
  { name: "R2D2_BB8_64" },
  { name: "king_jump", changedToAt: 2017-03-25T10:04:40.000Z },
  { name: "_Hunam", changedToAt: 2018-08-30T09:23:49.000Z }
]

//_Hunam's skin changed too
```

### Documentation

You can view the full documentation on [Deno doc](https://doc.deno.land/https/deno.land/x/minecraft/mod.ts).

### Contributing

Hi and welcome! If you want to contribute to this project you can do so by many different ways, add new features, fix bugs, or improve the [documentation](https://doc.deno.land/https/deno.land/x/minecraft/mod.ts).
Just remember to follow the [GitHub Community Guidelines](https://docs.github.com/articles/github-community-guidelines).

### License

This project is licensed under the [MIT license](./LICENSE).
