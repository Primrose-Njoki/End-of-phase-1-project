document.addEventListener('DOMContentLoaded', function() {

    //Event listener
    document.getElementById("dark-mode-toggle").addEventListener("click", function () {
        document.body.classList.toggle("dark-mode");
    });

    // DOM Elements -declares variables in brackets
    const skinForm = document.getElementById('skin-form');
    const routineDisplay = document.getElementById('routine-display');
    const favoritesList = document.getElementById('favorites-list');
    
    // Event Listeners-callbacks the generateRoutine function
    skinForm.addEventListener('submit', generateRoutine);
    
    // load favorites from db.json
    loadFavorites();

    //Generate routine based on users inputs

    function generateRoutine(e) {
        e.preventDefault();
        
        const skinType = document.getElementById('skin-type').value;
        const concerns = Array.from(document.querySelectorAll('input[name="concerns"]:checked'))
                            .map(checkbox => checkbox.value);
        
        if (!skinType) {
            alert('Please select your skin type');
            return;
        }
        
        // Fetch routine data from db.json
        fetch('db.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Fetched data:', data); 
                const routine = findMatchingRoutine(data, skinType, concerns);
                console.log('Matched routine:', routine); 
                displayRoutine(routine);
            })
            .catch(error => {
                console.error('Error:', error);
                routineDisplay.innerHTML = '<p>Error loading routine data. Please try again.</p>';
            });
    }
    
    // finds matching routine
    function findMatchingRoutine(data, skinType, concerns) {
        
        const exactMatches = data.routines.filter(routine => 
            routine.skinType === skinType && 
            concerns.every(concern => routine.concerns.includes(concern)));
        
        if (exactMatches.length > 0) {
            return exactMatches[0];
        }
        
        
        const partialMatches = data.routines.filter(routine => 
            routine.skinType === skinType && 
            concerns.some(concern => routine.concerns.includes(concern)));
        
        if (partialMatches.length > 0) {
            
            partialMatches.sort((a, b) => {
                const aMatches = a.concerns.filter(c => concerns.includes(c)).length;
                const bMatches = b.concerns.filter(c => concerns.includes(c)).length;
                return bMatches - aMatches;
            });
            return partialMatches[0];
        }
        
        return data.defaultRoutine;
    }
    
    // Display the generated routine
    function displayRoutine(routine) {
        if (!routine) {
            routineDisplay.innerHTML = '<p>No matching routine found. Using default.</p>';
            return;
        }
        
        routineDisplay.innerHTML = `
            <div class="routine" id="current-routine">
                <h2>Your Custom Skincare Routine</h2>
                <p><strong>Skin Type:</strong> ${capitalizeFirstLetter(routine.skinType)}</p>
                <p><strong>Targeted Concerns:</strong> ${routine.concerns.map(c => capitalizeFirstLetter(c)).join(', ')}</p>
                
                <div class="morning-routine">
                    <h3>🌞 Morning Routine</h3>
                    <ul>
                        ${routine.morning.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="night-routine">
                    <h3>🌙 Night Routine</h3>
                    <ul>
                        ${routine.night.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
                
                <button id="save-routine">Save to Favorites</button>
            </div>
        `;
    
        document.getElementById('save-routine').addEventListener('click', () => saveRoutine(routine));
    }
    const routineImage = document.getElementById("routine-image");


function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    // Save routine to favorites
    function saveRoutine(routine) {
        
    
        routine.id = Date.now();
        
        // Get current favorites
        fetch('db.json')
            .then(response => response.json())
            .then(data => {
                if (!data.favorites) {
                    data.favorites = [];
                }
                data.favorites.push(routine);
                
            
                updateFavoritesUI([routine]);
                
                alert('Routine saved to favorites!');
            })
            .catch(error => console.error('Error:', error));
    }
    
    // Load favorites from db.json
    function loadFavorites() {
        fetch('db.json')
            .then(response => response.json())
            .then(data => {
                if (data.favorites && data.favorites.length > 0) {
                    updateFavoritesUI(data.favorites);
                }
            })
            .catch(error => console.error('Error:', error));
    }
    
    // Update favorites list in UI
    function updateFavoritesUI(favorites) {
        favoritesList.innerHTML = ''; 
        
        favorites.forEach(routine => {
            const favoriteItem = document.createElement('div');
            favoriteItem.className = 'favorite-item';
            favoriteItem.innerHTML = `
                <h3>${capitalizeFirstLetter(routine.skinType)} Skin Routine</h3>
                <p><strong>Concerns:</strong> ${routine.concerns.map(c => capitalizeFirstLetter(c)).join(', ')}</p>
                <button class="delete-favorite" data-id="${routine.id}">Delete</button>
                <button class="use-favorite" data-id="${routine.id}">Use This Routine</button>
            `;
            
            favoritesList.appendChild(favoriteItem);
        });
        
        // Add event listeners to new buttons
        document.querySelectorAll('.delete-favorite').forEach(button => {
            button.addEventListener('click', deleteFavorite);
        });
        
        document.querySelectorAll('.use-favorite').forEach(button => {
            button.addEventListener('click', useFavorite);
        });
    }
    
    // Delete favorite routine
    function deleteFavorite(e) {
        
        const id = parseInt(e.target.getAttribute('data-id'));
        
    
        e.target.parentElement.remove();
    }
    
    // Use a favorite routine
    function useFavorite(e) {
        const id = parseInt(e.target.getAttribute('data-id'));
        
        fetch('db.json')
            .then(response => response.json())
            .then(data => {
                const routine = data.favorites.find(fav => fav.id === id);
                if (routine) {
                    displayRoutine(routine);
                    // Scroll to the routine
                    routineDisplay.scrollIntoView({ behavior: 'smooth' });
                }
            })
            .catch(error => console.error('Error:', error));

           
            
    }
});