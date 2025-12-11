/**
 * Generate Changelog from Git Commits
 * 
 * Extracts commits from git log and generates a structured JSON
 * that can be consumed by the promo site's changelog page.
 * 
 * Run: node website/scripts/generate-changelog.cjs
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'changelog.json');
const MAX_COMMITS = 100;

// Commit type prefixes and their display names
const COMMIT_TYPES = {
    'feat': { label: 'Novo', icon: 'plus', color: '#10b981' },
    'fix': { label: 'Correção', icon: 'bug', color: '#ef4444' },
    'refactor': { label: 'Refatoração', icon: 'code', color: '#8b5cf6' },
    'style': { label: 'Estilo', icon: 'palette', color: '#f59e0b' },
    'docs': { label: 'Documentação', icon: 'book', color: '#3b82f6' },
    'perf': { label: 'Performance', icon: 'zap', color: '#eab308' },
    'test': { label: 'Testes', icon: 'check', color: '#06b6d4' },
    'chore': { label: 'Manutenção', icon: 'wrench', color: '#6b7280' },
};

function getGitLog() {
    try {
        // Format: hash|date|subject
        const log = execSync(
            `git log --pretty=format:"%H|%ai|%s" -n ${MAX_COMMITS}`,
            { encoding: 'utf-8', cwd: path.join(__dirname, '..', '..') }
        );
        return log.split('\n').filter(line => line.trim());
    } catch (error) {
        console.error('Error getting git log:', error.message);
        return [];
    }
}

function parseCommit(line) {
    const [hash, dateStr, ...subjectParts] = line.split('|');
    const subject = subjectParts.join('|');
    const date = new Date(dateStr);

    const match = subject.match(/^(\w+)(?:\(.+\))?:\s*(.+)$/);
    let type = 'other';
    let message = subject;

    if (match) {
        const prefix = match[1].toLowerCase();
        if (COMMIT_TYPES[prefix]) {
            type = prefix;
            message = match[2];
        }
    }

    return {
        hash: hash.substring(0, 7),
        date: date.toISOString(),
        type,
        message: message.charAt(0).toUpperCase() + message.slice(1),
        typeInfo: COMMIT_TYPES[type] || { label: 'Outro', icon: 'circle', color: '#6b7280' }
    };
}

function groupByMonth(commits) {
    const groups = {};

    commits.forEach(commit => {
        const date = new Date(commit.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

        if (!groups[monthKey]) {
            groups[monthKey] = {
                key: monthKey,
                label: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                commits: []
            };
        }

        groups[monthKey].commits.push(commit);
    });

    return Object.values(groups).sort((a, b) => b.key.localeCompare(a.key));
}

function filterRelevantCommits(commits) {
    return commits.filter(commit => {
        const msg = commit.message.toLowerCase();
        return !msg.startsWith('merge') &&
            !msg.startsWith('wip') &&
            !msg.includes('initial commit') &&
            commit.message.length > 3;
    });
}

function main() {
    console.log('Checking for changelog updates...');

    let currentHash;
    try {
        currentHash = execSync('git rev-parse HEAD', {
            encoding: 'utf-8',
            cwd: path.join(__dirname, '..', '..')
        }).trim();
    } catch (error) {
        console.error('Error getting current git hash:', error.message);
        return;
    }

    const hashFilePath = path.join(__dirname, '..', 'public', 'last-changelog-hash');
    let lastHash = '';
    if (fs.existsSync(hashFilePath)) {
        lastHash = fs.readFileSync(hashFilePath, 'utf-8').trim();
    }

    if (currentHash === lastHash) {
        console.log('Changelog is already up to date. Skipping generation.');
        return;
    }

    console.log('Changes detected. Generating changelog...');

    const rawLog = getGitLog();
    console.log(`Found ${rawLog.length} commits`);

    const commits = rawLog.map(parseCommit);
    const filtered = filterRelevantCommits(commits);
    console.log(`Filtered to ${filtered.length} relevant commits`);

    const grouped = groupByMonth(filtered);

    const changelog = {
        generated: new Date().toISOString(),
        totalCommits: filtered.length,
        months: grouped
    };

    // Ensure data directory exists
    const dataDir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(changelog, null, 2), 'utf-8');
    fs.writeFileSync(hashFilePath, currentHash, 'utf-8');

    console.log(`Changelog written to ${OUTPUT_PATH}`);
    console.log(`Total groups: ${grouped.length} months`);
}

main();
