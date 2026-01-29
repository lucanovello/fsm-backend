import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function run(cmd, args, { env } = {}) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: false,
    env: { ...process.env, ...env },
  });

  if (result.error) throw result.error;
  return result.status ?? 0;
}

function runCapture(cmd, args) {
  const result = spawnSync(cmd, args, {
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
    encoding: "utf8",
  });

  return {
    code: result.status ?? 0,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function hasCommand(cmd) {
  const probe = runCapture(cmd, ["--version"]);
  return probe.code === 0;
}

function getStagedFiles() {
  const result = runCapture("git", ["diff", "--cached", "--name-only"]);
  if (result.code !== 0) return [];
  return result.stdout
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function shouldScanFromStagedFiles(stagedFiles) {
  const watched = [
    "Dockerfile",
    "docker-compose.yml",
    "compose.prod.yml",
    "package.json",
    "package-lock.json",
    "prisma/schema.prisma",
  ];

  return stagedFiles.some((f) => watched.includes(f));
}

const args = new Set(process.argv.slice(2));
const stagedOnly = args.has("--staged");
const imageTag = `fsm-backend:local-scan-${Date.now()}`;

if (process.env.SKIP_CONTAINER_SCAN === "1") {
  process.exit(0);
}

if (stagedOnly) {
  const stagedFiles = getStagedFiles();
  if (!shouldScanFromStagedFiles(stagedFiles)) {
    process.exit(0);
  }
}

const dockerAvailable = hasCommand("docker");
if (!dockerAvailable) {
  console.error("Container scan requires Docker (docker CLI not found).");
  console.error("Install Docker Desktop, or set SKIP_CONTAINER_SCAN=1 to bypass.");
  process.exit(1);
}

const buildArgDatabaseUrl =
  "postgresql://postgres:postgres@localhost:5432/fsm_backend_test?schema=public";

console.log(`Building image ${imageTag} for vulnerability scan...`);
const buildExit = run("docker", [
  "build",
  "--build-arg",
  `DATABASE_URL=${buildArgDatabaseUrl}`,
  "-t",
  imageTag,
  ".",
]);

if (buildExit !== 0) process.exit(buildExit);

const trivyCliAvailable = hasCommand("trivy");

console.log("Scanning image with Trivy (HIGH,CRITICAL)...");

if (trivyCliAvailable) {
  const scanExit = run("trivy", [
    "image",
    "--severity",
    "HIGH,CRITICAL",
    "--exit-code",
    "1",
    "--ignore-unfixed",
    "false",
    "--scanners",
    "vuln",
    imageTag,
  ]);

  process.exit(scanExit);
}

if (process.platform === "win32") {
  console.error("Trivy is not installed (trivy CLI not found).\n");
  console.error(
    "On Windows, the Docker-based Trivy fallback cannot reliably access the Docker daemon.",
  );
  console.error("Install Trivy locally, then retry:");
  console.error("  - Chocolatey: choco install trivy");
  console.error("  - Scoop:      scoop install trivy");
  console.error("Or run from WSL2, or bypass with SKIP_CONTAINER_SCAN=1.");
  process.exit(1);
}

// Fallback: run trivy via its official container image (Linux/WSL2).
const cacheDir = path.resolve(process.cwd(), ".cache", "trivy");
fs.mkdirSync(cacheDir, { recursive: true });

const trivyImage = "aquasec/trivy:0.65.0";

const scanExit = run("docker", [
  "run",
  "--rm",
  "-v",
  "/var/run/docker.sock:/var/run/docker.sock",
  "-v",
  `${cacheDir}:/root/.cache/`,
  trivyImage,
  "image",
  "--severity",
  "HIGH,CRITICAL",
  "--exit-code",
  "1",
  "--ignore-unfixed",
  "false",
  "--scanners",
  "vuln",
  imageTag,
]);

process.exit(scanExit);
