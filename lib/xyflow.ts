import type { AudioNodeProps } from '@/components/nodes/audio';
import type { CodeNodeProps } from '@/components/nodes/code';
import type { FileNodeProps } from '@/components/nodes/file';
import type { ImageNodeProps } from '@/components/nodes/image';
import type { TextNodeProps } from '@/components/nodes/text';
import type { TweetNodeProps } from '@/components/nodes/tweet';
import type { Node } from '@xyflow/react';

export const getTextFromTextNodes = (nodes: Node[]) => {
  const messages: string[] = [];

  // Coletar textos originais (mensagens do usuário)
  const sourceTexts = nodes
    .filter((node) => node.type === 'text')
    .map((node) => (node.data as TextNodeProps['data']).text)
    .filter(Boolean);

  // Adicionar textos originais com tag User:
  sourceTexts.forEach(text => {
    messages.push(`User: ${text}`);
  });

  // Coletar instruções do usuário (data.instructions)
  const userInstructions = nodes
    .filter((node) => node.type === 'text')
    .map((node) => (node.data as TextNodeProps['data']).instructions)
    .filter(Boolean);

  // Adicionar instruções com tag User:
  userInstructions.forEach(instruction => {
    messages.push(`User: ${instruction}`);
  });

  // Coletar textos gerados (mensagens do assistente)
  const generatedTexts = nodes
    .filter((node) => node.type === 'text' && node.data.generated)
    .map((node) => (node.data as TextNodeProps['data']).generated?.text)
    .filter(Boolean);

  // Adicionar textos gerados com tag Assistant:
  generatedTexts.forEach(text => {
    messages.push(`Assistant: ${text}`);
  });

  return messages;
};

export const getTranscriptionFromAudioNodes = (nodes: Node[]) => {
  const transcripts = nodes
    .filter((node) => node.type === 'audio')
    .map((node) => (node.data as AudioNodeProps['data']).transcript)
    .filter(Boolean) as string[];

  return transcripts;
};

export const getDescriptionsFromImageNodes = (nodes: Node[]) => {
  const descriptions = nodes
    .filter((node) => node.type === 'image')
    .map((node) => (node.data as ImageNodeProps['data']).description)
    .filter(Boolean) as string[];

  return descriptions;
};

export const getImagesFromImageNodes = (nodes: Node[]) => {
  const sourceImages = nodes
    .filter((node) => node.type === 'image')
    .map((node) => (node.data as ImageNodeProps['data']).content)
    .filter(Boolean) as { url: string; type: string }[];

  const generatedImages = nodes
    .filter((node) => node.type === 'image')
    .map((node) => (node.data as ImageNodeProps['data']).generated)
    .filter(Boolean) as { url: string; type: string }[];

  return [...sourceImages, ...generatedImages];
};

export const isValidSourceTarget = (source: Node, target: Node) => {
  // Prevent drop nodes from being sources
  if (source.type === 'drop') {
    return false;
  }

  // File nodes can only connect to text, image, and video nodes
  if (source.type === 'file' && !['text', 'image', 'video'].includes(target.type)) {
    return false;
  }

  // Audio nodes only accept text as input
  if (target.type === 'audio' && source.type !== 'text') {
    return false;
  }

  // File nodes don't accept any input
  if (target.type === 'file') {
    return false;
  }

  return true;
};

export const getCodeFromCodeNodes = (nodes: Node[]) => {
  const sourceCodes = nodes
    .filter((node) => node.type === 'code')
    .map((node) => (node.data as CodeNodeProps['data']).content)
    .filter(Boolean) as { text: string; language: string }[];

  const generatedCodes = nodes
    .filter((node) => node.type === 'code' && node.data.generated)
    .map((node) => (node.data as CodeNodeProps['data']).generated)
    .filter(Boolean) as { text: string; language: string }[];

  return [...sourceCodes, ...generatedCodes];
};

export const getFilesFromFileNodes = (nodes: Node[]) => {
  const files = nodes
    .filter((node) => node.type === 'file')
    .map((node) => (node.data as FileNodeProps['data']).content)
    .filter(Boolean) as { url: string; type: string; name: string }[];

  return files;
};

export const getTweetContentFromTweetNodes = (nodes: Node[]) => {
  const tweets = nodes
    .filter((node) => node.type === 'tweet')
    .map((node) => (node.data as TweetNodeProps['data']).content)
    .filter(Boolean) as NonNullable<TweetNodeProps['data']['content']>[];

  const tweetContent = tweets.map(
    (tweet) => `On ${tweet.date}, ${tweet.author} tweeted: ${tweet.text}`
  );

  return tweetContent;
};
