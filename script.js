const container = document.getElementById('container');
const zoneViewer = document.getElementById('zoneViewer');
let zoneFrame = document.getElementById('zoneFrame');
const searchBar = document.getElementById('searchBar');
const sortOptions = document.getElementById('sortOptions');
const filterOptions = document.getElementById('filterOptions');
const zonesurls = [
    "https://cdn.jsdelivr.net/gh/%67%6e%2d%6d%61%74%68/assets@main/zones.json",
    "https://cdn.jsdelivr.net/gh/%67%6e%2d%6d%61%74%68/assets@latest/zones.json",
    "https://cdn.jsdelivr.net/gh/%67%6e%2d%6d%61%74%68/assets@master/zones.json",
    "https://cdn.jsdelivr.net/gh/%67%6e%2d%6d%61%74%68/assets/zones.json"
];
let zonesURL = zonesurls[Math.floor(Math.random() * zonesurls.length)];
const coverURL = "https://cdn.jsdelivr.net/gh/%67%6e%2d%6d%61%74%68/covers@main";
const htmlURL = "https://cdn.jsdelivr.net/gh/%67%6e%2d%6d%61%74%68/html@main";
let zones = [];
let popularityData = {};
const featuredContainer = document.getElementById('featuredZones');

function toTitleCase(str) {
    return str.replace(/\w\S*/g, text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase());
}

async function listZones() {
    try {
        let sharesponse;
        let shajson;
        let sha;
        try {
            sharesponse = await fetch("https://api.github.com/repos/%67%6e%2d%6d%61%74%68/assets/commits?t=" + Date.now());
        } catch (error) {}
        if (sharesponse && sharesponse.status === 200) {
            try {
                shajson = await sharesponse.json();
                sha = shajson[0]['sha'];
                if (sha) {
                    zonesURL = `https://cdn.jsdelivr.net/gh/%67%6e%2d%6d%61%74%68/assets@${sha}/zones.json`;
                }
            } catch (error) {
                try {
                    let secondarysharesponse = await fetch("https://raw.githubusercontent.com/%67%6e%2d%6d%61%74%68/xml/refs/heads/main/sha.txt?t=" + Date.now());
                    if (secondarysharesponse && secondarysharesponse.status === 200) {
                        sha = (await secondarysharesponse.text()).trim();
                        if (sha) {
                            zonesURL = `https://cdn.jsdelivr.net/gh/%67%6e%2d%6d%61%74%68/assets@${sha}/zones.json`;
                        }
                    }
                } catch (error) {}
            }
        }
        const response = await fetch(zonesURL + "?t=" + Date.now());
        const json = await response.json();
        zones = json;
        zones[0].featured = true;
        await Promise.all([fetchPopularity("year"), fetchPopularity("month"), fetchPopularity("week"), fetchPopularity("day")]);
        sortZones();
        try {
            const search = new URLSearchParams(window.location.search);
            const id = search.get('id');
            const embed = window.location.hash.includes("embed");
            if (id) {
                const zone = zones.find(zone => zone.id + '' == id + '');
                if (zone) {
                    if (embed) {
                        if (zone.url.startsWith("http")) {
                            window.open(zone.url, "_blank");
                        } else {
                            const url = zone.url.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);
                            fetch(url + "?t=" + Date.now()).then(response => response.text()).then(html => {
                                document.documentElement.innerHTML = html;
                                const popup = document.createElement("div");
                                popup.style.position = "fixed";
                                popup.style.bottom = "20px";
                                popup.style.right = "20px";
                                popup.style.backgroundColor = "#cce5ff";
                                popup.style.color = "#004085";
                                popup.style.padding = "10px";
                                popup.style.border = "1px solid #b8daff";
                                popup.style.borderRadius = "5px";
                                popup.style.boxShadow = "0px 0px 10px rgba(0,0,0,0.1)";
                                popup.style.fontFamily = "Arial, sans-serif";
                                popup.innerHTML = `Play more games at <a href="#" target="_blank" style="color:#004085; font-weight:bold;">sight.w games</a>!`;
                                const closeBtn = document.createElement("button");
                                closeBtn.innerText = "?";
                                closeBtn.style.marginLeft = "10px";
                                closeBtn.style.background = "none";
                                closeBtn.style.border = "none";
                                closeBtn.style.cursor = "pointer";
                                closeBtn.style.color = "#004085";
                                closeBtn.style.fontWeight = "bold";
                                closeBtn.onclick = () => popup.remove();
                                popup.appendChild(closeBtn);
                                document.body.appendChild(popup);
                                document.documentElement.querySelectorAll('script').forEach(oldScript => {
                                    const newScript = document.createElement('script');
                                    if (oldScript.src) {
                                        newScript.src = oldScript.src;
                                    } else {
                                        newScript.textContent = oldScript.textContent;
                                    }
                                    document.body.appendChild(newScript);
                                });
                            }).catch(error => alert("Failed to load game: " + error));
                        }
                    } else {
                        openZone(zone);
                    }
                }
            }
        } catch (error) {}
        let alltags = [];
        for (const obj of json) {
            if (Array.isArray(obj.special)) {
                alltags.push(...obj.special);
            }
        }
        alltags = [...new Set(alltags)];
        let filteroption = document.getElementById("filterOptions");
        if (filteroption && filteroption.children.length > 1) {
            while (filteroption.children.length > 1) {
                filteroption.removeChild(filteroption.lastElementChild);
            }
        }
        for (const tag of alltags) {
            const opt = document.createElement("option");
            opt.value = tag;
            opt.textContent = toTitleCase(tag);
            filteroption.appendChild(opt);
        }
    } catch (error) {
        console.error(error);
        container.innerHTML = `Error loading games: ${error}`;
    }
}

async function fetchPopularity(duration) {
    try {
        if (!popularityData[duration]) {
            popularityData[duration] = {};
        }
        const response = await fetch(
            "https://data.jsdelivr.com/v1/stats/packages/gh/%67%6e%2d%6d%61%74%68/html@main/files?period=" + duration
        );
        const data = await response.json();
        data.forEach(file => {
            const idMatch = file.name.match(/\/(\d+)\.html$/);
            if (idMatch) {
                const id = parseInt(idMatch[1]);
                popularityData[duration][id] = file.hits?.total ?? 0;
            }
        });
    } catch (error) {
        if (!popularityData[duration]) {
            popularityData[duration] = {};
        }
        popularityData[duration][0] = 0;
    }
}

function sortZones() {
    const sortBy = sortOptions.value;
    if (sortBy === 'name') {
        zones.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'id') {
        zones.sort((a, b) => a.id - b.id);
    } else if (sortBy === 'popular') {
        zones.sort((a, b) => ((popularityData['year']?.[b.id]) ?? 0) - ((popularityData['year']?.[a.id]) ?? 0));
    } else if (sortBy === 'trendingMonth') {
        zones.sort((a, b) => ((popularityData['month']?.[b.id]) ?? 0) - ((popularityData['month']?.[a.id]) ?? 0));
    } else if (sortBy === 'trendingWeek') {
        zones.sort((a, b) => ((popularityData['week']?.[b.id]) ?? 0) - ((popularityData['week']?.[a.id]) ?? 0));
    } else if (sortBy === 'trendingDay') {
        zones.sort((a, b) => ((popularityData['day']?.[b.id]) ?? 0) - ((popularityData['day']?.[a.id]) ?? 0));
    }
    zones.sort((a, b) => (a.id === -1 ? -1 : b.id === -1 ? 1 : 0));
    if (featuredContainer.innerHTML === "") {
        const featured = zones.filter(z => z.featured);
        displayFeaturedZones(featured);
    }
    displayZones(zones);
}

function displayFeaturedZones(featuredZones) {
    featuredContainer.innerHTML = "";
    featuredZones.forEach((file, index) => {
        const zoneItem = document.createElement("div");
        zoneItem.className = "zone-item";
        zoneItem.onclick = () => openZone(file);
        const img = document.createElement("img");
        img.dataset.src = file.cover.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);
        img.alt = file.name;
        img.loading = "lazy";
        img.className = "lazy-zone-img";
        zoneItem.appendChild(img);
        const button = document.createElement("button");
        button.textContent = file.name;
        button.onclick = (event) => {
            event.stopPropagation();
            openZone(file);
        };
        zoneItem.appendChild(button);
        featuredContainer.appendChild(zoneItem);
    });
    if (featuredContainer.innerHTML === "") {
        featuredContainer.innerHTML = "No featured games found.";
    } else {
        document.getElementById("allZonesSummary").textContent = `Featured Games (${featuredZones.length})`;
    }
    observeLazyImages('#featuredZones img.lazy-zone-img');
}

function displayZones(zones) {
    container.innerHTML = "";
    zones.forEach((file, index) => {
        const zoneItem = document.createElement("div");
        zoneItem.className = "zone-item";
        zoneItem.onclick = () => openZone(file);
        const img = document.createElement("img");
        img.dataset.src = file.cover.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);
        img.alt = file.name;
        img.loading = "lazy";
        img.className = "lazy-zone-img";
        zoneItem.appendChild(img);
        const button = document.createElement("button");
        button.textContent = file.name;
        button.onclick = (event) => {
            event.stopPropagation();
            openZone(file);
        };
        zoneItem.appendChild(button);
        container.appendChild(zoneItem);
    });
    if (container.innerHTML === "") {
        container.innerHTML = "No games found.";
    } else {
        document.getElementById("allSummary").textContent = `All Games (${zones.length})`;
    }
    observeLazyImages('img.lazy-zone-img');
}

function observeLazyImages(selector) {
    const lazyImages = document.querySelectorAll(selector);
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !zoneViewer.hidden) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove("lazy-zone-img");
                observer.unobserve(img);
            }
        });
    }, { rootMargin: "100px", threshold: 0.1 });
    lazyImages.forEach(img => imageObserver.observe(img));
}

function filterZones2() {
    const query = filterOptions.value;
    if (query === "none") {
        displayZones(zones);
    } else {
        const filteredZones = zones.filter(zone => zone.special?.includes(query));
        if (query.length !== 0) {
            document.getElementById("featuredZonesWrapper").removeAttribute("open");
        }
        displayZones(filteredZones);
    }
}

function filterZones() {
    const query = searchBar.value.toLowerCase();
    const filteredZones = zones.filter(zone => zone.name.toLowerCase().includes(query));
    if (query.length !== 0) {
        document.getElementById("featuredZonesWrapper").removeAttribute("open");
    }
    displayZones(filteredZones);
}

function openZone(file) {
    if (file.url.startsWith("http")) {
        window.open(file.url, "_blank");
    } else {
        const url = file.url.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);
        fetch(url + "?t=" + Date.now()).then(response => response.text()).then(html => {
            if (zoneFrame.contentDocument === null) {
                zoneFrame = document.createElement("iframe");
                zoneFrame.id = "zoneFrame";
                zoneViewer.appendChild(zoneFrame);
            }
            zoneFrame.contentDocument.open();
            zoneFrame.contentDocument.write(html);
            zoneFrame.contentDocument.close();
            document.getElementById('zoneName').textContent = file.name;
            document.getElementById('zoneId').textContent = file.id;
            document.getElementById('zoneAuthor').textContent = "by " + file.author;
            if (file.authorLink) {
                document.getElementById('zoneAuthor').href = file.authorLink;
            }
            zoneViewer.style.display = "block";
            try {
                const url = new URL(window.location);
                url.searchParams.set('id', file.id);
                history.pushState(null, '', url.toString());
            } catch (error) {}
            zoneViewer.hidden = true;
        }).catch(error => alert("Failed to load game: " + error));
    }
}

function aboutBlank() {
    const newWindow = window.open("about:blank", "_blank");
    let zone = zones.find(zone => zone.id + '' === document.getElementById('zoneId').textContent).url.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);
    fetch(zone + "?t=" + Date.now()).then(response => response.text()).then(html => {
        if (newWindow) {
            newWindow.document.open();
            newWindow.document.write(html);
            newWindow.document.close();
        }
    });
}

function closeZone() {
    zoneViewer.hidden = false;
    zoneViewer.style.display = "none";
    zoneViewer.removeChild(zoneFrame);
    try {
        const url = new URL(window.location);
        url.searchParams.delete('id');
        history.pushState(null, '', url.toString());
    } catch (error) {}
}

function downloadZone() {
    let zone = zones.find(zone => zone.id + '' === document.getElementById('zoneId').textContent);
    fetch(zone.url.replace("{HTML_URL}", htmlURL) + "?t=" + Date.now()).then(res => res.text()).then(text => {
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = zone.name + ".html";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

function fullscreenZone() {
    if (zoneFrame.requestFullscreen) {
        zoneFrame.requestFullscreen();
    } else if (zoneFrame.mozRequestFullScreen) {
        zoneFrame.mozRequestFullScreen();
    } else if (zoneFrame.webkitRequestFullscreen) {
        zoneFrame.webkitRequestFullscreen();
    } else if (zoneFrame.msRequestFullscreen) {
        zoneFrame.msRequestFullscreen();
    }
}

function showZoneInfo() {
    let id = Number(document.getElementById('zoneId').textContent);
    fetch(`https://api.github.com/repos/%67%6e%2d%6d%61%74%68/html/commits?path=${id}.html`).then(res => res.json()).then(async json => {
        let stats = await getStats(id);
        idjson = zones.filter(a => a.id === id)[0];
        const date = new Date(json.at(-1).commit.author.date);
        let formatteddate = new Intl.DateTimeFormat("en-US", {
            month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true
        }).format(date);
        alert(`ID: ${id}\nName: ${idjson.name}\n${idjson.author ? 'Author: ' + idjson.author + '\n' : ''}${idjson.special ? 'Tags: ' + idjson.special + '\n' : ''}Added by: ${json.at(-1).commit.author.name}\nDate Added: ${formatteddate}\nTimes Played: ${Number(stats).toLocaleString("en-US")}`);
    });
}

let _allStatsCache = null;

async function getAllStats() {
    if (_allStatsCache) return _allStatsCache;
    const BASE_URL = "https://data.jsdelivr.com/v1/stats/packages/gh/%67%6e%2d%6d%61%74%68/html@main/files";
    const PERIOD = "year";
    const PAGE_BATCH = 5;
    let page = 1;
    let done = false;
    const combinedMap = Object.create(null);
    while (!done) {
        const pages = Array.from({ length: PAGE_BATCH }, (_, i) => page + i);
        const responses = await Promise.all(
            pages.map(p => fetch(`${BASE_URL}?period=${PERIOD}&page=${p}&limit=100`).then(r => (r.ok ? r.json() : [])))
        );
        for (const data of responses) {
            if (!Array.isArray(data) || data.length === 0) { done = true; break; }
            for (const item of data) {
                if (!item?.name) continue;
                const match = item.name.match(/^\/(\d+)([.-])/);
                if (!match) continue;
                const id = match[1];
                if (!combinedMap[id]) combinedMap[id] = { hits: 0, bandwidth: 0 };
                combinedMap[id].hits += item.hits?.total ?? 0;
                combinedMap[id].bandwidth += item.bandwidth?.total ?? 0;
            }
        }
        page += PAGE_BATCH;
    }
    _allStatsCache = combinedMap;
    return combinedMap;
}

async function getStats(id) {
    id = String(id);
    const allStats = await getAllStats();
    return allStats[id]?.hits ?? 0;
}

listZones();
