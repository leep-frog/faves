import { existsSync, lstatSync, statSync } from 'fs';
import { basename } from 'path';
import * as vscode from 'vscode';
import path = require('path');

export interface Fave {
  path: string;
  scheme: string;
  alias?: string;
};

interface SchemeHandler {
  openDocument: (uri: vscode.Uri) => Promise<any>;
}

const SCHEME_HANDLERS = new Map<string, SchemeHandler>([
  ["file", {
    openDocument: async (uri: vscode.Uri): Promise<any> => {
      await vscode.window.showTextDocument(uri);
    },
  }],
  ["vscode-notebook-cell", {
    openDocument: async (uri: vscode.Uri): Promise<any> => {
      const nd = await vscode.workspace.openNotebookDocument(uri);
      await vscode.window.showNotebookDocument(nd);
    },
  }],
]);

class RemoveFaveButton implements vscode.QuickInputButton {
  readonly iconPath: vscode.ThemeIcon;
  readonly tooltip?: string;
  constructor() {
    this.iconPath = new vscode.ThemeIcon("close");
    this.tooltip = "Remove file from favorites list";
  }
}

export interface SearchAliasArgs {
  alias?: string;
}

export interface FaveItem extends vscode.QuickPickItem {
  fave: Fave;
  // Comparing Uri in assertions led to awkward comparison failures due to internal workings of
  // the vscode.Uri type (seems like memoization problem). To avoid this, we simply use the fsPath instead.
  fsPath: string;
  manager: FavesManager;
}

async function openFave(fave: Fave, fsPath: string) {
  let scheme_handler = SCHEME_HANDLERS.get(fave.scheme);
  if (!scheme_handler) {
    vscode.window.showErrorMessage(`Selected fave with unsupported scheme (${fave.scheme}); defaulting to basic file open (delete and re-add this fave if this behavior is unexpected).`);
    scheme_handler = SCHEME_HANDLERS.get("file")!;
  }
  await scheme_handler.openDocument(vscode.Uri.file(fsPath));
}

export async function searchFaves(managers: FavesManager[], useAlias: boolean, args?: SearchAliasArgs) {
  if (useAlias && args?.alias) {
    for (const manager of managers) {
      for (const fave of manager.orderedFaves()) {
        if (fave.alias === args.alias) {
          const uris = manager.faveToURIs(fave);
          if (uris.length !== 1) {
            vscode.window.showErrorMessage(`Fave with alias ${args.alias} has ${uris.length} URIs; expected 1`);
            return;
          }
          const uri = uris[0];
          await openFave(fave, uri.fsPath);
          return;
        }
      }
    }
    vscode.window.showErrorMessage(`Unknown alias ${args.alias} (provided by command args)`);
    return;
  }

  const items: FaveItem[] = [];
  for (const manager of managers) {
    [...manager.orderedFaves()].forEach(fave => {
      manager.faveToURIs(fave).forEach(uri => {

        if (!existsSync(uri.fsPath)) {
          return;
        }

        const stat = statSync(uri.fsPath);
        if (!stat.isFile()) {
          return;
        }

        const wsFolder = vscode.workspace.getWorkspaceFolder(uri);

        const descriptionParts = [];
        if (!wsFolder) {
          // Add full path if we don't have additional info
          descriptionParts.push(path.dirname(fave.path));
        } else {
          // Add the workspace identifier if there is more than one workspace folder.
          if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders?.length > 1) {
            descriptionParts.push(wsFolder.name);
          }

          // Add the relative path if the file is not at the workspace folder root.
          const relativePath = path.dirname(path.relative(wsFolder.uri.fsPath, uri.fsPath));
          if (relativePath !== ".") {
            descriptionParts.push(relativePath);
          }
        }

        // Construct the quick pick item
        if (useAlias) {
          if (fave.alias) {
            descriptionParts.push(basename(fave.path));
            items.push({
              fave,
              fsPath: uri.fsPath,
              manager,
              label: fave.alias,
              iconPath: manager.itemIcon(),
              description: descriptionParts.filter(s => !!s).join(" ● "),
              buttons: [
                new RemoveFaveButton(),
              ],
            });
          }
        } else {
          items.push({
            fave,
            fsPath: uri.fsPath,
            manager,
            label: basename(fave.path),
            iconPath: manager.itemIcon(),
            description: descriptionParts.filter(s => !!s).join(" ● "),
            buttons: [
              new RemoveFaveButton(),
            ],
          });
        }
      });
    });
  }

  if (items.length === 0) {
    vscode.window.showInformationMessage("No favorites exist for this workspace");
    return;
  }

  const disposables: vscode.Disposable[] = [];
  const input = vscode.window.createQuickPick<FaveItem>();
  input.matchOnDescription = !useAlias;
  input.items = items.sort((a, b) => a.label < b.label ? -1 : 1);
  input.buttons = [
    // This is for global buttons (not item specific)
  ];
  input.placeholder = "Search favorited files";
  disposables.push(

    // Handle the item-level buttons
    input.onDidTriggerItemButton(async event => {
      switch (event.button.constructor) {
        case RemoveFaveButton:
          await event.item.manager.removePath(event.item.fave.path);
          const index = input.items.indexOf(event.item);
          input.items = [
            ...input.items.slice(0, index),
            ...input.items.slice(index + 1, input.items.length),
          ];
          break;
        default:
          vscode.window.showErrorMessage(`Unknown item button`);
      }
    }),

    // Open a file if an item is selected
    input.onDidAccept(async e => {
      input.dispose();
      switch (input.selectedItems.length) {
        case 0:
          vscode.window.showInformationMessage("No selection made");
          break;
        case 1:
          const selectedItem = input.selectedItems.at(0)!;

          await openFave(selectedItem.fave, selectedItem.fsPath);
          break;
        default:
          vscode.window.showErrorMessage("Multiple selections made?!?!?");
          break;
      }
    }),

    // Close on input hide
    input.onDidHide(async e => {
      disposables.forEach(d => d.dispose);
    }),
  );
  input.show();
}

abstract class FavesManager {

  abstract uriToPath(uri: vscode.Uri): string | undefined;
  abstract faveToURIs(fave: Fave): vscode.Uri[];
  abstract itemIcon(): vscode.ThemeIcon;

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

  public toJSON() {
    return this.subsection;
  }

  async add(f: vscode.Uri): Promise<void> {
    if (!SCHEME_HANDLERS.has(f.scheme)) {
      vscode.window.showErrorMessage(`${f.scheme} is an unsupported uri scheme`);
      return;
    }

    const p: string | undefined = this.uriToPath(f);
    if (!p) {
      return;
    }

    if (this.faves.has(p)) {
      vscode.window.showInformationMessage(`File already exists in ${this.subsection}`);
      return;
    }

    const alias = await vscode.window.showInputBox({
      placeHolder: "alias (leave blank for no alias)",
      prompt: "Fave alias",
    });

    this.faves.set(p, {
      path: p,
      scheme: f.scheme,
      // Remove whitespace and keep as undefined if empty after trimming.
      alias: alias?.trim() || undefined,
    });
    return await this.updateConfiguration()
      .then(() => {
        // Make sure we don't return the message
        vscode.window.showInformationMessage(`${basename(f.fsPath)} was added to faves.${this.subsection}`);
      })
      .catch((reason) => {
        // Make sure we don't return the message
        vscode.window.showErrorMessage(`Failed to add ${basename(f.fsPath)} to faves.${this.subsection}: ${reason}`);
      });
  }

  async remove(f: vscode.Uri): Promise<void> {
    const p = this.uriToPath(f);
    if (!p) {
      return;
    }
    return this.removePath(p);
  }

  async removePath(path: string): Promise<void> {
    if (!this.faves.has(path)) {
      vscode.window.showInformationMessage(`File does not exist in faves.${this.subsection}`);
    } else {
      this.faves.delete(path);
      return await this.updateConfiguration()
        .then(() => {
          // Make sure we don't return the message
          vscode.window.showInformationMessage(`${basename(path)} was removed from faves.${this.subsection}`);
        })
        .catch((reason) => {
          // Make sure we don't return the message
          vscode.window.showErrorMessage(`Failed to remove ${basename(path)} from faves.${this.subsection}: ${reason}`);
        });
    }
  }

  toggle(f: vscode.Uri) {
    const p = this.uriToPath(f);
    if (!p) {
      return;
    }

    if (this.faves.has(p)) {
      this.remove(f);
    } else {
      this.add(f);
    }
  }

  orderedFaves(): Fave[] {
    return Array.from(this.faves.values()).sort((a, b) => a.path < b.path ? -1 : 1);
  }

  reload(): void {
    const config = vscode.workspace.getConfiguration();
    const favorites = config.get<Fave[]>(`faves.${this.subsection}`);
    // We need to type-define this keyValueList (vs inline in `new Map(...)`) because typescript does some
    // weird type assumptions which results in an empty map initialization otherwise.
    // (or maybe just need the `|| []`). That seems to solve, but sticking with this just in case.
    const keyValueList: [string, Fave][] = (favorites?.map(fave => [fave.path, fave]) || []);
    this.faves = new Map(keyValueList);
  }

  private async updateConfiguration(): Promise<void> {
    // TODO: Update vscode-test-stubber (or this logic?) so 'faves' can be passed in `getConfiguration'. The issue is that
    // getConfiguration gets the highest-level config that matches faves (so the workspace one, even though the globalFavorites setting isn't present there).
    return vscode.workspace.getConfiguration().update(`faves.${this.subsection}`, this.orderedFaves(), this.configurationTarget).then(undefined, (reason: any) => {
      vscode.window.showInformationMessage(`Failed to update favorites: ${reason}`);
    });
  }
}

export class WorkspaceFavesManager extends FavesManager {

  constructor() {
    super("favorites", vscode.ConfigurationTarget.Workspace);
  }

  itemIcon(): vscode.ThemeIcon {
    return new vscode.ThemeIcon("home");
  }

  uriToPath(uri: vscode.Uri): string {
    return uri.fsPath;
  }

  faveToURIs(fave: Fave): vscode.Uri[] {
    return [vscode.Uri.file(fave.path)];
  }
}

export class GlobalFavesManager extends FavesManager {

  constructor() {
    super("globalFavorites", vscode.ConfigurationTarget.Global);
  }

  itemIcon(): vscode.ThemeIcon {
    return new vscode.ThemeIcon("globe");
  }

  uriToPath(uri: vscode.Uri): string | undefined {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    if (!workspaceFolder) {
      vscode.window.showErrorMessage(`File is not in a workspace folder`);
      return;
    }
    return path.relative(workspaceFolder.uri.fsPath, uri.fsPath);
  }

  faveToURIs(fave: Fave): vscode.Uri[] {
    const uris: vscode.Uri[] = [];
    for (const workspaceFolder of (vscode.workspace.workspaceFolders || [])) {

      const joinedPath = path.join(workspaceFolder.uri.fsPath, fave.path);
      if (!existsSync(joinedPath)) {
        continue;
      }

      const stat = lstatSync(joinedPath);
      if (!stat.isFile()) {
        continue;
      }

      uris.push(vscode.Uri.file(joinedPath));
    }

    return uris;
  }
}
