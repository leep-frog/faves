// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { GlobalFavesManager, WorkspaceFavesManager } from './faves';

const workspaceFaves = new WorkspaceFavesManager();
const globalFaves = new GlobalFavesManager();

function uriExecutor(handler: (u: vscode.Uri) => void): (u: vscode.Uri | undefined) => void {
  return (u: vscode.Uri | undefined) => {
    executeOnUri(handler, u);
  };
}

function executeOnUri(handler: (u: vscode.Uri) => void, uri?: vscode.Uri): void {
  if (!uri) {
    uri = vscode.window.activeTextEditor?.document.uri;
  }
  if (!uri) {
    vscode.window.showErrorMessage("Unable to get file URI");
    return;
  }
  if (uri.scheme !== "file") {
    vscode.window.showErrorMessage("Currently, only file resources are supported");
    return;
  }
  handler(uri);
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(vscode.commands.registerCommand('faves.add', uriExecutor((u: vscode.Uri) => (workspaceFaves.add(u)))));
  context.subscriptions.push(vscode.commands.registerCommand('faves.remove', uriExecutor((u: vscode.Uri) => (workspaceFaves.remove(u)))));
  context.subscriptions.push(vscode.commands.registerCommand('faves.toggle', uriExecutor((u: vscode.Uri) => (workspaceFaves.toggle(u)))));

  context.subscriptions.push(vscode.commands.registerCommand('faves.search', () => {
    workspaceFaves.select();
  }));

  context.subscriptions.push(vscode.commands.registerCommand('faves.globalAdd', uriExecutor((u: vscode.Uri) => (globalFaves.add(u)))));
  context.subscriptions.push(vscode.commands.registerCommand('faves.globalRemove', uriExecutor((u: vscode.Uri) => (globalFaves.remove(u)))));
  context.subscriptions.push(vscode.commands.registerCommand('faves.globalToggle', uriExecutor((u: vscode.Uri) => (globalFaves.toggle(u)))));

  context.subscriptions.push(vscode.commands.registerCommand('faves.globalSearch', () => {
    globalFaves.select();
  }));

  vscode.workspace.onDidChangeConfiguration(e => {
    if (e.affectsConfiguration("faves")) {
      workspaceFaves.reload();
      globalFaves.reload();
    }
  });
}

// This method is called when your extension is deactivated
export function deactivate() {}
