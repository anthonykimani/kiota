/**
 * Setup Verification Script
 * Checks if all required dependencies are installed
 */

const fs = require('fs');
const path = require('path');

const requiredPackages = [
  'next',
  'react',
  'react-dom',
  'typescript',
  '@types/react',
  '@types/node',
  '@types/react-dom',
];

const optionalPackages = [
  'tailwindcss',
  'postcss',
  'autoprefixer',
  'eslint',
  'eslint-config-next',
];

console.log('🔍 Checking Kiota setup...\n');

// Check node_modules
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
const hasNodeModules = fs.existsSync(nodeModulesPath);

console.log(`📦 node_modules: ${hasNodeModules ? '✅ Found' : '❌ Missing'}`);

if (!hasNodeModules) {
  console.log('\n⚠️  Run: npm install\n');
  process.exit(1);
}

// Check required packages
console.log('\n📚 Required Dependencies:');
let missingRequired = [];
for (const pkg of requiredPackages) {
  const exists = fs.existsSync(path.join(nodeModulesPath, pkg));
  console.log(`  ${exists ? '✅' : '❌'} ${pkg}`);
  if (!exists) missingRequired.push(pkg);
}

// Check optional packages
console.log('\n🎨 Optional Dependencies:');
let missingOptional = [];
for (const pkg of optionalPackages) {
  const exists = fs.existsSync(path.join(nodeModulesPath, pkg));
  console.log(`  ${exists ? '✅' : '⚠️ '} ${pkg}`);
  if (!exists) missingOptional.push(pkg);
}

// Check key files
console.log('\n📄 Configuration Files:');
const configFiles = [
  'tsconfig.json',
  'tailwind.config.ts',
  'next.config.js',
  '.env.local',
  'app/layout.tsx',
  'app/page.tsx',
];

for (const file of configFiles) {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
}

// Check type definitions
console.log('\n📝 Type Definitions:');
const typeFiles = [
  'types/models/user.ts',
  'types/models/portfolio.ts',
  'types/models/goals.ts',
];

for (const file of typeFiles) {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
}

// Summary
console.log('\n' + '='.repeat(50));
if (missingRequired.length === 0) {
  console.log('✅ All required dependencies are installed!');
  if (missingOptional.length > 0) {
    console.log(`\n⚠️  ${missingOptional.length} optional package(s) missing:`);
    console.log(`   Run: npm install -D ${missingOptional.join(' ')}`);
  } else {
    console.log('✅ All optional dependencies are installed!');
  }
  console.log('\n🚀 Ready to run: npm run dev');
} else {
  console.log(`❌ ${missingRequired.length} required package(s) missing:`);
  console.log(`   Run: npm install ${missingRequired.join(' ')}`);
  process.exit(1);
}
