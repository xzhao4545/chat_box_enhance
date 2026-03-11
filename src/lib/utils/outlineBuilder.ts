import type { HeaderTreeNode, OutlineItem } from '../types';
import { MessageOwner } from '../types';

const HEADER_SELECTOR = 'h1, h2, h3, h4, h5, h6';

export interface OutlineBuildResult {
  text: string;
  searchText: string;
  headers?: HeaderTreeNode[];
}

export function getMessageText(messageElement: Element): string {
  return messageElement.textContent || '';
}

export function buildMessageHash(index: number, text: string): string {
  const idLength = 10;

  if (text.length <= idLength * 2) {
    return `${index}${text}`;
  }

  const res: string[] = [];
  const step = Math.max(1, Math.ceil((text.length - idLength) / idLength));
  for (let i = 0; i < text.length - idLength && res.length < idLength; i += step) {
    res.push(text[i]);
  }

  return `${index}${res.join('')}${text.substring(text.length - idLength)}`;
}

export function buildHeaderTree(headers: Element[]): HeaderTreeNode[] {
  return buildHeaderTreeWithPrefix(headers, '');
}

export function buildHeaderTreeWithPrefix(headers: Element[], prefix: string): HeaderTreeNode[] {
  const tree: HeaderTreeNode[] = [];
  const stack: HeaderTreeNode[] = [];

  headers.forEach((header) => {
    const level = Number.parseInt(header.tagName.charAt(1), 10);
    const node: HeaderTreeNode = {
      id: '',
      element: header,
      level,
      text: header.textContent || '',
      children: []
    };

    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    const parent = stack[stack.length - 1];
    const localId = parent ? `${parent.id}.${parent.children.length}` : `${tree.length}`;
    node.id = prefix ? `${prefix}:${localId}` : localId;

    if (parent) {
      parent.children.push(node);
    } else {
      tree.push(node);
    }

    stack.push(node);
  });

  return tree;
}

export function buildOutlineData(
  messageElement: Element,
  type: MessageOwner,
  textLength: number,
  headerIdPrefix = '',
): OutlineBuildResult {
  const searchText = getMessageText(messageElement);
  const text = searchText.substring(0, textLength) + (searchText.length > textLength ? '...' : '');

  if (type !== MessageOwner.Assistant) {
    return { text, searchText };
  }

  const headers = messageElement.querySelectorAll(HEADER_SELECTOR);
  return {
    text,
    searchText,
    headers: headers.length > 0 ? buildHeaderTreeWithPrefix(Array.from(headers), headerIdPrefix) : undefined
  };
}

export function createOutlineViewItem(params: {
  id: string;
  index: number;
  type: MessageOwner;
  element: Element;
  textLength: number;
}): OutlineItem {
  const { id, index, type, element, textLength } = params;
  const built = buildOutlineData(element, type, textLength, id);

  return {
    id,
    index,
    type,
    text: built.text,
    searchText: built.searchText,
    element,
    headers: built.headers,
    isExpanded: true
  };
}
