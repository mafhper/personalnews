// quality-core/vitest.collector.ts
import { execSync } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import { TestMetrics, CoverageMetrics } from './quality-schema'

/**
 * VitestCollector executa os testes do projeto e extrai métricas.
 */
export class VitestCollector {
  private static REPORT_PATH = path.join(process.cwd(), 'performance-reports', 'coverage', 'temp-vitest-report.json')
  private static COVERAGE_PATH = path.join(process.cwd(), 'performance-reports', 'coverage', 'coverage-summary.json')
  private static LEGACY_COVERAGE_PATH = path.join(process.cwd(), 'coverage', 'coverage-summary.json')

  /**
   * Executa a suíte de testes e retorna as métricas.
   */
  static async collect(): Promise<{ tests: TestMetrics; coverage: CoverageMetrics }> {
    try {
      await fs.mkdir(path.dirname(this.REPORT_PATH), { recursive: true })

      // Executa vitest com reporter JSON e coverage
      // Usamos --passWithNoTests para evitar erro se não houver testes
      const command = `bun vitest run --config quality-core/config/vitest.config.core.ts --reporter=json --outputFile="${this.REPORT_PATH}" --coverage.enabled=true --coverage.reporter=json-summary --coverage.reportsDirectory=performance-reports/coverage --passWithNoTests`
      
      console.log(`[VitestCollector] Running: ${command}`)
      try {
        execSync(command, { stdio: 'pipe' })
      } catch (err) {
        // Vitest retorna exit code > 0 se houver falhas, mas o relatório ainda é gerado
        const execErr = err as { stdout?: unknown, stderr?: unknown };
        if (!execErr.stdout && !execErr.stderr) throw err
      }

      // 1. Parse Test Results
      const reportContent = await fs.readFile(this.REPORT_PATH, 'utf-8')
      const report = JSON.parse(reportContent)

      // DEBUG: Log the report structure to understand the format
      console.log('[VitestCollector] Report keys:', Object.keys(report))
      console.log('[VitestCollector] numTotalTests:', report.numTotalTests)
      console.log('[VitestCollector] numPassedTests:', report.numPassedTests)
      console.log('[VitestCollector] numFailedTests:', report.numFailedTests)
      console.log('[VitestCollector] numPendingTests:', report.numPendingTests)
      console.log('[VitestCollector] testResults length:', report.testResults?.length)

      // Try different property names that Vitest might use
      const total = report.numTotalTests || report.numTotalTestSuites || 0
      const passed = report.numPassedTests || report.numPassedTestSuites || 0
      const failed = report.numFailedTests || report.numFailedTestSuites || 0
      const skipped = report.numPendingTests || report.numPendingTestSuites || report.numSkippedTests || 0

      console.log('[VitestCollector] Calculated totals:', { total, passed, failed, skipped })

      const tests: TestMetrics = {
        total,
        passed,
        failed,
        skipped,
        duration: Date.now() - (report.startTime || Date.now()),
        suites: [] // Podem ser mapeadas de report.testResults se necessario
      }

      // 2. Parse Coverage Results
      let coverage: CoverageMetrics = {
        lines: 0,
        statements: 0,
        branches: 0,
        functions: 0,
        trend: 'stable'
      }

      try {
        let coveragePath = this.COVERAGE_PATH
        if (!(await this.fileExists(coveragePath)) && (await this.fileExists(this.LEGACY_COVERAGE_PATH))) {
          coveragePath = this.LEGACY_COVERAGE_PATH
        }
        if (await this.fileExists(coveragePath)) {
          const coverageContent = await fs.readFile(coveragePath, 'utf-8')
          const summary = JSON.parse(coverageContent)
          const total = summary.total
          
          if (total) {
            coverage = {
              lines: total.lines?.pct || 0,
              statements: total.statements?.pct || 0,
              branches: total.branches?.pct || 0,
              functions: total.functions?.pct || 0,
              trend: 'stable'
            }
          }
        }
      } catch (covErr) {
        console.warn('[VitestCollector] Failed to parse coverage summary:', covErr)
      }

      // Cleanup
      await fs.unlink(this.REPORT_PATH).catch(() => {})

      return { tests, coverage }
    } catch (err) {
      console.error('Failed to collect Vitest metrics:', err)
      return {
        tests: { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0, suites: [] },
        coverage: { lines: 0, statements: 0, branches: 0, functions: 0, trend: 'stable' }
      }
    }
  }

  private static async fileExists(p: string): Promise<boolean> {
    try {
      await fs.access(p)
      return true
    } catch {
      return false
    }
  }
}
