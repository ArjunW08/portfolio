// ===== Portfolio — Vanilla JS =====

document.addEventListener('DOMContentLoaded', function () {

    // --- Hamburger Toggle ---
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function () {
            navLinks.classList.toggle('open');
        });
    }

    // --- Hide/Show Navbar on Scroll ---
    const navbar = document.querySelector('.navbar');
    let lastScrollTop = 0;
    const delta = 5;
    let navbarHeight = navbar ? navbar.offsetHeight : 60;

    window.addEventListener('scroll', function () {
        const st = window.pageYOffset || document.documentElement.scrollTop;

        if (Math.abs(lastScrollTop - st) <= delta) return;

        if (st > lastScrollTop && st > navbarHeight) {
            // Scroll down — hide
            navbar.classList.add('nav-up');
            navbar.classList.remove('nav-down');
        } else {
            // Scroll up — show
            if (st + window.innerHeight < document.documentElement.scrollHeight) {
                navbar.classList.remove('nav-up');
                navbar.classList.add('nav-down');
            }
        }

        lastScrollTop = st;
    });

    // --- Active Nav Link ---
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(function (link) {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });

    // --- Contact Form with Security Question ---
    const contactForm = document.getElementById('contact-form');
    const sqNum1El = document.getElementById('sq-num1');
    const sqNum2El = document.getElementById('sq-num2');
    let sqAnswer = 0;

    // Generate security question on load
    if (sqNum1El && sqNum2El) {
        const n1 = Math.floor(Math.random() * 20) + 1;
        const n2 = Math.floor(Math.random() * 20) + 1;
        sqNum1El.textContent = n1;
        sqNum2El.textContent = n2;
        sqAnswer = n1 + n2;
    }

    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Validate security question
            const securityInput = document.getElementById('security');
            const securityError = document.getElementById('security-error');
            if (securityInput && parseInt(securityInput.value, 10) !== sqAnswer) {
                if (securityError) securityError.style.display = 'block';
                securityInput.focus();
                return;
            }
            if (securityError) securityError.style.display = 'none';

            // Gather form data
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value || 'Contact from Portfolio';
            const message = document.getElementById('message').value;

            // Build mailto link — uses email from data.json (set via data-recipient)
            const recipient = contactForm.dataset.recipient || 'YOUR_EMAIL_HERE';
            const mailSubject = encodeURIComponent(subject);
            const mailBody = encodeURIComponent(
                'Name: ' + name + '\nEmail: ' + email + '\n\n' + message
            );
            window.location.href = 'mailto:' + recipient + '?subject=' + mailSubject + '&body=' + mailBody;

            // Visual feedback
            const btn = contactForm.querySelector('.btn-submit');
            const originalText = btn.textContent;
            btn.textContent = 'Opening mail client...';
            btn.style.background = '#038252';
            setTimeout(function () {
                btn.textContent = originalText;
                btn.style.background = '';
                contactForm.reset();
                // Regenerate security question
                if (sqNum1El && sqNum2El) {
                    const n1 = Math.floor(Math.random() * 20) + 1;
                    const n2 = Math.floor(Math.random() * 20) + 1;
                    sqNum1El.textContent = n1;
                    sqNum2El.textContent = n2;
                    sqAnswer = n1 + n2;
                }
            }, 2500);
        });
    }

});
