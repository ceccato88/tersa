import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { logger } from '@/lib/logger';
import { handleError } from '@/lib/error/handle';
import { env } from '@/lib/env';

// Configurar a chave da API FAL
fal.config({
  credentials: env.FAL_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, input, nodeId } = body;

    logger.info('🚀 Iniciando stream FAL', {
      model,
      nodeId,
      prompt: input?.prompt?.substring(0, 100),
    });

    // Verificar se a chave da API está configurada
    if (!env.FAL_KEY) {
      return NextResponse.json(
        { error: 'FAL_KEY não está configurada' },
        { status: 500 }
      );
    }

    // Criar um stream de resposta
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Submeter a requisição para a fila do FAL
          const { request_id } = await fal.queue.submit(model, {
            input,
          });

          logger.info('📝 Requisição submetida para FAL', {
            requestId: request_id,
            model,
            nodeId,
          });

          // Enviar o ID da requisição
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'request_id',
                request_id,
                nodeId,
              })}\n\n`
            )
          );

          // Polling para verificar o status
          let isCompleted = false;
          let attempts = 0;
          const maxAttempts = 300; // 5 minutos com polling a cada segundo

          while (!isCompleted && attempts < maxAttempts) {
            try {
              const status = await fal.queue.status(model, {
                requestId: request_id,
                logs: true,
              });

              // Enviar logs se disponíveis
              if (status.logs && status.logs.length > 0) {
                for (const log of status.logs) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: 'log',
                        message: log.message,
                        level: log.level || 'info',
                        timestamp: log.timestamp,
                        nodeId,
                      })}\n\n`
                    )
                  );
                }
              }

              // Verificar se está completo
              if (status.status === 'COMPLETED') {
                const result = await fal.queue.result(model, {
                  requestId: request_id,
                });

                logger.info('✅ FAL stream concluído', {
                  requestId: request_id,
                  nodeId,
                  hasOutput: !!result.data,
                });

                // Enviar resultado final
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: 'completed',
                      data: result.data,
                      requestId: request_id,
                      nodeId,
                    })}\n\n`
                  )
                );

                isCompleted = true;
              } else if (status.status === 'FAILED') {
                logger.error('❌ FAL stream falhou', {
                  requestId: request_id,
                  nodeId,
                  error: status.error,
                });

                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: 'error',
                      error: status.error || 'Falha na geração',
                      requestId: request_id,
                      nodeId,
                    })}\n\n`
                  )
                );

                isCompleted = true;
              } else {
                // Ainda em progresso
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: 'progress',
                      status: status.status,
                      requestId: request_id,
                      nodeId,
                    })}\n\n`
                  )
                );
              }
            } catch (statusError) {
              logger.error('❌ Erro ao verificar status FAL', {
                error: statusError instanceof Error ? statusError.message : 'Erro desconhecido',
                requestId: request_id,
                nodeId,
                attempt: attempts,
              });

              // Continuar tentando por alguns erros temporários
              if (attempts < maxAttempts - 10) {
                await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar mais tempo em caso de erro
              }
            }

            attempts++;
            
            if (!isCompleted && attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // Polling a cada segundo
            }
          }

          if (!isCompleted) {
            logger.error('⏰ Timeout no FAL stream', {
              requestId: request_id,
              nodeId,
              attempts,
            });

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'error',
                  error: 'Timeout: A geração demorou mais que o esperado',
                  requestId: request_id,
                  nodeId,
                })}\n\n`
              )
            );
          }

        } catch (error) {
          logger.error('❌ Erro no FAL stream', {
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            nodeId,
          });

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                error: error instanceof Error ? error.message : 'Erro interno do servidor',
                nodeId,
              })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    logger.error('❌ Erro na rota FAL stream', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });

    handleError(error, {
      context: 'fal-stream-route',
    });

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'FAL Stream API - Use POST para submeter requisições' },
    { status: 200 }
  );
}