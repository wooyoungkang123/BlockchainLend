#!/bin/bash
# This script runs the frontend without TypeScript errors

# Set environment variables to disable TypeScript checks
export VITE_SKIP_TS_CHECK=true
export TSC_COMPILE_ON_ERROR=true
export VITE_DEVELOPMENT_MODE=true

# Run Vite dev server with TypeScript checks disabled
node node_modules/vite/bin/vite.js --force 