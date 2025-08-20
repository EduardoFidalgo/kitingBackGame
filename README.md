# Projeto Laravel Moderno
**observabilidade**,
**testes** 
**documentação**.

# Arquitetura
- **Backend:** Laravel
- **Cache:** Redis
- **Filas:** RabbitMQ
- **Banco de Dados:** PostgreSQL

## Observabilidade
- **OpenTelemetry (OTel)** https://opentelemetry.io/
  Coleta métricas, logs e traces distribuídos.  
  Exemplo de uso: visualizar o tempo gasto em cada etapa:
  - **20ms** no Laravel  
  - **150ms** na query PostgreSQL  
  - **10ms** no Redis

  ex: Dashboards de gráficos + Relatório de acessos (onde está o b.o php ou sql)

- **Grafana**  (envolve custo mas tem beneficios)
  Dashboards interativos, configuração de alertas. (Adicionar Prometheus)

## Testes
- **PestPHP**  
  Substituto moderno do PHPUnit para testes unitários e de integração.
- **Cypress**  
  Testes End-to-End, testes no frontend.

ex: Epoca MyHive (muito verboso)

## Documentação
- **Swagger**  
  Documentação interativa da API, fácil de consultar e testar endpoints.
- **Laravel Scribe**  
  Gera documentação automaticamente a partir de rotas e testes, reduzindo burocracia manual.

ex: dev odeia documentar, quanto mais automatizar melhor (PHPDOCS se quiser ser mais simples)

## Benefícios
- Visibilidade ponta a ponta das requisições e performance da aplicação
- Testes modernos e confiáveis
- Documentação sempre atualizada
- Stack escalável e pronta para produção

## Extra
- Workspace focado em php em todos os vscodes, padronizando extensões projeto
- PHP-CS-FIXER, formata com base em PSR-12 (padrão de codificação PHP recomendado + ATUALIZADO)