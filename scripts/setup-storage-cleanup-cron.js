#!/usr/bin/env node

/**
 * Script para configurar cron job automático de limpeza do storage
 * 
 * Uso:
 * node scripts/setup-storage-cleanup-cron.js [--schedule="0 2 * * *"] [--days=30]
 * 
 * Exemplos:
 * node scripts/setup-storage-cleanup-cron.js
 * node scripts/setup-storage-cleanup-cron.js --schedule="0 3 * * 0" --days=7
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configurações padrão
const DEFAULT_SCHEDULE = '0 2 * * *'; // Todo dia às 2h da manhã
const DEFAULT_RETENTION_DAYS = 30;

/**
 * Função para detectar o sistema operacional
 */
function getOperatingSystem() {
  const platform = process.platform;
  
  if (platform === 'win32') {
    return 'windows';
  } else if (platform === 'linux') {
    return 'linux';
  } else if (platform === 'darwin') {
    return 'macos';
  } else {
    return 'unknown';
  }
}

/**
 * Função para validar expressão cron
 */
function isValidCronExpression(expression) {
  const cronRegex = /^(\*|([0-5]?\d)) (\*|([01]?\d|2[0-3])) (\*|([01]?\d|[12]\d|3[01])) (\*|([01]?\d)) (\*|([0-6]))$/;
  return cronRegex.test(expression);
}

/**
 * Função para criar script de limpeza para Linux/macOS
 */
function createUnixCleanupScript(projectPath, retentionDays) {
  const scriptPath = path.join(projectPath, 'scripts', 'storage-cleanup-cron.sh');
  
  const scriptContent = `#!/bin/bash

# Script automático de limpeza do Supabase Storage
# Gerado automaticamente em ${new Date().toISOString()}

# Definir diretório do projeto
PROJECT_DIR="${projectPath}"

# Navegar para o diretório do projeto
cd "$PROJECT_DIR" || exit 1

# Carregar variáveis de ambiente
if [ -f ".env.local" ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Executar limpeza
echo "[$(date)] Iniciando limpeza automática do storage..."
node scripts/cleanup-storage.js --days=${retentionDays}

# Log do resultado
if [ $? -eq 0 ]; then
    echo "[$(date)] Limpeza concluída com sucesso"
else
    echo "[$(date)] Erro durante a limpeza"
fi
`;

  fs.writeFileSync(scriptPath, scriptContent, { mode: 0o755 });
  return scriptPath;
}

/**
 * Função para criar script de limpeza para Windows
 */
function createWindowsCleanupScript(projectPath, retentionDays) {
  const scriptPath = path.join(projectPath, 'scripts', 'storage-cleanup-cron.bat');
  
  const scriptContent = `@echo off
REM Script automático de limpeza do Supabase Storage
REM Gerado automaticamente em ${new Date().toISOString()}

REM Definir diretório do projeto
set PROJECT_DIR=${projectPath}

REM Navegar para o diretório do projeto
cd /d "%PROJECT_DIR%" || exit /b 1

REM Executar limpeza
echo [%date% %time%] Iniciando limpeza automática do storage...
wsl node scripts/cleanup-storage.js --days=${retentionDays}

REM Log do resultado
if %errorlevel% equ 0 (
    echo [%date% %time%] Limpeza concluída com sucesso
) else (
    echo [%date% %time%] Erro durante a limpeza
)
`;

  fs.writeFileSync(scriptPath, scriptContent);
  return scriptPath;
}

/**
 * Função para configurar cron job no Linux/macOS
 */
function setupUnixCron(schedule, scriptPath) {
  try {
    // Verificar se crontab existe
    let currentCrontab = '';
    try {
      currentCrontab = execSync('crontab -l 2>/dev/null', { encoding: 'utf8' });
    } catch (error) {
      // Crontab vazio, isso é normal
    }

    // Remover entradas antigas do storage cleanup
    const lines = currentCrontab.split('\n').filter(line => 
      !line.includes('storage-cleanup-cron.sh') && line.trim() !== ''
    );

    // Adicionar nova entrada
    const cronEntry = `${schedule} ${scriptPath} >> /tmp/storage-cleanup.log 2>&1`;
    lines.push(cronEntry);

    // Aplicar novo crontab
    const newCrontab = lines.join('\n') + '\n';
    execSync(`echo '${newCrontab}' | crontab -`);

    return true;
  } catch (error) {
    console.error('❌ Erro ao configurar crontab:', error.message);
    return false;
  }
}

/**
 * Função para configurar tarefa agendada no Windows
 */
function setupWindowsTask(schedule, scriptPath, retentionDays) {
  try {
    // Converter cron para formato do Windows Task Scheduler
    const [minute, hour, day, month, dayOfWeek] = schedule.split(' ');
    
    let scheduleType = 'DAILY';
    let scheduleModifier = '1';
    let startTime = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    
    if (dayOfWeek !== '*') {
      scheduleType = 'WEEKLY';
      // Converter dia da semana (0=domingo no cron, 1=segunda no Windows)
      const windowsDayOfWeek = dayOfWeek === '0' ? 'SUN' : 
                               dayOfWeek === '1' ? 'MON' :
                               dayOfWeek === '2' ? 'TUE' :
                               dayOfWeek === '3' ? 'WED' :
                               dayOfWeek === '4' ? 'THU' :
                               dayOfWeek === '5' ? 'FRI' : 'SAT';
      scheduleModifier = windowsDayOfWeek;
    }

    // Remover tarefa existente se houver
    try {
      execSync('schtasks /delete /tn "Supabase Storage Cleanup" /f', { stdio: 'ignore' });
    } catch (error) {
      // Tarefa não existe, isso é normal
    }

    // Criar nova tarefa
    const command = `schtasks /create /tn "Supabase Storage Cleanup" /tr "${scriptPath}" /sc ${scheduleType} /st ${startTime} /mo ${scheduleModifier} /f`;
    execSync(command);

    return true;
  } catch (error) {
    console.error('❌ Erro ao configurar tarefa do Windows:', error.message);
    return false;
  }
}

/**
 * Função para mostrar instruções de configuração manual
 */
function showManualInstructions(os, schedule, scriptPath, retentionDays) {
  console.log('📋 INSTRUÇÕES PARA CONFIGURAÇÃO MANUAL:');
  console.log('======================================');
  console.log('');
  
  if (os === 'linux' || os === 'macos') {
    console.log('🐧 Linux/macOS - Configuração do Crontab:');
    console.log('');
    console.log('1. Abra o crontab para edição:');
    console.log('   crontab -e');
    console.log('');
    console.log('2. Adicione a seguinte linha:');
    console.log(`   ${schedule} ${scriptPath} >> /tmp/storage-cleanup.log 2>&1`);
    console.log('');
    console.log('3. Salve e feche o editor');
    console.log('');
    console.log('4. Verifique se foi adicionado:');
    console.log('   crontab -l');
    console.log('');
    console.log('📅 Explicação do agendamento:');
    const [minute, hour, day, month, dayOfWeek] = schedule.split(' ');
    console.log(`   Minuto: ${minute} | Hora: ${hour} | Dia: ${day} | Mês: ${month} | Dia da semana: ${dayOfWeek}`);
    
  } else if (os === 'windows') {
    console.log('🪟 Windows - Configuração do Agendador de Tarefas:');
    console.log('');
    console.log('1. Abra o "Agendador de Tarefas" (Task Scheduler)');
    console.log('2. Clique em "Criar Tarefa Básica"');
    console.log('3. Configure:');
    console.log('   - Nome: "Supabase Storage Cleanup"');
    console.log('   - Descrição: "Limpeza automática do storage"');
    console.log(`   - Agendamento: Conforme expressão cron ${schedule}`);
    console.log(`   - Ação: Executar "${scriptPath}"`);
    console.log('');
    console.log('Ou use o comando PowerShell (como administrador):');
    const [minute, hour] = schedule.split(' ');
    const startTime = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    console.log(`   schtasks /create /tn "Supabase Storage Cleanup" /tr "${scriptPath}" /sc DAILY /st ${startTime} /f`);
  }
  
  console.log('');
  console.log('📝 Logs:');
  if (os === 'windows') {
    console.log('   Os logs serão exibidos na execução do script');
  } else {
    console.log('   Logs salvos em: /tmp/storage-cleanup.log');
    console.log('   Para visualizar: tail -f /tmp/storage-cleanup.log');
  }
}

/**
 * Função para testar a configuração
 */
function testConfiguration(scriptPath) {
  console.log('🧪 TESTANDO CONFIGURAÇÃO:');
  console.log('=========================');
  
  try {
    console.log('📋 Executando limpeza em modo dry-run...');
    
    const command = process.platform === 'win32' 
      ? `"${scriptPath}" --dry-run`
      : `bash "${scriptPath}" --dry-run`;
    
    const result = execSync(command, { encoding: 'utf8', cwd: process.cwd() });
    console.log(result);
    
    console.log('✅ Teste concluído com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    return false;
  }
}

/**
 * Função principal
 */
function main() {
  const args = process.argv.slice(2);
  
  // Parse de argumentos
  let schedule = DEFAULT_SCHEDULE;
  let retentionDays = DEFAULT_RETENTION_DAYS;
  let showHelp = false;
  let testOnly = false;
  let manualOnly = false;
  
  args.forEach(arg => {
    if (arg.startsWith('--schedule=')) {
      schedule = arg.split('=')[1].replace(/"/g, '');
    } else if (arg.startsWith('--days=')) {
      retentionDays = parseInt(arg.split('=')[1]);
    } else if (arg === '--help' || arg === '-h') {
      showHelp = true;
    } else if (arg === '--test') {
      testOnly = true;
    } else if (arg === '--manual') {
      manualOnly = true;
    }
  });
  
  // Mostrar ajuda
  if (showHelp) {
    console.log('🕐 CONFIGURADOR DE LIMPEZA AUTOMÁTICA DO STORAGE');
    console.log('===============================================');
    console.log('');
    console.log('Uso:');
    console.log('  node scripts/setup-storage-cleanup-cron.js [opções]');
    console.log('');
    console.log('Opções:');
    console.log('  --schedule="cron"      Expressão cron (padrão: "0 2 * * *")');
    console.log('  --days=N               Retenção em dias (padrão: 30)');
    console.log('  --test                 Apenas testa a configuração');
    console.log('  --manual               Mostra apenas instruções manuais');
    console.log('  --help, -h             Mostra esta ajuda');
    console.log('');
    console.log('Exemplos de agendamento:');
    console.log('  "0 2 * * *"            Todo dia às 2h');
    console.log('  "0 3 * * 0"            Todo domingo às 3h');
    console.log('  "30 1 1 * *"           Todo dia 1 do mês às 1h30');
    console.log('  "0 */6 * * *"          A cada 6 horas');
    console.log('');
    return;
  }
  
  // Validações
  if (!isValidCronExpression(schedule)) {
    console.error('❌ Expressão cron inválida:', schedule);
    console.error('   Formato: "minuto hora dia mês dia_da_semana"');
    console.error('   Exemplo: "0 2 * * *" (todo dia às 2h)');
    process.exit(1);
  }
  
  if (isNaN(retentionDays) || retentionDays < 1) {
    console.error('❌ Valor inválido para retenção de dias:', retentionDays);
    process.exit(1);
  }
  
  const projectPath = process.cwd();
  const os = getOperatingSystem();
  
  console.log('🕐 CONFIGURAÇÃO DE LIMPEZA AUTOMÁTICA');
  console.log('====================================');
  console.log(`🖥️  Sistema: ${os}`);
  console.log(`📅 Agendamento: ${schedule}`);
  console.log(`⏰ Retenção: ${retentionDays} dias`);
  console.log(`📁 Projeto: ${projectPath}`);
  console.log('');
  
  // Criar script apropriado
  let scriptPath;
  if (os === 'windows') {
    scriptPath = createWindowsCleanupScript(projectPath, retentionDays);
    console.log(`✅ Script criado: ${scriptPath}`);
  } else {
    scriptPath = createUnixCleanupScript(projectPath, retentionDays);
    console.log(`✅ Script criado: ${scriptPath}`);
  }
  
  // Teste apenas
  if (testOnly) {
    testConfiguration(scriptPath);
    return;
  }
  
  // Instruções manuais apenas
  if (manualOnly) {
    showManualInstructions(os, schedule, scriptPath, retentionDays);
    return;
  }
  
  // Tentar configuração automática
  console.log('⚙️  Configurando agendamento automático...');
  
  let success = false;
  if (os === 'windows') {
    success = setupWindowsTask(schedule, scriptPath, retentionDays);
  } else if (os === 'linux' || os === 'macos') {
    success = setupUnixCron(schedule, scriptPath);
  }
  
  if (success) {
    console.log('✅ Agendamento configurado com sucesso!');
    console.log('');
    console.log('🧪 Testando configuração...');
    testConfiguration(scriptPath);
  } else {
    console.log('⚠️  Configuração automática falhou. Veja as instruções manuais:');
    console.log('');
    showManualInstructions(os, schedule, scriptPath, retentionDays);
  }
  
  console.log('');
  console.log('📋 PRÓXIMOS PASSOS:');
  console.log('===================');
  console.log('1. ✅ Script de limpeza criado');
  console.log('2. ✅ Agendamento configurado');
  console.log('3. 🔍 Monitore os logs para verificar execução');
  console.log('4. 🧪 Execute teste manual: node scripts/cleanup-storage.js --dry-run');
  console.log('');
  console.log('⚠️  IMPORTANTE:');
  console.log('- Verifique se as variáveis de ambiente estão configuradas');
  console.log('- Teste a limpeza manualmente antes de confiar na automação');
  console.log('- Monitore os logs regularmente');
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { 
  createUnixCleanupScript, 
  createWindowsCleanupScript, 
  setupUnixCron, 
  setupWindowsTask,
  isValidCronExpression
};