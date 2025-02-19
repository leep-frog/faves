import { defineConfig } from '@vscode/test-cli';
import path from 'path';


export default defineConfig({
	files: 'out/test/**/*.test.js',
  workspaceFolder: path.resolve("src", "test", "test-workspace"),
  env: {
    TEST_MODE: true,
  },
  mocha: {
    timeout: 60000,
  },

  // TODO: Eventually remove the following:
  // Tests stopped working with latest version, so pinned to this version for now
  version: "1.96.4",
  useInstallation: {
    fromMachine: true,
  },
});
