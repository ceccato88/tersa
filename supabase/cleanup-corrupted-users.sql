-- Script para limpeza segura de usuários corrompidos
-- Execute no Supabase SQL Editor

-- 1. Listar usuários com problemas (sem instance_id ou aud)
SELECT 
  id,
  email,
  instance_id,
  aud,
  confirmed_at,
  created_at
FROM auth.users 
WHERE instance_id IS NULL OR aud IS NULL;

-- 2. Função para deletar usuário corrompido de forma segura
CREATE OR REPLACE FUNCTION cleanup_corrupted_user(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  target_user_id UUID;
  deleted_count INTEGER;
  result_message TEXT;
BEGIN
  -- Buscar o ID do usuário pelo email de forma mais robusta
  SELECT id INTO target_user_id
  FROM auth.users 
  WHERE CAST(email AS TEXT) = user_email
  LIMIT 1;
  
  IF target_user_id IS NULL THEN
    RETURN 'Usuário não encontrado: ' || user_email;
  END IF;
  
  -- Deletar do profile primeiro (convertendo UUID para TEXT)
  DELETE FROM public.profile WHERE id = target_user_id::text;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Deletar do auth.users
  DELETE FROM auth.users WHERE id = target_user_id;
  
  result_message := 'Usuário deletado com sucesso: ' || user_email || ' (ID: ' || target_user_id || ')';
  
  RETURN result_message;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Erro ao deletar usuário ' || user_email || ': ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- 3. Exemplo de uso da função de limpeza
-- SELECT cleanup_corrupted_user('ceccato.contato@gmail.com');

-- 4. Script alternativo para deletar usuário específico por ID
/*
DO $$
DECLARE
  target_user_id UUID := 'c2560abd-db3d-4c63-b9b1-2ff985655a7c'; -- Substitua pelo ID do usuário
BEGIN
  -- Deletar do profile primeiro
  DELETE FROM public.profile WHERE id = target_user_id;
  
  -- Deletar do auth.users
  DELETE FROM auth.users WHERE id = target_user_id;
  
  RAISE NOTICE 'Usuário % deletado com sucesso', target_user_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao deletar usuário %: %', target_user_id, SQLERRM;
END;
$$;
*/

-- 5. Verificar se a limpeza foi bem-sucedida
-- SELECT COUNT(*) as usuarios_corrompidos 
-- FROM auth.users 
-- WHERE instance_id IS NULL OR aud IS NULL;

-- 6. Listar todos os usuários restantes
-- SELECT id, email, instance_id, aud, confirmed_at 
-- FROM auth.users 
-- ORDER BY created_at DESC;