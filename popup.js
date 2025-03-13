document.addEventListener('DOMContentLoaded', function() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add the active class to the current tab that is clicked
            this.classList.add('active');
            const tabId = this.dataset.tab;
            document.getElementById(tabId).classList.add('active')

        });

    });

    loadAssignments();

    // Add event listeners to the buttons within each page
    document.getElementById('add-btn').addEventListener('click', addAssignment);
    document.getElementById('extract-btn').addEventListener('click', extractFromPage);
    document.getElementById('generate-schedule').addEventListener('click', generateSchedule);

    /**
     * Load the assignments from google chromes storage
     */
    function loadAssignments() {
        // Get assignment data from chrome storage
        chrome.storage.local.get('assignments', function(data) {
            const assignmentList = document.getElementById('assignment-list');

            if (data.assignments && data.assignments.length > 0) {
                // Clear the message
                assignmentList.innerHTML = '';
                
                // Sort the assignments by due date
                const sortedAssignments = data.assignments.sort((a, b) =>
                    new Date(a.dueDate) - new Date(b.dueDate)
                );

                // Add each assignment to the list
                sortedAssignments.forEach(assignment => {
                    const dueDate = new Date(assignment.dueDate);
                    const formattedDate = dueDate.toLocaleDateString();
                    const assignmentElement = document.createElement('div');

                    assignmentElement.className = `assignment-item ${assignment.priority}`;
                    assignmentElement.innerHTML = `
                        <div class="assignment-header">
                            <div class="assignment-title">${assignment.name}</div>
                            <div class="assignment-date">${formattedDate}</div>
                        </div>
                        <div class="assignment-notes">${assignment.notes || ''}</div>
                        <button class="remove-btn" data-id="${assignment.id}">Remove</button>
                        `;

                        assignmentList.appendChild(assignmentElement);
                });

                // Add event listener to remove buttons
                document.querySelectorAll('.remove-btn').forEach(button => {
                    button.addEventListener('click', function() {
                        removeAssignment(this.dataset.id);
                    });
                });
            } else {
                assignmentList.innerHTML = '<div class="empty-state">No assignments yet. Add one or extract from a page.</div>';
            }
        })
    };
    /**
     * Adds an assignment to the assignment list
     */
    function addAssignment() {
        const nameInput = document.getElementById('assignment-name');
        const dateInput = document.getElementById('assignment-date');
        const priorityInput = document.getElementById('assignment-priority');
        const notesInput = document.getElementById('assignment-notes');

        if (!nameInput.value.trim() || !dateInput.value) {
            alert('Please enter the assignment name and due date');
            return;
        }

        const newAssignment = {
            id: Date.now().toString(),
            name: nameInput.value.trim(),
            dueDate: dateInput.value,
            priority: priorityInput.value,
            notes: notesInput.value.trim(),
            createdAt: new Date().toISOString()
        };

        // Get the existing assignments and add the new one
        chrome.storage.local.get('assignments', function(data) {
            const assignments = data.assignments || [];
            assignments.push(newAssignment);
            
            // Save updated assignments List
            chrome.storage.local.set({ 'assignments': assignments }, function() {
                // Clear all the fields
                nameInput.value = '';
                dateInput.value = '';
                priorityInput.value = 'medium';
                notesInput.value = '';

                loadAssignments();
            });
        });
    }

    /**
     * Removes a function from the assignment list filtering out the assignments
     * id from the list and updating the list
     * @param id
     */
    function removeAssignment(id) {
        chrome.storage.local.get('assignments', function(data) {
            if (data.assignments) {
                const updatedAssignments = data.assignments.filter(
                    // Filter out the deleted assignment from the list
                    assignment => assignment.id !== id
                );

                chrome.storage.local.set({ 'assignments': updatedAssignments }, function() {
                    loadAssignments();
                });
            }
        });
    }
    
    /**
     * Extracts assignment information from the page
     */
    function extractFromPage() {
        // Query the active tab
        chrome.tabs.query({ active: true, currentWindow: true}, function(tabs) {

            // Send a message to the content script
            chrome.tabs.sendMessage(
                tabs[0].id,
                { action : "extractAssignments"},
                function(response) {
                    displayExtractionResults(response);
                }
            );
        });
    }

    function displayExtractionResults(results) {
        const extractionResults = document.getElementById('extraction-results');

        if (!results || results.error) {
            extractionResults.innerHTML = '<div class="empty-state">There was an error extracting information from the page.</div>';
            return;
        }

        if (results.assignment && results.assignment.length > 0);
        
        
    }
})