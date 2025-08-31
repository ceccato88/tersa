#!/usr/bin/env node

/**
 * Script para atualizar o IP da VPS no next.config.ts
 * 
 * Uso:
 * node scripts/update-vps-ip.js <novo-ip>
 * 
 * Exemplo:
 * node scripts/update-vps-ip.js 192.168.1.100
 */

const fs = require('fs');
const path = require('path');

// Função para atualizar o IP no next.config.ts
function updateVpsIp(newIp) {
  const configPath = path.join(process.cwd(), 'next.config.ts');
  const backupPath = path.join(process.cwd(), 'next.config.ts.backup');
  
  try {
    // Ler o arquivo atual
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Criar backup se não existir
    if (!fs.existsSync(backupPath)) {
      fs.writeFileSync(backupPath, configContent);
      console.log('✅ Backup criado: next.config.ts.backup');
    }
    
    // Regex para encontrar e substituir o IP da VPS
    const vpsIpRegex = /(hostname: ')[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}(',)/;
    
    // Verificar se o padrão foi encontrado
    if (!vpsIpRegex.test(configContent)) {
      console.log('❌ Padrão de IP da VPS não encontrado no next.config.ts');
      console.log('   Procurando por: hostname: \'xxx.xxx.xxx.xxx\',');
      return false;
    }
    
    // Substituir o IP
    const updatedContent = configContent.replace(vpsIpRegex, `$1${newIp}$2`);
    
    // Escrever o arquivo atualizado
    fs.writeFileSync(configPath, updatedContent);
    
    console.log('🎯 ATUALIZAÇÃO DO IP DA VPS');
    console.log('============================');
    console.log(`✅ IP atualizado para: ${newIp}`);
    console.log('📁 Arquivo: next.config.ts');
    console.log('💾 Backup mantido: next.config.ts.backup');
    console.log('');
    console.log('⚠️  IMPORTANTE: Reinicie o servidor de desenvolvimento:');
    console.log('   wsl pnpm dev');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao atualizar o IP:', error.message);
    return false;
  }
}

// Função para validar IP
function isValidIp(ip) {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
}

// Função para mostrar ajuda
function showHelp() {
  console.log('🔧 SCRIPT DE ATUALIZAÇÃO DO IP DA VPS');
  console.log('=====================================');
  console.log('');
  console.log('Uso:');
  console.log('  node scripts/update-vps-ip.js <novo-ip>');
  console.log('');
  console.log('Exemplos:');
  console.log('  node scripts/update-vps-ip.js 192.168.1.100');
  console.log('  node scripts/update-vps-ip.js [IP_DO_SEU_SERVIDOR]');
  console.log('');
  console.log('Opções:');
  console.log('  --help, -h    Mostra esta ajuda');
  console.log('  --check, -c   Verifica o IP atual sem alterar');
  console.log('');
}

// Função para verificar IP atual
function checkCurrentIp() {
  const configPath = path.join(process.cwd(), 'next.config.ts');
  
  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    const vpsIpRegex = /hostname: '([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})',/;
    const match = configContent.match(vpsIpRegex);
    
    if (match) {
      console.log('🔍 IP ATUAL DA VPS');
      console.log('==================');
      console.log(`📍 IP configurado: ${match[1]}`);
      console.log('📁 Arquivo: next.config.ts');
    } else {
      console.log('❌ IP da VPS não encontrado no next.config.ts');
    }
  } catch (error) {
    console.error('❌ Erro ao ler o arquivo:', error.message);
  }
}

// Função principal
function main() {
  const args = process.argv.slice(2);
  
  // Verificar argumentos
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }
  
  // Verificar IP atual
  if (args.includes('--check') || args.includes('-c')) {
    checkCurrentIp();
    return;
  }
  
  const newIp = args[0];
  
  // Validar IP
  if (!isValidIp(newIp)) {
    console.error('❌ IP inválido:', newIp);
    console.error('   Formato esperado: xxx.xxx.xxx.xxx');
    process.exit(1);
  }
  
  // Atualizar IP
  const success = updateVpsIp(newIp);
  
  if (success) {
    console.log('🎉 Atualização concluída com sucesso!');
    process.exit(0);
  } else {
    console.error('❌ Falha na atualização');
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { updateVpsIp, isValidIp, checkCurrentIp };