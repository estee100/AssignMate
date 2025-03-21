// Listen for messages on the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action == "extractAssignment") {
        const extractedInfo = extractAssignmentInfo();
        sendResponse(extractedInfo);
    }
    // Keep message channel open for async response
    return true
});

function extractAssignmentInfo() {
    try {
        // Get all of the text content from the page
        const bodyText = document.body.innterText;
        const pageContent = document.body.innerHTML;

        //Regular expressions to find deadlines and assignments
        const datePatterns = [
            /(?:due|deadline|submit by|turn in by)[:\s]*(.*?\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/gi,
            /(?:due|deadline|submit by|turn in by)[:\s]*(.*?\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)/gi,
            /(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)[:\s]*(?:due|deadline)/gi
        ];
          
        const assignmentPatterns = [
            /(?:assignment|homework|project|essay|paper|report|presentation)[:\s]*([^.!?\n\r]+)/gi,
            /([^.!?\n\r]+)\s+is\s+due/gi,
            /submit\s+([^.!?\n\r]+)/gi
          ];

        let assignments = [];

        // Extract assignments based on patterns
        assignmentPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(bodyText)) !== null) {
                if (match[1] && match[1].trim().length > 5 && match[1].length < 200) {
                    assignments.push({
                    text: match[1].trim(),
                    context: getContext(bodyText, match.index, 100),
                    source: 'text pattern'
                    });
                }
            }
        });

        // Find elements with certain classes or IDs that might indicate assignments
        const potentialAssignmentElements = [

            // Use the spread operator to combines both sets of elements into a single array
            ...document.querySelectorAll('.assignment, .homework, .due-date, .deadline, .task'),
            ...document.querySelectorAll('[id*=assignment], [id*=homework], [id*=deadline], [id*=due-date]')
        ];

        potentialAssignmentElements.forEach(element(element => {
            if (element.innterText && element.innerText.trim.length > 5) {
                assignments.push({
                    text: element.innterText.trim().split('\n')[0],
                    context: element.innterText.trim(),
                    source: 'HTML element'
                });
            }
        }));
    }
}