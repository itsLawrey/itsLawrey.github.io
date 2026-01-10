const pdfPaths = {
    'en': 'thesis-lorand-rat-movement_hungarian.pdf',
    'hu': 'thesis-lorand-rat-movement_compressed.pdf'
};

function switchLanguage(lang) {
    const pdfUrl = pdfPaths[lang];
    const objectTag = document.getElementById('pdfObject');
    const iframeTag = document.getElementById('pdfIframe');
    const buttons = document.querySelectorAll('.lang-btn');

    // Update viewer
    objectTag.setAttribute('data', pdfUrl);
    iframeTag.setAttribute('src', pdfUrl);

    // Update active state in switcher
    buttons.forEach(btn => btn.classList.remove('active'));
    // Find button with specific onclick handler string or assume event handling
    // Using a simpler approach: finding by text or data-lang if added.
    // For now, relying on the clicked element if available.
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

// Modal Logic
function openDownloadModal(e) {
    if(e) e.preventDefault();
    document.getElementById('downloadModal').classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

function closeDownloadModal() {
    document.getElementById('downloadModal').classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
}

function downloadPdf(lang) {
    const url = pdfPaths[lang];
    const link = document.createElement('a');
    link.href = url;
    link.download = url; // Uses filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    closeDownloadModal();
}

// Close modal when clicking outside content
window.addEventListener('click', function(e) {
    const modal = document.getElementById('downloadModal');
    if (e.target === modal) {
        closeDownloadModal();
    }
});
