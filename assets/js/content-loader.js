// ===== Content Loader — Reusable Blog & Project Fetcher =====
// Configure your Substack URL and GitHub username below.
// Leave empty to show "Will be uploaded soon" fallback.

let CONTENT_CONFIG = {
    substackUrl: '',
    substackPublications: [],
    githubUsername: ''
};

// ── Helpers ──────────────────────────────────────────────────

function formatDate(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

function renderEmpty(container, type) {
    container.innerHTML = `
        <div class="content-empty">
            <i class="fas ${type === 'blog' ? 'fa-pen-fancy' : 'fa-folder-open'}"></i>
            <p>Will be uploaded soon</p>
        </div>`;
}

function renderLoading(container) {
    container.innerHTML = `
        <div class="content-loading">
            <div class="loading-spinner"></div>
            <p>Loading...</p>
        </div>`;
}

// ── Data Config Fetcher ──────────────────────────────────────

let cachedConfigData = null;

async function fetchConfigData() {
    if (cachedConfigData) return cachedConfigData;
    try {
        const response = await fetch('assets/data/data.json');
        cachedConfigData = await response.json();
        
        // Populate global config from the social data
        if (cachedConfigData.social) {
            CONTENT_CONFIG.substackUrl = cachedConfigData.social.substack || '';
            CONTENT_CONFIG.substackPublications = cachedConfigData.social.substackPublications || [];
            const githubUrl = cachedConfigData.social.github || '';
            const parts = githubUrl.split('/');
            CONTENT_CONFIG.githubUsername = parts[parts.length - 1] || '';
        }

        return cachedConfigData;
    } catch (err) {
        console.error('Failed to load data.json', err);
        return null;
    }
}

// ── Blog Loader ──────────────────────────────────────────────

/**
 * Fetch blogs from Substack RSS and render into a container.
 * @param {string} containerSelector  CSS selector for the target element
 * @param {number} maxCount           Max items to show (0 = all)
 * @param {string} variant            'compact' (home) or 'card' (blogs page)
 */
function loadBlogs(containerSelector, maxCount, variant) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    renderLoading(container);

    fetchConfigData().then(function () {
        var publications = CONTENT_CONFIG.substackPublications;
        if (!publications || publications.length === 0) {
            renderEmpty(container, 'blog');
            return;
        }

        // Fetch RSS from all publications in parallel
        var feedPromises = publications.map(function (pubUrl) {
            var feedUrl = pubUrl.replace(/\/$/, '') + '/feed';
            var apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(feedUrl);
            return fetch(apiUrl)
                .then(function (res) { return res.json(); })
                .then(function (data) { return data.items || []; })
                .catch(function () { return []; });
        });

        Promise.all(feedPromises)
            .then(function (results) {
                // Merge all posts and sort by date (newest first)
                var allItems = [];
                results.forEach(function (items) {
                    allItems = allItems.concat(items);
                });
                allItems.sort(function (a, b) {
                    return new Date(b.pubDate) - new Date(a.pubDate);
                });

                if (allItems.length === 0) {
                    renderEmpty(container, 'blog');
                    return;
                }

                var items = maxCount > 0 ? allItems.slice(0, maxCount) : allItems;
                container.innerHTML = '';

                if (variant === 'compact') {
                    // Compact list for the home page
                    items.forEach(function (item) {
                        var div = document.createElement('div');
                        div.className = 'home-card-post';
                        div.innerHTML =
                            '<a href="' + item.link + '" target="_blank" rel="noopener">' + item.title + '</a>' +
                            '<span class="home-card-date">' + formatDate(item.pubDate) + '</span>';
                        container.appendChild(div);
                    });

                    // "View all posts" link
                    var viewAll = document.createElement('a');
                    viewAll.href = 'blogs.html';
                    viewAll.className = 'home-card-link';
                    viewAll.innerHTML = 'View all posts <i class="fas fa-arrow-right"></i>';
                    container.appendChild(viewAll);
                } else {
                    // Card grid for the blogs page
                    var grid = document.createElement('div');
                    grid.className = 'card-grid';

                    items.forEach(function (item) {
                        var snippet = stripHtml(item.description || '').substring(0, 160);
                        if (snippet.length >= 160) snippet += '…';
                        var imageUrl = item.thumbnail || (item.enclosure && item.enclosure.link) || '';

                        var card = document.createElement('div');
                        card.className = 'card content-card';
                        card.innerHTML =
                            (imageUrl
                                ? '<img class="card-img" src="' + imageUrl + '" alt="' + item.title + '">'
                                : '<div class="card-img card-img-placeholder"><i class="fas fa-newspaper"></i></div>') +
                            '<div class="card-body">' +
                            '  <h2 class="card-title"><a href="' + item.link + '" target="_blank" rel="noopener">' + item.title + '</a></h2>' +
                            '  <p class="card-text">' + snippet + '</p>' +
                            '</div>' +
                            '<div class="card-footer">' +
                            '  <div class="wrapfooter">' +
                            '    <span class="author-meta">' +
                            '      <span class="post-date">' + formatDate(item.pubDate) + '</span>' +
                            '    </span>' +
                            '    <span class="post-read-more"><a href="' + item.link + '" target="_blank" rel="noopener" title="Read Story">' +
                            '      <i class="fas fa-external-link-alt"></i></a></span>' +
                            '  </div>' +
                            '</div>';
                        grid.appendChild(card);
                    });

                    container.appendChild(grid);
                }
            })
            .catch(function () {
                renderEmpty(container, 'blog');
            });
    });
}

// ── Project Loader ───────────────────────────────────────────

/**
 * Fetch public repos from GitHub and render into a container.
 * @param {string} containerSelector  CSS selector for the target element
 * @param {number} maxCount           Max items to show (0 = all)
 * @param {string} variant            'compact' (home) or 'card' (work page)
 * @param {object} options            Additional options like { pinnedOnly: true }
 */
function loadProjects(containerSelector, maxCount, variant, options) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    renderLoading(container);

    fetchConfigData().then(function (configData) {
        if (!CONTENT_CONFIG.githubUsername) {
            renderEmpty(container, 'project');
            return;
        }

        if (!configData || !configData.work || !configData.work.projects) {
            renderEmpty(container, 'project');
            return;
        }

        var configuredProjects = configData.work.projects;
        if (options && options.pinnedOnly) {
            configuredProjects = configuredProjects.filter(function (p) { return p.pinned; });
        }

        if (configuredProjects.length === 0) {
            renderEmpty(container, 'project');
            return;
        }

        // Extract "username/repo" from GitHub URLs and fetch details individually
        var fetchPromises = configuredProjects.map(function (proj) {
            var parts = proj.repo.split('/');
            var repoPath = parts[parts.length - 2] + '/' + parts[parts.length - 1];
            return fetch('https://api.github.com/repos/' + repoPath)
                .then(function (res) { return res.ok ? res.json() : null; })
                .then(function (repoData) {
                    if (repoData) {
                        repoData._configTags = proj.tags || '';
                    }
                    return repoData;
                })
                .catch(function () { return null; });
        });

        Promise.all(fetchPromises)
            .then(function (reposData) {
                // Filter out nulls
                var repos = reposData.filter(function (r) { return r !== null; });
            if (!Array.isArray(repos) || repos.length === 0) {
                renderEmpty(container, 'project');
                return;
            }

                // No sorting by date anymore, trusting the order in data.json.
                var filtered = repos;

            if (filtered.length === 0) {
                renderEmpty(container, 'project');
                return;
            }

            var items = maxCount > 0 ? filtered.slice(0, maxCount) : filtered;
            container.innerHTML = '';

            if (variant === 'compact') {
                // Compact list for the home page
                items.forEach(function (repo) {
                    var firstTagHtml = '';
                    var tagsStr = repo._configTags || '';
                    if (tagsStr.trim()) {
                        var tagsArray = tagsStr.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
                        if (tagsArray.length > 0) {
                            firstTagHtml = '<span class="project-tag-compact">' + tagsArray[0] + '</span>';
                        }
                    }

                    var div = document.createElement('div');
                    div.className = 'home-card-post';
                    div.innerHTML =
                        '<a href="' + repo.html_url + '" target="_blank" rel="noopener">' + repo.name + '</a>' +
                        firstTagHtml;
                    container.appendChild(div);
                });

                // "View all projects" link
                var viewAll = document.createElement('a');
                viewAll.href = 'work.html';
                viewAll.className = 'home-card-link';
                viewAll.innerHTML = 'View all projects <i class="fas fa-arrow-right"></i>';
                container.appendChild(viewAll);
            } else {
                // Card grid for the work page
                var grid = document.createElement('div');
                grid.className = 'card-grid';

                items.forEach(function (repo) {
                    var desc = repo.description || 'No description provided.';
                    
                    var tagsHtml = '';
                    var tagsStr = repo._configTags || '';
                    if (tagsStr.trim()) {
                        var tagsArray = tagsStr.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
                        if (tagsArray.length > 0) {
                            tagsHtml = '<div class="project-tags">' +
                                tagsArray.map(function (t) { return '<span class="project-tag">' + t + '</span>'; }).join('') +
                                '</div>';
                        }
                    }

                    var starsHtml = '';
                    if (repo.stargazers_count > 0) {
                        starsHtml = '  <div class="project-meta">' +
                            '    <span class="project-stars"><i class="fas fa-star"></i> ' + repo.stargazers_count + '</span>' +
                            '  </div>';
                    }

                    var card = document.createElement('div');
                    card.className = 'card content-card project-card';
                    card.innerHTML =
                        '<div class="card-body">' +
                        '  <h2 class="card-title"><a href="' + repo.html_url + '" target="_blank" rel="noopener">' +
                        '    <i class="fas fa-code-branch"></i> ' + repo.name + '</a></h2>' +
                        '  <p class="card-text">' + desc + '</p>' +
                        tagsHtml +
                        starsHtml +
                        '</div>';
                    grid.appendChild(card);
                });

                container.appendChild(grid);
            }
        })
        .catch(function () {
            renderEmpty(container, 'project');
        });
    });
}

// ── Work Experience Loader ───────────────────────────────────

function loadWorkExperience(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    renderLoading(container);

    fetchConfigData().then(function (data) {
        if (!data || !data.work || !data.work.experience || data.work.experience.length === 0) {
            renderEmpty(container, 'file-alt');
            return;
        }

        container.innerHTML = '';
        data.work.experience.forEach(function (exp) {
            var detailsHtml = '';
            if (exp.details && exp.details.length > 0) {
                detailsHtml = '<ul>' + exp.details.map(function (d) { return '<li>' + d + '</li>'; }).join('') + '</ul>';
            }

            var item = document.createElement('div');
            item.className = 'timeline-item';
            item.innerHTML =
                '<div class="timeline-dot"></div>' +
                '<div class="timeline-date">' + exp.duration + '</div>' +
                '<div class="timeline-card">' +
                '  <h3>' + exp.designation + '</h3>' +
                '  <div class="company">' + exp.company + (exp.location ? ' - ' + exp.location : '') + '</div>' +
                detailsHtml +
                '</div>';
            container.appendChild(item);
        });
    });
}

// ── About Page Loader ────────────────────────────────────────

function loadAboutData() {
    fetchConfigData().then(function (data) {
        if (!data || !data.about) return;

        var about = data.about;

        // About Me paragraph
        var aboutMeContainer = document.querySelector('#about-me-content');
        if (aboutMeContainer && about.me) {
            aboutMeContainer.innerHTML = '<p>' + about.me + '</p>';
        }

        // Expertise list
        var expertiseContainer = document.querySelector('#about-expertise-list');
        if (expertiseContainer && about.expertise) {
            expertiseContainer.innerHTML = '';
            about.expertise.forEach(function (skill) {
                var li = document.createElement('li');
                li.innerHTML = '<i class="fas fa-check-circle"></i> ' + skill;
                expertiseContainer.appendChild(li);
            });
        }

        // Education
        var educationContainer = document.querySelector('#about-education-container');
        if (educationContainer && about.education) {
            educationContainer.innerHTML = '';
            about.education.forEach(function (edu) {
                var item = document.createElement('div');
                item.className = 'education-item';
                item.innerHTML =
                    '<h4>' + edu.degree + ' in ' + edu.stream + '</h4>' +
                    '<p class="education-meta">' + edu.college + ' · ' + edu.location + '</p>' +
                    '<p>CGPA: ' + edu.cgpa + '</p>';
                educationContainer.appendChild(item);
            });
        }

        // Currently doing
        var currentlyContainer = document.querySelector('#about-currently-list');
        if (currentlyContainer && about.currently) {
            currentlyContainer.innerHTML = '';
            about.currently.forEach(function (curr) {
                var li = document.createElement('li');
                li.innerText = curr;
                currentlyContainer.appendChild(li);
            });
        }

        // Contact links (Other ways to reach me)
        var social = data.social;
        var contactList = document.querySelector('#contact-links');
        if (social && contactList) {
            var items = [];
            if (social.email) {
                items.push('<li><strong>Email</strong> : <a href="mailto:' + social.email + '">' + social.email + '</a></li>');
            }
            if (social.phone) {
                items.push('<li><strong>Phone</strong> : <a href="tel:' + social.phone.replace(/\s/g, '') + '">' + social.phone + '</a></li>');
            }
            if (social.github) {
                var ghLabel = social.github.replace('https://', '');
                items.push('<li><strong>GitHub</strong> : <a href="' + social.github + '" target="_blank">' + ghLabel + '</a></li>');
            }
            if (social.leetcode) {
                var lcLabel = social.leetcode.replace('https://', '');
                items.push('<li><strong>LeetCode</strong> : <a href="' + social.leetcode + '" target="_blank">' + lcLabel + '</a></li>');
            }
            if (social.linkedin) {
                var liLabel = social.linkedin.replace('https://www.', '');
                items.push('<li><strong>LinkedIn</strong> : <a href="' + social.linkedin + '" target="_blank">' + liLabel + '</a></li>');
            }
            if (social.substack) {
                var ssLabel = social.substack.replace('https://', '');
                items.push('<li><strong>Substack</strong> : <a href="' + social.substack + '" target="_blank">' + ssLabel + '</a></li>');
            }
            contactList.innerHTML = items.join('');
        }
    });
}

// ── Social & Global Config Loader ────────────────────────────

function loadSocialLinks() {
    fetchConfigData().then(function (data) {
        if (!data || !data.social) return;

        const s = data.social;

        // Helper to update specific links if they exist on the page
        const updateLink = (selector, url, isMailto = false) => {
            if (!url) return;
            const finalUrl = isMailto ? (url.startsWith('mailto:') ? url : 'mailto:' + url) : url;
            document.querySelectorAll(selector).forEach(el => {
                if (el) el.href = finalUrl;
            });
        };

        // --- Global Updates (Navbar & Footer) ---
        updateLink('a[title="Email"], a[href^="mailto:"]', s.email, true);
        updateLink('a[title="LinkedIn"]', s.linkedin);
        updateLink('a[title="GitHub"]', s.github);
        updateLink('a[title="LeetCode"]', s.leetcode);
        updateLink('a[title="Substack"]', s.substack);

        // --- Homepage Specific Buttons ---
        updateLink('#hero-resume-btn', s.resume);
        updateLink('#home-contact-btn', 'about.html');
    });
}

// Automatically load social links on every page load
document.addEventListener('DOMContentLoaded', function() {
    loadSocialLinks();
});

