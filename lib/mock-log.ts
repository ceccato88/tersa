import fs from 'fs/promises';
import path from 'path';

const LOG_FILE = process.env.MOCK_LOG_FILE || path.join('.logs', 'mock.log');
const MAX_LINES = Number.parseInt(process.env.MOCK_LOG_MAX_LINES || '10000', 10);
const PRETTY = (process.env.MOCK_LOG_PRETTY ?? 'true') === 'true';
const INDENT = Number.parseInt(process.env.MOCK_LOG_INDENT || '2', 10);

const ensureDir = async (filePath: string) => {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
};

const trimFileToMaxLines = async (filePath: string, maxLines: number) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const lines = data.split(/\r?\n/);
    // Remove linha vazia final, se existir
    if (lines.length && lines[lines.length - 1] === '') lines.pop();
    if (lines.length > maxLines) {
      const trimmed = lines.slice(lines.length - maxLines).join('\n') + '\n';
      await fs.writeFile(filePath, trimmed, 'utf8');
    }
  } catch (err: any) {
    // Se o arquivo não existir ainda, ignore
    if (err && (err.code === 'ENOENT' || err.code === 'ENOTDIR')) return;
    // Logar silenciosamente em modo dev
    console.warn('[mock-log] trim error:', err?.message || err);
  }
};

export const appendMockLog = async (
  payload: Record<string, unknown>,
  options?: { filePath?: string; maxLines?: number }
) => {
  const filePath = options?.filePath || LOG_FILE;
  const maxLines = options?.maxLines ?? MAX_LINES;
  try {
    await ensureDir(filePath);
    const timestamp = new Date().toISOString();
    const json = PRETTY ? JSON.stringify(payload, null, INDENT) : JSON.stringify(payload);
    const entry = PRETTY
      ? `[${timestamp}]\n${json}\n\n`
      : `[${timestamp}] ${json}\n`;
    await fs.appendFile(filePath, entry, 'utf8');
    await trimFileToMaxLines(filePath, maxLines);
  } catch (err) {
    console.warn('[mock-log] append error:', (err as any)?.message || err);
  }
};
