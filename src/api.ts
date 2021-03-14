import {toUint8Array} from 'https://deno.land/x/base64/mod.ts'

const checkAPI = async (): Promise<string | boolean> => {
  return await MCStatus().then((res: Record<string, string>[]) => {
    if (res[5]['api.mojang.com'] === 'green') return 'api.mojang.com is down.'
    else return true
  })
}

const infos = async (username: string | string[], prop: string) => {
  //TODO: check for too long array (see doc)
  //TODO: add return type
  return await checkAPI().then(async (on: boolean | string) => {
    if (on) {
      if (typeof username === 'string')
        return await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`)
          .then(res => res.json())
          .then(res => res[prop])
          .catch(() => "The player doesn't exist")
      else
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
    } else return on
  })
}

const textures = async (username: string, prop: string) => {
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

const stats = async (prop: string) => {
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

export const MCStatus = async (): Promise<Record<string, string>[]> => {
  return await fetch('https://status.mojang.com/check').then(response => response.json())
}

export const UUID = async (username: string | string[]): Promise<string | Record<string, string>[]> => {
  return await infos(username, 'id')
}

export const formatName = async (username: string | string[]): Promise<string | Record<string, string>[]> => {
  return await infos(username, 'name')
}

export const skin = async (username: string) => {
  return await textures(username, 'SKIN')
}

export const cape = async (username: string) => {
  return await textures(username, 'CAPE')
}

export const nameHistory = async (username: string) => {
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

export const blockedServers = async () => {
  return await checkAPI().then(async (on: boolean | string) => {
    if (on)
      return await fetch('https://sessionserver.mojang.com/blockedservers')
        .then(res => res.text())
        .then(res => res.split('\n'))
    else return on
  })
}

export const MCStats = async () => {
  return await checkAPI().then(async (on: boolean | string) => {
    if (on) {
      return {
        item_sold_minecraft: await stats('item_sold_minecraft'),
        prepaid_card_redeemed_minecraft: await stats('prepaid_card_redeemed_minecraft'),
        item_sold_cobalt: await stats('item_sold_cobalt'),
        item_sold_scrolls: await stats('item_sold_scrolls'),
        prepaid_card_redeemed_cobalt: await stats('prepaid_card_redeemed_cobalt'),
        item_sold_dungeons: await stats('item_sold_dungeons')
      }
    } else return on
  })
}
