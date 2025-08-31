#!/usr/bin/env node

/**
 * Script para limpeza automática do Supabase Storage
 * 
 * Remove arquivos com mais de 30 dias dos buckets configurados
 * 
 * Uso:
 * node scripts/cleanup-storage.js [--dry-run] [--days=30] [--bucket=nome]
 * 
 * Exemplos:
 * node scripts/cleanup-storage.js --dry-run
 * node scripts/cleanup-storage.js --days=7
 * node scripts/cleanup-storage.js --bucket=files
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

// Configuração
const DEFAULT_RETENTION_DAYS = 30;
const BUCKETS_TO_CLEAN = ['files', 'screenshots', 'avatars'];

// Cliente Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Cliente PostgreSQL para consultas diretas (usando configuração que funciona)
const pgClient = new Client({
  host: '[IP_DO_SEU_SERVIDOR]',
  port: 6543,
  database: 'postgres',
  user: 'postgres.your-tenant-id',
  password: 'Fu9qWO9KRBTHJJolCqXY',
  ssl: false,
  connectionTimeoutMillis: 10000,
  query_timeout: 10000,
  statement_timeout: 10000
});

/**
 * Função para calcular data de corte
 */
function getCutoffDate(days) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return cutoff;
}

/**
 * Função para formatar tamanho em bytes
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Função para listar arquivos antigos em um bucket usando PostgreSQL direto
 */
async function listOldFiles(bucketName, cutoffDate) {
  try {
    console.log(`🔍 Verificando bucket: ${bucketName}`);
    
    // Conectar ao PostgreSQL se não estiver conectado
    if (pgClient._connected === false) {
      await pgClient.connect();
    }
    
    // Consultar arquivos diretamente no PostgreSQL
    const query = `
      SELECT 
        name,
        metadata,
        created_at,
        updated_at
      FROM storage.objects 
      WHERE bucket_id = $1 
        AND created_at < $2
      ORDER BY created_at ASC
      LIMIT 1000
    `;
    
    const result = await pgClient.query(query, [bucketName, cutoffDate.toISOString()]);
    const files = result.rows;

    if (!files || files.length === 0) {
      console.log(`📁 Bucket ${bucketName} está vazio ou sem arquivos antigos`);
      return [];
    }

    console.log(`📊 ${bucketName}: ${files.length} arquivos para remoção`);
    
    return files.map(file => ({
      bucket: bucketName,
      name: file.name,
      size: file.metadata?.size || 0,
      created_at: file.created_at,
      path: file.name
    }));

  } catch (error) {
    console.error(`❌ Erro inesperado no bucket ${bucketName}:`, error.message);
    return [];
  }
}

/**
 * Função para remover arquivos de um bucket
 */
async function removeFiles(bucketName, filePaths, dryRun = false) {
  if (filePaths.length === 0) {
    return { success: 0, failed: 0, bytes: 0 };
  }

  let successCount = 0;
  let failedCount = 0;
  let totalBytes = 0;

  console.log(`🗑️  ${dryRun ? '[DRY RUN] ' : ''}Removendo ${filePaths.length} arquivos do bucket ${bucketName}`);

  // Processar em lotes de 50 arquivos
  const batchSize = 50;
  for (let i = 0; i < filePaths.length; i += batchSize) {
    const batch = filePaths.slice(i, i + batchSize);
    const paths = batch.map(file => file.path);

    if (dryRun) {
      console.log(`📋 [DRY RUN] Removeria ${paths.length} arquivos:`);
      paths.forEach(path => console.log(`   - ${path}`));
      successCount += paths.length;
      totalBytes += batch.reduce((sum, file) => sum + (file.size || 0), 0);
    } else {
      try {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .remove(paths);

        if (error) {
          console.error(`❌ Erro ao remover lote:`, error.message);
          failedCount += paths.length;
        } else {
          console.log(`✅ Removidos ${paths.length} arquivos com sucesso`);
          successCount += paths.length;
          totalBytes += batch.reduce((sum, file) => sum + (file.size || 0), 0);
        }
      } catch (error) {
        console.error(`❌ Erro inesperado ao remover lote:`, error.message);
        failedCount += paths.length;
      }
    }

    // Pequena pausa entre lotes para não sobrecarregar
    if (i + batchSize < filePaths.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return { success: successCount, failed: failedCount, bytes: totalBytes };
}

/**
 * Função para verificar estatísticas do storage
 */
async function getStorageStats() {
  try {
    // Conectar ao PostgreSQL se não estiver conectado
    if (pgClient._connected === false) {
      await pgClient.connect();
    }
    
    const stats = {};
    
    for (const bucket of BUCKETS_TO_CLEAN) {
      const query = `
        SELECT 
          COUNT(*) as file_count,
          COALESCE(SUM(CASE WHEN metadata->>'size' IS NOT NULL THEN CAST(metadata->>'size' AS BIGINT) ELSE 0 END), 0) as total_size
        FROM storage.objects 
        WHERE bucket_id = $1
      `;
      
      const result = await pgClient.query(query, [bucket]);
      stats[bucket] = {
        count: parseInt(result.rows[0].file_count) || 0,
        size: parseInt(result.rows[0].total_size) || 0
      };
    }
    
    return stats;
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error.message);
    return {};
  }
}

/**
 * Função principal de limpeza
 */
async function cleanupStorage(options = {}) {
  const {
    dryRun = false,
    retentionDays = DEFAULT_RETENTION_DAYS,
    specificBucket = null
  } = options;

  const cutoffDate = getCutoffDate(retentionDays);
  const bucketsToProcess = specificBucket ? [specificBucket] : BUCKETS_TO_CLEAN;

  console.log('🧹 LIMPEZA AUTOMÁTICA DO SUPABASE STORAGE');
  console.log('==========================================');
  console.log(`📅 Data de corte: ${cutoffDate.toISOString()}`);
  console.log(`⏰ Retenção: ${retentionDays} dias`);
  console.log(`🪣 Buckets: ${bucketsToProcess.join(', ')}`);
  console.log(`🔍 Modo: ${dryRun ? 'DRY RUN (simulação)' : 'EXECUÇÃO REAL'}`);
  console.log('');

  // Estatísticas antes da limpeza
  console.log('📊 ESTATÍSTICAS ANTES DA LIMPEZA:');
  const statsBefore = await getStorageStats();
  for (const [bucket, data] of Object.entries(statsBefore)) {
    console.log(`   ${bucket}: ${data.count} arquivos, ${formatBytes(data.size)}`);
  }
  console.log('');

  let totalFilesProcessed = 0;
  let totalFilesRemoved = 0;
  let totalBytesCleaned = 0;
  let totalErrors = 0;

  // Processar cada bucket
  for (const bucket of bucketsToProcess) {
    try {
      const oldFiles = await listOldFiles(bucket, cutoffDate);
      totalFilesProcessed += oldFiles.length;

      if (oldFiles.length > 0) {
        const result = await removeFiles(bucket, oldFiles, dryRun);
        totalFilesRemoved += result.success;
        totalBytesCleaned += result.bytes;
        totalErrors += result.failed;
      }
    } catch (error) {
      console.error(`❌ Erro ao processar bucket ${bucket}:`, error.message);
      totalErrors++;
    }
    
    console.log(''); // Linha em branco entre buckets
  }

  // Relatório final
  console.log('📋 RELATÓRIO FINAL:');
  console.log('===================');
  console.log(`📁 Arquivos encontrados: ${totalFilesProcessed}`);
  console.log(`🗑️  Arquivos ${dryRun ? 'que seriam removidos' : 'removidos'}: ${totalFilesRemoved}`);
  console.log(`💾 Espaço ${dryRun ? 'que seria liberado' : 'liberado'}: ${formatBytes(totalBytesCleaned)}`);
  console.log(`❌ Erros: ${totalErrors}`);
  
  if (dryRun) {
    console.log('');
    console.log('⚠️  Este foi um DRY RUN. Para executar a limpeza real, remova a flag --dry-run');
  }

  return {
    processed: totalFilesProcessed,
    removed: totalFilesRemoved,
    bytes: totalBytesCleaned,
    errors: totalErrors
  };
}

/**
 * Função para mostrar ajuda
 */
function showHelp() {
  console.log('🧹 SCRIPT DE LIMPEZA AUTOMÁTICA DO STORAGE');
  console.log('==========================================');
  console.log('');
  console.log('Uso:');
  console.log('  node scripts/cleanup-storage.js [opções]');
  console.log('');
  console.log('Opções:');
  console.log('  --dry-run              Simula a limpeza sem remover arquivos');
  console.log('  --days=N               Define retenção em dias (padrão: 30)');
  console.log('  --bucket=nome          Limpa apenas o bucket especificado');
  console.log('  --help, -h             Mostra esta ajuda');
  console.log('  --stats                Mostra apenas estatísticas');
  console.log('');
  console.log('Exemplos:');
  console.log('  node scripts/cleanup-storage.js --dry-run');
  console.log('  node scripts/cleanup-storage.js --days=7');
  console.log('  node scripts/cleanup-storage.js --bucket=files --dry-run');
  console.log('  node scripts/cleanup-storage.js --stats');
  console.log('');
  console.log('Buckets configurados:', BUCKETS_TO_CLEAN.join(', '));
  console.log('');
}

/**
 * Função para mostrar apenas estatísticas
 */
async function showStats() {
  console.log('📊 ESTATÍSTICAS DO STORAGE');
  console.log('==========================');
  
  try {
    console.log('🔄 Conectando ao PostgreSQL...');
    await pgClient.connect();
    console.log('✅ Conectado ao PostgreSQL');
    
    const stats = await getStorageStats();
    let totalFiles = 0;
    let totalSize = 0;
    
    for (const [bucket, data] of Object.entries(stats)) {
      console.log(`📁 ${bucket}:`);
      console.log(`   Arquivos: ${data.count}`);
      console.log(`   Tamanho: ${formatBytes(data.size)}`);
      console.log('');
      
      totalFiles += data.count;
      totalSize += data.size;
    }
    
    console.log('📋 TOTAL:');
    console.log(`   Arquivos: ${totalFiles}`);
    console.log(`   Tamanho: ${formatBytes(totalSize)}`);
    
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error.message);
  } finally {
    try {
      await pgClient.end();
      console.log('\n🔌 Conexão PostgreSQL fechada');
    } catch (closeError) {
      console.log('⚠️ Aviso: Erro ao fechar conexão PostgreSQL');
    }
  }
}

/**
 * Função principal
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Parse de argumentos
  const options = {
    dryRun: args.includes('--dry-run'),
    retentionDays: DEFAULT_RETENTION_DAYS,
    specificBucket: null,
    showHelp: args.includes('--help') || args.includes('-h'),
    showStats: args.includes('--stats')
  };
  
  // Parse days
  const daysArg = args.find(arg => arg.startsWith('--days='));
  if (daysArg) {
    const days = parseInt(daysArg.split('=')[1]);
    if (isNaN(days) || days < 1) {
      console.error('❌ Valor inválido para --days. Use um número positivo.');
      process.exit(1);
    }
    options.retentionDays = days;
  }
  
  // Parse bucket
  const bucketArg = args.find(arg => arg.startsWith('--bucket='));
  if (bucketArg) {
    const bucket = bucketArg.split('=')[1];
    if (!BUCKETS_TO_CLEAN.includes(bucket)) {
      console.error(`❌ Bucket inválido: ${bucket}`);
      console.error(`   Buckets disponíveis: ${BUCKETS_TO_CLEAN.join(', ')}`);
      process.exit(1);
    }
    options.specificBucket = bucket;
  }
  
  // Mostrar ajuda
  if (options.showHelp) {
    showHelp();
    return;
  }
  
  // Mostrar estatísticas
  if (options.showStats) {
    await showStats();
    return;
  }
  
  try {
    const result = await cleanupStorage(options);
    
    if (result.errors > 0) {
      console.log('');
      console.log('⚠️  Limpeza concluída com alguns erros.');
      process.exit(1);
    } else {
      console.log('');
      console.log('✅ Limpeza concluída com sucesso!');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Erro fatal durante a limpeza:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { cleanupStorage, listOldFiles, removeFiles, getStorageStats };