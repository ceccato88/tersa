import { DropNode } from './drop';
import { AgentNode } from './agent';
import { ImageNode } from './image';
import { TextNode } from './text';
import { VideoNode } from './video';

export const nodeTypes = {
  image: ImageNode,
  text: TextNode,
  drop: DropNode,
  video: VideoNode,
  agent: AgentNode,
};
