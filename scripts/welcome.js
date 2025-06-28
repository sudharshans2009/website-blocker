// Welcome page JavaScript for FocusGuard

// Handle button clicks
document.addEventListener('DOMContentLoaded', function() {
    // Setup button event listeners
    const openSettingsBtn = document.getElementById('openSettings');
    const startBlockingBtn = document.getElementById('startBlocking');

    if (openSettingsBtn) {
        openSettingsBtn.addEventListener('click', function() {
            chrome.runtime.openOptionsPage();
        });
    }

    if (startBlockingBtn) {
        startBlockingBtn.addEventListener('click', function() {
            // Close this tab and open the popup
            chrome.action.openPopup();
        });
    }

    // Add interactive animations
    animateFeatures();
    animateSteps();
});

function animateFeatures() {
    const features = document.querySelectorAll('.feature');
    features.forEach((feature, index) => {
        setTimeout(() => {
            feature.style.opacity = '0';
            feature.style.transform = 'translateY(20px)';
            feature.style.transition = 'all 0.6s ease';
            
            setTimeout(() => {
                feature.style.opacity = '1';
                feature.style.transform = 'translateY(0)';
            }, 100);
        }, index * 100);
    });
}

function animateSteps() {
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        setTimeout(() => {
            step.style.opacity = '0';
            step.style.transform = 'translateX(-20px)';
            step.style.transition = 'all 0.6s ease';
            
            setTimeout(() => {
                step.style.opacity = '1';
                step.style.transform = 'translateX(0)';
            }, 100);
        }, (index * 150) + 800);
    });
}

// Keyboard shortcuts handler
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        chrome.action.openPopup();
    }
});