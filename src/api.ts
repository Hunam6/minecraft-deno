import {toUint8Array} from 'https://deno.land/x/base64/mod.ts'
import {createError} from 'https://deno.land/x/cstack/mod.ts'

async function checkAPI(): Promise<string | boolean> {
  return await MCStatus().then((res: Record<string, string>[]) => {
    if (res[5]['api.mojang.com'] === 'green') return 'api.mojang.com is down.'
    else return true
  })
}

async function infos(username: string | string[], prop: string): Promise<string | Record<string, string>[]> {
  return await checkAPI().then(async (on: boolean | string) => {
    if (on)
      if (typeof username === 'string')
        return await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`)
          .then(res => res.json())
          .then(res => res[prop])
          .catch(() => "The player doesn't exist")
      else if (username.length < 11)
        return await fetch('https://api.mojang.com/profiles/minecraft', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(username)
        })
          .then(res => res.json())
          .then(res => {
            const out: string[] = []
            res.forEach((el: Record<string, string>) => out.push(el[prop]))
            return out
          })
      else return 'The array length cannot exceed 10'
    else return on
  })
}

async function textures(username: string, prop: string): Promise<string> {
  return await checkAPI().then(async (on: boolean | string) => {
    if (on) {
      if (!/^[0-9a-f]{8}[0-9a-f]{4}[1-5][0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12}$/i.test(username)) username = await UUID(username).then(res => <string>res)
      return await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${username}`)
        .then(res => res.json())
        .then(res => (res.path === "/session/minecraft/profile/The player doesn't exist" ? "The player doesn't exist" : res))
        .then(res => (res.path === '/session/minecraft/profile/undefined' ? 'Invalid input, the inputted UUID should not have any dash' : res))
        .then(res => (JSON.parse(new TextDecoder().decode(toUint8Array(res.properties[0].value))).textures[prop] === undefined ? "The player doesn't have any cape" : JSON.parse(new TextDecoder().decode(toUint8Array(res.properties[0].value))).textures[prop].url))
        .catch(() => "The player doesn't exist")
    } else return on
  })
}

async function stats(prop: string): Promise<Record<string, number>> {
  return await fetch('https://api.mojang.com/orders/statistics', {
    method: 'POST',
    body: JSON.stringify({
      metricKeys: [prop]
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(res => res.json())
}

async function req(method: string, url: string, headers: Record<string, string> = {}, body: Record<string, string | Record<string, string>> = {}) {
  const options = {
    method: method,
    headers: headers,
    body: JSON.stringify(body)
  }
  if (Object.keys(body).length === 0) options.body = ''
  return await fetch(url, options)
}

/**
 * This function returns the status of various Mojang services.
 *
 *
 *     // MCStatus()
 *     [
 *       { "minecraft.net": "yellow" },
 *       { "session.minecraft.net": "green" },
 *       { "account.mojang.com": "green" },
 *       { "authserver.mojang.com": "green" },
 *       { "sessionserver.mojang.com": "red" },
 *       { "api.mojang.com": "green" },
 *       { "textures.minecraft.net": "green" },
 *       { "mojang.com": "green" }
 *     ]
 */
export async function MCStatus(): Promise<Record<string, string>[]> {
  return await fetch('https://status.mojang.com/check').then(response => response.json())
}

/**
 * This function returns the UUID(s) of the inputted username(s).
 * **username** is an username or an array of usernames smaller than 10
 *
 *
 *     // UUID(['_hunam', 'syriusgang'])
 *     [
 *       "e5a310a065c44c2e9baeea4712481b6c",
 *       "21e83fbae7a8403fbd7bf34060ca8cba"
 *     ]
 */
export async function UUID(username: string | string[]): Promise<string | Record<string, string>[]> {
  return await infos(username, 'id')
}

/**
 * This function returns the formatted username(s) of the inputted username(s).
 * **username** is an username or an array of usernames smaller than 10
 *
 *
 *     // formatName(['_hunam', 'syriusgang'])
 *     [
 *       "SyriusGang",
 *       "_Hunam"
 *     ]
 */
export async function formatName(username: string | string[]): Promise<string | Record<string, string>[]> {
  return await infos(username, 'name')
}

/**
 * This function returns the skin texture file of the inputted username.
 * **username** is an username or an UUID
 *
 *
 *     // skin('_hunam')
 *     "http://textures.minecraft.net/texture/a1b811ea2c2691d2e8c5e125b8d2e8d579b70592d0067ab27325445c40e4867c"
 */
export async function skin(username: string): Promise<string> {
  return await textures(username, 'SKIN')
}

/**
 * This function returns the cape texture file of the inputted username.
 * **username** is an username or an UUID
 *
 *
 *     // cape('ad')
 *     "http://textures.minecraft.net/texture/e7dfea16dc83c97df01a12fabbd1216359c0cd0ea42f9999b6e97c584963e980"
 */
export async function cape(username: string): Promise<string> {
  return await textures(username, 'CAPE')
}

/**
 * This function returns the names history of an account.
 * **username** is an username or an UUID
 *
 *
 *     // nameHistory('_hunam')
 *     [
 *       { name: "R2D2_BB8_64" },
 *       { name: "king_jump", changedToAt: 2017-03-25T10:04:40.000Z },
 *       { name: "_Hunam", changedToAt: 2018-08-30T09:23:49.000Z }
 *     ]
 */
export async function nameHistory(username: string): Promise<Record<string, string | Date>[]> {
  return await checkAPI().then(async (on: boolean | string) => {
    if (on) {
      if (!/^[0-9a-f]{8}[0-9a-f]{4}[1-5][0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12}$/i.test(username)) username = await UUID(username).then(res => <string>res)
      return await fetch(`https://api.mojang.com/user/profiles/${username}/names`)
        .then(res => res.json())
        .then(res => (res.errorMessage === "Invalid ID characters: The%20player%20doesn't%20exist" ? "The player doesn't exist" : res))
        .then(res => (res.errorMessage === 'Invalid ID size: undefined' ? 'Invalid input, the inputted UUID should not have any dash' : res))
        .then(res => {
          res.forEach((el: Record<string, string | number | Date>) => (el.changedToAt === undefined ? 0 : (el.changedToAt = new Date(el.changedToAt))))
          return res
        })
        .catch(() => "The player doesn't exist")
    } else return on
  })
}

/**
 * This function is special, it's required for the rename
 * **sec** is the output of the login function
 * **skin** is the skin URL
 * **isSlim** is if the inputted skin is a slim variant
 *
 *
 *     // resetSkin(sec)
 *     {
 *       token: "very_long_private_string",
 *       UUID: "21e83fbae7a8403fbd7bf34060ca8cba"
 *     }
 */
export async function login(email: string, password: string, secQues: string[] = []) {
  let token: string
  let UUID: string
  let needed = true
  return await MCStatus().then(res => {
    if (res[3]['authserver.mojang.com'] !== 'green') return 'authserver.mojang.com is down.'
    else
      return req(
        'POST',
        'https://authserver.mojang.com/authenticate',
        {
          'Content-Type': 'application/json'
        },
        {
          username: email,
          password: password,
          agent: {
            name: 'Minecraft'
          }
        }
      )
        .then(res => res.json())
        .then(res => {
          if (res.errorMessage !== undefined) throw createError(new Error(res.errorMessage))
          else {
            token = res.accessToken
            UUID = res.selectedProfile.id
          }
        })
        .then(() =>
          req('GET', 'https://api.mojang.com/user/security/location', {
            Authorization: `Bearer ${token}`
          })
        )
        .then(res => res.text())
        .then(res => (res === '' ? (needed = false) : ''))
        .then(() =>
          needed
            ? req('GET', 'https://api.mojang.com/user/security/challenges', {
                Authorization: `Bearer ${token}`
              }).then(res => res.json())
            : ''
        )
        .then(res => {
          if (needed) {
            if (secQues.length === 0) {
              res.forEach((el: Record<string, Record<string, string>>) => secQues.push(el.question.question))
              return <any>secQues
            }
            const answers: Record<string, string | number>[] = []
            res.forEach((el: Record<string, Record<string, string>>, i: number) =>
              answers.push({
                id: el.answer.id,
                answer: secQues[i]
              })
            )
            return answers
          }
          return
        })
        .then(res => {
          if (needed) {
            if (Array.isArray(res) && res.every(item => typeof item === 'string')) return res
            return req(
              'POST',
              'https://api.mojang.com/user/security/location',
              {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              res
            ).then(res => (res.status === 204 ? '' : res.json()))
          }
          return ''
        })
        .then(res => {
          if (res.constructor !== String && res.every((el: any) => typeof el === 'string')) return res
          if (res.errorMessage !== undefined) throw createError(new Error(res.errorMessage))
          return {token, UUID}
        })
  })
}

/**
 * This function sets a new name.
 * **sec** is the output of the login function
 * **newName** is the new name
 *
 *
 *     // rename(sec, '_Hunam')
 *     {
 *       token: "very_long_private_string",
 *       UUID: "21e83fbae7a8403fbd7bf34060ca8cba"
 *     }
 */
export async function rename(sec: Record<string, string>, newName: string) {
  return await req('PUT', `https://api.minecraftservices.com/minecraft/profile/name/${newName}`, {
    Authorization: `Bearer ${sec.token}`
  }).then(res => {
    if(res.status === 400) throw createError(new Error('Name is invalid, longer than 16 characters or contains characters other than (a-zA-Z0-9_)'))
    if(res.status === 403) throw createError(new Error('Name is unavailable (Either taken or has not become available)'))
    else return sec
  })
}

/**
 * This function resets the skin to either Steve's one or Alex's one (see this JS implementation: https://to.to/t1H8p).
 * **sec** is the output of the login function
 *
 *
 *     // resetSkin(sec)
 *     {
 *       token: "very_long_private_string",
 *       UUID: "21e83fbae7a8403fbd7bf34060ca8cba"
 *     }
 */
export async function resetSkin(sec: Record<string, string>) {
  return await req('DELETE', `https://api.mojang.com/user/profile/${sec.UUID}/skin`, {
    Authorization: `Bearer ${sec.token}`
  }).then(() => sec)
}

/**
 * This function sets a custom skin.
 * **sec** is the output of the login function
 * **skin** is the skin URL
 * **isSlim** is if the inputted skin is a slim variant
 *
 *
 *     // setSkin(sec, 'http://textures.minecraft.net/texture/a1b811ea2c2691d2e8c5e125b8d2e8d579b70592d0067ab27325445c40e4867c')
 *     {
 *       token: "very_long_private_string",
 *       UUID: "21e83fbae7a8403fbd7bf34060ca8cba"
 *     }
 */
export async function setSkin(sec: Record<string, string>, skin: string, isSlim = false) {
  return await req(
    'POST',
    `https://api.minecraftservices.com/minecraft/profile/skins`,
    {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${sec.token}`
    },
    {
      variant: isSlim ? 'slim' : 'classic',
      url: skin
    }
  ).then(() => sec)
}

/**
 * This function returns an array of SHA1 hashes used to check server addresses against when the client tries to connect.
 *
 *
 *     // blockedServers()
 *     [
 *       "c5c03d9bad5c5ad25deb64600b9cd900312d4d74",
 *       "72fd29f430c91c583bb7216fe673191dc25a7e18",
 *       "e38e82a54b47c7c5394670bb34b3aa941219959b",
 *       "d1bab7fcb1d44a0ad1084fb201006d79d05ae6e7",
 *       "1822a17662c7e0cf3b815c257d32c2aa0245fad0",
 *       "7905e1eeee5d57268bb9cbea2e0acbb5421a667b",
 *       "56c7a4ccff309d6eb3c5737fe9509c3555e7f5fa",
 *       "cf2f874a649da0118f717f7edb1f5fffcbae8c6b",
 *       "c800614f07e155ca842e23f84c6a553973ccdb1f",
 *       ... 2241 more items
 *     ]
 */
export async function blockedServers(): Promise<string[] | boolean | string> {
  return await checkAPI().then(async (on: boolean | string) => {
    if (on)
      return await fetch('https://sessionserver.mojang.com/blockedservers')
        .then(res => res.text())
        .then(res => res.split('\n'))
    else return on
  })
}

/**
 * This function returns statistics on the sales of Minecraft.
 *
 *
 *     // MCStats()
 *     {
 *       item_sold_minecraft: { total: 36124314, last24h: 25940, saleVelocityPerSeconds: 0.34 },
 *       prepaid_card_redeemed_minecraft: { total: 4782079, last24h: 0, saleVelocityPerSeconds: 0 },
 *       item_sold_cobalt: { total: 41722, last24h: 0, saleVelocityPerSeconds: 0 },
 *       item_sold_scrolls: { total: 132261, last24h: 0, saleVelocityPerSeconds: 0 },
 *       prepaid_card_redeemed_cobalt: { total: 1, last24h: 0, saleVelocityPerSeconds: 0 },
 *       item_sold_dungeons: { total: 268660, last24h: 171, saleVelocityPerSeconds: 0 }
 *     }
 */
export async function MCStats(): Promise<Record<string, Record<string, number>> | string | boolean> {
  return await checkAPI().then(async (on: boolean | string) => {
    if (on)
      return {
        item_sold_minecraft: await stats('item_sold_minecraft'),
        prepaid_card_redeemed_minecraft: await stats('prepaid_card_redeemed_minecraft'),
        item_sold_cobalt: await stats('item_sold_cobalt'),
        item_sold_scrolls: await stats('item_sold_scrolls'),
        prepaid_card_redeemed_cobalt: await stats('prepaid_card_redeemed_cobalt'),
        item_sold_dungeons: await stats('item_sold_dungeons')
      }
    else return on
  })
}
