import { basename, dirname } from 'path';
import * as vscode from 'vscode';

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
  return {
    ...fave,
    label: basename(fave.path),
    // matchOnDescription only matches on label OR description, hence why
    // we need to use `fave.path` (instead of `dirname(fave.path)`) here.
    description: fave.path,
    buttons: [
      new RemoveFaveButton(),
    ],
  };
}

export class FavesManager {

  faves: Map<string, Fave>;
  eventEmitter: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();

  constructor() {
    this.faves = new Map<string, Fave>();
    this.reload();
  }

  async add(f: vscode.Uri): Promise<void> {
    const p: string = this.pth(f);
    if (this.faves.has(p)) {
      vscode.window.showInformationMessage("File already exists in favorites");
    } else {
      vscode.window.showInformationMessage("Adding file to favorites");
      this.faves.set(this.pth(f), {path: this.pth(f)});
      return await this.updateConfiguration();
    }
  }

  async remove(f: vscode.Uri): Promise<void> {
    this.removePath(this.pth(f));
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
          const uri: vscode.Uri = vscode.Uri.from({
            scheme: "file",
            path: input.selectedItems[0].path,
          });
          vscode.window.showTextDocument(uri);
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
