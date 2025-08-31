# Sistema de Filtragem de Modelos IA - Especificação

## Objetivo
Criar um sistema de filtragem que determine dinamicamente quais modelos de IA do Replicate devem aparecer nos seletores dos nós de imagem e vídeo, baseado no tipo de conexão anterior na cadeia de processamento.

## Contexto Atual
- **Nós de Imagem até o momento:** flux-dev, flux-krea, flux-pro 1.1
- **Nós de Vídeo até o momento :** wan-2.2 (image-to-video)
- **API:** Replicate
- **Ambiente:** `pnpm dev`

## Regras de Filtragem

### Nós de Imagem

#### Cenário: Nenhum nó conectado (primeiro da cadeia)
**Modelos disponíveis:** flux-dev, flux-krea, flux-pro 1.1

#### Cenário: Nó de texto conectado (primitivo ou transform)
**Modelos disponíveis:** flux-dev, flux-krea, flux-pro 1.1

#### Cenário: Nó de imagem conectado (primitivo ou transform)
**Modelos disponíveis:** flux-dev, flux-krea, flux-pro 1.1

### Nós de Vídeo

#### Cenário: Nenhum nó conectado (primeiro da cadeia)
**Modelos disponíveis:** *Nenhum*
- Não possuímos modelos text-to-video ainda mas vamos cadastrar em breve, já deixar a lógica pronta

#### Cenário: Nó de texto conectado (primitivo ou transform)  
**Modelos disponíveis:** *Nenhum*
- Não possuímos modelos text-to-video ainda mas vamos cadastrar em breve, já deixar a lógica pronta

#### Cenário: Nó de imagem conectado (primitivo ou transform)
**Modelos disponíveis:** wan-2.2 i2v

#### Cenário: Nó de vídeo conectado (primitivo ou transform)
**Modelos disponíveis:** *Nenhum*
- Não possuímos modelos text-to-video ainda mas vamos cadastrar em breve, já deixar a lógica pronta

## Lógica de Detecção

### Tipos de Nós Anteriores
1. **Nenhuma conexão** - Nó é o primeiro da cadeia
2. **Texto primitivo** - Nó de entrada de texto básico sem ia
3. **Texto transform** - Nó que processa/transforma texto com ia
4. **Imagem primitiva** - Nó de entrada de imagem básico para upload  
5. **Imagem transform** - Nó que processa/transforma imagem com ia
6. **Vídeo primitivo** - Nó de entrada de vídeo básico para upload
7. **Vídeo transform** - Nó que processa/transforma vídeo


