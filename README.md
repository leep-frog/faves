# Faves

This extension implements a simple file-favoriting system. It allows users to
favorite files and open a file from the list by running the `faves.search`
command.

> Note: favorites are stored in the Workspace-level settings.

## Setup

The extension should start working automatically after installation.

It is also recommended to add a subset of the following keyboard bindings (in
`keybindings.json`):

```json
  // Toggle a file's presence in favorites
  {
    "key": "...",
    "command": "faves.toggle"
  },
  // Add a file to favorites
  {
    "key": "...",
    "command": "faves.add"
  },
  // Remove a file from favorites
  {
    "key": "...",
    "command": "faves.remove"
  },
  // Search through favorited files
  {
    "key": "...",
    "command": "faves.searach"
  },
```

## Contribute

Feel free to
[open issues](https://github.com/leep-frog/termin-all-or-nothing/issues) or
[pull requests](https://github.com/leep-frog/termin-all-or-nothing/pulls),
and I'll do my best to respond in a timely manner.

## Appreciate

I find it very rewarding to know that my projects made someone's day or
developer life a little better. If you feel so inclined, leave a review
or [buy my a coffee](https://paypal.me/sleepfrog) so I know my project helped
you out!

## Release Notes

### 0.0.1

Initial release
