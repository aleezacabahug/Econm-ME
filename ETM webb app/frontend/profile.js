document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please log in to view your profile');
        window.location.href = 'login.html';
        return;
    }

    // DOM Elements
    const profilePicture = document.getElementById('profile-picture');
    const profilePictureUpload = document.getElementById('profile-picture-upload');
    const uploadBtn = document.getElementById('upload-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const profileForm = document.getElementById('profile-form');
    const cancelBtn = document.getElementById('cancel-btn');
    const newPassword = document.getElementById('new-password');
    const confirmPassword = document.getElementById('confirm-password');
    const passwordStrength = document.getElementById('password-strength');
    const currentPassword = document.getElementById('current-password');
    const updatePasswordBtn = document.getElementById('update-password-btn');

    // Editable fields
    const fullNameInput = document.getElementById('full-name');
    const emailInput = document.getElementById('email');
    const usernameDisplay = document.getElementById('username');

    // Store original values for cancel functionality
    let originalValues = {};

    // Load user data from server
    async function loadUserData() {
        try {
            const response = await fetch('/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch profile data');
            }

            const userData = await response.json();
            
            console.log('Loading user data:', userData);

            // Populate form fields
            fullNameInput.value = userData.fullName || '';
            usernameDisplay.textContent = userData.username || 'username';
            emailInput.value = userData.email || '';
            
            // Set profile picture
            if (userData.profilePicture) {
                profilePicture.src = userData.profilePicture;
            } else {
                profilePicture.src = 'default-profile.jpg';
            }

            // Store original values
            originalValues = {
                fullName: userData.fullName || '',
                email: userData.email || '',
                profilePicture: userData.profilePicture || 'default-profile.jpg'
            };

            // Update header profile picture
            updateHeaderProfile(userData);

        } catch (error) {
            console.error('Profile load error:', error);
            alert(`Error loading profile: ${error.message}`);
            
            // Set default values if error occurs
            usernameDisplay.textContent = 'username';
            profilePicture.src = 'default-profile.jpg';
        }
    }

    // Upload profile picture
    uploadBtn.addEventListener('click', () => profilePictureUpload.click());
    profilePicture.addEventListener('click', () => profilePictureUpload.click());

    profilePictureUpload.addEventListener('change', async function(e) {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Validate file type and size
            if (!file.type.match('image.*')) {
                alert('Please select an image file');
                return;
            }
            
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                alert('Image size should be less than 2MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = async function(event) {
                try {
                    const response = await fetch('/profile', {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            profilePicture: event.target.result
                        })
                    });

                    if (!response.ok) {
                        throw new Error('Failed to update profile picture');
                    }

                    const updatedProfile = await response.json();
                    
                    // Update UI
                    profilePicture.src = event.target.result;
                    updateHeaderProfile(updatedProfile);
                    
                    alert('Profile picture updated successfully!');
                    loadUserData(); // Refresh profile data
                } catch (error) {
                    console.error('Error updating profile picture:', error);
                    alert('Error updating profile picture');
                }
            };
            reader.readAsDataURL(file);
        }
    });

    // Delete profile picture
    deleteBtn.addEventListener('click', async function() {
        if (confirm('Are you sure you want to delete your profile photo?')) {
            try {
                const response = await fetch('/profile', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        profilePicture: ''
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to delete profile picture');
                }

                const updatedProfile = await response.json();
                
                // Update UI
                profilePicture.src = 'default-profile.jpg';
                updateHeaderProfile(updatedProfile);
                
                alert('Profile picture deleted successfully!');
                loadUserData(); // Refresh profile data
            } catch (error) {
                console.error('Error deleting profile picture:', error);
                alert('Error deleting profile picture');
            }
        }
    });

    // Password strength indicator
    newPassword.addEventListener('input', function() {
        const strength = checkPasswordStrength(newPassword.value);
        passwordStrength.className = 'password-strength ' + strength;
        passwordStrength.textContent = strength.charAt(0).toUpperCase() + strength.slice(1);
    });

    function checkPasswordStrength(password) {
        if (password.length === 0) return '';
        if (password.length < 6) return 'weak';
        if (password.length < 10) return 'medium';
        
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNum = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        const complexity = [hasUpper, hasLower, hasNum, hasSpecial].filter(Boolean).length;
        return complexity < 2 ? 'medium' : 'strong';
    }

    // Update profile information
    profileForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            // Get form values
            const updatedData = {
                fullName: fullNameInput.value.trim(),
            };
            
            // Basic validation
            if (!updatedData.fullName) {
                throw new Error('Full name is required');
            }
            
            const response = await fetch('/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData)
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            const updatedProfile = await response.json();
            
            // Update original values
            originalValues = { ...originalValues, ...updatedData };
            alert('Profile updated successfully!');
            loadUserData(); // Refresh profile data
            
        } catch (error) {
            console.error('Error updating profile:', error);
            alert(error.message || 'Error updating profile');
        }
    });

    // Update password
    updatePasswordBtn.addEventListener('click', async function() {
        try {
            const currentPwd = currentPassword.value;
            const newPwd = newPassword.value;
            const confirmPwd = confirmPassword.value;
            
            // Validation
            if (!currentPwd) {
                throw new Error('Current password is required');
            }
            
            if (!newPwd) {
                throw new Error('New password is required');
            }
            
            if (newPwd !== confirmPwd) {
                throw new Error('New passwords do not match');
            }
            
            if (newPwd.length < 8) {
                throw new Error('Password must be at least 8 characters');
            }
            
            const response = await fetch('/profile/credentials', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: emailInput.value.trim(),
                    currentPassword: currentPwd,
                    newPassword: newPwd
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update password');
            }

            alert('Password updated successfully!');
            
            // Clear password fields
            currentPassword.value = '';
            newPassword.value = '';
            confirmPassword.value = '';
            passwordStrength.className = 'password-strength';
            passwordStrength.textContent = '';
            
        } catch (error) {
            console.error('Error updating password:', error);
            alert(error.message || 'Error updating password');
        }
    });

    // Cancel edits
    cancelBtn.addEventListener('click', function() {
        fullNameInput.value = originalValues.fullName;
        emailInput.value = originalValues.email;
    });

    // Update header profile picture
    function updateHeaderProfile(userData) {
        const profileElement = document.querySelector('.top-bar-right .profile');
        if (!profileElement) return;

        if (userData.profilePicture && userData.profilePicture !== 'default-profile.jpg') {
            profileElement.innerHTML = `<img src="${userData.profilePicture}" alt="Profile" class="header-profile-pic">`;
        } else {
            profileElement.innerHTML = `<i class='bx bx-user'></i>`;
        }
    }

    // Initialize dark mode toggle
    const modeSwitch = document.querySelector('.mode-switch');
    const body = document.body;
    
    // Check for saved dark mode preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        body.classList.add('dark-mode');
        const icon = modeSwitch.querySelector('i');
        icon.classList.remove('bx-moon');
        icon.classList.add('bx-sun');
    }
    
    // Toggle dark mode on click
    modeSwitch.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        
        // Save preference to localStorage
        if (body.classList.contains('dark-mode')) {
            localStorage.setItem('darkMode', 'enabled');
        } else {
            localStorage.setItem('darkMode', 'disabled');
        }
        
        // Toggle moon/sun icon
        const icon = modeSwitch.querySelector('i');
        icon.classList.toggle('bx-moon');
        icon.classList.toggle('bx-sun');
    });

    // Load user data when page loads
    loadUserData();
});