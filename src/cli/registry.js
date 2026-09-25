const MUTATING = new Set([
  "init", "import", "reindex", "wordcount", "progress", "migrate",
  "add", "rename", "remove", "export", "build", "synopsis"
]);

export function defineCommands(commands) {
  return commands.map((command) => {
    const commandPath = command.path ?? [command.name];
    return {
      ...command,
      path: commandPath,
      handler: command.handler ?? command.run,
      mutates: command.mutates ?? MUTATING.has(command.name),
      args: command.args ?? [],
      examples: command.examples ?? [],
      optionSchema: command.optionSchema ?? [],
      returnsResult: command.returnsResult === true,
      strictOptions: command.strictOptions === true,
      enforceArgs: command.enforceArgs === true
    };
  });
}

export function matchCommand(commands, positionals) {
  let best = null;
  let bestLength = 0;
  for (const command of commands) {
    const commandPath = command.path;
    if (commandPath.length > positionals.length || commandPath.length <= bestLength) continue;
    let matches = true;
    for (let index = 0; index < commandPath.length; index += 1) {
      if (commandPath[index] !== positionals[index]) {
        matches = false;
        break;
      }
    }
    if (matches) {
      best = command;
      bestLength = commandPath.length;
    }
  }
  return best;
}

export function validateInvocation(command, parsed) {
  if (command.enforceArgs) {
    let remaining = parsed.positionals.slice(command.path.length);
    for (const arg of command.args) {
      if (arg.rest) {
        if (arg.required && remaining.join(" ").trim() === "") {
          return `Usage: story ${command.usage}`;
        }
        break;
      }
      if (arg.required && (remaining.length === 0 || String(remaining[0]).trim() === "")) {
        return `Usage: story ${command.usage}`;
      }
      remaining = remaining.slice(1);
    }
  }
  if (!command.strictOptions) return null;
  const schemas = command.optionSchema ?? [];
  const allowed = new Set(schemas.map((entry) => entry.name));
  for (const key of Object.keys(parsed.options)) {
    if (key === "help" || key === "version") continue;
    if (!allowed.has(key)) {
      return `Option --${key} is not valid for ${command.path.join(" ")}`;
    }
    const schema = schemas.find((entry) => entry.name === key);
    if (schema?.values) {
      const value = Array.isArray(parsed.options[key]) ? parsed.options[key].at(-1) : parsed.options[key];
      if (!schema.values.includes(value)) {
        return `Option --${key} must be one of ${schema.values.join(", ")}`;
      }
    }
  }
  for (const schema of schemas) {
    if (schema.required && parsed.options[schema.name] === undefined) {
      return `Option --${schema.name} is required for ${command.path.join(" ")}`;
    }
  }
  return null;
}
