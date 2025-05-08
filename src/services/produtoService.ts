import { supabase } from '@/integrations/supabase/client';
import { Produto, ProdutoFormData, ProdutoStatus } from '@/lib/types/produto';
import { handleSupabaseError } from '@/lib/utils/supabase-error-handler';

// Substituir por tipos internos para o Supabase
// Definição simplificada dos tipos necessários
type ProdutoInsert = {
  user_id: string;
  nome: string;
  descricao?: string | null;
  categoria_id?: string | null;
  sku?: string | null;
  preco_custo?: number | null;
  preco_venda: number;
  quantidade: number;
  status: ProdutoStatus;
  atributos?: string | null;
  imagem_url?: string | null;
};

type ProdutoUpdate = Partial<ProdutoInsert>;

const BUCKET_NAME = 'imagens-produtos';

/**
 * Faz upload de um arquivo de imagem para o Supabase Storage.
 * @param userId ID do usuário (para criar a pasta)
 * @param file Arquivo de imagem a ser enviado.
 * @returns A URL pública da imagem no bucket.
 * @throws Erro se o upload falhar.
 */
export const uploadImagemProduto = async (userId: string, file: File): Promise<string> => {
  // Cria um nome de arquivo sanitizado e único para evitar colisões
  // Remove caracteres inválidos e substitui espaços por underscores
  const sanitizedFileName = file.name
    .normalize('NFD') // Separa acentos dos caracteres base
    .replace(/[^\w.\-\s]/g, '') // Remove caracteres não-alfanuméricos, exceto ., -, _ e espaços
    .replace(/\s+/g, '_'); // Substitui espaços por underscores
  const fileName = `${Date.now()}_${sanitizedFileName}`;
  // Define o caminho no bucket: /user_id/fileName
  const filePath = `${userId}/${fileName}`;

  // Faz o upload para o bucket 'imagens-produtos'
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file);

  // Trata erro no upload
  if (uploadError) {
    throw new Error(handleSupabaseError(uploadError, 'Falha ao enviar imagem'));
  }

  // Obtém a URL pública da imagem recém-enviada
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

  // Verifica se a URL foi obtida com sucesso
  if (!data?.publicUrl) {
    // Tenta remover o arquivo órfão se a URL não foi gerada
    await supabase.storage.from(BUCKET_NAME).remove([filePath]);
    throw new Error('Não foi possível obter a URL pública da imagem após o upload.');
  }

  // Retorna a URL pública
  return data.publicUrl;
};

/**
 * Remove uma imagem do Supabase Storage com base na sua URL pública.
 * @param imageUrl URL pública da imagem a ser removida.
 * @throws Erro se a remoção falhar.
 */
export const deleteImagemProduto = async (imageUrl: string): Promise<void> => {
  // Extrai o caminho do arquivo da URL pública completa
  // Ex: https://<project_ref>.supabase.co/storage/v1/object/public/imagens-produtos/user_id/file_name.jpg -> user_id/file_name.jpg
  try {
    const url = new URL(imageUrl);
    // O caminho estará após /public/bucket_name/
    const pathSegments = url.pathname.split('/');
    const bucketIndex = pathSegments.indexOf(BUCKET_NAME);
    if (bucketIndex === -1 || bucketIndex + 1 >= pathSegments.length) {
      console.error('Formato de URL inválido ou nome do bucket não encontrado:', imageUrl);
      throw new Error('Formato de URL da imagem inválido.');
    }
    const filePath = pathSegments.slice(bucketIndex + 1).join('/');

    // Tenta remover o arquivo do bucket
    const { error: removeError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    // Trata erro na remoção
    if (removeError) {
      // Não lançar erro se o arquivo já não existir (código '404' ou similar em alguns casos)
      // A verificação exata do código de erro pode variar, tratamos genericamente por enquanto
      if (removeError.message.includes('Not Found') || removeError.message.includes('404')) {
         console.warn(`Imagem não encontrada para exclusão no Storage: ${filePath}`);
      } else {
         throw new Error(handleSupabaseError(removeError, 'Falha ao remover imagem antiga'));
      }
    }
  } catch (error) {
    // Captura erros na construção da URL ou outros inesperados
    console.error("Erro ao processar URL para exclusão da imagem:", error);
    // Decide se relança o erro ou apenas loga
    // throw new Error('Erro ao processar URL da imagem para exclusão.');
  }
};

/**
 * Busca a lista de produtos do usuário logado.
 * TODO: Adicionar opções de filtro, ordenação e paginação no futuro.
 * TODO: Fazer JOIN com categorias para obter o nome.
 * @returns Uma lista de produtos.
 * @throws Erro se a busca falhar.
 */
export const getProdutos = async (): Promise<Produto[]> => {
  // Busca os produtos na tabela 'produtos'
  const { data, error } = await supabase
    .from('produtos')
    .select(`
      *,
      categorias ( id, nome, tipo, cor )
    `)
    .order('created_at', { ascending: false }); // Ordena pelos mais recentes primeiro

  // Trata erro na busca
  if (error) {
    throw new Error(handleSupabaseError(error, 'Erro ao buscar produtos'));
  }

  // Retorna os dados ou um array vazio se não houver produtos
  return data || [];
};

/**
 * Busca um produto específico pelo seu ID.
 * @param id O ID do produto a ser buscado.
 * @returns O objeto do produto ou null se não encontrado.
 * @throws Erro se a busca falhar.
 */
export const getProdutoById = async (id: string): Promise<Produto | null> => {
  // Busca o produto pelo ID
  const { data, error } = await supabase
    .from('produtos')
    .select(`
      *,
      categorias ( id, nome, tipo, cor )
    `)
    .eq('id', id)
    .single(); // Espera um único resultado

  // Trata erro na busca (incluindo erro se não encontrar, tratado por single())
  if (error) {
    // Se o erro for por não encontrar (PGRST116), retorna null
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(handleSupabaseError(error, 'Erro ao buscar produto'));
  }

  // Retorna o produto encontrado
  return data;
};

/**
 * Cria um novo produto no banco de dados.
 * @param produtoData Dados do formulário do produto.
 * @returns O objeto do produto recém-criado.
 * @throws Erro se a criação falhar ou o upload da imagem falhar.
 */
export const createProduto = async (produtoData: ProdutoFormData): Promise<Produto> => {
  let imageUrl: string | null = null;

  // 1. Obter o ID do usuário logado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuário não autenticado.');
  }

  // 2. Fazer upload da imagem, se fornecida
  if (produtoData.imagem && produtoData.imagem.length > 0) {
    try {
      imageUrl = await uploadImagemProduto(user.id, produtoData.imagem[0]);
    } catch (uploadError) {
      // Se o upload falhar, interrompe a criação do produto
      throw uploadError; // Relança o erro do upload
    }
  }

  // 3. Preparar os dados para inserção no Supabase
  const produtoParaInserir: ProdutoInsert = {
    user_id: user.id,
    nome: produtoData.nome,
    descricao: produtoData.descricao,
    categoria_id: produtoData.categoria_id || null,
    sku: produtoData.sku,
    preco_custo: produtoData.preco_custo,
    preco_venda: produtoData.preco_venda,
    quantidade: produtoData.quantidade,
    status: produtoData.status,
    // Converte atributos para JSON se for objeto, caso contrário usa a string (já validada pelo Zod)
    atributos: typeof produtoData.atributos === 'object' && produtoData.atributos !== null
                 ? JSON.stringify(produtoData.atributos)
                 : (produtoData.atributos as string | null),
    imagem_url: imageUrl, // Adiciona a URL da imagem obtida no upload
  };

  // 4. Inserir o produto no banco de dados
  const { data: newProduto, error: insertError } = await supabase
    .from('produtos')
    .insert(produtoParaInserir)
    .select()
    .single(); // Retorna o objeto completo recém-criado

  // 5. Tratar erro na inserção
  if (insertError) {
    // Se a inserção falhar APÓS o upload da imagem, tenta remover a imagem órfã
    if (imageUrl) {
      try {
        await deleteImagemProduto(imageUrl);
      } catch (deleteError) {
        console.error("Falha ao remover imagem órfã após erro na criação do produto:", deleteError);
        // Não interrompe o fluxo principal por falha na limpeza
      }
    }
    throw new Error(handleSupabaseError(insertError, 'Erro ao criar produto'));
  }

  // Retorna o produto criado
  return newProduto;
};

/**
 * Atualiza um produto existente no banco de dados.
 * @param id ID do produto a ser atualizado.
 * @param produtoData Dados do formulário do produto.
 * @param imagemAntigaUrl URL da imagem atual (se existir), para possível exclusão.
 * @returns O objeto do produto atualizado.
 * @throws Erro se a atualização falhar ou o upload/exclusão da imagem falhar.
 */
export const updateProduto = async (
  id: string,
  produtoData: ProdutoFormData,
  imagemAntigaUrl?: string | null
): Promise<Produto> => {
  let novaImageUrl: string | undefined | null = undefined; // undefined significa não mexer, null significa remover

  // 1. Obter o ID do usuário logado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuário não autenticado.');
  }

  // 2. Verificar se uma nova imagem foi enviada
  const novaImagemEnviada = produtoData.imagem && produtoData.imagem.length > 0;

  if (novaImagemEnviada) {
    try {
      // Faz upload da nova imagem
      novaImageUrl = await uploadImagemProduto(user.id, produtoData.imagem![0]);
      // Se o upload deu certo e existia imagem antiga, remove a antiga
      if (imagemAntigaUrl) {
        // Não bloquear se a exclusão da antiga falhar
        deleteImagemProduto(imagemAntigaUrl).catch(err => {
             console.error("Falha não crítica ao remover imagem antiga durante atualização:", err)
        });
      }
    } catch (uploadError) {
      // Se o upload da nova imagem falhar, interrompe a atualização
      throw uploadError;
    }
  } else if (produtoData.imagem === null && imagemAntigaUrl) {
    // Caso onde o input file foi limpo (ou marcado para remover) e existia imagem antiga
    try {
        await deleteImagemProduto(imagemAntigaUrl);
        novaImageUrl = null; // Marca para atualizar o campo imagem_url para null no DB
    } catch (deleteError) {
        console.error("Falha ao remover imagem existente durante atualização:", deleteError);
        // Não interrompe a atualização se falhar em remover a imagem
    }
  }
  // Se novaImageUrl for undefined, o campo imagem_url não será alterado no DB

  // 3. Preparar os dados para atualização
  const produtoParaAtualizar: ProdutoUpdate = {
    // Não atualiza user_id nem created_at
    nome: produtoData.nome,
    descricao: produtoData.descricao,
    categoria_id: produtoData.categoria_id || null,
    sku: produtoData.sku,
    preco_custo: produtoData.preco_custo,
    preco_venda: produtoData.preco_venda,
    quantidade: produtoData.quantidade,
    status: produtoData.status,
    atributos: typeof produtoData.atributos === 'object' && produtoData.atributos !== null
                 ? JSON.stringify(produtoData.atributos)
                 : (produtoData.atributos as string | null), // Cast explícito para string | null
    // Atualiza imagem_url apenas se novaImageUrl não for undefined
    ...(novaImageUrl !== undefined && { imagem_url: novaImageUrl }),
  };

  // 4. Atualizar o produto no banco de dados
  const { data: updatedProduto, error: updateError } = await supabase
    .from('produtos')
    .update(produtoParaAtualizar)
    .eq('id', id)
    .select()
    .single();

  // 5. Tratar erro na atualização
  if (updateError) {
    // Se a atualização do DB falhar APÓS um NOVO upload, tenta remover a imagem recém-adicionada
    if (novaImagemEnviada && novaImageUrl) {
      deleteImagemProduto(novaImageUrl).catch(err => {
          console.error("Falha não crítica ao remover nova imagem após erro na atualização do produto:", err)
      });
    }
    throw new Error(handleSupabaseError(updateError, 'Erro ao atualizar produto'));
  }

  // Retorna o produto atualizado
  return updatedProduto;
};

/**
 * Realiza o "soft delete" de um produto, atualizando seu status para 'inativo'.
 * @param id ID do produto a ser inativado.
 * @param imagemUrl URL da imagem do produto (para possível exclusão do storage)
 * @throws Erro se a atualização falhar.
 */
export const deleteProduto = async (id: string, imagemUrl?: string | null): Promise<void> => {

  // Atualiza o status do produto para 'inativo'
  const { error: updateError } = await supabase
    .from('produtos')
    .update({ status: 'inativo' })
    .eq('id', id);

  // Trata erro na atualização
  if (updateError) {
    throw new Error(handleSupabaseError(updateError, 'Erro ao inativar produto'));
  }

  // Opcional: Remover a imagem do storage ao inativar?
  // Por enquanto, vamos manter a imagem mesmo inativando o produto,
  // caso o usuário queira reativá-lo depois.
  /*
  if (imagemUrl) {
      deleteImagemProduto(imagemUrl).catch(err => {
          console.error("Falha não crítica ao remover imagem ao inativar produto:", err)
      });
  }
  */
};

/**
 * Busca produtos disponíveis para venda (status 'disponivel').
 * Útil para o select no formulário de Vendas.
 * @returns Lista de produtos disponíveis (id, nome, preco_venda, quantidade).
 * @throws Erro se a busca falhar.
 */
export const getProdutosDisponiveisParaVenda = async (): Promise<(Pick<Produto, 'id' | 'nome' | 'preco_venda' | 'quantidade'> & { quantidade_disponivel: number })[]> => {
  const { data, error } = await supabase
    .from('produtos')
    .select('id, nome, preco_venda, quantidade, quantidade_reservada')
    .eq('status', 'disponivel')
    .gt('quantidade', 0) // Apenas produtos com quantidade > 0
    .order('nome', { ascending: true });

  if (error) {
    throw new Error(handleSupabaseError(error, 'Erro ao buscar produtos disponíveis'));
  }

  // Calcular a quantidade disponível e adicionar ao objeto retornado
  const produtosComDisponibilidade = (data || []).map(produto => {
    const quantidadeReservada = produto.quantidade_reservada || 0;
    const quantidadeDisponivel = produto.quantidade - quantidadeReservada;
    
    // Filtrar produtos que não têm disponibilidade real (devido a reservas)
    if (quantidadeDisponivel <= 0) {
      return null;
    }
    
    return {
      id: produto.id,
      nome: produto.nome,
      preco_venda: produto.preco_venda,
      quantidade: produto.quantidade,
      quantidade_disponivel: quantidadeDisponivel
    };
  }).filter(produto => produto !== null);

  return produtosComDisponibilidade;
};

/**
 * Atualiza a quantidade de um produto e ajusta seu status automaticamente.
 * @param produtoId - ID do produto a ser atualizado
 * @param novaQuantidade - Nova quantidade do produto
 * @param motivoAtualizacao - Motivo da alteração (para log)
 * @returns O produto atualizado
 * @throws Erro se a atualização falhar ou o produto não for encontrado
 */
export const atualizarQuantidadeProduto = async (
  produtoId: string, 
  novaQuantidade: number,
  motivoAtualizacao: string = 'Atualização manual'
): Promise<Produto> => {
  try {
    // 1. Buscar o produto atual para verificar estado
    const produtoAtual = await getProdutoById(produtoId);
    if (!produtoAtual) {
      throw new Error(`Produto com ID ${produtoId} não encontrado`);
    }

    // 2. Determinar o novo status com base na quantidade e status atual
    let novoStatus = produtoAtual.status as ProdutoStatus;
    
    // Regras de transição de estado baseadas na quantidade:
    if (novaQuantidade <= 0) {
      // Se não tiver mais estoque e não estiver reservado
      if (novoStatus !== 'reservado') {
        novoStatus = 'vendido';
      }
    } else if (novoStatus === 'vendido' || novoStatus === 'inativo') {
      // Se tiver estoque mas estava marcado como vendido ou inativo
      novoStatus = 'disponivel';
    }
    // Mantém o status 'reservado' se já estiver, mesmo se quantidade > 0

    console.log(`[atualizarQuantidadeProduto] Produto ${produtoId}: ${produtoAtual.nome} - Qtd: ${produtoAtual.quantidade} → ${novaQuantidade}, Status: ${produtoAtual.status} → ${novoStatus}. Motivo: ${motivoAtualizacao}`);

    // 3. Atualizar no banco
    const { data: produtoAtualizado, error } = await supabase
      .from('produtos')
      .update({
        quantidade: novaQuantidade,
        status: novoStatus
      })
      .eq('id', produtoId)
      .select()
      .single();

    if (error) {
      throw new Error(handleSupabaseError(error, 'Erro ao atualizar quantidade do produto'));
    }

    return produtoAtualizado;
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error(`[atualizarQuantidadeProduto] Falha ao atualizar produto ${produtoId}: ${mensagem}`);
    throw error;
  }
};

/**
 * Reserva uma quantidade específica de um produto.
 * @param produtoId - ID do produto a ser reservado
 * @param quantidade - Quantidade a ser reservada
 * @param cliente - Nome do cliente (para referência no log)
 * @param clienteContato - Contato do cliente (opcional)
 * @param observacoes - Observações adicionais sobre a reserva (opcional)
 * @returns O produto atualizado
 */
export const reservarProduto = async (
  produtoId: string,
  quantidade: number = 1,
  cliente: string = 'Cliente não especificado',
  clienteContato: string = '',
  observacoes: string = ''
): Promise<Produto> => {
  try {
    // 1. Verificar se o produto existe e está disponível
    const produto = await getProdutoById(produtoId);
    if (!produto) {
      throw new Error(`Produto com ID ${produtoId} não encontrado`);
    }
    
    if (produto.status !== 'disponivel') {
      throw new Error(`Produto "${produto.nome}" não está disponível para reserva (Status: ${produto.status})`);
    }
    
    // Verificamos agora a quantidade DISPONÍVEL, não a quantidade total
    const quantidadeDisponivel = produto.quantidade - (produto.quantidade_reservada || 0);
    if (quantidadeDisponivel < quantidade) {
      throw new Error(`Quantidade insuficiente para reserva do produto "${produto.nome}". Disponível: ${quantidadeDisponivel}, Solicitado: ${quantidade}`);
    }
    
    // Criar uma nota de reserva para armazenar no produto
    const dataHora = new Date().toLocaleString('pt-BR');
    let notaReserva = `RESERVA: ${quantidade} unid. para ${cliente}`;
    if (clienteContato) notaReserva += ` | Contato: ${clienteContato}`;
    if (observacoes) notaReserva += ` | Obs: ${observacoes}`;
    notaReserva += ` | Data: ${dataHora}`;
    
    // Adicionar a nota de reserva ao campo descrição (concatenar se já existir descrição)
    const descricaoAtualizada = produto.descricao 
      ? `${produto.descricao}\n\n${notaReserva}`
      : notaReserva;
    
    // 2. Calcular a quantidade_reservada (adicionar à existente, se houver)
    const quantidadeReservadaAtual = produto.quantidade_reservada || 0;
    const novaQuantidadeReservada = quantidadeReservadaAtual + quantidade;
    
    // 3. Determinar o status com base na quantidade total vs. reservada
    // Se toda a quantidade foi reservada, status = 'reservado'
    // Se ainda há itens disponíveis, status permanece 'disponivel'
    const novoStatus = (novaQuantidadeReservada >= produto.quantidade) ? 'reservado' : 'disponivel';
    
    // 4. Atualizar no banco de dados - apenas quantidade_reservada e status, não a quantidade total
    const { data: produtoAtualizado, error } = await supabase
      .from('produtos')
      .update({
        status: novoStatus,
        descricao: descricaoAtualizada,
        quantidade_reservada: novaQuantidadeReservada
      })
      .eq('id', produtoId)
      .select()
      .single();
      
    if (error) {
      throw new Error(handleSupabaseError(error, 'Erro ao reservar produto'));
    }
    
    console.log(`[reservarProduto] Produto ${produtoId} reservado para "${cliente}". Quantidade: ${quantidade}, Qtd. Disponível: ${produto.quantidade - novaQuantidadeReservada}, Status: ${novoStatus}`);
    
    return produtoAtualizado;
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error(`[reservarProduto] Falha ao reservar produto ${produtoId}: ${mensagem}`);
    throw error;
  }
};

/**
 * Cancela a reserva de um produto, total ou parcialmente.
 * @param produtoId - ID do produto com reserva a ser cancelada
 * @param quantidade - Quantidade a ser liberada da reserva (se não informado, cancela toda a reserva)
 * @param motivo - Motivo do cancelamento (para registro)
 * @returns O produto atualizado
 */
export const cancelarReservaProduto = async (
  produtoId: string,
  quantidade?: number,
  motivo: string = 'Cancelamento solicitado'
): Promise<Produto> => {
  try {
    // 1. Verificar se o produto existe
    const produto = await getProdutoById(produtoId);
    if (!produto) {
      throw new Error(`Produto com ID ${produtoId} não encontrado`);
    }
    
    // 2. Verificar se o produto tem alguma reserva
    const quantidadeReservadaAtual = produto.quantidade_reservada || 0;
    if (quantidadeReservadaAtual <= 0) {
      throw new Error(`Produto "${produto.nome}" não possui reservas para cancelar`);
    }
    
    // 3. Determinar a quantidade a ser liberada (tudo ou quantidade específica)
    const quantidadeALiberar = quantidade !== undefined 
      ? Math.min(quantidade, quantidadeReservadaAtual) 
      : quantidadeReservadaAtual;
    
    // 4. Calcular nova quantidade reservada
    const novaQuantidadeReservada = quantidadeReservadaAtual - quantidadeALiberar;
    
    // 5. Determinar o novo status
    // Se ainda há reservas, mantém como está (pode ser 'reservado' ou 'disponivel')
    // Se não há mais reservas, volta para 'disponivel'
    const novoStatus = novaQuantidadeReservada > 0 
      ? (novaQuantidadeReservada >= produto.quantidade ? 'reservado' : 'disponivel')
      : 'disponivel';
    
    // 6. Adicionar nota sobre o cancelamento da reserva
    const dataHora = new Date().toLocaleString('pt-BR');
    let notaCancelamento = `CANCELAMENTO DE RESERVA: ${quantidadeALiberar} unid. liberadas`;
    if (motivo) notaCancelamento += ` | Motivo: ${motivo}`;
    notaCancelamento += ` | Data: ${dataHora}`;
    
    const descricaoAtualizada = produto.descricao 
      ? `${produto.descricao}\n\n${notaCancelamento}`
      : notaCancelamento;
    
    // 7. Atualizar no banco de dados - apenas quantidade_reservada e status, não modificar a quantidade total
    const { data: produtoAtualizado, error } = await supabase
      .from('produtos')
      .update({
        status: novoStatus,
        descricao: descricaoAtualizada,
        quantidade_reservada: novaQuantidadeReservada
      })
      .eq('id', produtoId)
      .select()
      .single();
      
    if (error) {
      throw new Error(handleSupabaseError(error, 'Erro ao cancelar reserva do produto'));
    }
    
    console.log(`[cancelarReservaProduto] Cancelada reserva de ${quantidadeALiberar} unid. do produto ${produtoId}. Nova qtd. reservada: ${novaQuantidadeReservada}, Status: ${novoStatus}`);
    
    return produtoAtualizado;
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error(`[cancelarReservaProduto] Falha ao cancelar reserva do produto ${produtoId}: ${mensagem}`);
    throw error;
  }
}; 