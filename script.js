// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        // Get and validate the href attribute
        const href = this.getAttribute('href');
        
        // Security: Only allow simple fragment identifiers (no complex selectors)
        // This prevents potential XSS if user input were ever incorporated
        if (!href || !href.match(/^#[a-zA-Z0-9_-]+$/)) {
            return;
        }
        
        // Use getElementById for better security and performance
        const targetId = href.substring(1);
        const target = document.getElementById(targetId);
        
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add active class to navigation on scroll
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('nav a');

    let current = '';
    // Check if we've reached the bottom of the page
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50) {
        current = 'contact';
    } else {
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - 100)) {
                const id = section.getAttribute('id');
                if (id) {
                    current = id;
                }
            }
        });
    }

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// ==================== Contact Form Modal ====================

// Modal elements
const modal = document.getElementById('contactModal');
const openBtn = document.getElementById('openContactFormBtn');
const closeBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const contactForm = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const formStatus = document.getElementById('formStatus');

// Form fields
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const subjectInput = document.getElementById('subject');
const messageInput = document.getElementById('message');
const honeypotInput = document.getElementById('honeypot');

// Error message elements
const nameError = document.getElementById('nameError');
const emailError = document.getElementById('emailError');
const subjectError = document.getElementById('subjectError');
const messageError = document.getElementById('messageError');

// Rate limiting configuration
const RATE_LIMIT_KEY = 'contactFormSubmissions';
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes in milliseconds
const MAX_SUBMISSIONS = 3;

// Open modal
function openModal(e) {
    if (e) e.preventDefault();
    resetForm(); // Ensure fresh state every time
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
    // Focus first input for accessibility
    setTimeout(() => nameInput.focus(), 100);
}

// Close modal
function closeModal() {
    // Add closing class to trigger animation
    modal.classList.add('closing');
    
    // Wait for animation to finish (300ms matches CSS)
    setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.remove('closing');
        document.body.classList.remove('modal-open');
        resetForm();
    }, 300);
}

// Reset form
function resetForm() {
    contactForm.reset();
    clearErrors();
    formStatus.style.display = 'none';
    formStatus.className = 'form-status';
    setLoadingState(false);
    
    // Hide progress bar
    const progressBarContainer = document.getElementById('progressBarContainer');
    if (progressBarContainer) {
        progressBarContainer.style.display = 'none';
    }
}

// Clear all error messages
function clearErrors() {
    [nameError, emailError, subjectError, messageError].forEach(error => {
        error.textContent = '';
    });
    document.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('has-error');
    });
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Sanitize input to prevent XSS
function sanitizeInput(input) {
    const temp = document.createElement('div');
    temp.textContent = input;
    return temp.innerHTML;
}

// Validate single field
function validateField(field, errorElement, validationFn, errorMsg) {
    const value = field.value.trim();
    const isValid = validationFn(value);
    
    if (!isValid) {
        errorElement.textContent = errorMsg;
        field.closest('.form-group').classList.add('has-error');
        return false;
    } else {
        errorElement.textContent = '';
        field.closest('.form-group').classList.remove('has-error');
        return true;
    }
}

// Validate all fields
function validateForm() {
    let isValid = true;
    
    // Validate name
    isValid = validateField(
        nameInput,
        nameError,
        (val) => val.length >= 2 && val.length <= 100,
        'Name must be between 2 and 100 characters'
    ) && isValid;
    
    // Validate email
    isValid = validateField(
        emailInput,
        emailError,
        (val) => isValidEmail(val) && val.length <= 100,
        'Please enter a valid email address'
    ) && isValid;
    
    // Validate subject
    isValid = validateField(
        subjectInput,
        subjectError,
        (val) => val.length >= 3 && val.length <= 150,
        'Subject must be between 3 and 150 characters'
    ) && isValid;
    
    // Validate message
    isValid = validateField(
        messageInput,
        messageError,
        (val) => val.length >= 10 && val.length <= 5000,
        'Message must be between 10 and 5000 characters'
    ) && isValid;
    
    return isValid;
}

// Check rate limiting
function checkRateLimit() {
    try {
        const submissionsData = localStorage.getItem(RATE_LIMIT_KEY);
        const now = Date.now();
        
        if (!submissionsData) {
            return true;
        }
        
        const submissions = JSON.parse(submissionsData);
        
        // Filter submissions within the rate limit window
        const recentSubmissions = submissions.filter(timestamp => 
            now - timestamp < RATE_LIMIT_WINDOW
        );
        
        // Update localStorage with recent submissions only
        localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(recentSubmissions));
        
        return recentSubmissions.length < MAX_SUBMISSIONS;
    } catch (e) {
        // If localStorage fails, allow submission
        return true;
    }
}

// Record submission
function recordSubmission() {
    try {
        const submissionsData = localStorage.getItem(RATE_LIMIT_KEY);
        const now = Date.now();
        const submissions = submissionsData ? JSON.parse(submissionsData) : [];
        
        submissions.push(now);
        localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(submissions));
    } catch (e) {
        // Silently fail if localStorage is not available
        console.warn('Could not record submission for rate limiting');
    }
}

// Set loading state
function setLoadingState(isLoading) {
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    if (isLoading) {
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-block';
        submitBtn.disabled = true;
    } else {
        btnText.style.display = 'inline-block';
        btnLoading.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// Show status message
function showStatus(message, isSuccess) {
    formStatus.textContent = message;
    formStatus.className = `form-status ${isSuccess ? 'success' : 'error'}`;
    formStatus.style.display = 'block';
    
    // Auto-hide success message and close modal after 5 seconds with progress bar
    if (isSuccess) {
        const progressBarContainer = document.getElementById('progressBarContainer');
        const progressBar = document.getElementById('progressBar');
        
        // Show and animate progress bar
        progressBarContainer.style.display = 'block';
        progressBar.style.width = '0%';
        
        // Trigger animation
        setTimeout(() => {
            progressBar.style.width = '100%';
        }, 10);
        
        // Close modal after 5 seconds (matched with CSS transition)
        setTimeout(() => {
            closeModal();
        }, 5000);

        // Auto-scroll to bottom to ensure message is visible
        const modalContainer = document.querySelector('.modal-container');
        if (modalContainer) {
            setTimeout(() => {
                modalContainer.scrollTo({
                    top: modalContainer.scrollHeight,
                    behavior: 'smooth'
                });
            }, 100); // Small delay to ensure layout update
        }
    }
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();
    
    // Clear previous status
    formStatus.style.display = 'none';
    
    // Check honeypot (spam protection)
    if (honeypotInput.value !== '') {
        console.warn('Honeypot triggered - potential spam');
        showStatus('There was an error submitting the form. Please try again.', false);
        return;
    }
    
    // Validate form
    if (!validateForm()) {
        showStatus('Please correct the errors above.', false);
        return;
    }
    
    // Check rate limiting
    if (!checkRateLimit()) {
        showStatus('Too many submissions. Please wait a few minutes before trying again.', false);
        return;
    }
    
    // Prepare form data
    const formData = {
        access_key: "cca3445a-d74a-4026-94c7-97ac79c1f129",
        name: sanitizeInput(nameInput.value.trim()),
        email: sanitizeInput(emailInput.value.trim()),
        subject: sanitizeInput(subjectInput.value.trim()),
        message: sanitizeInput(messageInput.value.trim()),
        from_name: sanitizeInput(nameInput.value.trim()),
        botcheck: "" // Web3Forms honeypot
    };
    
    setLoadingState(true);
    
    try {
        const response = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            recordSubmission();
            showStatus('✓ Message sent successfully! I\'ll get back to you soon.', true);
            contactForm.reset();
        } else {
            throw new Error(result.message || 'Submission failed');
        }
    } catch (error) {
        console.error('Form submission error:', error);
        showStatus('Failed to send message. Please try again or contact me via LinkedIn.', false);
    } finally {
        setLoadingState(false);
    }
}

// Ensure modal is hidden on load
document.addEventListener('DOMContentLoaded', () => {
    // Ensure form status is clean
    if (formStatus) {
        formStatus.style.display = 'none';
        formStatus.className = 'form-status';
    }
});

// Event listeners
openBtn.addEventListener('click', openModal);
closeBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
        closeModal();
    }
});

// Form submission
contactForm.addEventListener('submit', handleSubmit);

// Real-time validation on blur
nameInput.addEventListener('blur', () => validateField(
    nameInput, nameError,
    (val) => val.length >= 2 && val.length <= 100,
    'Name must be between 2 and 100 characters'
));

emailInput.addEventListener('blur', () => validateField(
    emailInput, emailError,
    (val) => isValidEmail(val) && val.length <= 100,
    'Please enter a valid email address'
));

subjectInput.addEventListener('blur', () => validateField(
    subjectInput, subjectError,
    (val) => val.length >= 3 && val.length <= 150,
    'Subject must be between 3 and 150 characters'
));

messageInput.addEventListener('blur', () => validateField(
    messageInput, messageError,
    (val) => val.length >= 10 && val.length <= 5000,
    'Message must be between 10 and 5000 characters'
));

// Hamburger Menu Logic
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const navLinksItems = document.querySelectorAll('.nav-links a');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = hamburger.querySelector('i');
        if (navLinks.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });

    // Close menu when a link is clicked
    navLinksItems.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            const icon = hamburger.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        });
    });
}
