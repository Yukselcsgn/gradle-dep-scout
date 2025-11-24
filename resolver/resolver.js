const fs = require('fs');
const path = require('path');
const axios = require('axios');
const minimist = require('minimist');

function pLimit(concurrency) {
    const queue = [];
    let active = 0;
    const next = () => {
        if (queue.length === 0) return;
        if (active >= concurrency) return;
        active++;
        const {fn, resolve, reject} = queue.shift();
        Promise.resolve()
            .then(fn)
            .then((val) => { active--; resolve(val); next(); })
            .catch((err) => { active--; reject(err); next(); });
};
return (fn) => new Promise((resolve,reject) => { queue.push({fn,resolve,reject}); next(); });
}

async function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }


const argv = minimist(process.argv.slice(2), {
    string: ['input','output'],
    alias: {i:'input', o:'output', c:'concurrency'},
    default: { input: '../imports.txt', output: 'dependencies.gradle', concurrency: 6 }
});

const INPUT = argv.input;
const OUTPUT = argv.output;
const CONCURRENCY = parseInt(argv.concurrency,10) || 4;


if (!fs.existsSync(INPUT)){
    console.error(`Input file not found: ${INPUT}`);
    process.exit(2);
}


const imports = fs.readFileSync(INPUT, 'utf-8')
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean);

const cache = new Map();
const limit = pLimit(CONCURRENCY);

async function queryMavenByClass(className, packageName){
    const base = 'https://search.maven.org/solrsearch/select';
    const q2 = `q=fc:%22${encodeURIComponent(className)}%22+AND+p:%22${encodeURIComponent(packageName)}%22&rows=20&wt=json`;
    const q1 = `q=fc:%22${encodeURIComponent(className)}%22&rows=20&wt=json`;


    async function doRequest(q, attempt=0){
        try{
            const url = `${base}?${q}`;
            const res = await axios.get(url, { timeout: 10000 });
            return res.data && res.data.response && res.data.response.docs ? res.data.response.docs : [];
        }catch(err){
            const status = err && err.response && err.response.status;
            if ((status === 429 || !status) && attempt < 4){
                const wait = Math.pow(2, attempt) * 500 + Math.random()*200;
                await sleep(wait);
                return doRequest(q, attempt+1);
            }
            return [];
        }
    }


    let docs = await doRequest(q2);
    if (!docs || docs.length === 0) docs = await doRequest(q1);
    return docs;
}

function scoreDoc(doc, className, packageName){
    let score = 0;
    const group = (doc.g||'').toLowerCase();
    const artifact = (doc.a||'').toLowerCase();
    const pkg = (packageName||'').toLowerCase();
    const cls = (className||'').toLowerCase();


    const parts = pkg.split('.').filter(Boolean);
    for (const p of parts){
        if (group.includes(p)) score += 3;
        if (artifact.includes(p)) score += 2;
    }
    if (group.includes(cls)) score += 4;
    if (artifact.includes(cls)) score += 3;
    if ((doc.latestVersion||'').length > 0) score += 1;
    return score;
}

async function resolveImport(fullImport){
    const parts = fullImport.split('.').filter(Boolean);
    if (parts.length === 0) return { import: fullImport, error: 'invalid' };
    const className = parts.pop();
    const packageName = parts.join('.');


    const cacheKey = `${packageName}#${className}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);


    const docs = await queryMavenByClass(className, packageName);
    if (!docs || docs.length === 0){
        const result = { import: fullImport, found: false };
        cache.set(cacheKey, result);
        return result;
    }


    let best = null; let bestScore = -Infinity;
    for (const d of docs){
        const s = scoreDoc(d, className, packageName);
        if (s > bestScore){ bestScore = s; best = d; }
    }


    const result = {
        import: fullImport,
        found: true,
        group: best.g,
        artifact: best.a,
        version: best.latestVersion
    };
    cache.set(cacheKey, result);
    return result;
}

async function main(){
    const tasks = imports.map(imp => limit(() => resolveImport(imp)));
    const results = await Promise.allSettled(tasks);


    const lines = [];
    const report = [];
    for (const r of results){
        if (r.status === 'fulfilled'){
            const res = r.value;
            report.push(res);
            if (res.found){
                lines.push(`implementation '${res.group}:${res.artifact}:${res.version}'`);
            } else {
                lines.push(`// Not resolved: ${res.import}`);
            }
        } else {
            lines.push(`// Error resolving: ${JSON.stringify(r.reason)}`);
        }
    }


    fs.writeFileSync(OUTPUT, lines.join('\n'));
    fs.writeFileSync('report.json', JSON.stringify(report, null, 2));
    console.log(`Wrote ${OUTPUT} and report.json`);
}


main().catch(err => { console.error(err); process.exit(1); });