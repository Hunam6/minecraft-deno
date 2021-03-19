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

async function req(method: string, url: string, headers: Record<string, string> = {}, body: Record<string, string> = {}) {
  const options = {
    method: method,
    headers: headers,
    body: JSON.stringify(body)
  }
  if (Object.keys(body).length === 0) options.body = ''
  return await fetch(url, options)
}

export async function MCStatus(): Promise<Record<string, string>[]> {
  return await fetch('https://status.mojang.com/check').then(response => response.json())
}

export async function UUID(username: string | string[]): Promise<string | Record<string, string>[]> {
  return await infos(username, 'id')
}

/**
 * This function returns the formatted username(s) of the inputted username(s).
 *
 * @username is an username or an array of usernames smaller than 10
 *
 * Example output:
 *
 *   // formatName(['_hunam', 'syriusgang'])
 *   [
 *     "SyriusGang",
 *     "_Hunam"
 *   ]
 */
export async function formatName(username: string | string[]): Promise<string | Record<string, string>[]> {
  return await infos(username, 'name')
}

export async function skin(username: string): Promise<string> {
  return await textures(username, 'SKIN')
}

export async function cape(username: string): Promise<string> {
  return await textures(username, 'CAPE')
}

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

export async function login(email: string, password: string, secQues: string[] = []) {
  let token: string
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
          password: password
        }
      )
        .then(res => res.json())
        .then(res => {
          if (res.errorMessage !== undefined) throw createError(new Error(res.errorMessage))
          else token = res.accessToken
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
          if (Array.isArray(res) && res.every(item => typeof item === 'string')) return res
          if (res.errorMessage !== undefined) throw createError(new Error(res.errorMessage))
          else return token
        })
  })
}

export async function blockedServers(): Promise<string[] | boolean | string> {
  return await checkAPI().then(async (on: boolean | string) => {
    if (on)
      return await fetch('https://sessionserver.mojang.com/blockedservers')
        .then(res => res.text())
        .then(res => res.split('\n'))
    else return on
  })
}

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
