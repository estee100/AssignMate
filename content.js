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
    }
}