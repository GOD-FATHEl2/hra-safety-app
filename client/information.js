// Information Page JavaScript
class InformationPage {
    constructor() {
        this.modal = document.getElementById('imageModal');
        this.modalImg = document.getElementById('modalImage');
        this.closeBtn = document.querySelector('.close');
        this.imageGallery = document.getElementById('imageGallery');
        
        this.init();
    }
    
    init() {
        this.loadImages();
        this.setupModal();
        this.addAnimations();
    }
    
    loadImages() {
        const images = [
            '1.jpeg', // Dashboard-funktioner (första)
            '2.jpeg', // Säkerhetsprocesser (andra)
            '3.jpeg', // HRA Systemöversikt (tredje)
            '4.jpeg', // Dokumentation och Export (fjärde)
            '5.jpeg', // Mobil Integration (femte)
            '6.jpeg', // Godkännandearbetsflöde (sjätte)
            '7.jpeg'  // Användarroller och Behörigheter (sjunde)
        ];
        
        const imageTitles = [
            'Dashboard-funktioner',
            'Säkerhetsprocesser',
            'HRA Systemöversikt',
            'Dokumentation och Export',
            'Mobil Integration',
            'Godkännandearbetsflöde',
            'Användarroller och Behörigheter'
        ];
        
        images.forEach((imageName, index) => {
            const imageItem = document.createElement('div');
            imageItem.className = 'image-item';
            
            const img = document.createElement('img');
            img.src = `../images/${imageName}`;
            img.alt = imageTitles[index];
            img.loading = 'lazy';
            
            // Handle image load error
            img.onerror = () => {
                img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNHB4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QmlsZCBrbHVuZGUgaW50ZSBsYWRkYXM8L3RleHQ+PC9zdmc+';
                img.alt = 'Bild kunde inte laddas';
            };
            
            const caption = document.createElement('div');
            caption.className = 'image-caption';
            caption.innerHTML = `
                <h4>${imageTitles[index]}</h4>
                <p>Referensbild ${index + 1} av ${images.length}</p>
            `;
            
            imageItem.appendChild(img);
            imageItem.appendChild(caption);
            
            // Add click event for modal
            imageItem.addEventListener('click', () => {
                this.openModal(img.src, imageTitles[index]);
            });
            
            this.imageGallery.appendChild(imageItem);
        });
    }
    
    setupModal() {
        // Close modal when clicking the X
        this.closeBtn.addEventListener('click', () => {
            this.closeModal();
        });
        
        // Close modal when clicking outside the image
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'block') {
                this.closeModal();
            }
        });
    }
    
    openModal(src, title) {
        this.modal.style.display = 'block';
        this.modalImg.src = src;
        this.modalImg.alt = title;
        document.body.style.overflow = 'hidden'; // Prevent scrolling
        
        // Add fade-in animation
        this.modal.style.opacity = '0';
        setTimeout(() => {
            this.modal.style.opacity = '1';
        }, 10);
    }
    
    closeModal() {
        this.modal.style.opacity = '0';
        setTimeout(() => {
            this.modal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Restore scrolling
        }, 300);
    }
    
    addAnimations() {
        // Add scroll-triggered animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);
        
        // Observe all sections for animation
        document.querySelectorAll('.info-section, .image-item').forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(30px)';
            section.style.transition = 'all 0.6s ease';
            observer.observe(section);
        });
        
        // Add hover effects to feature cards
        document.querySelectorAll('.feature-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });
        
        // Add pulse animation to info list items
        document.querySelectorAll('.info-list li').forEach((item, index) => {
            item.style.animationDelay = `${index * 0.1}s`;
            item.classList.add('fade-in-up');
        });
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .fade-in-up {
        animation: fadeInUp 0.6s ease forwards;
    }
    
    .modal {
        transition: opacity 0.3s ease;
    }
    
    .modal-content {
        animation: zoomIn 0.3s ease;
    }
    
    @keyframes zoomIn {
        from {
            transform: scale(0.8);
            opacity: 0;
        }
        to {
            transform: scale(1);
            opacity: 1;
        }
    }
    
    .image-item {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .feature-card {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .back-button {
        animation: slideInLeft 0.6s ease;
    }
    
    @keyframes slideInLeft {
        from {
            opacity: 0;
            transform: translateX(-30px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    .info-header {
        animation: fadeInDown 0.8s ease;
    }
    
    @keyframes fadeInDown {
        from {
            opacity: 0;
            transform: translateY(-30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// Initialize the information page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new InformationPage();
});