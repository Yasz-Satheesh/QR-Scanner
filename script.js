// ==================== QR Scanner Application ====================

class QRScanner {
    constructor() {
        // DOM Elements
        this.video = document.getElementById('qrVideo');
        this.canvas = document.getElementById('qrCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.scanAgainBtn = document.getElementById('scanAgainBtn');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.shareBtn = document.getElementById('shareBtn');

        // Upload mode elements
        this.modeTabs = document.querySelectorAll('.mode-tab');
        this.cameraMode = document.getElementById('cameraMode');
        this.uploadMode = document.getElementById('uploadMode');
        this.uploadZone = document.getElementById('uploadZone');
        this.fileInput = document.getElementById('fileInput');
        this.uploadedImage = document.getElementById('uploadedImage');
        this.uploadCanvas = document.getElementById('uploadCanvas');
        this.uploadCtx = this.uploadCanvas.getContext('2d');
        this.imagePreviewContainer = document.getElementById('imagePreviewContainer');
        this.scanImageBtn = document.getElementById('scanImageBtn');
        this.removeImageBtn = document.getElementById('removeImageBtn');

        this.statusMessage = document.getElementById('statusMessage');
        this.scannerSection = document.getElementById('scannerSection');
        this.resultsSection = document.getElementById('resultsSection');
        this.dataDisplay = document.getElementById('dataDisplay');
        this.historyList = document.getElementById('historyList');

        // State
        this.stream = null;
        this.scanning = false;
        this.scanHistory = this.loadHistory();
        this.currentData = null;
        this.currentMode = 'camera';

        // Initialize
        this.init();
    }

    init() {
        // Event Listeners
        this.startBtn.addEventListener('click', () => this.startScanning());
        this.stopBtn.addEventListener('click', () => this.stopScanning());
        this.clearBtn.addEventListener('click', () => this.clearResults());
        this.copyBtn.addEventListener('click', () => this.copyData());
        this.scanAgainBtn.addEventListener('click', () => this.scanAgain());
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        this.downloadBtn.addEventListener('click', () => this.downloadData());
        this.shareBtn.addEventListener('click', () => this.shareData());

        // Mode switching
        this.modeTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.switchMode(mode);
            });
        });

        // Upload mode events
        this.uploadZone.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.scanImageBtn.addEventListener('click', () => this.scanUploadedImage());
        this.removeImageBtn.addEventListener('click', () => this.removeUploadedImage());

        // Drag and drop events
        this.uploadZone.addEventListener('dragenter', (e) => this.handleDragEnter(e));
        this.uploadZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadZone.addEventListener('drop', (e) => this.handleDrop(e));

        // Load history on startup
        this.renderHistory();
    }

    // ==================== Mode Switching ====================

    switchMode(mode) {
        this.currentMode = mode;

        // Update tab states
        this.modeTabs.forEach(tab => {
            if (tab.dataset.mode === mode) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Show/hide mode content
        if (mode === 'camera') {
            this.cameraMode.style.display = 'block';
            this.uploadMode.style.display = 'none';
            this.updateStatus('Ready to scan with camera', 'info');
        } else {
            this.cameraMode.style.display = 'none';
            this.uploadMode.style.display = 'block';
            this.stopScanning(); // Stop camera if running
            this.updateStatus('Ready to upload QR code image', 'info');
        }
    }

    // ==================== File Upload Functionality ====================

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.processUploadedFile(file);
        }
    }

    handleDragEnter(event) {
        event.preventDefault();
        event.stopPropagation();
        this.uploadZone.classList.add('drag-over');
    }

    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        this.uploadZone.classList.add('drag-over');
    }

    handleDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        this.uploadZone.classList.remove('drag-over');
    }

    handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        this.uploadZone.classList.remove('drag-over');

        const files = event.dataTransfer.files;
        if (files.length > 0) {
            this.processUploadedFile(files[0]);
        }
    }

    processUploadedFile(file) {
        // Validate file
        if (!this.validateFile(file)) {
            return;
        }

        this.updateStatus('Processing uploaded image...', 'info');

        // Read and display the file
        const reader = new FileReader();

        reader.onload = (e) => {
            this.uploadedImage.src = e.target.result;
            this.uploadedImage.onload = () => {
                // Show preview
                this.uploadZone.style.display = 'none';
                this.imagePreviewContainer.style.display = 'block';
                this.updateStatus('Image uploaded. Click "Scan This Image" to detect QR code.', 'success');
            };
        };

        reader.onerror = () => {
            this.updateStatus('Failed to read image file', 'error');
            this.showToast('Failed to read image file', 'error');
        };

        reader.readAsDataURL(file);
    }

    validateFile(file) {
        // Check if it's an image
        if (!file.type.startsWith('image/')) {
            this.updateStatus('Please upload an image file', 'error');
            this.showToast('Please upload an image file (PNG, JPG, WEBP)', 'error');
            return false;
        }

        // Check file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
            this.updateStatus('File too large. Maximum size is 10MB', 'error');
            this.showToast('File too large. Maximum size is 10MB', 'error');
            return false;
        }

        return true;
    }

    scanUploadedImage() {
        if (!this.uploadedImage.src) {
            this.showToast('No image to scan', 'error');
            return;
        }

        this.updateStatus('Scanning QR code from image...', 'info');

        try {
            // Set canvas dimensions to match image
            this.uploadCanvas.width = this.uploadedImage.naturalWidth;
            this.uploadCanvas.height = this.uploadedImage.naturalHeight;

            // Draw image to canvas
            this.uploadCtx.drawImage(
                this.uploadedImage,
                0, 0,
                this.uploadCanvas.width,
                this.uploadCanvas.height
            );

            // Get image data
            const imageData = this.uploadCtx.getImageData(
                0, 0,
                this.uploadCanvas.width,
                this.uploadCanvas.height
            );

            // Scan for QR code
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
            });

            if (code) {
                // QR code found!
                this.handleQRCodeDetected(code.data);
                this.removeUploadedImage(); // Clean up upload mode
            } else {
                this.updateStatus('No QR code detected in the image', 'error');
                this.showToast('No QR code found. Please try another image.', 'error');
            }
        } catch (error) {
            console.error('Error scanning image:', error);
            this.updateStatus('Error scanning image', 'error');
            this.showToast('Error scanning image', 'error');
        }
    }

    removeUploadedImage() {
        this.uploadedImage.src = '';
        this.imagePreviewContainer.style.display = 'none';
        this.uploadZone.style.display = 'block';
        this.fileInput.value = ''; // Reset file input
        this.updateStatus('Ready to upload QR code image', 'info');
    }


    async startScanning() {
        try {
            this.updateStatus('Requesting camera access...', 'info');

            // Request camera access
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });

            this.video.srcObject = this.stream;
            this.video.setAttribute('playsinline', true);
            this.video.play();

            this.scanning = true;
            this.startBtn.style.display = 'none';
            this.stopBtn.style.display = 'inline-flex';

            this.updateStatus('Scanning for QR codes...', 'success');

            // Start scanning loop
            requestAnimationFrame(() => this.tick());

        } catch (error) {
            console.error('Camera access error:', error);
            this.updateStatus('Camera access denied. Please allow camera permissions.', 'error');
        }
    }

    stopScanning() {
        this.scanning = false;

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        this.video.srcObject = null;
        this.startBtn.style.display = 'inline-flex';
        this.stopBtn.style.display = 'none';

        this.updateStatus('Scanner stopped', 'info');
    }

    tick() {
        if (!this.scanning) return;

        if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
            // Set canvas dimensions to match video
            this.canvas.height = this.video.videoHeight;
            this.canvas.width = this.video.videoWidth;

            // Draw video frame to canvas
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

            // Get image data
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

            // Scan for QR code
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
            });

            if (code) {
                this.handleQRCodeDetected(code.data);
                return; // Stop scanning after successful detection
            }
        }

        requestAnimationFrame(() => this.tick());
    }

    // ==================== QR Code Processing ====================

    handleQRCodeDetected(data) {
        this.stopScanning();
        this.currentData = data;

        // Add to history
        this.addToHistory(data);

        // Display results
        this.displayResults(data);

        // Show results section
        this.showResults();

        // Show success notification
        this.showToast('QR Code scanned successfully!');

        // Play success sound (optional - can be added)
        this.playSuccessSound();
    }

    displayResults(data) {
        // Try to parse as JSON
        let parsedData = this.parseData(data);

        if (parsedData.type === 'json') {
            this.displayJSONData(parsedData.data);
        } else if (parsedData.type === 'profile') {
            this.displayProfileData(parsedData.data);
        } else {
            // Check if it's a comma separated profile
            const profileData = this.matchProfilePattern(data);
            if (profileData && (profileData.name || profileData.age || profileData.address || profileData.phoneNumber || profileData.dob || profileData.emailId)) {
                this.displayProfileData(profileData);
            } else {
                this.displayRawData(data);
            }
        }
    }

    parseData(data) {
        // Check if it's a vCard
        if (data.includes('BEGIN:VCARD')) {
            const vCardData = this.parseVCard(data);
            if (vCardData) return { type: 'profile', data: vCardData };
        }

        // Try to parse as JSON
        try {
            const jsonData = JSON.parse(data);

            // Check if it's a profile object
            const profileFields = ['firstName', 'lastName', 'name', 'age', 'address', 'phoneNumber', 'dob', 'emailId'];
            const hasProfileFields = profileFields.some(field => jsonData.hasOwnProperty(field));

            if (hasProfileFields) {
                return { type: 'profile', data: jsonData };
            }

            return { type: 'json', data: jsonData };
        } catch (e) {
            // Not JSON
        }

        // Return as raw text
        return { type: 'text', data: data };
    }

    parseVCard(data) {
        const lines = data.split(/\r?\n/);
        const result = {
            firstName: '',
            lastName: '',
            companyName: '',
            address: '',
            phoneNumber: '',
            emailId: ''
        };

        lines.forEach(line => {
            if (line.startsWith('FN:')) {
                const fullName = line.substring(3).trim();
                if (!result.firstName && !result.lastName) {
                    const parts = fullName.split(' ');
                    result.firstName = parts[0] || '';
                    result.lastName = parts.slice(1).join(' ') || '';
                }
            } else if (line.startsWith('N:')) {
                const parts = line.substring(2).split(';');
                result.lastName = parts[0] ? parts[0].trim() : '';
                result.firstName = parts[1] ? parts[1].trim() : '';
            } else if (line.startsWith('ORG:')) {
                result.companyName = line.substring(4).split(';')[0].trim();
            } else if (line.startsWith('TEL')) {
                const phoneMatch = line.match(/:(.*)$/);
                if (phoneMatch) result.phoneNumber = phoneMatch[1].trim();
            } else if (line.startsWith('EMAIL')) {
                const emailMatch = line.match(/:(.*)$/);
                if (emailMatch && !result.emailId) result.emailId = emailMatch[1].trim();
            } else if (line.startsWith('ADR')) {
                const adrMatch = line.match(/:(.*)$/);
                if (adrMatch) {
                    const parts = adrMatch[1].split(';').map(p => p.trim()).filter(p => p);
                    result.address = parts.join(', ');
                }
            }
        });

        return result;
    }

    matchProfilePattern(data) {
        const parts = data.split(',').map(p => p.trim());
        if (parts.length >= 3) {
            const maybeEmail = parts.find(p => p.includes('@'));
            const maybePhone = parts.find(p => /^\+?[\d\s-]{10,}$/.test(p));
            const maybeAge = parts.find(p => /^\d{1,3}$/.test(p));

            return {
                firstName: parts[0] || '',
                lastName: parts[1] || '',
                companyName: '',
                age: maybeAge || '',
                address: parts[parts.length > 2 ? 2 : 1] || '',
                phoneNumber: maybePhone || '',
                dob: parts.find(p => /\d{4}|\d{2}\/\d{2}/.test(p)) || '',
                emailId: maybeEmail || ''
            };
        }
        return null;
    }

    displayProfileData(data) {
        const fields = [
            { key: 'firstName', label: 'First Name' },
            { key: 'lastName', label: 'Last Name' },
            { key: 'companyName', label: 'Company Name' },
            { key: 'age', label: 'Age' },
            { key: 'address', label: 'Address' },
            { key: 'phoneNumber', label: 'Phone Number' },
            { key: 'dob', label: 'Date of Birth (DOB)' },
            { key: 'emailId', label: 'Email ID' }
        ];

        let html = '<div class="profile-display">';

        fields.forEach(field => {
            let value = data[field.key] || data[field.label] || data[field.label.toLowerCase()] || '';

            // If we have a 'name' field but no first/last, split it
            if (field.key === 'firstName' && !value && data.name) {
                const parts = data.name.trim().split(' ');
                value = parts[0] || '';
            }
            if (field.key === 'lastName' && !value && data.name) {
                const parts = data.name.trim().split(' ');
                value = parts.slice(1).join(' ') || '';
            }

            if (value) {
                html += `
                    <div class="data-item vertical">
                        <div class="data-label">${field.label}</div>
                        <div class="data-value">${this.escapeHTML(String(value))}</div>
                    </div>
                `;
            }
        });

        html += '</div>';
        this.dataDisplay.innerHTML = html;
    }

    displayJSONData(data) {
        let html = '';

        for (const [key, value] of Object.entries(data)) {
            html += `
                <div class="data-item">
                    <div class="data-label">${this.formatKey(key)}</div>
                    <div class="data-value">${this.escapeHTML(String(value))}</div>
                </div>
            `;
        }

        this.dataDisplay.innerHTML = html;
    }

    displayURLData(url) {
        const html = `
            <div class="data-item">
                <div class="data-label">URL</div>
                <div class="data-value">
                    <a href="${url.href}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); text-decoration: none;">
                        ${this.escapeHTML(url.href)}
                    </a>
                </div>
            </div>
            <div class="data-item">
                <div class="data-label">Domain</div>
                <div class="data-value">${this.escapeHTML(url.hostname)}</div>
            </div>
            ${url.pathname !== '/' ? `
                <div class="data-item">
                    <div class="data-label">Path</div>
                    <div class="data-value">${this.escapeHTML(url.pathname)}</div>
                </div>
            ` : ''}
            ${url.search ? `
                <div class="data-item">
                    <div class="data-label">Query Parameters</div>
                    <div class="data-value">${this.escapeHTML(url.search)}</div>
                </div>
            ` : ''}
        `;

        this.dataDisplay.innerHTML = html;
    }

    displayRawData(data) {
        const html = `
            <div class="data-item">
                <div class="data-label">Scanned Data</div>
                <div class="raw-data">${this.escapeHTML(data)}</div>
            </div>
        `;

        this.dataDisplay.innerHTML = html;
    }

    // ==================== History Management ====================

    addToHistory(data) {
        const historyItem = {
            id: Date.now(),
            data: data,
            timestamp: new Date().toISOString()
        };

        this.scanHistory.unshift(historyItem);

        // Keep only last 20 items
        if (this.scanHistory.length > 20) {
            this.scanHistory = this.scanHistory.slice(0, 20);
        }

        this.saveHistory();
        this.renderHistory();
    }

    renderHistory() {
        if (this.scanHistory.length === 0) {
            this.historyList.innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                        <circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="2" opacity="0.3"/>
                        <path d="M24 16V24L30 30" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
                    </svg>
                    <p>No scan history yet</p>
                </div>
            `;
            return;
        }

        let html = '';

        this.scanHistory.forEach(item => {
            const preview = item.data.length > 50 ? item.data.substring(0, 50) + '...' : item.data;
            const timeAgo = this.getTimeAgo(new Date(item.timestamp));

            html += `
                <div class="history-item" data-id="${item.id}">
                    <div class="history-time">${timeAgo}</div>
                    <div class="history-preview">${this.escapeHTML(preview)}</div>
                </div>
            `;
        });

        this.historyList.innerHTML = html;

        // Add click listeners
        this.historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                this.loadHistoryItem(id);
            });
        });
    }

    loadHistoryItem(id) {
        const item = this.scanHistory.find(h => h.id === id);
        if (item) {
            this.currentData = item.data;
            this.displayResults(item.data);
            this.showResults();
            this.showToast('History item loaded');
        }
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear all scan history?')) {
            this.scanHistory = [];
            this.saveHistory();
            this.renderHistory();
            this.showToast('History cleared');
        }
    }

    saveHistory() {
        localStorage.setItem('qr_scan_history', JSON.stringify(this.scanHistory));
    }

    loadHistory() {
        const saved = localStorage.getItem('qr_scan_history');
        return saved ? JSON.parse(saved) : [];
    }

    // ==================== UI Actions ====================

    showResults() {
        this.scannerSection.style.display = 'none';
        this.resultsSection.style.display = 'block';
    }

    clearResults() {
        this.resultsSection.style.display = 'none';
        this.scannerSection.style.display = 'block';
        this.currentData = null;
        this.dataDisplay.innerHTML = '';
        this.updateStatus('Ready to scan', 'info');
    }

    scanAgain() {
        this.clearResults();
        this.startScanning();
    }

    async copyData() {
        if (!this.currentData) return;

        try {
            await navigator.clipboard.writeText(this.currentData);
            this.showToast('Data copied to clipboard!');
        } catch (error) {
            console.error('Copy failed:', error);
            this.showToast('Failed to copy data', 'error');
        }
    }

    downloadData() {
        if (!this.currentData) return;

        let content = this.currentData;

        // If it's a profile, create a formatted version for the file
        const parsed = this.parseData(this.currentData);
        if (parsed.type === 'profile') {
            content = `--- SCANNED PROFILE DATA ---\n\n`;
            const fields = [
                { key: 'firstName', label: 'First Name' },
                { key: 'lastName', label: 'Last Name' },
                { key: 'companyName', label: 'Company Name' },
                { key: 'age', label: 'Age' },
                { key: 'address', label: 'Address' },
                { key: 'phoneNumber', label: 'Phone Number' },
                { key: 'dob', label: 'Date of Birth (DOB)' },
                { key: 'emailId', label: 'Email ID' }
            ];
            fields.forEach(f => {
                let val = parsed.data[f.key] || parsed.data[f.label] || '';

                // Merge logic for Name if only name exists in legacy data
                if (f.key === 'firstName' && !val && parsed.data.name) {
                    val = parsed.data.name.split(' ')[0] || '';
                }
                if (f.key === 'lastName' && !val && parsed.data.name) {
                    val = parsed.data.name.split(' ').slice(1).join(' ') || '';
                }

                if (val) {
                    content += `${f.label}: ${val}\n`;
                }
            });
            content += `\nScanned on: ${new Date().toLocaleString()}`;
        }

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scanned_profile_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('Data downloaded successfully!');
    }

    async shareData() {
        if (!this.currentData) return;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Scanned Data',
                    text: this.currentData,
                });
                this.showToast('Shared successfully!');
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Share failed:', error);
                    this.showToast('Failed to share data', 'error');
                }
            }
        } else {
            this.showToast('Web Share API not supported in this browser', 'error');
            // Fallback: Copy to clipboard
            this.copyData();
        }
    }

    // ==================== Utility Functions ====================

    updateStatus(message, type = 'info') {
        this.statusMessage.querySelector('span').textContent = message;
        this.statusMessage.className = 'status-message';

        if (type === 'success') {
            this.statusMessage.classList.add('success');
        } else if (type === 'error') {
            this.statusMessage.classList.add('error');
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');

        toastMessage.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    formatKey(key) {
        // Convert camelCase or snake_case to Title Case
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/_/g, ' ')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);

        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60,
            second: 1
        };

        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
            }
        }

        return 'Just now';
    }

    playSuccessSound() {
        // Create a simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
            // Audio not supported or blocked
            console.log('Audio playback not available');
        }
    }
}

// ==================== Initialize Application ====================

document.addEventListener('DOMContentLoaded', () => {
    const scanner = new QRScanner();

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Press 'S' to start/stop scanning
        if (e.key === 's' || e.key === 'S') {
            if (!scanner.scanning) {
                scanner.startScanning();
            } else {
                scanner.stopScanning();
            }
        }

        // Press 'C' to copy data
        if ((e.key === 'c' || e.key === 'C') && e.ctrlKey && scanner.currentData) {
            e.preventDefault();
            scanner.copyData();
        }

        // Press 'Escape' to clear results
        if (e.key === 'Escape' && scanner.resultsSection.style.display === 'block') {
            scanner.clearResults();
        }
    });
});
