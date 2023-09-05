import { basename, dirname } from 'path';
import * as vscode from 'vscode';

interface Fave {
  path: string;
};

interface FaveQuickPickItem  extends vscode.QuickPickItem, Fave {};

// Note: we use a function (rather than having Fave extend QuickPickItem),
// to ensure we don't write unnecessary data to settings
function faveToQuickPick(fave: Fave): FaveQuickPickItem {
  return {
    ...fave,
    label: basename(fave.path),
    description: dirname(fave.path),
  };
}

interface FavesConfiguration {
  favorites: Fave[];
};

export class FavesManager {

  faves: Map<string, Fave>;
  eventEmitter: vscode.EventEmitter<void> = new vscode.EventEmitter<void>()

  constructor() {
    this.faves = new Map<string, Fave>();
    this.reload();
  }

  async add(f: vscode.Uri): Promise<void> {
    this.faves.set(this.pth(f), {path: this.pth(f)});
    return await this.updateConfiguration();
  }

  async remove(f: vscode.Uri): Promise<void> {
    this.faves.delete(this.pth(f));
    return await this.updateConfiguration();
  }

  pth(f: vscode.Uri): string {
    return f.path;
  }

  toggle(f: vscode.Uri) {
    if (this.faves.has(this.pth(f))) {
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
    const item = await vscode.window.showQuickPick(this.orderedFaves().map(faveToQuickPick));
    if (!item) {
      return;
    }
    vscode.window.showInformationMessage(`Picked item: ${item.path}`);
  }

  reload(): void {
    const config = vscode.workspace.getConfiguration("faves", vscode.window.activeTextEditor?.document.uri);
    const favorites = config.get<Fave[]>("favorites");
    this.faves = new Map(favorites?.map(fave => [fave.path, fave]));
  }

  private updateConfiguration(): Promise<void> {
    vscode.workspace.getConfiguration("faves").update("favorites", this.orderedFaves(), vscode.ConfigurationTarget.Workspace, true).then(undefined, (reason: any) => {
      vscode.window.showInformationMessage(`Failed to update favorites: ${reason}`);
    });
    return Promise.resolve();
  }
}
