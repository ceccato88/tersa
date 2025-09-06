'use client';

import { updateProfileAction } from '@/app/actions/profile/update';
import { Canvas } from '@/components/canvas';
import type { ImageNodeProps } from '@/components/nodes/image';
import type { TextNodeProps } from '@/components/nodes/text';
import { Toolbar } from '@/components/toolbar';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/use-user';
import { handleError } from '@/lib/error/handle';
import { nodeButtons } from '@/lib/node-buttons';
import { useProject } from '@/providers/project';
import { useSubscription } from '@/providers/subscription';
import { getIncomers, useReactFlow } from '@xyflow/react';
import { PlayIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const TextNode = nodeButtons.find((button) => button.id === 'text');

if (!TextNode) {
  throw new Error('Nó de texto não encontrado');
}

type WelcomeDemoProps = {
  title: string;
  description: string;
};

export const WelcomeDemo = ({ title, description }: WelcomeDemoProps) => {
  const project = useProject();
  const { getNodes, getEdges } = useReactFlow();
  const [started, setStarted] = useState(false);
  const { isSubscribed } = useSubscription();
  const stepsContainerRef = useRef<HTMLDivElement>(null);
  const [hasTextNode, setHasTextNode] = useState(false);
  const [hasFilledTextNode, setHasFilledTextNode] = useState(false);
  const [hasImageNode, setHasImageNode] = useState(false);
  const [hasConnectedImageNode, setHasConnectedImageNode] = useState(false);
  const [hasImageInstructions, setHasImageInstructions] = useState(false);
  const [hasGeneratedImage, setHasGeneratedImage] = useState(false);
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    // Run on mount to set initial state
    handleNodesChange();
  }, []);

  const handleFinishWelcome = async () => {
    if (!user || !project?.id) {
      return;
    }

    try {
      const response = await updateProfileAction(user.id);

      if ('error' in response) {
        throw new Error(response.error);
      }

      router.push(`/projects/${project.id}`);
    } catch (error) {
      handleError('Erro ao finalizar integração', error);
    }
  };

  const steps = [
    {
      instructions: `${description} Parece bom?`,
      action: (
        <div className="not-prose flex items-center gap-4">
          <Button onClick={() => setStarted(true)}>Parece bom!</Button>
          <Button variant="outline" onClick={handleFinishWelcome}>
            Pular introdução
          </Button>
        </div>
      ),
      complete: started,
    },

    {
      instructions: (
        <>
          Primeiro, clique no ícone{' '}
          <TextNode.icon className="-translate-y-0.5 inline-block size-4 text-primary" />{' '}
          na barra de ferramentas inferior. Isso adicionará um nó de Texto ao canvas.
        </>
      ),
      complete: hasTextNode,
    },
    {
      instructions: (
        <>
          Fantástico! Esse é o primeiro nó. Como não há nós de entrada,
          você controla o conteúdo. Tente escrever algumas palavras ou frases no
          nó. Nossa favorita é "um campo selvagem de delphiniums".
        </>
      ),
      complete: hasTextNode && hasFilledTextNode,
    },
    {
      instructions: (
        <>
          Excelente trabalho! Agora, vamos conectá-lo a um nó de Imagem. Arraste a alça
          do lado direito do nó de Texto para um espaço vazio e solte. Você será
          solicitado a selecionar um tipo de nó. Selecione o nó de Imagem.
        </>
      ),
      complete:
        hasTextNode &&
        hasFilledTextNode &&
        hasImageNode &&
        hasConnectedImageNode,
    },
    {
      instructions: (
        <>
          Você está pegando o jeito! Como este nó tem nós de entrada
          conectados a ele, ele gerará conteúdo com IA baseado nos
          nós de entrada.
          <br />
          <br />
          Você também pode adicionar instruções ao nó de Imagem. Isso será usado para
          influenciar o resultado. Tente adicionar algumas instruções ao nó de Imagem,
          talvez algo como "faça no estilo anime".
        </>
      ),
      complete:
        hasTextNode &&
        hasFilledTextNode &&
        hasImageNode &&
        hasConnectedImageNode &&
        hasImageInstructions,
    },
    {
      instructions: (
        <>
          Essa é toda a informação que precisamos para gerar uma imagem incrível! Clique
          no nó de Imagem para selecioná-lo, então pressione o botão{' '}
          <PlayIcon className="-translate-y-0.5 inline-block size-4 text-primary" />{' '}
          para gerar conteúdo.
        </>
      ),
      complete:
        hasTextNode &&
        hasFilledTextNode &&
        hasImageNode &&
        hasConnectedImageNode &&
        hasImageInstructions &&
        hasGeneratedImage,
    },
    {
      instructions: (
        <>
          É isso! Você criou seu primeiro fluxo de trabalho alimentado por IA. Você pode
          continuar adicionando mais nós ao canvas para criar fluxos mais complexos
          e descobrir o poder do WOW.
        </>
      ),
      action: (
        <div className="not-prose">
          <Button asChild onClick={handleFinishWelcome}>
            <Link href="/">Continuar</Link>
          </Button>
        </div>
      ),
      complete: false,
    },
  ];

  const activeStep = steps.find((step) => !step.complete) ?? steps[0];
  const previousSteps = steps.slice(0, steps.indexOf(activeStep));

  // biome-ignore lint/correctness/useExhaustiveDependencies: "we want to listen to activeStep"
  useEffect(() => {
    if (stepsContainerRef.current) {
      stepsContainerRef.current.scrollTo({
        top: stepsContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [activeStep.instructions]);

  const handleNodesChange = useCallback(() => {
    setTimeout(() => {
      const newEdges = getEdges();
      const newNodes = getNodes();

      const textNodes = newNodes.filter((node) => node.type === 'text');

      if (!textNodes.length) {
        setHasTextNode(false);
        return;
      }

      setHasTextNode(true);

      const textNode = textNodes.at(0);

      if (!textNode) {
        return;
      }

      const text = (textNode as unknown as TextNodeProps).data.text;

      if (text && text.length > 10) {
        setHasFilledTextNode(true);
      } else {
        setHasFilledTextNode(false);
      }

      const imageNodes = newNodes.filter((node) => node.type === 'image');
      const imageNode = imageNodes.at(0);

      if (!imageNode) {
        setHasImageNode(false);
        return;
      }

      setHasImageNode(true);

      const sources = getIncomers(imageNode, newNodes, newEdges);
      const textSource = sources.find((source) => source.id === textNode.id);

      if (!textSource) {
        setHasConnectedImageNode(false);
        return;
      }

      setHasConnectedImageNode(true);

      const image = imageNode as unknown as ImageNodeProps;
      const instructions = image.data.instructions;

      if (instructions && instructions.length > 5) {
        setHasImageInstructions(true);
      } else {
        setHasImageInstructions(false);
      }

      if (!image.data.generated?.url) {
        setHasGeneratedImage(false);
        return;
      }

      setHasGeneratedImage(true);
    }, 50);
  }, [getNodes, getEdges]);

  return (
    <div className="grid h-screen w-screen grid-rows-3 lg:grid-cols-3 lg:grid-rows-1">
      <div
        className="size-full overflow-auto p-8 lg:p-16"
        ref={stepsContainerRef}
      >
        <div className="prose flex flex-col items-start gap-4">
          <h1 className="font-semibold! text-3xl!">{title}</h1>
          {previousSteps.map((step, index) => (
            <p key={index} className="lead opacity-50">
              {step.instructions}
            </p>
          ))}

          <p className="lead">{activeStep?.instructions}</p>
          {activeStep?.action}
        </div>
      </div>
      <div className="row-span-3 p-8 lg:col-span-2 lg:row-span-1">
        <div className="relative size-full overflow-hidden rounded-3xl border">
          <Canvas onNodesChange={handleNodesChange}>
            {steps[0].complete && <Toolbar />}
          </Canvas>
        </div>
      </div>
    </div>
  );
};
