document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Remove active class from all buttons and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to current button and corresponding content
        this.classList.add('active');
        const tabId = this.dataset.tab;
        document.getElementById(tabId).classList.add('active');
      });
    });
    
    // Load existing assignments
    loadAssignments();
    
    // Add assignment functionality
    document.getElementById('add-btn').addEventListener('click', addAssignment);
    
    // Extract from page functionality
    document.getElementById('extract-btn').addEventListener('click', extractFromPage);
    
    // Generate schedule functionality
    document.getElementById('generate-schedule').addEventListener('click', generateSchedule);
  });
  
  // Function to load assignments from storage
  function loadAssignments() {
    chrome.storage.local.get('assignments', function(data) {
      const assignmentList = document.getElementById('assignment-list');
      
      if (data.assignments && data.assignments.length > 0) {
        // Clear empty state message
        assignmentList.innerHTML = '';
        
        // Sort assignments by due date
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
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-btn').forEach(button => {
          button.addEventListener('click', function() {
            removeAssignment(this.dataset.id);
          });
        });
      } else {
        assignmentList.innerHTML = '<div class="empty-state">No assignments yet. Add one or extract from a page.</div>';
      }
    });
  }
  
  // Function to add a new assignment
  function addAssignment() {
    const nameInput = document.getElementById('assignment-name');
    const dateInput = document.getElementById('assignment-date');
    const priorityInput = document.getElementById('assignment-priority');
    const notesInput = document.getElementById('assignment-notes');
    
    // Validate inputs
    if (!nameInput.value.trim() || !dateInput.value) {
      alert('Please enter a name and due date for the assignment.');
      return;
    }
    
    // Create new assignment object
    const newAssignment = {
      id: Date.now().toString(), // Use timestamp as unique ID
      name: nameInput.value.trim(),
      dueDate: dateInput.value,
      priority: priorityInput.value,
      notes: notesInput.value.trim(),
      createdAt: new Date().toISOString()
    };
    
    // Get existing assignments and add new one
    chrome.storage.local.get('assignments', function(data) {
      const assignments = data.assignments || [];
      assignments.push(newAssignment);
      
      // Save updated assignments list
      chrome.storage.local.set({ 'assignments': assignments }, function() {
        // Clear form fields
        nameInput.value = '';
        dateInput.value = '';
        priorityInput.value = 'medium';
        notesInput.value = '';
        
        // Reload assignments list
        loadAssignments();
      });
    });
  }
  
  // Function to remove an assignment
  function removeAssignment(id) {
    chrome.storage.local.get('assignments', function(data) {
      if (data.assignments) {
        const updatedAssignments = data.assignments.filter(
          assignment => assignment.id !== id
        );
        
        chrome.storage.local.set({ 'assignments': updatedAssignments }, function() {
          loadAssignments();
        });
      }
    });
  }
  
  // Function to extract assignment information from the current page
  function extractFromPage() {
    // Query the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      // Send a message to the content script
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "extractAssignments" },
        function(response) {
          displayExtractionResults(response);
        }
      );
    });
  }
  
  // Function to display extraction results
  function displayExtractionResults(results) {
    const extractionResults = document.getElementById('extraction-results');
    
    if (!results || results.error) {
      extractionResults.innerHTML = '<div class="empty-state">There was an error extracting information from the page.</div>';
      return;
    }
    
    if (results.assignments && results.assignments.length > 0) {
      let html = '<h3>Extracted Items</h3>';
      
      results.assignments.forEach(item => {
        html += `
          <div class="extracted-item">
            <div>${item.text}</div>
            <div class="extracted-date">${item.date || 'No date detected'}</div>
            <button class="add-extracted" data-name="${item.text}" data-date="${item.date || ''}">
              Add to Assignments
            </button>
          </div>
        `;
      });
      
      extractionResults.innerHTML = html;
      
      // Add event listeners to "Add to Assignments" buttons
      document.querySelectorAll('.add-extracted').forEach(button => {
        button.addEventListener('click', function() {
          const assignmentName = this.dataset.name;
          let assignmentDate = this.dataset.date;
          
          // If no date was detected, prompt user to enter one
          if (!assignmentDate) {
            assignmentDate = prompt('Please enter a due date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
            if (!assignmentDate) return; // User cancelled
          }
          
          // Pre-fill the add assignment form
          document.getElementById('assignment-name').value = assignmentName;
          document.getElementById('assignment-date').value = assignmentDate;
          
          // Switch to assignments tab
          document.querySelector('[data-tab="assignments"]').click();
        });
      });
    } else {
      extractionResults.innerHTML = '<div class="empty-state">No assignments or deadlines detected on this page.</div>';
    }
  }
  
  // Function to generate a study schedule based on assignments
  function generateSchedule() {
    chrome.storage.local.get('assignments', function(data) {
      if (!data.assignments || data.assignments.length === 0) {
        document.getElementById('schedule-view').innerHTML = 
          '<div class="empty-state">Add some assignments first to generate a schedule.</div>';
        return;
      }
      

      // Simple schedule without Ai, need to implement ChatGPT API
      const scheduleView = document.getElementById('schedule-view');
      
      // Sort assignments by due date
      const sortedAssignments = data.assignments.sort((a, b) => 
        new Date(a.dueDate) - new Date(b.dueDate)
      );
      
      let html = '<h3>Recommended Study Schedule</h3>';
      html += '<div class="schedule-container">';
      
      // Create a simple schedule - in a real implementation, this would use AI
      sortedAssignments.forEach(assignment => {
        const dueDate = new Date(assignment.dueDate);
        const today = new Date();
        
        // Calculate days until due
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue < 0) {
          // Past due
          html += `
            <div class="schedule-item overdue">
              <div class="schedule-header">
                <span class="schedule-title">${assignment.name}</span>
                <span class="schedule-urgency">OVERDUE</span>
              </div>
              <div class="schedule-advice">This assignment is overdue. Complete immediately.</div>
            </div>
          `;
        } else if (daysUntilDue <= 3) {
          // Due soon
          html += `
            <div class="schedule-item urgent">
              <div class="schedule-header">
                <span class="schedule-title">${assignment.name}</span>
                <span class="schedule-urgency">URGENT</span>
              </div>
              <div class="schedule-advice">Due in ${daysUntilDue} days. Allocate at least 2-3 hours daily.</div>
            </div>
          `;
        } else if (daysUntilDue <= 7) {
          // Due within a week
          html += `
            <div class="schedule-item soon">
              <div class="schedule-header">
                <span class="schedule-title">${assignment.name}</span>
                <span class="schedule-urgency">UPCOMING</span>
              </div>
              <div class="schedule-advice">Due in ${daysUntilDue} days. Schedule 1-2 hours daily.</div>
            </div>
          `;
        } else {
          // Due later
          html += `
            <div class="schedule-item planned">
              <div class="schedule-header">
                <span class="schedule-title">${assignment.name}</span>
                <span class="schedule-urgency">PLANNED</span>
              </div>
              <div class="schedule-advice">Due in ${daysUntilDue} days. Start with 30-60 minutes, 3 times a week.</div>
            </div>
          `;
        }
      });
      
      html += '</div>';
      html += '<div class="schedule-note">Note: In a full implementation, this schedule would be generated using AI based on your learning preferences and assignment complexity.</div>';
      
      scheduleView.innerHTML = html;
    });
  }