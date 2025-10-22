// Image Upload Functionality for HRA Application
class ImageUploadManager {
    constructor() {
        this.uploadedImages = [];
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        this.init();
    }

    init() {
        this.createImageUploadHTML();
        this.setupEventListeners();
    }

    createImageUploadHTML() {
        return `
            <div class="image-upload" id="imageUpload">
                <div class="upload-area" onclick="document.getElementById('fileInput').click()">
                    <div class="upload-icon">📷</div>
                    <div class="upload-text">
                        <strong>Klicka för att ladda upp bilder</strong><br>
                        eller dra och släpp här<br>
                        <small>Max 10MB per fil (JPG, PNG, GIF, WebP)</small>
                    </div>
                    <input type="file" id="fileInput" class="file-input" multiple accept="image/*">
                    <button type="button" class="camera-capture" onclick="event.stopPropagation(); imageUploadManager.openCamera()">
                        📱 Ta foto med kamera
                    </button>
                </div>
                <div class="image-preview-container" id="imagePreviewContainer">
                    <!-- Uploaded images will appear here -->
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // We'll set up listeners when the element is added to DOM
        document.addEventListener('change', (e) => {
            if (e.target.id === 'fileInput') {
                this.handleFiles(e.target.files);
            }
        });

        // Drag and drop functionality
        document.addEventListener('dragover', (e) => {
            if (e.target.closest('.image-upload')) {
                e.preventDefault();
                e.target.closest('.image-upload').classList.add('dragover');
            }
        });

        document.addEventListener('dragleave', (e) => {
            if (e.target.closest('.image-upload')) {
                e.target.closest('.image-upload').classList.remove('dragover');
            }
        });

        document.addEventListener('drop', (e) => {
            const uploadArea = e.target.closest('.image-upload');
            if (uploadArea) {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                this.handleFiles(e.dataTransfer.files);
            }
        });
    }

    handleFiles(files) {
        Array.from(files).forEach(file => {
            if (this.validateFile(file)) {
                this.processFile(file);
            }
        });
    }

    validateFile(file) {
        if (!this.allowedTypes.includes(file.type)) {
            this.showError(`Filtypen ${file.type} stöds inte. Använd JPG, PNG, GIF eller WebP.`);
            return false;
        }

        if (file.size > this.maxFileSize) {
            this.showError(`Filen ${file.name} är för stor. Max storlek är 10MB.`);
            return false;
        }

        return true;
    }

    processFile(file) {
        const fileId = 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const imageData = {
            id: fileId,
            file: file,
            name: file.name,
            size: this.formatFileSize(file.size),
            type: file.type,
            url: null,
            uploaded: false
        };

        this.uploadedImages.push(imageData);
        this.createImagePreview(imageData);
        this.uploadImageToServer(imageData);
    }

    createImagePreview(imageData) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imageData.url = e.target.result;
            const previewHTML = `
                <div class="image-preview" data-image-id="${imageData.id}">
                    <img src="${imageData.url}" alt="${imageData.name}">
                    <div class="image-info">
                        <div class="image-name">${imageData.name}</div>
                        <div class="image-size">${imageData.size}</div>
                    </div>
                    <button class="remove-image" onclick="imageUploadManager.removeImage('${imageData.id}')" title="Ta bort bild">
                        ×
                    </button>
                    <div class="upload-progress">
                        <div class="upload-progress-bar" id="progress-${imageData.id}"></div>
                    </div>
                </div>
            `;
            
            const container = document.getElementById('imagePreviewContainer');
            if (container) {
                container.insertAdjacentHTML('beforeend', previewHTML);
            }
        };
        reader.readAsDataURL(imageData.file);
    }

    uploadImageToServer(imageData) {
        const formData = new FormData();
        formData.append('image', imageData.file);
        formData.append('filename', imageData.name);
        formData.append('assessmentId', window.currentAssessmentId || 'temp');

        const progressBar = document.getElementById(`progress-${imageData.id}`);
        
        // Check if user is authenticated
        const authToken = window.token || localStorage.getItem('token');
        if (!authToken) {
            this.showError('Du måste logga in för att ladda upp bilder');
            this.removeImage(imageData.id);
            return;
        }
        
        // Real server upload
        fetch('/api/upload-image', {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': 'Bearer ' + (window.token || localStorage.getItem('token') || '')
            }
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Autentisering misslyckades - logga in igen');
                } else if (response.status === 413) {
                    throw new Error('Filen är för stor');
                } else {
                    throw new Error(`Upload misslyckades (${response.status})`);
                }
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                imageData.serverUrl = data.url;
                imageData.uploaded = true;
                window.showNotification(`Bilden ${imageData.name} har laddats upp!`, 'success');
            } else {
                throw new Error(data.error || 'Upload failed');
            }
        })
        .catch(error => {
            console.error('Upload error:', error);
            this.showError(`Kunde inte ladda upp ${imageData.name}: ${error.message}`);
            this.removeImage(imageData.id);
        })
        .finally(() => {
            if (progressBar) {
                const progressContainer = progressBar.parentElement;
                if (progressContainer) progressContainer.remove();
            }
        });
    }

    removeImage(imageId) {
        // Remove from uploaded images array
        this.uploadedImages = this.uploadedImages.filter(img => img.id !== imageId);
        
        // Remove from DOM
        const preview = document.querySelector(`[data-image-id="${imageId}"]`);
        if (preview) {
            preview.style.animation = 'imageSlideOut 0.3s ease-in forwards';
            setTimeout(() => {
                if (preview.parentElement) {
                    preview.parentElement.removeChild(preview);
                }
            }, 300);
        }

        window.showNotification('Bild borttagen', 'info');
    }

    openCamera() {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            // Create camera modal
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000;';
            modal.innerHTML = `
                <div class="modal-content" style="background: white; padding: 2rem; border-radius: 16px; max-width: 90%; max-height: 90%; position: relative; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
                    <button onclick="imageUploadManager.closeCamera()" style="position: absolute; top: 10px; right: 15px; background: none; border: none; font-size: 24px; cursor: pointer; color: #666; padding: 5px; line-height: 1;" title="Stäng kamera">×</button>
                    <h2 style="margin: 0 0 1rem 0; text-align: center; color: #333;">📷 Ta ett foto</h2>
                    <video id="cameraVideo" autoplay playsinline style="width: 100%; max-height: 400px; border-radius: 12px; background: #000;"></video>
                    <canvas id="cameraCanvas" style="display: none;"></canvas>
                    <div style="margin-top: 1rem; display: flex; gap: 1rem; justify-content: center;">
                        <button onclick="imageUploadManager.capturePhoto()" style="background: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;">📷 Ta foto</button>
                        <button onclick="imageUploadManager.closeCamera()" style="background: #6b7280; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600;">Avbryt</button>
                    </div>
                </div>
            `;
            
            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeCamera();
                }
            });
            document.body.appendChild(modal);
            this.currentCameraModal = modal;

            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                .then(stream => {
                    const video = document.getElementById('cameraVideo');
                    video.srcObject = stream;
                    this.currentStream = stream;
                })
                .catch(error => {
                    this.showError('Kunde inte komma åt kameran: ' + error.message);
                    this.closeCamera();
                });
        } else {
            this.showError('Kamera stöds inte i denna webbläsare');
        }
    }

    capturePhoto() {
        const video = document.getElementById('cameraVideo');
        const canvas = document.getElementById('cameraCanvas');
        
        if (video && canvas) {
            const context = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0);
            
            canvas.toBlob(blob => {
                const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
                this.handleFiles([file]);
                this.closeCamera();
                window.showNotification('Foto taget och laddat upp!', 'success');
            }, 'image/jpeg', 0.9);
        }
    }

    closeCamera() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
        if (this.currentCameraModal) {
            this.currentCameraModal.remove();
            this.currentCameraModal = null;
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'image-upload-error';
        errorDiv.textContent = message;
        
        const uploadArea = document.querySelector('.image-upload');
        if (uploadArea) {
            uploadArea.appendChild(errorDiv);
            setTimeout(() => {
                if (errorDiv.parentElement) {
                    errorDiv.parentElement.removeChild(errorDiv);
                }
            }, 5000);
        }
        
        window.showNotification(message, 'error');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getUploadedImages() {
        return this.uploadedImages.filter(img => img.uploaded);
    }

    clearImages() {
        this.uploadedImages = [];
        const container = document.getElementById('imagePreviewContainer');
        if (container) {
            container.innerHTML = '';
        }
    }
}

// Add CSS animation for image removal
const imageUploadStyles = document.createElement('style');
imageUploadStyles.textContent = `
    @keyframes imageSlideOut {
        0% {
            opacity: 1;
            transform: translateX(0) scale(1);
        }
        100% {
            opacity: 0;
            transform: translateX(-100%) scale(0.8);
        }
    }
`;
document.head.appendChild(imageUploadStyles);

// Initialize the image upload manager
window.imageUploadManager = new ImageUploadManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageUploadManager;
}