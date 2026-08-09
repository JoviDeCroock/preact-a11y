/* oxlint-disable no-await-in-loop -- directory readers are paginated and must be consumed serially */
import type { DirectoryDropItem, DragItem, DropItem, FileDropItem, TextDropItem } from './types';

const CUSTOM_DRAG_TYPE = 'application/vnd.preact-aria.items+json';
const GENERIC_TYPE = 'application/octet-stream';
const NATIVE_TEXT_TYPES = new Set(['text/plain', 'text/html', 'text/uri-list']);

export function writeToDataTransfer(dataTransfer: DataTransfer, items: DragItem[]) {
  const grouped = new Map<string, string[]>();
  let needsCustomData = false;
  for (const item of items) {
    const types = Object.keys(item);
    if (types.length > 1) needsCustomData = true;
    for (const type of types) {
      const values = grouped.get(type) ?? [];
      if (values.length) needsCustomData = true;
      values.push(item[type]!);
      grouped.set(type, values);
    }
  }

  for (const [type, values] of grouped) {
    dataTransfer.setData(type, NATIVE_TEXT_TYPES.has(type) ? values.join('\n') : values[0]!);
  }
  if (needsCustomData) dataTransfer.setData(CUSTOM_DRAG_TYPE, JSON.stringify(items));
}

function fileItem(file: File): FileDropItem {
  return {
    kind: 'file',
    name: file.name,
    type: file.type || GENERIC_TYPE,
    getText: () => file.text(),
    getFile: () => Promise.resolve(file),
  };
}

interface LegacyFileEntry {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  file?(success: (file: File) => void, failure: (error: DOMException) => void): void;
  createReader?(): {
    readEntries(
      success: (entries: LegacyFileEntry[]) => void,
      failure: (error: DOMException) => void,
    ): void;
  };
}

function entryFile(entry: LegacyFileEntry) {
  return new Promise<File>((resolve, reject) => entry.file?.(resolve, reject));
}

function directoryItem(entry: LegacyFileEntry): DirectoryDropItem {
  return {
    kind: 'directory',
    name: entry.name,
    async *getEntries() {
      const reader = entry.createReader?.();
      if (!reader) return;
      while (true) {
        const entries = await new Promise<LegacyFileEntry[]>((resolve, reject) =>
          reader.readEntries(resolve, reject),
        );
        if (!entries.length) return;
        for (const child of entries) {
          if (child.isDirectory) yield directoryItem(child);
          else if (child.isFile) yield fileItem(await entryFile(child));
        }
      }
    },
  };
}

export function readFromDataTransfer(dataTransfer: DataTransfer): DropItem[] {
  if (Array.from(dataTransfer.types).includes(CUSTOM_DRAG_TYPE)) {
    try {
      const parsed = JSON.parse(dataTransfer.getData(CUSTOM_DRAG_TYPE)) as DragItem[];
      return parsed.map<TextDropItem>((item) => ({
        kind: 'text',
        types: new Set(Object.keys(item)),
        getText: (type) => Promise.resolve(item[type] ?? ''),
      }));
    } catch {
      // Fall through to native formats when another application supplies malformed custom data.
    }
  }

  const result: DropItem[] = [];
  const text = new Map<string, string>();
  for (const item of Array.from(dataTransfer.items ?? [])) {
    if (item.kind === 'string') {
      const type = item.type || GENERIC_TYPE;
      text.set(type, dataTransfer.getData(item.type));
      continue;
    }
    const entry = (
      item as DataTransferItem & { webkitGetAsEntry?: () => LegacyFileEntry | null }
    ).webkitGetAsEntry?.();
    if (entry?.isDirectory) result.push(directoryItem(entry));
    else {
      const file = item.getAsFile();
      if (file) result.push(fileItem(file));
    }
  }

  if (!dataTransfer.items?.length) {
    for (const type of Array.from(dataTransfer.types)) {
      if (type !== CUSTOM_DRAG_TYPE && type !== 'Files') text.set(type, dataTransfer.getData(type));
    }
  }
  if (text.size) {
    result.push({
      kind: 'text',
      types: new Set(text.keys()),
      getText: (type) => Promise.resolve(text.get(type) ?? ''),
    });
  }
  return result;
}
