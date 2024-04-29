import { defineConfig } from '@vscode/test-cli';
import path from 'path';

// Note: this needs to be identical to the value in extension.test.ts (trying to have shared import here is awkward).
export const stubbableTestFile = path.resolve(".vscode-test", "stubbable-file.json");

export default defineConfig({
	files: 'out/test/**/*.test.js',
  useInstallation: {
    fromMachine: true,
    // This needs to be a different version than the one I'm actually using, otherwise test doesn't run
    fromPath: path.resolve(".vscode-test", "vscode-win32-x64-archive-1.87.0", "Code.exe"),
  },
  workspaceFolder: path.resolve("src", "test", "test-workspace"),
  env: {
    VSCODE_STUBBABLE_TEST_FILE: stubbableTestFile,
  },
  mocha: {
    timeout: 60000,
  },
});