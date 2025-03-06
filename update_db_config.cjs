// Update database configuration
const fs = require('fs');
const path = require('path');

// Files that need to be updated
const files = [
  'server.js',
  'update_courses_with_youtube.cjs',
  'add_quantum_courses.js'
];

// Update each file to use a different database configuration
files.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`File ${file} does not exist, skipping...`);
    return;
  }

  let content = fs.readFileSync(file, 'utf8');
  
  // Replace database configuration to work without password
  let updatedContent = content.replace(
    /const dbConfig = \{[\s\S]*?host:.*?['"]localhost['"],[\s\S]*?user:.*?['"]root['"],[\s\S]*?(password:.*?,[\s\S]*?)?database:.*?['"]prepai_courses['"][\s\S]*?\};/g,
    `const dbConfig = {
  host: 'localhost',
  user: 'root',
  database: 'prepai_courses'
};`
  );
  
  if (content !== updatedContent) {
    fs.writeFileSync(file, updatedContent);
    console.log(`Updated database configuration in ${file}`);
  } else {
    console.log(`No changes needed in ${file}`);
  }
});

console.log('Database configuration updated successfully');