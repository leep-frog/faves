// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Faves } from './faves';

const faves = new Faves();

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(vscode.commands.registerCommand('faves.add', (fileUri: vscode.Uri) => {
    faves.add(fileUri);
	}));

  context.subscriptions.push(vscode.commands.registerCommand('faves.remove', (fileUri: vscode.Uri) => {
    faves.remove(fileUri);
  }));

  context.subscriptions.push(vscode.commands.registerCommand('faves.toggle', (fileUri: vscode.Uri) => {
    faves.toggle(fileUri);
  }));

  context.subscriptions.push(vscode.commands.registerCommand('faves.search', () => {
    faves.select();
  }));
}

// This method is called when your extension is deactivated
export function deactivate() {}
