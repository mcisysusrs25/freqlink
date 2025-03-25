document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const bookmarkForm = document.getElementById('bookmarkForm');
    const categoriesContainer = document.getElementById('categoriesContainer');
    const bookmarkModal = document.getElementById('bookmarkModal');
    const deleteModal = document.getElementById('deleteModal');
    const openModalButton = document.getElementById('openModal');
    const closeModalButton = document.getElementById('closeModal');
    const cancelButton = document.getElementById('cancelButton');
    const saveButton = document.getElementById('saveButton');
    const modalTitle = document.getElementById('modalTitle');
    const bookmarkNameInput = document.getElementById('bookmarkName');
    const bookmarkUrlInput = document.getElementById('bookmarkUrl');
    const bookmarkIconInput = document.getElementById('bookmarkIcon');
    const bookmarkCategorySelect = document.getElementById('bookmarkCategory');
    const fileSelectButton = document.getElementById('fileSelectButton');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const fileError = document.getElementById('fileError');
    const themeToggle = document.getElementById('themeToggle');
    const confirmDeleteButton = document.getElementById('confirmDelete');
    const cancelDeleteButton = document.getElementById('cancelDelete');
    const closeDeleteModalButton = document.getElementById('closeDeleteModal');
    const deleteModalTitle = document.getElementById('deleteModalTitle');
    const deleteModalLink = document.getElementById('deleteModalLink');
    const noLinksState = document.getElementById('noLinksState');

    // State variables
    let bookmarks = JSON.parse(localStorage.getItem('freqlinks-bookmarks')) || [];
    let editingIndex = null;
    let deletingIndex = null;

    // Initialize theme
    const initTheme = () => {
        const savedTheme = localStorage.getItem('freqlinks-theme') || 'light';
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
            themeToggle.checked = true;
        } else {
            document.documentElement.classList.remove('dark');
            themeToggle.checked = false;
        }
    };

    // Toggle theme
    const toggleTheme = () => {
        if (themeToggle.checked) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('freqlinks-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('freqlinks-theme', 'light');
        }
    };

    // Display bookmarks grouped by category
    const displayBookmarks = () => {
        categoriesContainer.innerHTML = '';

        // Check if there are any bookmarks
        if (bookmarks.length === 0) {
            noLinksState.classList.remove('hidden');
            return;
        }

        noLinksState.classList.add('hidden');

        // Get unique categories
        const categories = [...new Set(bookmarks.map(bookmark => bookmark.category))];

        // Sort categories alphabetically
        categories.sort();

        // Create section for each category
        categories.forEach(category => {
            const categorySection = document.createElement('section');
            categorySection.className = 'mb-10';

            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'category-header';

            // Add category icon based on category name
            let categoryIcon = 'folder';
            switch(category.toLowerCase()) {
                case 'work': categoryIcon = 'briefcase'; break;
                case 'personal': categoryIcon = 'user'; break;
                case 'education': categoryIcon = 'graduation-cap'; break;
                case 'entertainment': categoryIcon = 'film'; break;
                case 'finance': categoryIcon = 'dollar-sign'; break;
                case 'other': categoryIcon = 'tag'; break;
            }

            categoryHeader.innerHTML = `
                <i class="fas fa-${categoryIcon} text-indigo-500 dark:text-indigo-400"></i>
                <h2 class="category-title">${category}</h2>
                <span class="text-sm text-gray-500 dark:text-gray-400 ml-auto">${bookmarks.filter(b => b.category === category).length} items</span>
            `;

            const bookmarkGrid = document.createElement('div');
            bookmarkGrid.className = 'bookmark-grid';

            // Filter bookmarks by current category
            const categoryBookmarks = bookmarks.filter(bookmark => bookmark.category === category);

            // Create card for each bookmark
            categoryBookmarks.forEach((bookmark, index) => {
                const globalIndex = bookmarks.findIndex(b => 
                    b.url === bookmark.url && b.name === bookmark.name && b.category === bookmark.category);
                
                const bookmarkCard = document.createElement('div');
                bookmarkCard.className = 'bookmark-card';
                
                // Create image or placeholder
                let imageHtml;
                if (bookmark.icon) {
                    imageHtml = `<img src="${bookmark.icon}" alt="${bookmark.name}" class="bookmark-image">`;
                } else {
                    // Generate a color based on domain
                    const colors = ['from-blue-500 to-indigo-500', 'from-purple-500 to-pink-500', 'from-green-500 to-emerald-500', 
                                  'from-yellow-500 to-orange-500', 'from-red-500 to-pink-500', 'from-teal-500 to-cyan-500'];
                    const colorIndex = Math.abs(bookmark.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;
                    const gradientColor = colors[colorIndex];
                    
                    imageHtml = `
                        <div class="h-32 w-full bg-gradient-to-br ${gradientColor} flex items-center justify-center">
                            <span class="text-4xl font-bold text-white uppercase">${bookmark.name.charAt(0)}</span>
                        </div>
                    `;
                }
                
                // Create bookmark content
                const displayUrl = getDisplayUrl(bookmark.url);
                
                bookmarkCard.innerHTML = `
                    ${imageHtml}
                    <div class="bookmark-content">
                        <h3 class="bookmark-title">${bookmark.name}</h3>
                        <div class="bookmark-url">${displayUrl}</div>
                    </div>
                    <div class="bookmark-actions">
                        <button class="action-btn visit-btn" data-index="${globalIndex}" title="Visit">
                            <i class="fas fa-external-link-alt"></i>
                        </button>
                        <button class="action-btn edit-btn" data-index="${globalIndex}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" data-index="${globalIndex}" title="Delete">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
                
                // Make entire card clickable for visit
                bookmarkCard.addEventListener('click', (e) => {
                    // Only trigger if we didn't click on an action button
                    if (!e.target.closest('.bookmark-actions')) {
                        visitBookmark(globalIndex);
                    }
                });
                
                bookmarkGrid.appendChild(bookmarkCard);
            });

            categorySection.appendChild(categoryHeader);
            categorySection.appendChild(bookmarkGrid);
            categoriesContainer.appendChild(categorySection);
        });

        // Add event listeners to buttons
        document.querySelectorAll('.visit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click
                const index = parseInt(button.getAttribute('data-index'));
                visitBookmark(index);
            });
        });

        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click
                const index = parseInt(button.getAttribute('data-index'));
                openEditModal(index);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click
                const index = parseInt(button.getAttribute('data-index'));
                openDeleteModal(index);
            });
        });
    };

    // Visit a bookmark
    const visitBookmark = (index) => {
        window.open(bookmarks[index].url, '_blank');
    };

    // Helper to get display URL
    const getDisplayUrl = (url) => {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch (e) {
            return url;
        }
    };

    // Open modal for adding a bookmark
    const openAddModal = () => {
        modalTitle.textContent = 'Add New Bookmark';
        saveButton.textContent = 'Save Bookmark';
        editingIndex = null;
        bookmarkForm.reset();
        fileNameDisplay.textContent = 'No file chosen';
        fileError.classList.add('hidden');
        showModal(bookmarkModal);
    };

    // Open modal for editing a bookmark
    const openEditModal = (index) => {
        editingIndex = index;
        modalTitle.textContent = 'Edit Bookmark';
        saveButton.textContent = 'Update Bookmark';
        
        const bookmark = bookmarks[index];
        bookmarkNameInput.value = bookmark.name;
        bookmarkUrlInput.value = bookmark.url;
        bookmarkCategorySelect.value = bookmark.category;
        fileNameDisplay.textContent = bookmark.icon ? 'Current image' : 'No file chosen';
        fileError.classList.add('hidden');
        
        showModal(bookmarkModal);
    };

    // Open modal for deleting a bookmark
    const openDeleteModal = (index) => {
        deletingIndex = index;
        deleteModalTitle.textContent = `Delete Bookmark: ${bookmarks[index].name}`;
        deleteModalLink.textContent = bookmarks[index].url;
        showModal(deleteModal);
    };

    // Show a modal
    const showModal = (modal) => {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    };

    // Hide a modal
    const hideModal = (modal) => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    };

    // Save or update bookmark
    const saveBookmark = (e) => {
        e.preventDefault();
        
        const name = bookmarkNameInput.value.trim();
        const url = formatUrl(bookmarkUrlInput.value.trim());
        const category = bookmarkCategorySelect.value;
        const file = bookmarkIconInput.files[0];
        
        // Validation
        if (!name || !url) return;
        
        // Check file size (max 1MB)
        if (file && file.size > 1048576) {
            fileError.classList.remove('hidden');
            return;
        } else {
            fileError.classList.add('hidden');
        }
        
        // Handle file upload
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const icon = e.target.result;
                saveBookmarkData(name, url, category, icon);
            };
            reader.readAsDataURL(file);
        } else {
            // If no new file, keep existing icon if editing
            let icon = '';
            if (editingIndex !== null && bookmarks[editingIndex].icon) {
                icon = bookmarks[editingIndex].icon;
            }
            saveBookmarkData(name, url, category, icon);
        }
    };

    // Helper function to format URL
    const formatUrl = (url) => {
        if (!/^https?:\/\//i.test(url)) {
            return 'https://' + url;
        }
        return url;
    };

    // Save bookmark data to array and localStorage
    const saveBookmarkData = (name, url, category, icon) => {
        if (editingIndex !== null) {
            // Update existing bookmark
            bookmarks[editingIndex] = {
                name,
                url,
                category,
                icon,
                dateAdded: bookmarks[editingIndex].dateAdded,
                dateModified: new Date().toISOString()
            };
        } else {
            // Add new bookmark
            bookmarks.push({
                name,
                url,
                category,
                icon,
                dateAdded: new Date().toISOString(),
                dateModified: new Date().toISOString()
            });
        }
        
        // Save to localStorage
        localStorage.setItem('freqlinks-bookmarks', JSON.stringify(bookmarks));
        
        // Update UI
        hideModal(bookmarkModal);
        displayBookmarks();
        
        // Show success feedback (could add toast notification here)
    };

    // Delete a bookmark
    const deleteBookmark = () => {
        if (deletingIndex !== null) {
            bookmarks.splice(deletingIndex, 1);
            localStorage.setItem('freqlinks-bookmarks', JSON.stringify(bookmarks));
            deletingIndex = null;
            hideModal(deleteModal);
            displayBookmarks();
        }
    };

    // Event Listeners
    // Open modal to add a bookmark
    openModalButton.addEventListener('click', openAddModal);
    
    // Close modal
    closeModalButton.addEventListener('click', () => hideModal(bookmarkModal));
    cancelButton.addEventListener('click', () => hideModal(bookmarkModal));
    
    // Close delete modal
    closeDeleteModalButton.addEventListener('click', () => hideModal(deleteModal));
    cancelDeleteButton.addEventListener('click', () => hideModal(deleteModal));
    
    // Confirm delete
    confirmDeleteButton.addEventListener('click', deleteBookmark);
    
    // Handle form submission
    bookmarkForm.addEventListener('submit', saveBookmark);
    
    // Handle file input
    fileSelectButton.addEventListener('click', () => {
        bookmarkIconInput.click();
    });
    
    bookmarkIconInput.addEventListener('change', () => {
        if (bookmarkIconInput.files.length > 0) {
            fileNameDisplay.textContent = bookmarkIconInput.files[0].name;
        } else {
            fileNameDisplay.textContent = 'No file chosen';
        }
    });
    
    // Theme toggle
    themeToggle.addEventListener('change', toggleTheme);
    
    // Close modals when clicking backdrop
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                hideModal(e.target.parentElement);
            }
        });
    });
    
    // Initialize
    initTheme();
    displayBookmarks();
});