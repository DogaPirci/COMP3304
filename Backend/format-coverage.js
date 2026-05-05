const fs = require('fs');
const path = require('path');

const coverageFile = path.join(__dirname, 'coverage', 'coverage-final.json');

if (!fs.existsSync(coverageFile)) {
  console.error('Coverage file not found. Run tests with coverage first.');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));

console.log('Name'.padEnd(25) + 'Stmts'.padStart(8) + 'Miss'.padStart(8) + 'Cover'.padStart(8) + '   Missing');
console.log('-'.repeat(70));

let totalStmts = 0;
let totalMiss = 0;

Object.keys(data).forEach(filePath => {
  const fileData = data[filePath];
  const fileName = path.basename(filePath);
  
  const statementMap = fileData.s;
  const statements = Object.values(statementMap);
  const stmtsCount = statements.length;
  const missCount = statements.filter(v => v === 0).length;
  const cover = stmtsCount > 0 ? Math.round(((stmtsCount - missCount) / stmtsCount) * 100) : 100;
  
  totalStmts += stmtsCount;
  totalMiss += missCount;

  // Find missing lines
  const missingLines = [];
  const sMap = fileData.statementMap;
  Object.keys(statementMap).forEach(key => {
    if (statementMap[key] === 0) {
      missingLines.push(sMap[key].start.line);
    }
  });

  // Group missing lines (simple grouping)
  const missingStr = missingLines.join(', ');

  console.log(
    fileName.padEnd(25) + 
    stmtsCount.toString().padStart(8) + 
    missCount.toString().padStart(8) + 
    (cover + '%').padStart(8) + 
    '   ' + missingStr
  );
});

const totalCover = totalStmts > 0 ? Math.round(((totalStmts - totalMiss) / totalStmts) * 100) : 100;
console.log('-'.repeat(70));
console.log('TOTAL'.padEnd(25) + totalStmts.toString().padStart(8) + totalMiss.toString().padStart(8) + (totalCover + '%').padStart(8));
