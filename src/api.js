// src/api.js — Apps Script bilan aloqa (v3: 3-bosqich, parol, push token)
import { API_URL, KALIT } from './config';

export async function post(action, data) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ kalit: KALIT, action, ...data }),
    redirect: 'follow' // MUHIM: Shu qator qolib ketgan edi
  });
  return res.json();
}

export async function get(action, params = {}) {
  const q = new URLSearchParams({ kalit: KALIT, action, ...params }).toString();
  const res = await fetch(API_URL + '?' + q, {
    method: 'GET',
    redirect: 'follow' // MUHIM: Shu qator qolib ketgan edi
  });
  return res.json();
}

export const login = (pinfl, parol, deviceId) => post('login', { pinfl, parol, deviceId });
export const mfylarOl = () => get('mfylar');
export const kategoriyalarOl = () => get('kategoriyalar');
export const menikiOl = (xodimId) => get('meniki', { xodim: xodimId });
export const parolAlmashtir = (xodimId, eskiParol, yangiParol) => post('parolAlmashtir', { xodimId, eskiParol, yangiParol });
export const pushTokenSaqla = (xodimId, token) => post('pushTokenSaqla', { xodimId, token });
export const tahrirSora = (hisobotId, xodimId, xodimFio, sabab) => post('tahrirSora', { hisobotId, xodimId, xodimFio, sabab });
