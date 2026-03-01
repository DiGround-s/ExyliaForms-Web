import { createHash } from "crypto"

const SALT = process.env.IP_HASH_SALT ?? "exylia-forms-default-salt"

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip + SALT).digest("hex")
}
