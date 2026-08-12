#!/usr/bin/env node

import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const match = arg.match(/^--([^=]+)=(.*)$/)
    if (!match) throw new Error(`参数格式错误: ${arg}`)
    return [match[1], match[2]]
  }),
)

const repo = path.resolve(args.repo || "")
const source = args.source
const targetPath = args.path
const expectedBranch = args["expected-branch"]
const personalConfigUrl = args["personal-config-url"] || "http://xia.agione.opr/v3/api-docs/swagger-config"

if (!args.repo || !fs.existsSync(path.join(repo, "package.json"))) {
  throw new Error("--repo 必须指向 project-mamba 仓库或 worktree")
}
if (!new Set(["xia", "dev", "test"]).has(source)) {
  throw new Error("--source 只允许 xia、dev、test")
}
if (!targetPath?.startsWith("/") || targetPath === "/") {
  throw new Error("--path 必须是非根定向路径，如 /general/cloud")
}

const run = (command, commandArgs, options = {}) => {
  const isWindowsPnpm = process.platform === "win32" && command === "pnpm"
  const executable = isWindowsPnpm ? process.execPath : command
  const executableArgs = isWindowsPnpm
    ? [path.join(process.env.APPDATA || "", "npm", "node_modules", "pnpm", "bin", "pnpm.cjs"), ...commandArgs]
    : commandArgs
  const result = spawnSync(executable, executableArgs, {
    cwd: repo,
    encoding: "utf8",
    shell: false,
    stdio: options.capture ? "pipe" : "inherit",
  })
  if (result.status !== 0) {
    throw new Error(`${command} ${commandArgs.join(" ")} 执行失败${result.stderr ? `\n${result.stderr}` : ""}`)
  }
  return result.stdout?.trim()
}

const branch = run("git", ["branch", "--show-current"], { capture: true })
if (expectedBranch && branch !== expectedBranch) {
  throw new Error(`目标分支不匹配：期望 ${expectedBranch}，实际 ${branch}`)
}

const packagePath = path.join(repo, "package.json")
const originalPackage = fs.readFileSync(packagePath)

try {
  if (source === "xia") {
    const packageJson = JSON.parse(originalPackage.toString("utf8"))
    if (!packageJson.swaggerConfig?.url?.dev) {
      throw new Error("package.json 缺少 swaggerConfig.url.dev")
    }
    packageJson.swaggerConfig.url.dev = personalConfigUrl
    fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8")
  }

  run("pnpm", ["swagger", source === "xia" ? "dev" : source, "--", targetPath])
} finally {
  if (source === "xia") {
    fs.writeFileSync(packagePath, originalPackage)
  }
}

const packageDiff = run("git", ["diff", "--", "package.json"], { capture: true })
if (source === "xia" && packageDiff) {
  throw new Error("个人 Swagger 同步后 package.json 未完整恢复")
}

process.stdout.write(`Swagger 定向同步完成：branch=${branch} source=${source} path=${targetPath}\n`)
