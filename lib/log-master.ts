/**
 * Log de segurança do Painel Master.
 *
 * O sistema de auditoria existente (LogAuditoria) é por empresa — tem
 * empresaId obrigatório e está ligado a produto/usuário de uma empresa
 * específica. Ações do Master (login, e futuramente criação/edição de
 * empresa etc.) NÃO pertencem a nenhuma empresa, então não fazem sentido
 * nessa tabela, e criar uma tabela nova de auditoria dedicada ao Master é
 * uma mudança de schema fora do escopo desta etapa.
 *
 * Como medida imediata (e não uma auditoria persistida completa — ver
 * pendência no relatório), toda tentativa de login do Master gera uma linha
 * estruturada no log do servidor, sem NUNCA incluir a senha ou o hash.
 * Isso já é suficiente para detectar tentativas de força bruta e para
 * investigação em caso de incidente, via qualquer coletor de logs (ex:
 * CloudWatch, Datadog, etc. — o que a infraestrutura de vocês já usa).
 */
export function logSegurancaMaster(evento: {
  acao: 'LOGIN_SUCESSO' | 'LOGIN_FALHA' | 'LOGOUT';
  email?: string;
  motivo?: string;
  ip?: string | null;
}) {
  console.warn(
    JSON.stringify({
      tipo: 'AUDITORIA_MASTER',
      acao: evento.acao,
      email: evento.email,
      motivo: evento.motivo,
      ip: evento.ip ?? undefined,
      timestamp: new Date().toISOString(),
    })
  );
}

export function extrairIpDaRequisicao(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? null;
  return headers.get('x-real-ip');
}
