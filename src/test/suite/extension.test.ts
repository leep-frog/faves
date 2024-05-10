import { SimpleTestCase, SimpleTestCaseProps, StubbablesConfig } from '@leep-frog/vscode-test-stubber';
import * as vscode from 'vscode';
import path = require('path');

// Note: this needs to be identical to the value in .vscode-test.mjs (trying to have shared import there is awkward).
export const stubbableTestFile = path.resolve("..", "..", ".vscode-test", "stubbable-file.json");

interface TestCase {
  name: string;
  sc: StubbablesConfig;
  stc: SimpleTestCaseProps;
}

const testCases: TestCase[] = [
  {
    name: "Does absolutely nothing",
    sc: {},
    stc: {},
  },
];

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

    testCases.forEach(tc => {
      test(tc.name, async () => {
        await new SimpleTestCase(tc.stc).runTest(stubbableTestFile, tc.sc).catch(e => {
          throw e;
        });
      });
  });
});
