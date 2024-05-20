// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { GlobalFavesManager, WorkspaceFavesManager, searchFaves } from './faves';

const workspaceFaves = new WorkspaceFavesManager();
const globalFaves = new GlobalFavesManager();

function uriExecutor(handler: (u: vscode.Uri) => void): () => void {
  return () => {
    executeOnUri(handler);
  };
}

function executeOnUri(handler: (u: vscode.Uri) => void): void {
  const uri = vscode.window.activeTextEditor?.document.uri;
  if (!uri) {
    vscode.window.showErrorMessage("No active text editor");
    return;
  }
  if (uri.scheme !== "file") {
    vscode.window.showErrorMessage("Currently, only file resources are supported");
    return;
  }
  handler(uri);
}

interface SearchSettings {
  alias?: boolean;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  context.subscriptions.push(vscode.commands.registerCommand('faves.add', uriExecutor((u: vscode.Uri) => (workspaceFaves.add(u)))));
  context.subscriptions.push(vscode.commands.registerCommand('faves.remove', uriExecutor((u: vscode.Uri) => (workspaceFaves.remove(u)))));
  context.subscriptions.push(vscode.commands.registerCommand('faves.toggle', uriExecutor((u: vscode.Uri) => (workspaceFaves.toggle(u)))));

  context.subscriptions.push(vscode.commands.registerCommand('faves.globalAdd', uriExecutor((u: vscode.Uri) => (globalFaves.add(u)))));
  context.subscriptions.push(vscode.commands.registerCommand('faves.globalRemove', uriExecutor((u: vscode.Uri) => (globalFaves.remove(u)))));
  context.subscriptions.push(vscode.commands.registerCommand('faves.globalToggle', uriExecutor((u: vscode.Uri) => (globalFaves.toggle(u)))));

  context.subscriptions.push(vscode.commands.registerCommand('faves.search', (ss: SearchSettings | undefined) => searchFaves([
    workspaceFaves, globalFaves,
  ], !!ss?.alias)));

  vscode.workspace.onDidChangeConfiguration(e => {
    if (e.affectsConfiguration("faves")) {
      workspaceFaves.reload();
      globalFaves.reload();
    }
  });

  // Test command
  context.subscriptions.push(vscode.commands.registerCommand('faves.testReset', () => {
    if (process.env.TEST_MODE) {
      workspaceFaves.reload();
      globalFaves.reload();
    } else {
      vscode.window.showErrorMessage(`Cannot run testReset outside of test mode!`);
    }
  }));
}

// This method is called when your extension is deactivated
export function deactivate() {}
