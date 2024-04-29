import * as assert from 'assert';
import * as vscode from 'vscode';
import { Fave } from '../../faves';

// TODO: Use stubbables from groog extension
// Stub updateConfiguration

interface TestCase {
  startingFaves: Map<string, Fave>;
  startingGlobalFaves: Map<string, Fave>;
  wantFaves: Map<string, Fave>;
  wantGlobalFaves: Map<string, Fave>;
}

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});
});
