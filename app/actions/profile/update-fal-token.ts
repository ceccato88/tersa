'use server';

import { database } from '@/lib/database';
import { profile } from '@/schema';
import { eq } from 'drizzle-orm';
import { currentUser } from '@/lib/auth';
import { encryptToken, decryptToken } from '@/lib/crypto';
import { revalidatePath } from 'next/cache';

export async function updateFalTokenAction(token: string) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    // Validar formato do token FAL (UUID:chave)
    const falTokenRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}:[a-f0-9]{32}$/i;
    if (!falTokenRegex.test(token)) {
      return { error: 'Token FAL inválido. Formato esperado: UUID:chave (ex: 12345678-1234-1234-1234-123456789abc:abcdef123456...)' };
    }

    // Criptografar o token antes de salvar
    const encryptedToken = encryptToken(token);

    // Atualizar/inserir no banco
    await database
      .insert(profile)
      .values({ 
        id: user.id,
        falToken: encryptedToken 
      })
      .onConflictDoUpdate({
        target: profile.id,
        set: { falToken: encryptedToken }
      });

    revalidatePath('/profile');
    return { success: true };
  } catch (error) {
    console.error('Erro ao salvar token FAL:', error);
    return { error: 'Falha ao salvar token' };
  }
}

export async function getFalTokenAction() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    const userProfile = await database
      .select()
      .from(profile)
      .where(eq(profile.id, user.id))
      .limit(1);

    if (!userProfile.length || !userProfile[0].falToken) {
      return { token: null };
    }

    // Descriptografar o token
    const decryptedToken = decryptToken(userProfile[0].falToken);
    
    // Retornar apenas parte do token para exibição (mascarado)
    // Formato: 12345678-1234-... (mostra até o primeiro hífen + 4 dígitos)
    const maskedToken = decryptedToken.substring(0, 13) + '...';
    
    return { token: maskedToken, hasToken: true };
  } catch (error) {
    console.error('Erro ao buscar token FAL:', error);
    return { error: 'Falha ao buscar token' };
  }
}

// Função para obter o token real (para uso interno das APIs)
export async function getUserFalToken(userId: string): Promise<string | null> {
  try {
    const userProfile = await database
      .select()
      .from(profile)
      .where(eq(profile.id, userId))
      .limit(1);

    if (!userProfile.length || !userProfile[0].falToken) {
      return null;
    }

    return decryptToken(userProfile[0].falToken);
  } catch (error) {
    console.error('Erro ao obter token FAL do usuário:', error);
    return null;
  }
}

export async function deleteFalTokenAction() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    await database
      .update(profile)
      .set({ falToken: null })
      .where(eq(profile.id, user.id));

    revalidatePath('/profile');
    return { success: true };
  } catch (error) {
    console.error('Erro ao remover token FAL:', error);
    return { error: 'Falha ao remover token' };
  }
}