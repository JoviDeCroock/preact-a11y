export interface DragItem {
  [type: string]: string;
}

export interface TextDropItem {
  kind: 'text';
  types: Set<string>;
  getText(type: string): Promise<string>;
}

export interface FileDropItem {
  kind: 'file';
  name: string;
  type: string;
  getText(): Promise<string>;
  getFile(): Promise<File>;
}

export interface DirectoryDropItem {
  kind: 'directory';
  name: string;
  getEntries(): AsyncIterable<DropItem>;
}

export type DropItem = TextDropItem | FileDropItem | DirectoryDropItem;

export const DIRECTORY_DRAG_TYPE = Symbol('directory');

export function isTextDropItem(item: DropItem): item is TextDropItem {
  return item.kind === 'text';
}

export function isFileDropItem(item: DropItem): item is FileDropItem {
  return item.kind === 'file';
}

export function isDirectoryDropItem(item: DropItem): item is DirectoryDropItem {
  return item.kind === 'directory';
}
