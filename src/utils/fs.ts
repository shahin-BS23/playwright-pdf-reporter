import { promises as fs } from 'fs';
import path from 'path';

export const ensureDir = async (dirPath: string): Promise<void> => {
  await fs.mkdir(dirPath, { recursive: true });
};

export const writeFileSafe = async (
  filePath: string,
  data: string | Buffer,
  encoding: BufferEncoding | undefined = undefined
): Promise<void> => {
  await ensureDir(path.dirname(filePath));
  if (typeof data === 'string') {
    await fs.writeFile(filePath, data, encoding);
  } else {
    await fs.writeFile(filePath, data);
  }
};

export const readFileSafe = async (
  filePath: string,
  encoding: BufferEncoding = 'utf-8'
): Promise<string | undefined> => {
  try {
    return await fs.readFile(filePath, encoding);
  } catch {
    return undefined;
  }
};

export const readBinarySafe = async (filePath: string): Promise<Buffer | undefined> => {
  try {
    return await fs.readFile(filePath);
  } catch {
    return undefined;
  }
};

export const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

