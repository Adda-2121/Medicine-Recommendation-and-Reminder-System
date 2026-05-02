const fs = require('fs');

// 1. Patch DoctorDashboard.jsx
const docDashPath = 'c:/Users/HP/Documents/Medicine-Recommendation-and-Reminder-System/Medicine_recommender_system/frontend/src/pages/DoctorDashboard.jsx';
let docDashContent = fs.readFileSync(docDashPath, 'utf-8');

// Remove the availability tab button
docDashContent = docDashContent.replace(
    /<button[^>]*onClick=\{\(\) => setActiveTab\('availability'\)\}[^>]*>[\s\S]*?My Availability Schedule[\s\S]*?<\/button>/,
    ''
);

// Remove the availability tab content
docDashContent = docDashContent.replace(
    /\{activeTab === 'availability' && \([\s\S]*?\}\) \}\)/,
    ''
);

fs.writeFileSync(docDashPath, docDashContent, 'utf-8');

// 2. Patch FindDoctor.jsx
const findDocPath = 'c:/Users/HP/Documents/Medicine-Recommendation-and-Reminder-System/Medicine_recommender_system/frontend/src/pages/FindDoctor.jsx';
let findDocContent = fs.readFileSync(findDocPath, 'utf-8');

// Change View Availability to Contact The Doctor
findDocContent = findDocContent.replace(
    /\{t\('findDoctor\.viewAvailability'\)\}/g,
    `"Contact The Doctor"`
);

// Remove fetching slots logic
findDocContent = findDocContent.replace(
    /try \{\s*setFetchingSlots\(true\);[\s\S]*?\} finally \{\s*setFetchingSlots\(false\);\s*\}/,
    ''
);

// Remove selectedSlot validation from handleBookAppointment
findDocContent = findDocContent.replace(
    /if \(!selectedSlot \|\| !selectedDoctor\) return;/,
    'if (!selectedDoctor) return;'
);

// Remove appointment_date and appointment_time from payload
findDocContent = findDocContent.replace(
    /appointment_date: selectedSlot\.date,\s*appointment_time: selectedSlot\.start_time,/,
    ''
);

// Hide the Left Column: Slots
findDocContent = findDocContent.replace(
    /\{\/\* Left Column: Slots \*\/\}.*?(?=\{\/\* Right Column: Form \*\*\/)/s,
    ''
);

// Make the Right Column take full width and remove the empty slot placeholder
findDocContent = findDocContent.replace(
    /w-full md:w-1\/2 flex flex-col/g,
    'w-full flex flex-col'
);

findDocContent = findDocContent.replace(
    /\{!selectedSlot \? \([\s\S]*?\) : \(/,
    '('
);

// Remove the closing parenthesis of the ternary
findDocContent = findDocContent.replace(
    /<\/form>\s*\)/,
    '</form>'
);

// Fix disabled condition on submit button
findDocContent = findDocContent.replace(
    /disabled=\{\!selectedSlot \|\| isSubmitting\}/,
    'disabled={isSubmitting}'
);

fs.writeFileSync(findDocPath, findDocContent, 'utf-8');

console.log("Patched successfully");
