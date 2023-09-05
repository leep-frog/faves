import { basename, dirname } from 'path';
import * as vscode from 'vscode';

export class Faves {

  faves: Set<vscode.Uri>;

  constructor() {
    this.faves = new Set<vscode.Uri>();
  }

  add(f: vscode.Uri) {
    this.faves.add(f);
  }

  remove(f: vscode.Uri) {
    this.faves.delete(f);
  }

  toggle(f: vscode.Uri) {
    if (this.faves.has(f)) {
      this.remove(f);
    } else {
      this.add(f);
    }
  }

  select() {
    vscode.window.showQuickPick(
      Array.from(this.faves).map(uri => ({
        label: basename(uri.path),
        description: dirname(uri.path),
      })),
      {
        canPickMany: false,
      },
    );
  }
}
