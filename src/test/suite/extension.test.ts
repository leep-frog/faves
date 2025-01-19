import { PressItemButtonQuickPickAction, PressUnknownButtonQuickPickAction, SelectItemQuickPickAction, SimpleTestCase, SimpleTestCaseProps, Waiter, cmd } from '@leep-frog/vscode-test-stubber';
import * as vscode from 'vscode';
import path = require('path');

function startingFile(filename: string) {
  return path.resolve(__dirname, "..", "..", "..", "src", "test", "test-workspace", filename);
}

function pathResolve(...filepath: string[]) {
  return vscode.Uri.file(path.resolve(...filepath)).fsPath;
}

function uriFile(...filepath: string[]): string {
  // Comparing Uri in assertions led to awkward comparison failures due to internal workings of
  // the vscode.Uri type (seems like memoization problem). To avoid this, we simply pass the fsPath instead.
  return vscode.Uri.file(path.join(...filepath)).fsPath;
}

interface TestCase {
  name: string;
  stc: SimpleTestCaseProps;
  runSolo?: boolean;
}

function qpe<T extends vscode.QuickPickItem>(items: (T | string)[][]): (vscode.QuickPickItem | string)[][] {
  return items;
}

// waitForScheme is a UserInteraction that waits for the active text editor to have the provided scheme
function waitForScheme(scheme: 'output' | 'file'): Waiter {
  return new Waiter(5, () => vscode.window.activeTextEditor?.document.uri.scheme === scheme);
}

const waitForOutputScheme = waitForScheme('output');
const waitForFileScheme = waitForScheme('file');

const testCases: TestCase[] = [
  {
    name: "Does absolutely nothing",
    stc: {},
  },
  // Add tests
  {
    name: "Fails to add if no active editor",
    stc: {
      userInteractions: [
        cmd('faves.add'),
      ],
      expectedErrorMessages: [
        'No active text editor',
      ],
    },
  },
  {
    name: "Fails to add if terminal focus",
    stc: {
      file: startingFile('bloop.java'),
      expectedText: [],
      userInteractions: [
        cmd('workbench.panel.output.focus'),
        waitForOutputScheme,
        cmd('faves.add'),
      ],
      expectedErrorMessages: [
        "output is an unsupported uri scheme",
      ],
    },
  },
  {
    name: "Fails to add file if already exists",
    stc: {
      file: startingFile('bloop.java'),
      expectedText: ['package bloop', ''],
      userInteractions: [
        waitForFileScheme,
        cmd('faves.add'),
      ],
      expectedInfoMessages: [
        'File already exists in favorites',
      ],
      // TODO: Why does removing this cause all tests to fail?
      // inputBoxResponses: ['wut'], // Move uriToPath after alias input box
      workspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java'),
                  scheme: "file",
                },
              ]],
            ])],
          ])],
        ]),
      },
    },
  },
  {
    name: "Successfully adds file with no alias (undefined input) to workspace faves",
    stc: {
      file: startingFile('bloop.java'),
      expectedText: ['package bloop', ''],
      userInteractions: [
        cmd('faves.add'),
      ],
      expectedInfoMessages: [
        'bloop.java was added to faves.favorites',
      ],
      expectedInputBoxes: [
        {
          options: {
            placeHolder: 'alias (leave blank for no alias)',
            prompt: 'Fave alias',
            validateInputProvided: false,
          },
        },
      ],
      inputBoxResponses: [undefined],
      expectedWorkspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java'),
                  scheme: "file",
                },
              ]],
            ])],
          ])],
        ]),
      },
    },
  },
  {
    name: "Successfully adds file with no alias (empty string input) to workspace faves",
    stc: {
      file: startingFile('bloop.java'),
      expectedText: ['package bloop', ''],
      userInteractions: [
        cmd('faves.add'),
      ],
      expectedInfoMessages: [
        'bloop.java was added to faves.favorites',
      ],
      expectedInputBoxes: [
        {
          options: {
            placeHolder: 'alias (leave blank for no alias)',
            prompt: 'Fave alias',
            validateInputProvided: false,
          },
        },
      ],
      inputBoxResponses: [''],
      expectedWorkspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java'),
                  scheme: "file",
                },
              ]],
            ])],
          ])],
        ]),
      },
    },
  },
  {
    name: "Successfully adds file with no alias (whitespace string input) to workspace faves",
    stc: {
      file: startingFile('bloop.java'),
      expectedText: ['package bloop', ''],
      userInteractions: [
        cmd('faves.add'),
      ],
      expectedInfoMessages: [
        'bloop.java was added to faves.favorites',
      ],
      expectedInputBoxes: [
        {
          options: {
            placeHolder: 'alias (leave blank for no alias)',
            prompt: 'Fave alias',
            validateInputProvided: false,
          },
        },
      ],
      inputBoxResponses: [' \t \n'],
      expectedWorkspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java'),
                  scheme: "file",
                },
              ]],
            ])],
          ])],
        ]),
      },
    },
  },
  {
    name: "Successfully adds file with trimmed alias to workspace faves",
    stc: {
      file: startingFile('bloop.java'),
      expectedText: ['package bloop', ''],
      userInteractions: [
        cmd('faves.add'),
      ],
      expectedInfoMessages: [
        'bloop.java was added to faves.favorites',
      ],
      expectedInputBoxes: [
        {
          options: {
            placeHolder: 'alias (leave blank for no alias)',
            prompt: 'Fave alias',
            validateInputProvided: false,
          },
        },
      ],
      inputBoxResponses: ['\t bl oop\n'],
      expectedWorkspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java'),
                  scheme: "file",
                  alias: "bl oop",
                },
              ]],
            ])],
          ])],
        ]),
      },
    },
  },
  {
    name: "Successfully adds file to existing set of faves",
    stc: {
      file: startingFile('bloop.java'),
      expectedText: ['package bloop', ''],
      userInteractions: [
        cmd('faves.add'),
      ],
      expectedInfoMessages: [
        'bloop.java was added to faves.favorites',
      ],
      expectedInputBoxes: [
        {
          options: {
            placeHolder: 'alias (leave blank for no alias)',
            prompt: 'Fave alias',
            validateInputProvided: false,
          },
        },
      ],
      inputBoxResponses: [undefined],
      workspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
                  scheme: "file",
                  alias: 'other',
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'another.txt'),
                  scheme: "file",
                },
              ]],
            ])],
          ])],
        ]),
      },
      expectedWorkspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'another.txt'),
                  scheme: "file",
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java'),
                  scheme: "file",
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
                  scheme: "file",
                  alias: 'other',
                },
              ]],
            ])],
          ])],
        ]),
      },
    },
  },
  // [Global] Add tests
  {
    name: "[Global] Fails to add if no active editor",
    stc: {
      userInteractions: [
        cmd('faves.globalAdd'),
      ],
      expectedErrorMessages: [
        'No active text editor',
      ],
    },
  },
  {
    name: "[Global] Fails to add if terminal focus",
    stc: {
      file: startingFile('bloop.java'),
      expectedText: [],
      userInteractions: [
        cmd('workbench.panel.output.focus'),
        waitForOutputScheme,
        cmd('faves.globalAdd'),
      ],
      expectedErrorMessages: [
        "output is an unsupported uri scheme",
      ],
    },
  },
  {
    name: "[Global] Fails to add file if already exists",
    stc: {
      file: startingFile('bloop.java'),
      expectedText: ['package bloop', ''],
      userInteractions: [
        waitForFileScheme,
        cmd('faves.globalAdd'),
      ],
      expectedInfoMessages: [
        'File already exists in globalFavorites',
      ],
      // TODO: Why does removing this cause all tests to fail?
      // inputBoxResponses: ['wut'], // Move uriToPath after alias input box
      workspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Global, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['globalFavorites', [
                {
                  path: 'bloop.java',
                  scheme: "file",
                },
              ]],
            ])],
          ])],
        ]),
      },
    },
  },
  {
    name: "[Global] Fails to add file not in workspace",
    stc: {
      file: pathResolve('..', '..', 'src', 'test', 'outside-test-workspace.txt'),
      expectedText: ['aliens!', ''],
      userInteractions: [
        cmd('faves.globalAdd'),
      ],
      expectedErrorMessages: [
        'File is not in a workspace folder',
      ],
    },
  },
  {
    name: "[Global] Successfully adds file with no alias (undefined input) to global faves",
    stc: {
      file: startingFile('bloop.java'),
      expectedText: ['package bloop', ''],
      userInteractions: [
        cmd('faves.globalAdd'),
      ],
      expectedInfoMessages: [
        'bloop.java was added to faves.globalFavorites',
      ],
      expectedInputBoxes: [
        {
          options: {
            placeHolder: 'alias (leave blank for no alias)',
            prompt: 'Fave alias',
            validateInputProvided: false,
          },
        },
      ],
      inputBoxResponses: [undefined],
      expectedWorkspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Global, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['globalFavorites', [
                {
                  path: 'bloop.java',
                  scheme: "file",
                },
              ]],
            ])],
          ])],
        ]),
      },
    },
  },
  {
    name: "[Global] Successfully adds file with trimmed alias to global faves",
    stc: {
      file: startingFile('bloop.java'),
      expectedText: ['package bloop', ''],
      userInteractions: [
        cmd('faves.globalAdd'),
      ],
      expectedInfoMessages: [
        'bloop.java was added to faves.globalFavorites',
      ],
      expectedInputBoxes: [
        {
          options: {
            placeHolder: 'alias (leave blank for no alias)',
            prompt: 'Fave alias',
            validateInputProvided: false,
          },
        },
      ],
      inputBoxResponses: ['\t bl oop\n'],
      expectedWorkspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Global, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['globalFavorites', [
                {
                  path: 'bloop.java',
                  scheme: "file",
                  alias: "bl oop",
                },
              ]],
            ])],
          ])],
        ]),
      },
    },
  },
  {
    name: "[Global] Successfully adds nested file to global faves",
    stc: {
      file: startingFile(path.join('nested', 'leaf.ts')),
      expectedText: ["// I'm a leaf", ''],
      userInteractions: [
        cmd('faves.globalAdd'),
      ],
      expectedInfoMessages: [
        `leaf.ts was added to faves.globalFavorites`,
      ],
      expectedInputBoxes: [
        {
          options: {
            placeHolder: 'alias (leave blank for no alias)',
            prompt: 'Fave alias',
            validateInputProvided: false,
          },
        },
      ],
      inputBoxResponses: ['leave'],
      expectedWorkspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Global, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['globalFavorites', [
                {
                  path: path.join('nested', 'leaf.ts'),
                  scheme: "file",
                  alias: "leave",
                },
              ]],
            ])],
          ])],
        ]),
      },
    },
  },
  {
    name: "[Global] Successfully adds file to existing set of faves",
    stc: {
      file: startingFile('bloop.java'),
      expectedText: ['package bloop', ''],
      userInteractions: [
        cmd('faves.globalAdd'),
      ],
      expectedInfoMessages: [
        'bloop.java was added to faves.globalFavorites',
      ],
      expectedInputBoxes: [
        {
          options: {
            placeHolder: 'alias (leave blank for no alias)',
            prompt: 'Fave alias',
            validateInputProvided: false,
          },
        },
      ],
      inputBoxResponses: [undefined],
      workspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Global, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['globalFavorites', [
                {
                  path: 'other.py',
                  scheme: "file",
                  alias: 'other',
                },
                {
                  path: 'another.txt',
                  scheme: "file",
                },
              ]],
            ])],
          ])],
        ]),
      },
      expectedWorkspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Global, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['globalFavorites', [
                {
                  path: 'another.txt',
                  scheme: "file",
                },
                {
                  path: 'bloop.java',
                  scheme: "file",
                },
                {
                  path: 'other.py',
                  scheme: "file",
                  alias: 'other',
                },
              ]],
            ])],
          ])],
        ]),
      },
    },
  },
  // Remove file tests
  {
    name: "Fails to remove if no active editor",
    stc: {
      userInteractions: [
        cmd('faves.remove'),
      ],
      expectedErrorMessages: [
        'No active text editor',
      ],
    },
  },
  {
    name: "Tries to remove if unsupported scheme (terminal) focus",
    stc: {
      file: startingFile('bloop.java'),
      expectedText: [],
      userInteractions: [
        cmd('workbench.panel.output.focus'),
        waitForOutputScheme,
        cmd('faves.remove'),
      ],
      expectedInfoMessages: [
        `File does not exist in faves.favorites`,
      ],
    },
  },
  {
    name: "Fails to remove file if does not exist in faves",
    stc: {
      file: startingFile('bloop.java'),
      expectedText: ['package bloop', ''],
      userInteractions: [
        waitForFileScheme,
        cmd('faves.remove'),
      ],
      expectedInfoMessages: [
        'File does not exist in faves.favorites',
      ],
    },
  },
  {
    name: "Successfully removes a file",
    stc: {
      file: startingFile('bloop.java'),
      expectedText: ['package bloop', ''],
      userInteractions: [
        cmd('faves.remove'),
      ],
      expectedInfoMessages: [
        'bloop.java was removed from faves.favorites',
      ],
      workspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
                  scheme: "file",
                  alias: 'other',
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java'),
                  scheme: "file",
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'another.txt'),
                  scheme: "file",
                },
              ]],
            ])],
          ])],
        ]),
      },
      expectedWorkspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'another.txt'),
                  scheme: "file",
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
                  scheme: "file",
                  alias: 'other',
                },
              ]],
            ])],
          ])],
        ]),
      },
    },
  },
  // [Global] Remove file tests
  {
    name: "[Global] Fails to remove if no active editor",
    stc: {
      userInteractions: [
        cmd('faves.globalRemove'),
      ],
      expectedErrorMessages: [
        'No active text editor',
      ],
    },
  },
  {
    name: "[Global] Tries to remove if unsupported scheme (terminal) focus",
    stc: {
      file: startingFile('bloop.java'),
      expectedText: [],
      userInteractions: [
        cmd('workbench.panel.output.focus'),
        waitForOutputScheme,
        cmd('faves.globalRemove'),
      ],
      expectedErrorMessages: [
        `File is not in a workspace folder`,
      ],
    },
  },
  {
    name: "[Global] Fails to remove file if does not exist in faves",
    stc: {
      file: startingFile('bloop.java'),
      expectedText: ['package bloop', ''],
      userInteractions: [
        waitForFileScheme,
        cmd('faves.globalRemove'),
      ],
      expectedInfoMessages: [
        'File does not exist in faves.globalFavorites',
      ],
    },
  },
  {
    name: "[Global] Fails to remove file not in workspace",
    stc: {
      file: pathResolve('..', '..', 'src', 'test', 'outside-test-workspace.txt'),
      expectedText: ['aliens!', ''],
      userInteractions: [
        cmd('faves.globalRemove'),
      ],
      expectedErrorMessages: [
        'File is not in a workspace folder',
      ],
    },
  },
  {
    name: "[Global] Successfully removes a file",
    stc: {
      file: startingFile('bloop.java'),
      expectedText: ['package bloop', ''],
      userInteractions: [
        cmd('faves.globalRemove'),
      ],
      expectedInfoMessages: [
        'bloop.java was removed from faves.globalFavorites',
      ],
      workspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Global, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['globalFavorites', [
                {
                  path: 'other.py',
                  scheme: "file",
                  alias: 'other',
                },
                {
                  path: 'bloop.java',
                  scheme: "file",
                },
                {
                  path: 'another.txt',
                  scheme: "file",
                },
              ]],
            ])],
          ])],
        ]),
      },
      expectedWorkspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Global, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['globalFavorites', [
                {
                  path: 'another.txt',
                  scheme: "file",
                },
                {
                  path: 'other.py',
                  scheme: "file",
                  alias: 'other',
                },
              ]],
            ])],
          ])],
        ]),
      },
    },
  },
  // Toggle tests (only simple tests since it just calls add/remove under the hood
  {
    name: "Toggle adds file if it is not present in configuration",
    stc: {
      file: startingFile('bloop.java'),
      expectedText: ['package bloop', ''],
      userInteractions: [
        cmd('faves.toggle'),
      ],
      expectedInfoMessages: [
        'bloop.java was added to faves.favorites',
      ],
      expectedInputBoxes: [
        {
          options: {
            placeHolder: 'alias (leave blank for no alias)',
            prompt: 'Fave alias',
            validateInputProvided: false,
          },
        },
      ],
      inputBoxResponses: [undefined],
      expectedWorkspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java'),
                  scheme: "file",
                },
              ]],
            ])],
          ])],
        ]),
      },
    },
  },
  {
    name: "Toggle removes a file if it is present in configuration",
    stc: {
      file: startingFile('bloop.java'),
      expectedText: ['package bloop', ''],
      userInteractions: [
        cmd('faves.toggle'),
      ],
      expectedInfoMessages: [
        'bloop.java was removed from faves.favorites',
      ],
      workspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
                  scheme: "file",
                  alias: 'other',
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java'),
                  scheme: "file",
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'another.txt'),
                  scheme: "file",
                },
              ]],
            ])],
          ])],
        ]),
      },
      expectedWorkspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'another.txt'),
                  scheme: "file",
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
                  scheme: "file",
                  alias: 'other',
                },
              ]],
            ])],
          ])],
        ]),
      },
    },
  },
  // [Global] Toggle tests (only simple tests since it just calls add/remove under the hood
  {
    name: "[Global] Fails to toggle file not in workspace",
    stc: {
      file: pathResolve('..', '..', 'src', 'test', 'outside-test-workspace.txt'),
      expectedText: ['aliens!', ''],
      userInteractions: [
        cmd('faves.globalToggle'),
      ],
      expectedErrorMessages: [
        'File is not in a workspace folder',
      ],
    },
  },
  {
    name: "[Global] Toggle adds file if it is not present in configuration",
    stc: {
      file: startingFile('bloop.java'),
      expectedText: ['package bloop', ''],
      userInteractions: [
        cmd('faves.globalToggle'),
      ],
      expectedInfoMessages: [
        'bloop.java was added to faves.globalFavorites',
      ],
      expectedInputBoxes: [
        {
          options: {
            placeHolder: 'alias (leave blank for no alias)',
            prompt: 'Fave alias',
            validateInputProvided: false,
          },
        },
      ],
      inputBoxResponses: [undefined],
      expectedWorkspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Global, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['globalFavorites', [
                {
                  path: 'bloop.java',
                  scheme: "file",
                },
              ]],
            ])],
          ])],
        ]),
      },
    },
  },
  {
    name: "[Global] Toggle removes a file if it is present in configuration",
    stc: {
      file: startingFile(path.join('nested', 'tree.txt')),
      expectedText: ["I'm a tree", ''],
      userInteractions: [
        cmd('faves.globalToggle'),
      ],
      expectedInfoMessages: [
        'tree.txt was removed from faves.globalFavorites',
      ],
      workspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Global, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['globalFavorites', [
                {
                  path: path.join('nested', 'tree.txt'),
                  scheme: "file",
                  alias: 'walnut',
                },
                {
                  path: 'bloop.java',
                  scheme: "file",
                },
              ]],
            ])],
          ])],
        ]),
      },
      expectedWorkspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Global, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['globalFavorites', [
                {
                  path: 'bloop.java',
                  scheme: "file",
                },
              ]],
            ])],
          ])],
        ]),
      },
    },
  },
  // Search tests
  {
    name: "Search with no faves",
    stc: {
      userInteractions: [
        cmd('faves.search'),
      ],
      expectedInfoMessages: [
        'No favorites exist for this workspace',
      ],
    },
  },
  {
    name: "Search with no selection",
    stc: {
      userInteractions: [
        cmd('faves.search'),
        new SelectItemQuickPickAction([]),
      ],
      expectedInfoMessages: [
        'No selection made',
      ],
      expectedQuickPicks: qpe([[
        // [globalFavorites] another.txt
        {
          buttons: [
            {
              iconPath: {
                id: "close",
              },
              tooltip: "Remove file from favorites list",
            },
          ],
          description: "",
          fave: {
            path: path.join('another.txt'),
            scheme: "file",
          },
          iconPath: {
            id: "globe",
          },
          label: "another.txt",
          manager: 'globalFavorites',
          fsPath: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'another.txt')),
        },
        // [favorites] bloop.java
        {
          buttons: [
            {
              iconPath: {
                id: "close",
              },
              tooltip: "Remove file from favorites list",
            },
          ],
          description: "",
          fave: {
            path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java'),
            scheme: "file",
          },
          iconPath: {
            id: "home",
          },
          label: "bloop.java",
          manager: 'favorites',
          fsPath: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java')),
        },
        // [favorites] leaf.ts
        {
          buttons: [
            {
              iconPath: {
                id: "close",
              },
              tooltip: "Remove file from favorites list",
            },
          ],
          description: "nested",
          fave: {
            path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'leaf.ts'),
            scheme: "file",
          },
          iconPath: {
            id: "home",
          },
          label: "leaf.ts",
          manager: 'favorites',
          fsPath: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'leaf.ts')),
        },
        // [favorites] other.py
        {
          buttons: [
            {
              iconPath: {
                id: "close",
              },
              tooltip: "Remove file from favorites list",
            },
          ],
          description: "",
          fave: {
            alias: 'othr',
            path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
            scheme: "file",
          },
          iconPath: {
            id: "home",
          },
          label: "other.py",
          manager: 'favorites',
          fsPath: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py')),
        },
        // [globalFavorites] tree.txt
        {
          buttons: [
            {
              iconPath: {
                id: "close",
              },
              tooltip: "Remove file from favorites list",
            },
          ],
          description: "nested",
          fave: {
            alias: 'oak',
            path: path.join('nested', 'tree.txt'),
            scheme: "file",
          },
          iconPath: {
            id: "globe",
          },
          label: "tree.txt",
          manager: 'globalFavorites',
          fsPath: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'tree.txt')),
        },
      ]]),
      workspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
                  scheme: "file",
                  alias: 'othr',
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java'),
                  scheme: "file",
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'leaf.ts'),
                  scheme: "file",
                },
                // Ignore file that doesn't exist
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'dne.txt'),
                  scheme: "file",
                },
                // Ignore directory
                {
                  path: pathResolve('..', '..', 'src', 'test'),
                  scheme: "file",
                },
              ]],
            ])],
          ])],
          [vscode.ConfigurationTarget.Global, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['globalFavorites', [
                {
                  path: path.join('nested', 'tree.txt'),
                  scheme: "file",
                  alias: 'oak',
                },
                {
                  path: path.join('another.txt'),
                  scheme: "file",
                },
                // Ignore file that doesn't exist
                {
                  path: path.join('other-folder', 'idk.py'),
                  scheme: "file",
                },
                // Ignore directory
                {
                  path: path.join('nested'),
                  scheme: "file",
                },
              ]],
            ])],
          ])],
        ]),
      },
    },
  },
  {
    name: "Search with multiple selections",
    stc: {
      userInteractions: [
        cmd('faves.search'),
        new SelectItemQuickPickAction([
          'bloop.java',
          'tree.txt',
        ]),
      ],
      expectedErrorMessages: [
        'Multiple selections made?!?!?',
      ],
      expectedQuickPicks: qpe([[
        // [globalFavorites] another.txt
        {
          buttons: [
            {
              iconPath: {
                id: "close",
              },
              tooltip: "Remove file from favorites list",
            },
          ],
          description: "",
          fave: {
            path: path.join('another.txt'),
            scheme: "file",
          },
          iconPath: {
            id: "globe",
          },
          label: "another.txt",
          manager: 'globalFavorites',
          fsPath: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'another.txt')),
        },
        // [favorites] bloop.java
        {
          buttons: [
            {
              iconPath: {
                id: "close",
              },
              tooltip: "Remove file from favorites list",
            },
          ],
          description: "",
          fave: {
            path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java'),
            scheme: "file",
          },
          iconPath: {
            id: "home",
          },
          label: "bloop.java",
          manager: 'favorites',
          fsPath: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java')),
        },
        // [favorites] leaf.ts
        {
          buttons: [
            {
              iconPath: {
                id: "close",
              },
              tooltip: "Remove file from favorites list",
            },
          ],
          description: "nested",
          fave: {
            path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'leaf.ts'),
            scheme: "file",
          },
          iconPath: {
            id: "home",
          },
          label: "leaf.ts",
          manager: 'favorites',
          fsPath: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'leaf.ts')),
        },
        // [favorites] other.py
        {
          buttons: [
            {
              iconPath: {
                id: "close",
              },
              tooltip: "Remove file from favorites list",
            },
          ],
          description: "",
          fave: {
            alias: 'othr',
            path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
            scheme: "file",
          },
          iconPath: {
            id: "home",
          },
          label: "other.py",
          manager: 'favorites',
          fsPath: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py')),
        },
        // [globalFavorites] tree.txt
        {
          buttons: [
            {
              iconPath: {
                id: "close",
              },
              tooltip: "Remove file from favorites list",
            },
          ],
          description: "nested",
          fave: {
            alias: 'oak',
            path: path.join('nested', 'tree.txt'),
            scheme: "file",
          },
          iconPath: {
            id: "globe",
          },
          label: "tree.txt",
          manager: 'globalFavorites',
          fsPath: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'tree.txt')),
        },
      ]]),
      workspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
                  scheme: "file",
                  alias: 'othr',
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java'),
                  scheme: "file",
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'leaf.ts'),
                  scheme: "file",
                },
                // Ignore file that doesn't exist
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'dne.txt'),
                  scheme: "file",
                },
              ]],
            ])],
          ])],
          [vscode.ConfigurationTarget.Global, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['globalFavorites', [
                {
                  path: path.join('nested', 'tree.txt'),
                  scheme: "file",
                  alias: 'oak',
                },
                {
                  path: path.join('another.txt'),
                  scheme: "file",
                },
                // Ignore file that doesn't exist
                {
                  path: path.join('other-folder', 'idk.py'),
                  scheme: "file",
                },
              ]],
            ])],
          ])],
        ]),
      },
    },
  },
  {
    name: "Search with single selection",
    stc: {
      expectedText: [
        // Contents of tree.txt
        "I'm a tree",
        '',
      ],
      userInteractions: [
        cmd('faves.search'),
        new SelectItemQuickPickAction([
          'tree.txt',
        ]),
      ],
      expectedQuickPicks: qpe([[
        // [globalFavorites] another.txt
        {
          buttons: [
            {
              iconPath: {
                id: "close",
              },
              tooltip: "Remove file from favorites list",
            },
          ],
          description: "",
          fave: {
            path: path.join('another.txt'),
            scheme: "file",
          },
          iconPath: {
            id: "globe",
          },
          label: "another.txt",
          manager: 'globalFavorites',
          fsPath: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'another.txt')),
        },
        // [favorites] bloop.java
        {
          buttons: [
            {
              iconPath: {
                id: "close",
              },
              tooltip: "Remove file from favorites list",
            },
          ],
          description: "",
          fave: {
            path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java'),
            scheme: "file",
          },
          iconPath: {
            id: "home",
          },
          label: "bloop.java",
          manager: 'favorites',
          fsPath: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java')),
        },
        // [favorites] faves.ts
        {
          buttons: [
            {
              iconPath: {
                id: "close",
              },
              tooltip: "Remove file from favorites list",
            },
          ],
          description: pathResolve('..', '..', 'src'),
          fave: {
            path: pathResolve('..', '..', 'src', 'faves.ts'),
            scheme: "file",
          },
          iconPath: {
            id: "home",
          },
          label: "faves.ts",
          manager: 'favorites',
          fsPath: uriFile(pathResolve('..', '..', 'src', 'faves.ts')),
        },
        // [favorites] leaf.ts
        {
          buttons: [
            {
              iconPath: {
                id: "close",
              },
              tooltip: "Remove file from favorites list",
            },
          ],
          description: "nested",
          fave: {
            path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'leaf.ts'),
            scheme: "file",
          },
          iconPath: {
            id: "home",
          },
          label: "leaf.ts",
          manager: 'favorites',
          fsPath: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'leaf.ts')),
        },
        // [favorites] other.py
        {
          buttons: [
            {
              iconPath: {
                id: "close",
              },
              tooltip: "Remove file from favorites list",
            },
          ],
          description: "",
          fave: {
            alias: 'othr',
            path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
            scheme: "file",
          },
          iconPath: {
            id: "home",
          },
          label: "other.py",
          manager: 'favorites',
          fsPath: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py')),
        },
        // [globalFavorites] tree.txt
        {
          buttons: [
            {
              iconPath: {
                id: "close",
              },
              tooltip: "Remove file from favorites list",
            },
          ],
          description: "nested",
          fave: {
            alias: 'oak',
            path: path.join('nested', 'tree.txt'),
            scheme: "file",
          },
          iconPath: {
            id: "globe",
          },
          label: "tree.txt",
          manager: 'globalFavorites',
          fsPath: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'tree.txt')),
        },
      ]]),
      workspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
                  scheme: "file",
                  alias: 'othr',
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java'),
                  scheme: "file",
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'leaf.ts'),
                  scheme: "file",
                },
                // File not in workspace
                {
                  path: pathResolve('..', '..', 'src', 'faves.ts'),
                  scheme: "file",
                },
                // Ignore file that doesn't exist
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'dne.txt'),
                  scheme: "file",
                },
              ]],
            ])],
          ])],
          [vscode.ConfigurationTarget.Global, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['globalFavorites', [
                {
                  path: path.join('nested', 'tree.txt'),
                  scheme: "file",
                  alias: 'oak',
                },
                {
                  path: path.join('another.txt'),
                  scheme: "file",
                },
                // Ignore file that doesn't exist
                {
                  path: path.join('other-folder', 'idk.py'),
                  scheme: "file",
                },
                // Ignore directory
                {
                  path: path.join('nested'),
                  scheme: "file",
                },
              ]],
            ])],
          ])],
        ]),
      },
    },
  },
  {
    name: "Defaults to opening as a file if unsupported scheme",
    stc: {
      expectedText: [
        // Contents of other.py
        "# other",
        '',
      ],
      expectedErrorMessages: [
        `Selected fave with unsupported scheme (idk-scheme); defaulting to basic file open (delete and re-add this fave if this behavior is unexpected).`,
      ],
      userInteractions: [
        cmd('faves.search'),
        new SelectItemQuickPickAction([
          'other.py',
        ]),
      ],
      expectedQuickPicks: qpe([[
        {
          buttons: [
            {
              iconPath: {
                id: "close",
              },
              tooltip: "Remove file from favorites list",
            },
          ],
          description: "",
          fave: {
            alias: 'other',
            path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
            scheme: "idk-scheme",
          },
          iconPath: {
            id: "home",
          },
          label: "other.py",
          manager: 'favorites',
          fsPath: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py')),
        },
      ]]),
      workspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
                  scheme: "idk-scheme",
                  alias: 'other',
                },
              ]],
            ])],
          ])],
        ]),
      },
    },
  },
  {
    name: "Defaults to opening as a file if missing scheme",
    stc: {
      expectedText: [
        // Contents of other.py
        "# other",
        '',
      ],
      expectedErrorMessages: [
        `Selected fave with unsupported scheme (undefined); defaulting to basic file open (delete and re-add this fave if this behavior is unexpected).`,
      ],
      userInteractions: [
        cmd('faves.search'),
        new SelectItemQuickPickAction([
          'other.py',
        ]),
      ],
      expectedQuickPicks: qpe([[
        {
          buttons: [
            {
              iconPath: {
                id: "close",
              },
              tooltip: "Remove file from favorites list",
            },
          ],
          description: "",
          fave: {
            alias: 'other',
            path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
          },
          iconPath: {
            id: "home",
          },
          label: "other.py",
          manager: 'favorites',
          fsPath: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py')),
        },
      ]]),
      workspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
                  alias: 'other',
                },
              ]],
            ])],
          ])],
        ]),
      },
    },
  },
  {
    name: "Search with single selection for aliases only",
    stc: {
      expectedText: [
        // Contents of other.py
        '# other',
        '',
      ],
      userInteractions: [
        cmd('faves.aliasSearch'),
        new SelectItemQuickPickAction(['othr']),
      ],
      expectedQuickPicks: qpe([[
        // [globalFavorites] another.txt (no alias)
        // [favorites] bloop.java (no alias)
        // [favorites] leaf.ts (no alias)
        // [globalFavorites] tree.txt
        {
          buttons: [
            {
              iconPath: {
                id: "close",
              },
              tooltip: "Remove file from favorites list",
            },
          ],
          description: "nested ● tree.txt",
          fave: {
            alias: 'oak',
            path: path.join('nested', 'tree.txt'),
            scheme: "file",
          },
          iconPath: {
            id: "globe",
          },
          label: "oak",
          manager: 'globalFavorites',
          fsPath: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'tree.txt')),
        },
        // [favorites] other.py
        {
          buttons: [
            {
              iconPath: {
                id: "close",
              },
              tooltip: "Remove file from favorites list",
            },
          ],
          description: "other.py",
          fave: {
            alias: 'othr',
            path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
            scheme: "file",
          },
          iconPath: {
            id: "home",
          },
          label: "othr",
          manager: 'favorites',
          fsPath: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py')),
        },
      ]]),
      workspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
                  scheme: "file",
                  alias: 'othr',
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java'),
                  scheme: "file",
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'leaf.ts'),
                  scheme: "file",
                },
                // Ignore file that doesn't exist
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'dne.txt'),
                  scheme: "file",
                },
              ]],
            ])],
          ])],
          [vscode.ConfigurationTarget.Global, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['globalFavorites', [
                {
                  path: path.join('nested', 'tree.txt'),
                  scheme: "file",
                  alias: 'oak',
                },
                {
                  path: path.join('another.txt'),
                  scheme: "file",
                },
                // Ignore file that doesn't exist
                {
                  path: path.join('other-folder', 'idk.py'),
                  scheme: "file",
                },
              ]],
            ])],
          ])],
        ]),
      },
    },
  },
  // Search button tests
  {
    name: "Handles unknown button",
    stc: {
      userInteractions: [
        cmd('faves.aliasSearch'),
        new PressUnknownButtonQuickPickAction('othr'),
      ],
      expectedErrorMessages: [
        'Unknown item button',
      ],
      expectedQuickPicks: qpe([[
        // [globalFavorites] another.txt (no alias)
        // [favorites] bloop.java (no alias)
        // [favorites] leaf.ts (no alias)
        // [globalFavorites] tree.txt
        {
          buttons: [
            {
              iconPath: {
                id: "close",
              },
              tooltip: "Remove file from favorites list",
            },
          ],
          description: "nested ● tree.txt",
          fave: {
            alias: 'oak',
            path: path.join('nested', 'tree.txt'),
            scheme: "file",
          },
          iconPath: {
            id: "globe",
          },
          label: "oak",
          manager: 'globalFavorites',
          fsPath: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'tree.txt')),
        },
        // [favorites] other.py
        {
          buttons: [
            {
              iconPath: {
                id: "close",
              },
              tooltip: "Remove file from favorites list",
            },
          ],
          description: "other.py",
          fave: {
            alias: 'othr',
            path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
            scheme: "file",
          },
          iconPath: {
            id: "home",
          },
          label: "othr",
          manager: 'favorites',
          fsPath: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py')),
        },
      ]]),
      workspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
                  scheme: "file",
                  alias: 'othr',
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java'),
                  scheme: "file",
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'leaf.ts'),
                  scheme: "file",
                },
                // Ignore file that doesn't exist
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'dne.txt'),
                  scheme: "file",
                },
              ]],
            ])],
          ])],
          [vscode.ConfigurationTarget.Global, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['globalFavorites', [
                {
                  path: path.join('nested', 'tree.txt'),
                  scheme: "file",
                  alias: 'oak',
                },
                {
                  path: path.join('another.txt'),
                  scheme: "file",
                },
                // Ignore file that doesn't exist
                {
                  path: path.join('other-folder', 'idk.py'),
                  scheme: "file",
                },
              ]],
            ])],
          ])],
        ]),
      },
    },
  },
  {
    name: "Handles remove fave button for global",
    stc: {
      userInteractions: [
        cmd('faves.aliasSearch'),
        new PressItemButtonQuickPickAction('oak', 0),
      ],
      expectedInfoMessages: [
        'tree.txt was removed from faves.globalFavorites',
      ],
      expectedQuickPicks: qpe([[
        // [globalFavorites] another.txt (no alias)
        // [favorites] bloop.java (no alias)
        // [favorites] leaf.ts (no alias)
        // [globalFavorites] tree.txt
        {
          buttons: [
            {
              iconPath: {
                id: "close",
              },
              tooltip: "Remove file from favorites list",
            },
          ],
          description: "nested ● tree.txt",
          fave: {
            alias: 'oak',
            path: path.join('nested', 'tree.txt'),
            scheme: "file",
          },
          iconPath: {
            id: "globe",
          },
          label: "oak",
          manager: 'globalFavorites',
          fsPath: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'tree.txt')),
        },
        // [favorites] other.py
        {
          buttons: [
            {
              iconPath: {
                id: "close",
              },
              tooltip: "Remove file from favorites list",
            },
          ],
          description: "other.py",
          fave: {
            alias: 'othr',
            path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
            scheme: "file",
          },
          iconPath: {
            id: "home",
          },
          label: "othr",
          manager: 'favorites',
          fsPath: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py')),
        },
      ]]),
      workspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            // TODO: [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
                  scheme: "file",
                  alias: 'othr',
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java'),
                  scheme: "file",
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'leaf.ts'),
                  scheme: "file",
                },
                // Ignore file that doesn't exist
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'dne.txt'),
                  scheme: "file",
                },
              ]],
            ])],
          ])],
          [vscode.ConfigurationTarget.Global, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['globalFavorites', [
                {
                  path: path.join('nested', 'tree.txt'),
                  scheme: "file",
                  alias: 'oak',
                },
                {
                  path: path.join('another.txt'),
                  scheme: "file",
                },
                // Ignore file that doesn't exist
                {
                  path: path.join('other-folder', 'idk.py'),
                  scheme: "file",
                },
              ]],
            ])],
          ])],
        ]),
      },
      expectedWorkspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            // TODO: [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
                  scheme: "file",
                  alias: 'othr',
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java'),
                  scheme: "file",
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'leaf.ts'),
                  scheme: "file",
                },
                // Ignore file that doesn't exist
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'dne.txt'),
                  scheme: "file",
                },
              ]],
            ])],
          ])],
          [vscode.ConfigurationTarget.Global, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['globalFavorites', [
                {
                  path: path.join('another.txt'),
                  scheme: "file",
                },
                // Ignore file that doesn't exist
                {
                  path: path.join('other-folder', 'idk.py'),
                  scheme: "file",
                },
              ]],
            ])],
          ])],
        ]),
      },
    },
  },
  {
    name: "Handles remove fave button for workspace",
    stc: {
      userInteractions: [
        cmd('faves.aliasSearch'),
        new PressItemButtonQuickPickAction('othr', 0),
      ],
      expectedInfoMessages: [
        'other.py was removed from faves.favorites',
      ],
      expectedQuickPicks: qpe([[
        // [globalFavorites] another.txt (no alias)
        // [favorites] bloop.java (no alias)
        // [favorites] leaf.ts (no alias)
        // [globalFavorites] tree.txt
        {
          buttons: [
            {
              iconPath: {
                id: "close",
              },
              tooltip: "Remove file from favorites list",
            },
          ],
          description: "nested ● tree.txt",
          fave: {
            alias: 'oak',
            path: path.join('nested', 'tree.txt'),
            scheme: "file",
          },
          iconPath: {
            id: "globe",
          },
          label: "oak",
          manager: 'globalFavorites',
          fsPath: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'tree.txt')),
        },
        // [favorites] other.py
        {
          buttons: [
            {
              iconPath: {
                id: "close",
              },
              tooltip: "Remove file from favorites list",
            },
          ],
          description: "other.py",
          fave: {
            alias: 'othr',
            path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
            scheme: "file",
          },
          iconPath: {
            id: "home",
          },
          label: "othr",
          manager: 'favorites',
          fsPath: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py')),
        },
      ]]),
      workspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
                  scheme: "file",
                  alias: 'othr',
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java'),
                  scheme: "file",
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'leaf.ts'),
                  scheme: "file",
                },
                // Ignore file that doesn't exist
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'dne.txt'),
                  scheme: "file",
                },
              ]],
            ])],
          ])],
          [vscode.ConfigurationTarget.Global, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['globalFavorites', [
                {
                  path: path.join('nested', 'tree.txt'),
                  scheme: "file",
                  alias: 'oak',
                },
                {
                  path: path.join('another.txt'),
                  scheme: "file",
                },
                // Ignore file that doesn't exist
                {
                  path: path.join('other-folder', 'idk.py'),
                  scheme: "file",
                },
              ]],
            ])],
          ])],
        ]),
      },
      expectedWorkspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                // other.py was removed from here!
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java'),
                  scheme: "file",
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'dne.txt'),
                  scheme: "file",
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'leaf.ts'),
                  scheme: "file",
                },
              ]],
            ])],
          ])],
          [vscode.ConfigurationTarget.Global, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['globalFavorites', [
                {
                  path: path.join('nested', 'tree.txt'),
                  scheme: "file",
                  alias: 'oak',
                },
                {
                  path: path.join('another.txt'),
                  scheme: "file",
                },
                // Ignore file that doesn't exist
                {
                  path: path.join('other-folder', 'idk.py'),
                  scheme: "file",
                },
              ]],
            ])],
          ])],
        ]),
      },
    },
  },
  // Notebook tests
  // Unfortunately, these don't work, but they were manually tested which is fine enough
  /*{
    name: "Successfully adds a notebook",
    stc: {
      // file: startingFile('simple-notebook.ipynb'),
      expectedText: [],
      userInteractions: [
        openFile(startingFile('simple-notebook.ipynb')),
        cmd('faves.add'),
      ],
      expectedInfoMessages: [
        'simple-notebook.ipynb was added to faves.favorites',
      ],
      expectedInputBoxes: [
        {
          options: {
            placeHolder: 'alias (leave blank for no alias)',
            prompt: 'Fave alias',
            validateInputProvided: false,
          },
        },
      ],
      inputBoxResponses: ['nb'],
      expectedWorkspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'simple-notebook.ipynb'),
                  scheme: "vscode-notebook-cell",
                  alias: "nb",
                },
              ]],
            ])],
          ])],
        ]),
      },
    },
  },
  {
    name: "Opens a notebook properly",
    stc: {
      expectedText: [
        // Contents of other.py
        "# other",
        '',
      ],
      userInteractions: [
        cmd('faves.search'),
        new SelectItemQuickPickAction([
          'simple-notebook.ipynb',
        ]),
      ],
      expectedQuickPicks: qpe([[
        {
          buttons: [
            {
              iconPath: {
                id: "close",
              },
              tooltip: "Remove file from favorites list",
            },
          ],
          description: "",
          fave: {
            alias: 'nb',
            path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'simple-notebook.ipynb'),
            scheme: "vscode-notebook-cell",
          },
          iconPath: {
            id: "home",
          },
          label: "simple-notebook.ipynb",
          manager: 'favorites',
          fsPath: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'simple-notebook.ipynb')),
        },
      ]]),
      workspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'simple-notebook.ipynb'),
                  scheme: "vscode-notebook-cell",
                  alias: 'nb',
                },
              ]],
            ])],
          ])],
        ]),
      },
    },
  },
  /* Useful for commenting out tests. */
];

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  const requireSolo = testCases.some(tc => tc.runSolo);

  testCases.filter(tc => !requireSolo || tc.runSolo).forEach(tc => {

    test(tc.name, async () => {

      // Add reset command
      tc.stc.userInteractions = [
        cmd("faves.testReset"),
        ...(tc.stc.userInteractions || []),
      ];

      // Run test
      await new SimpleTestCase(tc.stc).runTest().catch((e: any) => {
        throw e;
      });
    });
  });
});
