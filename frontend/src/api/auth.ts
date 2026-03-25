import client from './client'
import type { User } from '../types'

interface TokenResponse {
  access_token: string
  token_type: string
}

interface TokenData {
  username?: string
  nickname?: string
  is_admin: boolean
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

async function fetchUserWithToken(token: string): Promise<User> {
  const response = await client.get<TokenData>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = response.data
  return {
    nickname: data.nickname,
    username: data.username,
    isAdmin: data.is_admin,
  }
}

export async function guestLogin(nickname: string): Promise<LoginResponse> {
  const response = await client.post<TokenResponse>('/auth/guest', { nickname })
  const { access_token, token_type } = response.data
  const user = await fetchUserWithToken(access_token)
  return { access_token, token_type, user }
}

export async function adminLogin(username: string, password: string): Promise<LoginResponse> {
  const response = await client.post<TokenResponse>('/auth/admin/login', { username, password })
  const { access_token, token_type } = response.data
  const user = await fetchUserWithToken(access_token)
  return { access_token, token_type, user }
}

export async function getMe(): Promise<User> {
  const response = await client.get<TokenData>('/auth/me')
  const data = response.data
  return {
    nickname: data.nickname,
    username: data.username,
    isAdmin: data.is_admin,
  }
}
