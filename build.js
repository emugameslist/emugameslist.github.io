// build.js - Static site generator script for GitHub Actions

const fs = require('fs');
const path = require('path');
const ini = require('ini');
const { URL } = require('url');

// --- Configuration ---
const OUTPUT_DIR = path.join(__dirname, 'pages');
const TEMPLATE_PATH = path.join(__dirname, 'index.html');
const SYSTEMS_INI_PATH = path.join(__dirname, 'Systems.ini'); // Assuming Systems.ini is in the root
const BASE_URL = 'https://imadering.github.io/emugames-list/'; // *** IMPORTANT: REPLACE WITH YOUR ACTUAL DOMAIN ***
const INI_FILE_ORDER = ['Emulators', 'Games', 'Demos'];

// --- Helper Function: Formats text to be SEO-friendly URL slug ---
function slugify(text) {
  if (!text) return 'untitled';
  return text.toString().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start
    .replace(/-+$/, '');         // Trim - from end
}

// --- Helper Function: Extracts YouTube ID from URL in Info.txt ---
function extractYoutubeId(text) {
    if (!text) return null;
    const match = text.match(/(?:Gameplay|Video):\s*(https?:\/\/[^\s]+)/);
    if (match && match[1]) {
        const idMatch = match[1].match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
        if (idMatch && idMatch[1]) return idMatch[1];
    }
    return null;
}

// --- Helper Function: Escapes HTML for safe inclusion ---
function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// --- Helper Function: Reads and parses INI files (mimics client-side logic) ---
function readIniFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return null;
    }
    try {
        // Read file content (using utf-8 or trying the client's utf-16le assumption might be needed)
        // We'll stick to ini library's default, which is usually sufficient for common configs.
        const content = fs.readFileSync(filePath, 'utf-8');
        return ini.parse(content);
    } catch (e) {
        console.warn(`Error reading or parsing INI file: ${filePath}`, e.message);
        return null;
    }
}

// --- Helper Function: Gets the display text for a game (mimics client's getGameDisplayText) ---
function getGameDisplayText(g) {
    let suffix = '';
    if (g.source === 'Emulators') suffix = ' - Emulator';
    else if (g.source === 'Demos') suffix = ' - Demo';
    
    let title = escapeHtml(g.name) + suffix;
    if (g.year) title += ` (${escapeHtml(g.year)})`;
    if (g.rating) title += ` ⭐ ${escapeHtml(g.rating)}`;
    return title;
}

// --- Main Generation Function ---
async function generatePages() {
    console.log("Starting static site generation...");

    // CLEANUP: Explicitly delete and recreate the output folder
    if (fs.existsSync(OUTPUT_DIR)) {
        console.log(`Cleaning up old directory: ${OUTPUT_DIR}`);
        fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created new directory: ${OUTPUT_DIR}`);

    // Read the main template (index.html)
    let templateHtml = fs.readFileSync(TEMPLATE_PATH, 'utf8');

    // Read list of all Systems
    const sysData = readIniFile(SYSTEMS_INI_PATH);
    if (!sysData) {
        console.error("Systems.ini not found or empty. Aborting.");
        return;
    }

    let sitemapEntries = ['/']; // Start with the main index page

    // Iterate over all systems
    for (const sysKey of Object.keys(sysData)) {
        const sys = sysData[sysKey];
        const systemName = sysKey;
        const systemDir = sys.Dir || sysKey;
        const systemSlug = slugify(systemName);
        
        console.log(`\nProcessing System: ${systemName} (${systemDir})`);

        // --- A. Generate System Info Page (if Info.txt exists) ---
        const sysInfoDir = path.join(__dirname, 'Systems', systemDir, 'Info');
        const sysInfoPath = path.join(sysInfoDir, 'Info.txt');
        
        if (fs.existsSync(sysInfoPath)) {
            const sysInfoTxt = fs.readFileSync(sysInfoPath, 'utf-8');
            const pagePath = path.join(OUTPUT_DIR, 'systems', systemSlug, 'index.html');
            const pageUrlPath = `/systems/${systemSlug}/`;

            // SEO content
            const pageTitle = `${systemName} Games List | EmuGames List`;
            const pageDescription = sysInfoTxt.substring(0, 155).replace(/(\r\n|\n|\r)/gm, " ") + '...';

            let finalHtml = templateHtml
                .replace(/<title>EmuGames List<\/title>/, `<title>${escapeHtml(pageTitle)}</title>`)
                .replace(/<meta name="description" content="Retro games catalog" \/>/, `<meta name="description" content="${escapeHtml(pageDescription)}" \/>`);

            // Insert placeholder SEO content (System description)
            const seoContent = `
              <div id="seo-content" style="display: none;">
                <h1>${escapeHtml(systemName)} Games</h1>
                <p>System Overview: ${escapeHtml(sysInfoTxt.substring(0, 500))}</p>
              </div>
            `;
            finalHtml = finalHtml.replace('</body>', `${seoContent}</body>`);

            // Save the file
            fs.mkdirSync(path.dirname(pagePath), { recursive: true });
            fs.writeFileSync(pagePath, finalHtml);
            sitemapEntries.push(pageUrlPath);
            console.log(`  Generated System Page: ${pageUrlPath}`);
        }


        // --- B. Generate Game Pages ---
        const systemGameData = [];
        
        // 1. Load all games data for the system
        for (const type of INI_FILE_ORDER) {
            const iniPath = path.join(__dirname, 'Systems', systemDir, `${type}.ini`);
            const data = readIniFile(iniPath);
            if (!data) continue;

            const group = Object.keys(data).map(key => ({
                name: data[key]['Name'] || data[key]['NAME'] || data[key]['name'] || key,
                dir: data[key]['Dir'] || data[key]['DIR'] || data[key]['dir'] || key,
                year: data[key]['Year'] || data[key]['year'] || '',
                rating: data[key]['Rating'] || data[key]['rating'] || '',
                comment: data[key]['Comment'] || data[key]['COMMENT'] || '',
                source: type, // Emulators, Games, Demos
                systemDir: systemDir 
            })).filter(g => g.name || g.dir);

            systemGameData.push(...group);
        }

        // 2. Iterate and generate HTML for each game
        for (const game of systemGameData) {
            const gameSlug = slugify(game.name);
            const gameDir = game.dir;
            const sourceDir = game.source; // Emulators/Games/Demos

            const pagePath = path.join(OUTPUT_DIR, 'systems', systemSlug, `${gameSlug}.html`);
            const pageUrlPath = `/systems/${systemSlug}/${gameSlug}.html`;

            // --- Get Game Description (Info.txt) ---
            const gameInfoPath = path.join(__dirname, 'Systems', systemDir, sourceDir, gameDir, 'Info.txt');
            let infoTxt = '';
            if (fs.existsSync(gameInfoPath)) {
                infoTxt = fs.readFileSync(gameInfoPath, 'utf-8');
            }
            
            const safeInfo = infoTxt || game.comment || 'No description available for this game.';
            const videoId = extractYoutubeId(safeInfo);

            // --- Prepare SEO content ---
            const pageTitle = `${game.name} (${systemName}${game.year ? ' ' + game.year : ''}) - Gameplay & Info`;
            const pageDescription = safeInfo.substring(0, 155).replace(/(\r\n|\n|\r)/gm, " ") + '...';
            
            // --- Apply to Template ---
            let finalHtml = templateHtml
                .replace(/<title>EmuGames List<\/title>/, `<title>${escapeHtml(pageTitle)}</title>`)
                .replace(/<meta name="description" content="Retro games catalog" \/>/, `<meta name="description" content="${escapeHtml(pageDescription)}" \/>`);

            // Hidden SEO block with full details
            const seoContent = `
              <div id="seo-content" style="display: none;">
                <h1>${escapeHtml(game.name)}</h1>
                <p>System: ${escapeHtml(systemName)}</p>
                ${game.year ? `<p>Year: ${escapeHtml(game.year)}</p>` : ''}
                ${game.rating ? `<p>Rating: ${escapeHtml(game.rating)}</p>` : ''}
                <p>Description: ${escapeHtml(safeInfo.substring(0, 1000))}</p>
                ${videoId ? `<p>Video: https://www.youtube.com/watch?v=${videoId}</p>` : ''}
              </div>
            `;
            finalHtml = finalHtml.replace('</body>', `${seoContent}</body>`);

            // --- User Redirect Logic ---
            // This script redirects real users to the JS-powered site hash fragment, but allows bots to see the static content.
            const redirectScript = `
              <script>
                // Check if the user is likely a bot (to allow them to see the static content)
                const isBot = /bot|crawler|spider|google|yandex|archiver|ahrefs|bing/i.test(navigator.userAgent);
                
                // If it's NOT a bot, redirect to the main JS site using a fragment/hash
                if (!isBot && window.location.pathname.endsWith('.html')) {
                  // Redirect: /systems/nes/mario.html -> /#systems/nes/mario
                  const pathParts = window.location.pathname.split('/').slice(1);
                  const newHash = pathParts.map(p => p.replace('.html', '')).join('/');
                  window.location.replace('/#' + newHash);
                }
              </script>
            `;
            finalHtml = finalHtml.replace('</head>', `${redirectScript}</head>`);
            
            // --- Save File ---
            fs.mkdirSync(path.dirname(pagePath), { recursive: true });
            fs.writeFileSync(pagePath, finalHtml);
            sitemapEntries.push(pageUrlPath);
            // console.log(`  Generated Game Page: ${pageUrlPath}`); // uncomment for detailed log
        }
    }

    // --- 3. Generate sitemap.xml ---
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    sitemapEntries.forEach(urlPath => {
        // Ensure path starts with a slash
        const fullUrl = new URL(urlPath.startsWith('/') ? urlPath.substring(1) : urlPath, BASE_URL).href;
        sitemap += `  <url>\n    <loc>${fullUrl}</loc>\n  </url>\n`;
    });
    sitemap += '</urlset>';
    
    fs.writeFileSync(path.join(OUTPUT_DIR, 'sitemap.xml'), sitemap);
    console.log(`\nGenerated sitemap.xml with ${sitemapEntries.length} entries.`);
    console.log("Static site generation complete.");
}

generatePages().catch(console.error);
