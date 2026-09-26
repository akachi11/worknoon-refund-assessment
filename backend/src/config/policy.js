import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultPath = path.resolve(__dirname, "../../../data/policy.json");

export function loadPolicy() {
  const policyPath = process.env.POLICY_PATH
    ? path.resolve(process.env.POLICY_PATH)
    : defaultPath;

  const raw = fs.readFileSync(policyPath, "utf-8");
  return JSON.parse(raw);
}
