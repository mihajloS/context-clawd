# Security

Context Clawd reads one figure, how full the context window is, and draws a picture of it. This page lists everything the mod can reach and shows how to check that yourself.

## What it reaches

Claude Code runs a mod's module with no Node.js and no browser APIs, so the module has no `fetch`, file system or `process` of its own. Everything outside the module goes through Claude Code's `$` interface, and Context Clawd uses this much of it:

| Reaches | What for |
| --- | --- |
| `session.start` | Pick the session's set and start the timer |
| `$.session.usage` | Read the tokens used and the window size, the figures the status line shows |
| `$.clock` | Re-read the usage every 1.5 seconds and end an alert after 2.6 seconds |
| `$.state` | Keep its own three values for the session: the last reading, the running alert, the set |
| `ui.render` on `AbovePrompt`, `$.ui.resolve` | Draw the band above the prompt |

## What it never reaches

- Your prompts, Claude's replies, the transcript, tool calls or their results
- Files, the shell, environment variables
- The network, the model or any API
- The system prompt: it adds no tools, skills, commands or MCP servers
- Anything that outlives the session: it stores nothing

It has no dependencies. There is no `package.json`, and installing it fetches this repository and nothing else.

## The checked list

`claude plugin validate` reads the module the way Claude Code loads it and lists every hook it registers and every `$` call it makes. On every push, [CI](.github/workflows/check.yml) runs it and fails when its list differs from this one:

<!-- surface:start -->
```text
hook  session.start
hook  ui.render{component=AbovePrompt}
call  $.clock.after
call  $.clock.every
call  $.clock.now
call  $.session.usage
call  $.state.get
call  $.state.set
call  $.ui.resolve
```
<!-- surface:end -->

A change that reaches anything new has to change this page too, in the same commit.

## Check it yourself

```bash
git clone https://github.com/mihajloS/context-clawd
cd context-clawd
claude plugin validate .
```

Compare the `hooks:` and `calls:` lines with the list above, or run `.github/scripts/check-surface.sh`, which does the comparison. Then read `hooks/register.tsx`, about 170 lines: it is the only file that talks to Claude Code. `classic.ts`, `play.ts`, `pixels.ts` and `art.ts` only build SVG strings.

Each release is tagged. Before you update, read what changed since the version you installed, for example `https://github.com/mihajloS/context-clawd/compare/v0.1.0...main`.

## Limits

`validate` reads the source as it is written. A call hidden behind a computed name could slip past it, which is why the whole module is kept short enough to read in a few minutes.

## Reporting a problem

Use **Report a vulnerability** on the repository's [Security tab](https://github.com/mihajloS/context-clawd/security) to tell me privately.
