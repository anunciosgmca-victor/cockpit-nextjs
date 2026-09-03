-- ============================================================
-- Dados de demonstração (opcional) para a instância /grupoordos.
-- Rode depois de schema.sql + migration_workspace.sql.
-- É a mesma cópia dos exemplos de fábrica de seed.sql, só que
-- marcada com workspace = 'grupoordos' — não mexe em nada da
-- instância principal ('default').
-- ============================================================

do $$
declare
  lev_aquisicao uuid;
  lev_marca uuid;
  lev_estrategia uuid;
  top_indicacao uuid;
  top_ads uuid;
  top_marca uuid;
  top_estrategico uuid;
begin
  insert into levers (name, workspace) values ('Aquisição', 'grupoordos') returning id into lev_aquisicao;
  insert into levers (name, workspace) values ('Marca', 'grupoordos') returning id into lev_marca;
  insert into levers (name, workspace) values ('Estratégia', 'grupoordos') returning id into lev_estrategia;

  insert into topics (lever_id, name, strategy, objective, workspace)
    values (lev_aquisicao, 'Indicação', 'Clube de Relacionamento', 'Ampliar a base de indicados por meio de um programa estruturado de indicação.', 'grupoordos')
    returning id into top_indicacao;
  insert into kpis (topic_id, name, unit, goal, current, previous, source) values
    (top_indicacao, 'Número de Participantes', 'pessoas', 120, 98, 90, 'CRM'),
    (top_indicacao, 'Número de Visitantes', 'pessoas', 60, 41, 52, 'Recepção');
  insert into participants (topic_id, name, role, email) values
    (top_indicacao, 'Victor', 'Gestor de Marketing', 'victor@empresa.com'),
    (top_indicacao, 'Ana', 'Relacionamento', 'ana@empresa.com');

  insert into topics (lever_id, name, strategy, objective, workspace)
    values (lev_aquisicao, 'ADS Online', 'Tráfego Pago Meta + CRM', 'Gerar demanda qualificada e transformar tráfego em oportunidades comerciais.', 'grupoordos')
    returning id into top_ads;
  insert into kpis (topic_id, name, unit, goal, current, previous, source) values
    (top_ads, 'Atendimentos', 'atend.', 100, 82, 100, 'CRM'),
    (top_ads, 'Apresentações', 'apres.', 50, 43, 47, 'CRM'),
    (top_ads, 'Negociações', 'neg.', 25, 21, 19, 'CRM');
  insert into participants (topic_id, name, role, email) values
    (top_ads, 'Victor', 'Gestor de Marketing', 'victor@empresa.com'),
    (top_ads, 'João', 'Gestor de Tráfego', 'joao@empresa.com'),
    (top_ads, 'Maria', 'Comercial', 'maria@empresa.com'),
    (top_ads, 'Agência', 'CRM', 'agencia@parceiro.com');

  insert into topics (lever_id, name, strategy, objective, workspace)
    values (lev_marca, 'Marca Pessoal', 'Social Seller', 'Transformar o time comercial em geradores de autoridade e demanda via redes sociais.', 'grupoordos')
    returning id into top_marca;
  insert into kpis (topic_id, name, unit, goal, current, previous, source) values
    (top_marca, 'Número de Seguidores', 'seg.', 15000, 15800, 14200, 'Instagram'),
    (top_marca, 'Número de Leads', 'leads', 80, 54, 61, 'CRM');
  insert into participants (topic_id, name, role, email) values
    (top_marca, 'Marina', 'Conteúdo', 'marina@empresa.com'),
    (top_marca, 'Victor', 'Gestor de Marketing', 'victor@empresa.com');

  insert into topics (lever_id, name, strategy, objective, workspace)
    values (lev_estrategia, 'Marketing Estratégico', 'Plataforma de Escala', 'Estruturar demandas personalizadas de marketing como produto interno escalável.', 'grupoordos')
    returning id into top_estrategico;
  insert into kpis (topic_id, name, unit, goal, current, previous, source) values
    (top_estrategico, 'Número de Demandas', 'demandas', 40, 37, 30, 'Planilha'),
    (top_estrategico, 'Demandas Personalizadas', 'demandas', 15, 9, 11, 'Planilha'),
    (top_estrategico, '% de Execução', '%', 90, 74, 70, 'Planilha');
  insert into participants (topic_id, name, role, email) values
    (top_estrategico, 'Victor', 'Gestor de Marketing', 'victor@empresa.com'),
    (top_estrategico, 'Equipe', 'Execução', '');
end $$;
