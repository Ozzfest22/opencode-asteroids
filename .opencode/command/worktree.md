---
description: Crea un worktree en .worktrees/ con nombre derivado del argumento
agent: build
---

Crea un worktree de git con este argumento: $ARGUMENTS

1. Deriva el nombre del worktree a partir de TODO el texto del argumento (puede contener espacios o no): minúsculas, espacios y caracteres inválidos para rutas → `-`, colapsa guiones repetidos, quita guiones al inicio/fin, máx. ~40 caracteres. Usa kebab-case.
2. Ejecuta UN solo comando, SIN cambiar de directorio:

   git worktree add .worktrees/<nombre-derivable>

3. No hagas nada más: nada de cd, commits, edits, gitignore ni otros comandos.

Si el argumento está vacío, detente y pide el nombre.
