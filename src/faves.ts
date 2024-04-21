import { existsSync, lstatSync } from 'fs';
import { basename } from 'path';
import * as vscode from 'vscode';
import path = require('path');

interface Fave {
  path: string;
};

class RemoveFaveButton implements vscode.QuickInputButton {
  readonly iconPath: vscode.ThemeIcon;
  readonly tooltip?: string;
  constructor() {
    this.iconPath = new vscode.ThemeIcon("close");
    this.tooltip = "Remove file from favorites list";
  }
}


interface FaveQuickPickItem  extends vscode.QuickPickItem, Fave {};

// Note: we use a function (rather than having Fave extend QuickPickItem),
// to ensure we don't write unnecessary data to settings
function faveToQuickPick(fave: Fave): FaveQuickPickItem {
  const wsFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.from({
    scheme: "file",
    path: fave.path,
  }));
  const numWsFolders = vscode.workspace.workspaceFolders?.length;
  return {
    ...fave,
    label: basename(fave.path),
    // matchOnDescription only matches on label OR description, hence why
    // we need to use `fave.path` (instead of `dirname(fave.path)`) here.
    description: wsFolder ? `${numWsFolders === 1 ? `` : `${wsFolder.name} ● `}${path.relative(wsFolder.uri.fsPath, fave.path)}` : fave.path,
    buttons: [
      new RemoveFaveButton(),
    ],
  };
}

abstract class FavesManager {

  abstract uriToPath(uri: vscode.Uri): string;
  abstract pathToUri(path: string): vscode.Uri | undefined;

  // These fields used to be abstract, but would be undefined on first initialization (so reload would fail).
  readonly subsection: string;
  readonly configurationTarget: vscode.ConfigurationTarget;

  faves: Map<string, Fave>;
  eventEmitter: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();

  constructor(subsection: string, configurationTarget: vscode.ConfigurationTarget) {
    this.subsection = subsection;
    this.configurationTarget = configurationTarget;
    this.faves = new Map<string, Fave>();
    this.reload();
  }

  async add(f: vscode.Uri): Promise<void> {
    const p: string = this.uriToPath(f);
    if (this.faves.has(p)) {
      vscode.window.showInformationMessage("File already exists in favorites");
    } else {
      vscode.window.showInformationMessage("Adding file to favorites");
      this.faves.set(this.uriToPath(f), {path: this.uriToPath(f)});
      return await this.updateConfiguration();
    }
  }

  async remove(f: vscode.Uri): Promise<void> {
    this.removePath(this.uriToPath(f));
  }

  async removePath(path: string): Promise<void> {
    if (!this.faves.has(path)) {
      vscode.window.showInformationMessage("File already removed from favorites");
    } else {
      vscode.window.showInformationMessage("Removing file from favorites");
      this.faves.delete(path);
      return await this.updateConfiguration();
    }
  }

  toggle(f: vscode.Uri) {
    if (this.faves.has(this.uriToPath(f))) {
      this.remove(f);
    } else {
      this.add(f);
    }
  }

  orderedFaves(): Fave[] {
    return Array.from(this.faves.values()).sort((a, b) => a < b ? -1 : 1);
  }

  async select() {
    if (this.faves.size === 0) {
      vscode.window.showInformationMessage("No favorites exist in this workspace");
      return;
    }

    const disposables: vscode.Disposable[] = [];
    const input = vscode.window.createQuickPick<FaveQuickPickItem>();
    input.matchOnDescription = true;
    input.items = this.orderedFaves().map(faveToQuickPick);
    input.buttons = [
      // This is for global buttons (not item specific)
    ];
    input.placeholder = "Search favorited files";
    disposables.push(
      input.onDidTriggerItemButton(event => {
        input.items = input.items.filter(item => item.path !== event.item.path);
        this.removePath(event.item.path);
      }),
      input.onDidHide(e => {
        disposables.forEach(d => d.dispose);
      }),
      input.onDidAccept(e => {
        switch (input.selectedItems.length) {
        case 0:
          vscode.window.showInformationMessage("No selection made");
          break;
        case 1:
          const uri = this.pathToUri(input.selectedItems[0].path);
          if (uri) {
            vscode.window.showTextDocument(uri);
          } // No else because the pathToUri should output an error message
          break;
        default:
          vscode.window.showInformationMessage("Multiple selections made?!?!?");
          break;
        }
        input.dispose();
      }),
    );
    input.show();
  }

  reload(): void {
    const config = vscode.workspace.getConfiguration("faves", vscode.window.activeTextEditor?.document.uri);
    const favorites = config.get<Fave[]>(this.subsection);
    // We need to type-define this keyValueList (vs inline in `new Map(...)`) because typescript does some
    // weird type assumptions which results in an empty map initialization otherwise.
    // (or maybe just need the `|| []`). That seems to solve, but sticking with this just in case.
    const keyValueList: [string, Fave][] = (favorites?.map(fave => [fave.path, fave]) || []);
    this.faves = new Map(keyValueList);
  }

  private updateConfiguration(): Promise<void> {
    vscode.workspace.getConfiguration("faves").update(this.subsection, this.orderedFaves(), this.configurationTarget, true).then(undefined, (reason: any) => {
      vscode.window.showInformationMessage(`Failed to update favorites: ${reason}`);
    });
    return Promise.resolve();
  }
}

export class WorkspaceFavesManager extends FavesManager {

  constructor() {
    super("favorites", vscode.ConfigurationTarget.Workspace);
  }

  uriToPath(uri: vscode.Uri): string {
    return uri.fsPath;
  }

  pathToUri(path: string): vscode.Uri {
    return vscode.Uri.from({
      scheme: "file",
      path,
    });
  }
}

export class GlobalFavesManager extends FavesManager {

  constructor() {
    super("globalFavorites", vscode.ConfigurationTarget.Global);
  }

  uriToPath(uri: vscode.Uri): string {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    if (!workspaceFolder) {
      throw new Error("No workspace folder for given URI!");
    }
    return path.relative(workspaceFolder.uri.fsPath, uri.fsPath);
  }

  pathToUri(favePath: string): vscode.Uri | undefined {
    const uris: vscode.Uri[] = [];
    for (const workspaceFolder of (vscode.workspace.workspaceFolders || [])) {

      const joinedPath = path.join(workspaceFolder.uri.fsPath, favePath);
      if (!existsSync(joinedPath)) {
        continue;
      }

      const stat = lstatSync(joinedPath);
      if (!stat.isFile()) {
        continue;
      }

      uris.push(vscode.Uri.from({
          scheme: "file",
          path: joinedPath,
      }));
    }

    switch (uris.length) {
    case 0:
      vscode.window.showErrorMessage(`No files in this workspace match this pattern`);
      return;
    case 1:
      return uris.at(0)!;
    default:
      vscode.window.showErrorMessage(`Multiple files in this workspace match this pattern`);
      return;
    }
  }
}
