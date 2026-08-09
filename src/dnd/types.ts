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

export type DropOperation = 'copy' | 'move' | 'link' | 'cancel';

export interface DragStartEvent {
  type: 'dragstart';
  x: number;
  y: number;
}

export interface DragMoveEvent {
  type: 'dragmove';
  x: number;
  y: number;
}

export interface DragEndEvent {
  type: 'dragend';
  x: number;
  y: number;
  dropOperation: DropOperation;
}

export class DragTypes {
  readonly types: Set<string>;

  constructor(types: Iterable<string>) {
    this.types = new Set(types);
  }

  has(type: string | string[] | typeof DIRECTORY_DRAG_TYPE): boolean {
    if (Array.isArray(type)) return type.some((value) => this.has(value));
    if (type === DIRECTORY_DRAG_TYPE)
      return this.types.has('application/octet-stream') || this.types.has('Files');
    if (type === '*/*') return true;
    if (type.endsWith('/*')) {
      const prefix = type.slice(0, -1);
      return [...this.types].some((value) => value.startsWith(prefix));
    }
    return this.types.has(type);
  }
}

export interface DropEventBase {
  x: number;
  y: number;
  dropOperation: DropOperation;
  types: DragTypes;
}

export interface DropEnterEvent extends DropEventBase {
  type: 'dropenter';
}

export interface DropMoveEvent extends DropEventBase {
  type: 'dropmove';
}

export interface DropActivateEvent extends DropEventBase {
  type: 'dropactivate';
}

export interface DropExitEvent extends DropEventBase {
  type: 'dropexit';
}

export interface DropEvent extends DropEventBase {
  type: 'drop';
  items: DropItem[];
}

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
