/**
 * Script para testar os novos feeds padrão
 * 
 * Execute com: bun run quality-core/scripts/testFeeds.ts
 */

import { feedValidator } from '../../services/feedValidator';
import { getAllSuggestedFeeds } from '../../utils/suggestedFeeds';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const UI = require('../cli/ui-helpers.cjs');
const History = require('../cli/history.cjs');
const args = process.argv.slice(2);
const isSilent = args.includes('--silent') || args.includes('-s');
const isQuiet = args.includes('--quiet') || args.includes('-q');
const modeLabel = [
  isSilent ? 'silent' : isQuiet ? 'quiet' : 'default',
].join('-');
const log = UI.createLogger({ tag: 'FEEDS', silent: isSilent, quiet: isQuiet });

async function testFeeds() {
  const startTime = Date.now();
  let stopTimer = null;
  if (!isSilent) {
    UI.printHeader({
      title: 'QUALITY CORE - FEED TESTS',
      modes: ['--silent', '--quiet', 'FEED_TEST_LIMIT'],
      active: [
        isSilent ? 'silent' : null,
        isQuiet ? 'quiet' : null,
      ].filter(Boolean),
    });
    const avgHeader = History.getAverageDuration('test-feeds', modeLabel);
    stopTimer = UI.printTimingHeader({
      avgLabel: avgHeader,
      modeLabel,
      live: UI.shouldLiveTimer() && !isQuiet,
    });
  }
  if (!isSilent && !isQuiet) {
    UI.printScriptStart('feed tests', 1, 1);
  } else if (isQuiet) {
    UI.printQuietStepStart('feed tests', 1, 1);
  }
  log.info('Testando feeds padrão...');
  
  const suggestedFeeds = getAllSuggestedFeeds();
  const limit = Math.max(1, Number.parseInt(process.env.FEED_TEST_LIMIT || '5', 10));
  const feedList = suggestedFeeds.slice(0, limit);
  const results = [];
  
  for (let index = 0; index < feedList.length; index += 1) {
    const feed = feedList[index];
    const bar = UI.progressBar(index + 1, feedList.length, 14);
    log.info(`${bar} [${index + 1}/${feedList.length}] Testando: ${feed.title} (${feed.url})`);
    
    try {
      const result = await feedValidator.validateFeed(feed.url);
      
      if (result.isValid) {
        log.success(`${feed.title}: OK (${result.responseTime}ms)`);
        if (result.title) {
          log.info(`   Título: ${result.title}`);
        }
      } else {
        log.warn(`${feed.title}: ${result.error}`);
        if (result.suggestions.length > 0) {
          log.info(`   Sugestões: ${result.suggestions[0]}`);
        }
      }
      
      results.push({
        feed: feed.title,
        url: feed.url,
        valid: result.isValid,
        responseTime: result.responseTime,
        error: result.error
      });
      
    } catch (error) {
      log.error(`${feed.title}: Erro inesperado - ${error}`);
      results.push({
        feed: feed.title,
        url: feed.url,
        valid: false,
        error: `Erro inesperado: ${error}`
      });
    }
    
    log.raw(''); // Linha em branco
  }
  
  // Resumo
  const validFeeds = results.filter(r => r.valid).length;
  const totalFeeds = results.length;
  
  log.info('Resumo dos testes:');
  log.info(`   Feeds válidos: ${validFeeds}/${totalFeeds}`);
  log.info(`   Taxa de sucesso: ${Math.round((validFeeds / totalFeeds) * 100)}%`);
  
  if (validFeeds < totalFeeds) {
    log.warn('Feeds com problemas:');
    results.filter(r => !r.valid).forEach(r => {
      log.warn(`   - ${r.feed}: ${r.error}`);
    });
  }

  const duration = Date.now() - startTime;
  History.saveExecutionTime('test-feeds', duration, modeLabel);
  const avg = History.getAverageDuration('test-feeds', modeLabel);
  if (!isSilent && !isQuiet) {
    UI.printScriptEnd('feed tests', duration, avg, validFeeds === totalFeeds);
  } else if (isQuiet) {
    UI.printQuietStepEnd('feed tests', 1, 1, duration, avg, validFeeds === totalFeeds);
  }
  if (stopTimer) stopTimer();
  if (isSilent || isQuiet) {
    UI.printSummary({
      title: 'FEED TESTS',
      status: validFeeds === totalFeeds ? 'pass' : 'fail',
      metrics: [
        `Valid: ${validFeeds}/${totalFeeds}`,
        `Success: ${Math.round((validFeeds / totalFeeds) * 100)}%`,
      ],
      duration: (duration / 1000).toFixed(2),
    });
  }
}

// Executar apenas se chamado diretamente
if (import.meta.main) {
  testFeeds()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export { testFeeds };
