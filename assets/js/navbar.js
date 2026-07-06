// ===== Shared Navbar Component =====
(function () {

    const navbarHTML = `
    <nav class="navbar nav-down" aria-label="Main navigation">
        <div class="container">
            <a href="index.html" class="nav-name">Arjun Wankhede</a>
            <button class="hamburger" aria-label="Toggle navigation menu">
                <span></span><span></span><span></span>
            </button>
            <ul class="nav-links" role="menubar">
                <li role="none"><a href="index.html" role="menuitem">Home</a></li>
                <li role="none"><a href="about.html" role="menuitem">About</a></li>
                <li role="none"><a href="blogs.html" role="menuitem">Blogs</a></li>
                <li role="none"><a href="work.html" role="menuitem">Work</a></li>
            </ul>
            <div class="nav-social" aria-label="Social links">
                <a href="https://www.linkedin.com/in/wankhedearjun/" target="_blank" rel="noopener noreferrer" title="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
                <a href="https://github.com/ArjunW08" target="_blank" rel="noopener noreferrer" title="GitHub"><i class="fab fa-github"></i></a>
                <a href="https://leetcode.com/u/ArjunW08/" target="_blank" rel="noopener noreferrer" title="LeetCode"><img class="nav-icon" src="https://cdn.simpleicons.org/leetcode/666666" alt="LeetCode"></a>
                <a href="https://substack.com/@arjunw08" target="_blank" rel="noopener noreferrer" title="Substack"><img class="nav-icon" src="https://cdn.simpleicons.org/substack/666666" alt="Substack"></a>
            </div>
        </div>
    </nav>`;

    const placeholder = document.getElementById('navbar');
    if (placeholder) {
        placeholder.innerHTML = navbarHTML;
    }
})();
