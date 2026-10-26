/*
 * password hashing
 * @flow
 */

import bcrypt from 'bcryptjs';

const configuredRounds = Number.parseInt(process.env.PASSWORD_COST, 10);
export const PASSWORD_COST = Number.isInteger(configuredRounds)
  ? Math.min(Math.max(configuredRounds, 10), 15)
  : 12;

export function generateHash(password: string) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(PASSWORD_COST));
}

export function compareToHash(password: string, hash: string) {
  if (!password || !hash) return false;
  return bcrypt.compareSync(password, hash);
}

export function needsRehash(hash: string) {
  try {
    return bcrypt.getRounds(hash) < PASSWORD_COST;
  } catch (err) {
    return false;
  }
}
