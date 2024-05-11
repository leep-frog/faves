import { PressUnknownButtonQuickPickAction, SelectItemQuickPickAction, SimpleTestCase, SimpleTestCaseProps, StubbablesConfig, UserInteraction, cmd, delay } from '@leep-frog/vscode-test-stubber';
import * as vscode from 'vscode';
import path = require('path');

// Note: this needs to be identical to the value in .vscode-test.mjs (trying to have shared import there is awkward).
export const stubbableTestFile = path.resolve("..", "..", ".vscode-test", "stubbable-file.json");

function startingFile(filename: string) {
  return path.resolve(__dirname, "..", "..", "..", "src", "test", "test-workspace", filename);
}

function pathResolve(...filepath: string[]) {
  return vscode.Uri.file(path.resolve(...filepath)).fsPath;
}

function uriFile(...filepath: string[]) {
  const uri = vscode.Uri.file(path.join(...filepath));
  uri.fsPath;
  return uri;
}

interface TestCase {
  name: string;
  stc: SimpleTestCaseProps;
  sc?: StubbablesConfig;
  runSolo?: boolean;
}

function qpe<T extends vscode.QuickPickItem>(items: (T | string)[][]): (vscode.QuickPickItem | string)[][] {
  return items;
}

// WaitForScheme is a UserInteraction that waits for the active text editor to have the provided scheme
class WaitForScheme implements UserInteraction {

  readonly scheme: 'output' | 'file';

  constructor(scheme: 'output' | 'file') {
    this.scheme = scheme;
  }

  async do(): Promise<any> {
    while (vscode.window.activeTextEditor?.document.uri.scheme !== this.scheme) {
      await delay(10).do();
    }
  }
}

const waitForOutputScheme = new WaitForScheme('output');
const waitForFileScheme = new WaitForScheme('file');

const testCases: TestCase[] = [
  {
    name: "Does absolutely nothing",
    stc: {},
  },
  // Add tests
  {
    name: "Fails to add if no active editor",
    sc: {
      expectedErrorMessages: [
        'No active text editor',
      ],
    },
    stc: {
      userInteractions: [
        cmd('faves.add'),
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
    },
    sc: {
      expectedErrorMessages: [
        "Currently, only file resources are supported",
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
    },
    sc: {
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
    },
    sc: {
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
    },
    sc: {
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
    },
    sc: {
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
    },
    sc: {
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
    },
    sc: {
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
                  alias: 'other',
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'another.txt'),
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
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java'),
                },
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
  // [Global] Add tests
  {
    name: "[Global] Fails to add if no active editor",
    sc: {
      expectedErrorMessages: [
        'No active text editor',
      ],
    },
    stc: {
      userInteractions: [
        cmd('faves.globalAdd'),
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
    },
    sc: {
      expectedErrorMessages: [
        "Currently, only file resources are supported",
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
    },
    sc: {
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
    },
    sc: {
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
    },
    sc: {
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
    },
    sc: {
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
    },
    sc: {
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
    },
    sc: {
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
                  alias: 'other',
                },
                {
                  path: 'another.txt',
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
                },
                {
                  path: 'bloop.java',
                },
                {
                  path: 'other.py',
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
    sc: {
      expectedErrorMessages: [
        'No active text editor',
      ],
    },
    stc: {
      userInteractions: [
        cmd('faves.remove'),
      ],
    },
  },
  {
    name: "Fails to remove if terminal focus",
    stc: {
      file: startingFile('bloop.java'),
      expectedText: [],
      userInteractions: [
        cmd('workbench.panel.output.focus'),
        waitForOutputScheme,
        cmd('faves.remove'),
      ],
    },
    sc: {
      expectedErrorMessages: [
        "Currently, only file resources are supported",
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
    },
    sc: {
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
    },
    sc: {
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
                  alias: 'other',
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java'),
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'another.txt'),
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
                },
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
  // [Global] Remove file tests
  {
    name: "[Global] Fails to remove if no active editor",
    sc: {
      expectedErrorMessages: [
        'No active text editor',
      ],
    },
    stc: {
      userInteractions: [
        cmd('faves.globalRemove'),
      ],
    },
  },
  {
    name: "[Global] Fails to remove if terminal focus",
    stc: {
      file: startingFile('bloop.java'),
      expectedText: [],
      userInteractions: [
        cmd('workbench.panel.output.focus'),
        waitForOutputScheme,
        cmd('faves.globalRemove'),
      ],
    },
    sc: {
      expectedErrorMessages: [
        "Currently, only file resources are supported",
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
    },
    sc: {
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
    },
    sc: {
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
    },
    sc: {
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
                  alias: 'other',
                },
                {
                  path: 'bloop.java',
                },
                {
                  path: 'another.txt',
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
                },
                {
                  path: 'other.py',
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
    },
    sc: {
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
    },
    sc: {
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
                  alias: 'other',
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java'),
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'another.txt'),
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
                },
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
  // [Global] Toggle tests (only simple tests since it just calls add/remove under the hood
  {
    name: "[Global] Fails to toggle file not in workspace",
    stc: {
      file: pathResolve('..', '..', 'src', 'test', 'outside-test-workspace.txt'),
      expectedText: ['aliens!', ''],
      userInteractions: [
        cmd('faves.globalToggle'),
      ],
    },
    sc: {
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
    },
    sc: {
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
    },
    sc: {
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
                  alias: 'walnut',
                },
                {
                  path: 'bloop.java',
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
    },
    sc: {
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
      ],
    },
    sc: {
      quickPickActions: [
        new SelectItemQuickPickAction([]),
      ],
      expectedInfoMessages: [
        'No selection made',
      ],
      expectedQuickPickExecutions: qpe([[
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
          },
          iconPath: {
            id: "globe",
          },
          label: "another.txt",
          manager: 'globalFavorites',
          uri: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'another.txt')),
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
          },
          iconPath: {
            id: "home",
          },
          label: "bloop.java",
          manager: 'favorites',
          uri: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java')),
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
          },
          iconPath: {
            id: "home",
          },
          label: "leaf.ts",
          manager: 'favorites',
          uri: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'leaf.ts')),
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
          },
          iconPath: {
            id: "home",
          },
          label: "other.py",
          manager: 'favorites',
          uri: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py')),
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
          },
          iconPath: {
            id: "globe",
          },
          label: "tree.txt",
          manager: 'globalFavorites',
          uri: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'tree.txt')),
        },
      ]]),
      workspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
                  alias: 'othr',
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java'),
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'leaf.ts'),
                },
                // Ignore file that doesn't exist
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'dne.txt'),
                },
              ]],
            ])],
          ])],
          [vscode.ConfigurationTarget.Global, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['globalFavorites', [
                {
                  path: path.join('nested', 'tree.txt'),
                  alias: 'oak',
                },
                {
                  path: path.join('another.txt'),
                },
                // Ignore file that doesn't exist
                {
                  path: path.join('other-folder', 'idk.py'),
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
      ],
    },
    sc: {
      quickPickActions: [
        new SelectItemQuickPickAction([
          'bloop.java',
          'tree.txt',
        ]),
      ],
      expectedErrorMessages: [
        'Multiple selections made?!?!?',
      ],
      expectedQuickPickExecutions: qpe([[
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
          },
          iconPath: {
            id: "globe",
          },
          label: "another.txt",
          manager: 'globalFavorites',
          uri: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'another.txt')),
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
          },
          iconPath: {
            id: "home",
          },
          label: "bloop.java",
          manager: 'favorites',
          uri: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java')),
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
          },
          iconPath: {
            id: "home",
          },
          label: "leaf.ts",
          manager: 'favorites',
          uri: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'leaf.ts')),
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
          },
          iconPath: {
            id: "home",
          },
          label: "other.py",
          manager: 'favorites',
          uri: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py')),
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
          },
          iconPath: {
            id: "globe",
          },
          label: "tree.txt",
          manager: 'globalFavorites',
          uri: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'tree.txt')),
        },
      ]]),
      workspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
                  alias: 'othr',
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java'),
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'leaf.ts'),
                },
                // Ignore file that doesn't exist
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'dne.txt'),
                },
              ]],
            ])],
          ])],
          [vscode.ConfigurationTarget.Global, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['globalFavorites', [
                {
                  path: path.join('nested', 'tree.txt'),
                  alias: 'oak',
                },
                {
                  path: path.join('another.txt'),
                },
                // Ignore file that doesn't exist
                {
                  path: path.join('other-folder', 'idk.py'),
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
      ],
    },
    sc: {
      quickPickActions: [
        new SelectItemQuickPickAction([
          'tree.txt',
        ]),
      ],
      expectedQuickPickExecutions: qpe([[
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
          },
          iconPath: {
            id: "globe",
          },
          label: "another.txt",
          manager: 'globalFavorites',
          uri: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'another.txt')),
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
          },
          iconPath: {
            id: "home",
          },
          label: "bloop.java",
          manager: 'favorites',
          uri: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java')),
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
          },
          iconPath: {
            id: "home",
          },
          label: "faves.ts",
          manager: 'favorites',
          uri: uriFile(pathResolve('..', '..', 'src', 'faves.ts')),
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
          },
          iconPath: {
            id: "home",
          },
          label: "leaf.ts",
          manager: 'favorites',
          uri: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'leaf.ts')),
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
          },
          iconPath: {
            id: "home",
          },
          label: "other.py",
          manager: 'favorites',
          uri: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py')),
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
          },
          iconPath: {
            id: "globe",
          },
          label: "tree.txt",
          manager: 'globalFavorites',
          uri: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'tree.txt')),
        },
      ]]),
      workspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
                  alias: 'othr',
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java'),
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'leaf.ts'),
                },
                // File not in workspace
                {
                  path: pathResolve('..', '..', 'src', 'faves.ts'),
                },
                // Ignore file that doesn't exist
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'dne.txt'),
                },
              ]],
            ])],
          ])],
          [vscode.ConfigurationTarget.Global, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['globalFavorites', [
                {
                  path: path.join('nested', 'tree.txt'),
                  alias: 'oak',
                },
                {
                  path: path.join('another.txt'),
                },
                // Ignore file that doesn't exist
                {
                  path: path.join('other-folder', 'idk.py'),
                },
                // Ignore directory
                {
                  path: path.join('nested'),
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
        cmd('faves.search', {alias: true}),
      ],
    },
    sc: {
      quickPickActions: [
        new SelectItemQuickPickAction(['othr']),
      ],
      expectedQuickPickExecutions: qpe([[
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
          },
          iconPath: {
            id: "globe",
          },
          label: "oak",
          manager: 'globalFavorites',
          uri: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'tree.txt')),
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
          },
          iconPath: {
            id: "home",
          },
          label: "othr",
          manager: 'favorites',
          uri: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py')),
        },
      ]]),
      workspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
                  alias: 'othr',
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java'),
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'leaf.ts'),
                },
                // Ignore file that doesn't exist
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'dne.txt'),
                },
              ]],
            ])],
          ])],
          [vscode.ConfigurationTarget.Global, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['globalFavorites', [
                {
                  path: path.join('nested', 'tree.txt'),
                  alias: 'oak',
                },
                {
                  path: path.join('another.txt'),
                },
                // Ignore file that doesn't exist
                {
                  path: path.join('other-folder', 'idk.py'),
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
        cmd('faves.search', {alias: true}),
      ],
    },
    sc: {
      quickPickActions: [
        new PressUnknownButtonQuickPickAction('othr'),
      ],
      expectedErrorMessages: [
        'Unknown item button',
      ],
      expectedQuickPickExecutions: qpe([[
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
          },
          iconPath: {
            id: "globe",
          },
          label: "oak",
          manager: 'globalFavorites',
          uri: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'tree.txt')),
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
          },
          iconPath: {
            id: "home",
          },
          label: "othr",
          manager: 'favorites',
          uri: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py')),
        },
      ]]),
      workspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
                  alias: 'othr',
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java'),
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'leaf.ts'),
                },
                // Ignore file that doesn't exist
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'dne.txt'),
                },
              ]],
            ])],
          ])],
          [vscode.ConfigurationTarget.Global, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['globalFavorites', [
                {
                  path: path.join('nested', 'tree.txt'),
                  alias: 'oak',
                },
                {
                  path: path.join('another.txt'),
                },
                // Ignore file that doesn't exist
                {
                  path: path.join('other-folder', 'idk.py'),
                },
              ]],
            ])],
          ])],
        ]),
      },
    },
  },
  /*{
    name: "Handles remove fave button for global",
    runSolo: true,
    stc: {
      userInteractions: [
        cmd('faves.search', {alias: true}),
      ],
    },
    sc: {
      quickPickActions: [
        new PressItemButtonQuickPickAction('oak', 0),
      ],
      expectedInfoMessages: [
        'tree.txt was removed from faves.globalFavorites',
      ],
      expectedQuickPickExecutions: qpe([[
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
          },
          iconPath: {
            id: "globe",
          },
          label: "oak",
          manager: 'globalFavorites',
          uri: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'tree.txt')),
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
          },
          iconPath: {
            id: "home",
          },
          label: "othr",
          manager: 'favorites',
          uri: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py')),
        },
      ]]),
      workspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Global, new Map<string, any>([
          // TODO: [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
                  alias: 'othr',
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java'),
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'leaf.ts'),
                },
                // Ignore file that doesn't exist
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'dne.txt'),
                },
              ]],
              //   ])],
              // ])],
              // [vscode.ConfigurationTarget.Global, new Map<string, any>([
              //   ['faves', new Map<string, any>([
              ['globalFavorites', [
                {
                  path: path.join('nested', 'tree.txt'),
                  alias: 'oak',
                },
                {
                  path: path.join('another.txt'),
                },
                // Ignore file that doesn't exist
                {
                  path: path.join('other-folder', 'idk.py'),
                },
              ]],
            ])],
          ])],
        ]),
      },
      expectedWorkspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Global, new Map<string, any>([
          // TODO: [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
                  alias: 'othr',
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java'),
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'leaf.ts'),
                },
                // Ignore file that doesn't exist
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'dne.txt'),
                },
              ]],
              //   ])],
              // ])],
              // [vscode.ConfigurationTarget.Global, new Map<string, any>([
              //   ['faves', new Map<string, any>([
              ['globalFavorites', [
                // {
                //   path: path.join('nested', 'tree.txt'),
                //   alias: 'oak',
                // },
                {
                  path: path.join('another.txt'),
                },
                // Ignore file that doesn't exist
                {
                  path: path.join('other-folder', 'idk.py'),
                },
              ]],
            ])],
          ])],
        ]),
      },
    },
  },
  /*{
    name: "Handles remove fave button for workspace",
    runSolo: true,
    stc: {
      userInteractions: [
        cmd('faves.search', {alias: true}),
      ],
    },
    sc: {
      quickPickActions: [
        new PressItemButtonQuickPickAction('othr', 0),
      ],
      expectedInfoMessages: [
        'other.py was removed from faves.globalFavorites',
      ],
      expectedQuickPickExecutions: qpe([[
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
          },
          iconPath: {
            id: "globe",
          },
          label: "oak",
          manager: 'globalFavorites',
          uri: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'tree.txt')),
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
          },
          iconPath: {
            id: "home",
          },
          label: "othr",
          manager: 'favorites',
          uri: uriFile(pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py')),
        },
      ]]),
      workspaceConfiguration: {
        configuration: new Map<vscode.ConfigurationTarget, Map<string, any>>([
          [vscode.ConfigurationTarget.Workspace, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['favorites', [
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'other.py'),
                  alias: 'othr',
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'bloop.java'),
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'leaf.ts'),
                },
                // Ignore file that doesn't exist
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'dne.txt'),
                },
              ]],
            ])],
          ])],
          [vscode.ConfigurationTarget.Global, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['globalFavorites', [
                {
                  path: path.join('nested', 'tree.txt'),
                  alias: 'oak',
                },
                {
                  path: path.join('another.txt'),
                },
                // Ignore file that doesn't exist
                {
                  path: path.join('other-folder', 'idk.py'),
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
                },
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'nested', 'leaf.ts'),
                },
                // Ignore file that doesn't exist
                {
                  path: pathResolve('..', '..', 'src', 'test', 'test-workspace', 'dne.txt'),
                },
              ]],
            ])],
          ])],
          [vscode.ConfigurationTarget.Global, new Map<string, any>([
            ['faves', new Map<string, any>([
              ['globalFavorites', [
                {
                  path: path.join('nested', 'tree.txt'),
                  alias: 'oak',
                },
                {
                  path: path.join('another.txt'),
                },
                // Ignore file that doesn't exist
                {
                  path: path.join('other-folder', 'idk.py'),
                },
              ]],
            ])],
          ])],
        ]),
      },
    },
  },*/
  /* Useful for commenting out tests. */
];

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  const requireSolo = testCases.some(tc => tc.runSolo);

  testCases.forEach(tc => {

    if (requireSolo && !tc.runSolo) {
      return;
    }

    test(tc.name, async () => {

      // Add reset command
      tc.stc.userInteractions = [
        cmd("faves.testReset"),
        ...(tc.stc.userInteractions || []),
      ];

      // Run test
      await new SimpleTestCase(tc.stc).runTest(stubbableTestFile, tc.sc).catch(e => {
        throw e;
      });
    });
  });
});
