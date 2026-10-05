import { mkdir, writeFile, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve } from "node:path";
const project = resolve("."),
  node = process.execPath;
const units = {
  "panda-world.service": `[Unit]
Description=Panda's Little World local game
After=network.target panda-local-ai.service
Wants=panda-local-ai.service

[Service]
Type=simple
WorkingDirectory=${project}
EnvironmentFile=-${project}/.env
ExecStart=${node} ${project}/server/index.js
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
UMask=0077

[Install]
WantedBy=default.target
`,
  "panda-local-ai.service": `[Unit]
Description=Panda's Little World private local AI
After=network.target

[Service]
Type=simple
WorkingDirectory=${project}
Environment=OLLAMA_HOST=127.0.0.1:11434
Environment=OLLAMA_MODELS=${project}/data/models
Environment=OLLAMA_NO_CLOUD=1
Environment=LD_LIBRARY_PATH=${project}/tools/ollama/usr/lib/ollama
ExecStart=${project}/tools/ollama/usr/bin/ollama serve
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
UMask=0077

[Install]
WantedBy=default.target
`,
};
await mkdir("ops", { recursive: true });
for (const [name, content] of Object.entries(units))
  await writeFile(`ops/${name}`, content);
if (process.argv.includes("--install")) {
  const directory = resolve(homedir(), ".config/systemd/user");
  await mkdir(directory, { recursive: true });
  for (const [name, content] of Object.entries(units)) {
    const path = resolve(directory, name);
    let existing;
    try {
      existing = await readFile(path, "utf8");
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
    }
    if (existing && !existing.includes("Description=Panda's Little World"))
      throw new Error(`Refusing to replace unrelated service ${name}`);
    await writeFile(path, content, { mode: 0o600 });
  }
  console.log(
    "Installed Panda user-service definitions. Enable with systemctl --user enable --now panda-world.service panda-local-ai.service.",
  );
} else
  console.log(
    "Prepared service definitions in ops/. No system configuration changed.",
  );
