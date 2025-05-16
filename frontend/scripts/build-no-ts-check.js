const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building frontend without TypeScript checks...');

try {
  // Create .env.build file to disable TypeScript checks
  fs.writeFileSync(
    path.join(__dirname, '..', '.env.build'),
    'VITE_SKIP_TS_CHECK=true\nVITE_DEVELOPMENT_MODE=false\n'
  );

  // Run Vite build with TS checks disabled
  console.log('Running Vite build...');
  execSync('npx vite build --mode build', { 
    stdio: 'inherit',
    env: { ...process.env, VITE_SKIP_TS_CHECK: 'true' }
  });

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
} 