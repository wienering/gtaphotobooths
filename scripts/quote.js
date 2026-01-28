// Quote Tool JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // State management
    const quoteData = {
        contact: {},
        package: {
            hours: 0,
            price: 0
        },
        addons: {
            unlimitedPrints: false,
            glamBooth: false,
            waitingTime: 0
        },
        total: 0
    };

    // DOM elements
    const steps = document.querySelectorAll('.quote-step');
    const stepIndicators = document.querySelectorAll('.step-indicator');
    const contactForm = document.getElementById('contactForm');
    const packagesGrid = document.getElementById('packagesGrid');
    const packageCards = document.querySelectorAll('.package-card');
    const unlimitedPrintsCheckbox = document.getElementById('unlimitedPrints');
    const glamBoothCheckbox = document.getElementById('glamBooth');
    const waitingTimeCheckbox = document.getElementById('waitingTime');
    const waitingHoursInput = document.getElementById('waitingHours');
    const reviewQuoteBtn = document.getElementById('reviewQuote');
    const sendQuoteBtn = document.getElementById('sendQuote');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const successMessage = document.getElementById('successMessage');

    // Step navigation
    function showStep(stepNumber) {
        // Hide all steps
        steps.forEach(step => step.classList.remove('active'));
        
        // Show selected step
        const targetStep = document.getElementById(`step${stepNumber}`);
        if (targetStep) {
            targetStep.classList.add('active');
        }

        // Update step indicators
        stepIndicators.forEach((indicator, index) => {
            const stepNum = index + 1;
            indicator.classList.remove('active', 'completed');
            
            if (stepNum === stepNumber) {
                indicator.classList.add('active');
            } else if (stepNum < stepNumber) {
                indicator.classList.add('completed');
            }
        });
    }

    // Contact form submission
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Collect contact data
            quoteData.contact = {
                fullName: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                eventDate: document.getElementById('eventDate').value
            };

            // Validate
            if (!quoteData.contact.fullName || !quoteData.contact.email || 
                !quoteData.contact.phone || !quoteData.contact.eventDate) {
                alert('Please fill in all required fields.');
                return;
            }

            // Send contact info to API (don't block on error, just log it)
            try {
                await fetch('/api/quote-contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(quoteData.contact),
                });
            } catch (error) {
                // Silently fail - don't interrupt user flow
                console.error('Error sending contact info:', error);
            }

            // Move to step 2
            showStep(2);
            updatePackageSummary();
        });
    }

    // Package selection
    packageCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove selected class from all cards
            packageCards.forEach(c => c.classList.remove('selected'));
            
            // Add selected class to clicked card
            this.classList.add('selected');
            
            // Update quote data
            quoteData.package.hours = parseInt(this.dataset.hours);
            quoteData.package.price = parseInt(this.dataset.price);
            
            // Enable review button
            if (reviewQuoteBtn) {
                reviewQuoteBtn.disabled = false;
            }
            
            // Update unlimited prints price if selected
            updateUnlimitedPrintsPrice();
            updatePackageSummary();
        });
    });

    // Add-ons
    if (unlimitedPrintsCheckbox) {
        unlimitedPrintsCheckbox.addEventListener('change', function() {
            quoteData.addons.unlimitedPrints = this.checked;
            updateUnlimitedPrintsPrice();
            updatePackageSummary();
        });
    }

    if (glamBoothCheckbox) {
        glamBoothCheckbox.addEventListener('change', function() {
            quoteData.addons.glamBooth = this.checked;
            updatePackageSummary();
        });
    }

    if (waitingTimeCheckbox) {
        waitingTimeCheckbox.addEventListener('change', function() {
            waitingHoursInput.disabled = !this.checked;
            if (!this.checked) {
                waitingHoursInput.value = 0;
                quoteData.addons.waitingTime = 0;
            } else {
                // Automatically set to 1 hour when checked
                if (parseInt(waitingHoursInput.value) === 0) {
                    waitingHoursInput.value = 1;
                }
                quoteData.addons.waitingTime = parseInt(waitingHoursInput.value) || 1;
            }
            updateWaitingTimePrice();
            updatePackageSummary();
        });
    }

    if (waitingHoursInput) {
        waitingHoursInput.addEventListener('change', function() {
            if (waitingTimeCheckbox && waitingTimeCheckbox.checked) {
                quoteData.addons.waitingTime = parseInt(this.value) || 0;
                updateWaitingTimePrice();
                updatePackageSummary();
            }
        });
    }

    // Update waiting time price display
    function updateWaitingTimePrice() {
        const waitingTimePriceDisplay = document.getElementById('waitingTimePriceDisplay');
        if (waitingTimePriceDisplay && quoteData.addons.waitingTime > 0) {
            const price = quoteData.addons.waitingTime * 50;
            waitingTimePriceDisplay.textContent = `$${price}`;
        } else if (waitingTimePriceDisplay) {
            waitingTimePriceDisplay.textContent = '$0';
        }
    }

    // Update unlimited prints price based on selected package hours
    function updateUnlimitedPrintsPrice() {
        const unlimitedPrintsPriceDisplay = document.getElementById('unlimitedPrintsPriceDisplay');
        if (unlimitedPrintsPriceDisplay && quoteData.package.hours > 0) {
            const price = quoteData.package.hours * 60;
            unlimitedPrintsPriceDisplay.textContent = `$${price}`;
        } else if (unlimitedPrintsPriceDisplay) {
            unlimitedPrintsPriceDisplay.textContent = '$120';
        }
    }

    // Calculate and update summary
    function updatePackageSummary() {
        // Calculate totals
        let basePrice = quoteData.package.price || 0;
        // Unlimited prints scales at $60 per hour
        let unlimitedPrintsPrice = quoteData.addons.unlimitedPrints && quoteData.package.hours > 0 
            ? quoteData.package.hours * 60 
            : 0;
        let glamBoothPrice = quoteData.addons.glamBooth ? 75 : 0;
        // Waiting time scales at $50 per hour
        let waitingTimePrice = quoteData.addons.waitingTime > 0 
            ? quoteData.addons.waitingTime * 50 
            : 0;
        
        const total = basePrice + unlimitedPrintsPrice + glamBoothPrice + waitingTimePrice;
        quoteData.total = total;

        // Update summary display
        const basePackagePriceEl = document.getElementById('basePackagePrice');
        const unlimitedPrintsPriceEl = document.getElementById('unlimitedPrintsPrice');
        const glamBoothPriceEl = document.getElementById('glamBoothPrice');
        const waitingTimePriceEl = document.getElementById('waitingTimePrice');
        const totalPriceEl = document.getElementById('totalPrice');

        if (basePackagePriceEl) {
            basePackagePriceEl.textContent = basePrice > 0 ? `$${basePrice.toLocaleString()}` : '$0';
        }
        if (unlimitedPrintsPriceEl) {
            unlimitedPrintsPriceEl.textContent = unlimitedPrintsPrice > 0 ? `$${unlimitedPrintsPrice}` : '$0';
        }
        if (glamBoothPriceEl) {
            glamBoothPriceEl.textContent = glamBoothPrice > 0 ? `$${glamBoothPrice}` : '$0';
        }
        if (waitingTimePriceEl) {
            waitingTimePriceEl.textContent = waitingTimePrice > 0 ? `$${waitingTimePrice}` : '$0';
        }
        if (totalPriceEl) {
            totalPriceEl.textContent = `$${total.toLocaleString()}`;
        }
    }

    // Review quote button
    if (reviewQuoteBtn) {
        reviewQuoteBtn.addEventListener('click', function() {
            if (quoteData.package.price === 0) {
                alert('Please select a package.');
                return;
            }

            // Populate review step
            populateReviewStep();
            
            // Move to step 3
            showStep(3);
        });
    }

    // Populate review step
    function populateReviewStep() {
        // Contact info
        const reviewName = document.getElementById('reviewName');
        const reviewEmail = document.getElementById('reviewEmail');
        const reviewPhone = document.getElementById('reviewPhone');
        const reviewEventDate = document.getElementById('reviewEventDate');

        if (reviewName) reviewName.textContent = quoteData.contact.fullName;
        if (reviewEmail) reviewEmail.textContent = quoteData.contact.email;
        if (reviewPhone) reviewPhone.textContent = quoteData.contact.phone;
        if (reviewEventDate) {
            const date = new Date(quoteData.contact.eventDate);
            reviewEventDate.textContent = date.toLocaleDateString('en-CA', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }

        // Package details
        const reviewBasePackage = document.getElementById('reviewBasePackage');
        const reviewAddons = document.getElementById('reviewAddons');
        const reviewTotal = document.getElementById('reviewTotal');

        if (reviewBasePackage) {
            reviewBasePackage.textContent = `${quoteData.package.hours} Hours - $${quoteData.package.price.toLocaleString()}`;
        }

        if (reviewAddons) {
            let addonsHTML = '';
            
            if (quoteData.addons.unlimitedPrints) {
                const unlimitedPrintsPrice = quoteData.package.hours * 60;
                addonsHTML += `
                    <div class="summary-item">
                        <span class="summary-label">Unlimited Prints:</span>
                        <span class="summary-value">$${unlimitedPrintsPrice}</span>
                    </div>
                `;
            }
            
            if (quoteData.addons.glamBooth) {
                addonsHTML += `
                    <div class="summary-item">
                        <span class="summary-label">Glam Booth:</span>
                        <span class="summary-value">$75</span>
                    </div>
                `;
            }
            
            if (quoteData.addons.waitingTime > 0) {
                const waitingTimePrice = quoteData.addons.waitingTime * 50;
                addonsHTML += `
                    <div class="summary-item">
                        <span class="summary-label">Waiting Time (${quoteData.addons.waitingTime} hours):</span>
                        <span class="summary-value">$${waitingTimePrice}</span>
                    </div>
                `;
            }

            if (addonsHTML === '') {
                addonsHTML = '<div class="summary-item"><span class="summary-label">No add-ons selected</span></div>';
            }

            reviewAddons.innerHTML = addonsHTML;
        }

        if (reviewTotal) {
            reviewTotal.textContent = `$${quoteData.total.toLocaleString()}`;
        }
    }

    // Back buttons
    const backToStep1 = document.getElementById('backToStep1');
    const backToStep2 = document.getElementById('backToStep2');

    if (backToStep1) {
        backToStep1.addEventListener('click', function() {
            showStep(1);
        });
    }

    if (backToStep2) {
        backToStep2.addEventListener('click', function() {
            showStep(2);
        });
    }

    // Send quote
    if (sendQuoteBtn) {
        sendQuoteBtn.addEventListener('click', async function() {
            // Show loading
            if (loadingOverlay) {
                loadingOverlay.classList.add('active');
            }

            try {
                // Prepare quote data
                const quotePayload = {
                    contact: quoteData.contact,
                    package: quoteData.package,
                    addons: quoteData.addons,
                    total: quoteData.total
                };

                // Send to API
                const response = await fetch('/api/quote', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(quotePayload),
                });

                const result = await response.json();

                if (response.ok) {
                    // Hide loading
                    if (loadingOverlay) {
                        loadingOverlay.classList.remove('active');
                    }

                    // Hide all steps
                    steps.forEach(step => step.classList.remove('active'));

                    // Show success message
                    if (successMessage) {
                        successMessage.classList.add('active');
                    }
                } else {
                    throw new Error(result.error || 'Failed to send quote');
                }
            } catch (error) {
                console.error('Error sending quote:', error);
                alert(`Sorry, there was an error sending your quote: ${error.message}\n\nPlease try again or call us at 647-378-5332`);
                
                // Hide loading
                if (loadingOverlay) {
                    loadingOverlay.classList.remove('active');
                }
            }
        });
    }

    // Create new quote
    const createNewQuote = document.getElementById('createNewQuote');
    if (createNewQuote) {
        createNewQuote.addEventListener('click', function() {
            // Reset form
            if (contactForm) contactForm.reset();
            
            // Reset quote data
            Object.assign(quoteData, {
                contact: {},
                package: { hours: 0, price: 0 },
                addons: { unlimitedPrints: false, glamBooth: false, waitingTime: 0 },
                total: 0
            });

            // Reset UI
            packageCards.forEach(card => card.classList.remove('selected'));
            if (unlimitedPrintsCheckbox) unlimitedPrintsCheckbox.checked = false;
            if (glamBoothCheckbox) glamBoothCheckbox.checked = false;
            if (waitingTimeCheckbox) waitingTimeCheckbox.checked = false;
            if (waitingHoursInput) {
                waitingHoursInput.value = 0;
                waitingHoursInput.disabled = true;
            }
            if (reviewQuoteBtn) reviewQuoteBtn.disabled = true;

            // Hide success message
            if (successMessage) {
                successMessage.classList.remove('active');
            }

            // Show step 1
            showStep(1);
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Set minimum date to today
    const eventDateInput = document.getElementById('eventDate');
    if (eventDateInput) {
        const today = new Date().toISOString().split('T')[0];
        eventDateInput.setAttribute('min', today);
    }
});
